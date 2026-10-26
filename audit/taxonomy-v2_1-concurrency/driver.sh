#!/bin/bash
# Two-session concurrency driver for taxonomy v2.1 (scratch schema taxc; zero residue).
set -u
export PGPASSWORD=$(cat /home/sandbox/.vault/supabase-navara-pathways-database-205b05/password)
CONN="host=aws-0-us-east-1.pooler.supabase.com port=5432 user=postgres.tvvoauvtrgziwxtzlluq dbname=postgres sslmode=require options=project%3Dtvvoauvtrgziwxtzlluq"
cd "$(dirname "$0")"
echo "== setup =="
psql "$CONN" -v ON_ERROR_STOP=1 -q -f setup.sql || exit 1

echo "== CASE 1: capture holds SHARE ROW EXCLUSIVE; concurrent logged mutation blocks, then replays =="
psql "$CONN" -q -f sessA.sql > outA.txt 2>&1 &
APID=$!
sleep 1.5
time psql "$CONN" -q -f sessB.sql > outB.txt 2>&1
wait $APID
echo "-- session A (capture):"; grep -E 'capture_A|COMMIT' outA.txt | head -3
echo "-- session B (blocked writer) done; now asserting"
psql "$CONN" -tA <<'SQL'
SELECT 'C1 audit after concurrent mutation', taxc.audit('rbt','1');
SELECT 'C1 boundary: horizon < event, snapshot kept old cluster',
 (SELECT b.event_horizon FROM taxc.taxonomy_baseline b WHERE b.item_id='1' ORDER BY b.baseline_seq DESC LIMIT 1)
 < (SELECT max(e.event_id) FROM taxc.review_event e WHERE e.table_name='item_tag_review')
 AND (SELECT b.row_mapping->'tag_x@current'->>'surface_cluster_id' FROM taxc.taxonomy_baseline b WHERE b.item_id='1' ORDER BY b.baseline_seq DESC LIMIT 1) = 'C_TEST';
SQL

echo "== CASE 2: rolled-back concurrent mutation leaves no event and no drift =="
psql "$CONN" -q -c "BEGIN; UPDATE taxc.item_tag_review SET surface_cluster_id='C_GONE' WHERE item_id='1'; ROLLBACK;"
psql "$CONN" -tA -c "SELECT 'C2 audit after rollback', taxc.audit('rbt','1');"

echo "== CASE 3: competing supersessions cannot fork the chain =="
TIP=$(psql "$CONN" -tA -c "SELECT baseline_id FROM taxc.taxonomy_baseline WHERE item_id='1' ORDER BY baseline_seq DESC LIMIT 1")
N0=$(psql "$CONN" -tA -c "SELECT count(*) FROM taxc.taxonomy_baseline WHERE item_id='1'")
psql "$CONN" -q -v tip="$TIP" -f sessC.sql > outC.txt 2>&1 &
CPID=$!
sleep 1.5
psql "$CONN" -q -v tip="$TIP" -f sessD.sql > outD.txt 2>&1   -- expected to fail loudly after unblocking
wait $CPID
N1=$(psql "$CONN" -tA -c "SELECT count(*) FROM taxc.taxonomy_baseline WHERE item_id='1'")
echo "-- C output:"; grep -E 'capture_C|ERROR' outC.txt | head -2
echo "-- D output:"; grep -E 'capture_D|ERROR' outD.txt | head -2
echo "C3 baselines_before=$N0 baselines_after=$N1 (expect exactly +1)"
psql "$CONN" -tA -c "SELECT 'C3 deterministic tip audit', taxc.audit('rbt','1');"

echo "== cleanup =="
psql "$CONN" -q -c "DROP SCHEMA taxc CASCADE;"
psql "$CONN" -tA -c "SELECT 'residue', count(*) FROM information_schema.schemata WHERE schema_name='taxc';"
