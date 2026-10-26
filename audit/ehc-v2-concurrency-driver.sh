#!/bin/bash
# EHC v2 concurrency harness: real two-session races against scratch tables carrying
# the EXACT v2 constraint DDL (unique btree serialization is engine-level, table-independent).
# Scratch tables dropped at the end; live tables untouched.
set -u
export PGPASSWORD=$(cat /home/sandbox/.vault/supabase-navara-pathways-database-205b05/password)
CONN="host=aws-0-us-east-1.pooler.supabase.com port=5432 user=postgres.tvvoauvtrgziwxtzlluq dbname=postgres sslmode=require options=project%3Dtvvoauvtrgziwxtzlluq"
S=pathways_evidence
psql "$CONN" -X -q <<'SQL'
DROP TABLE IF EXISTS pathways_evidence._conc_binding, pathways_evidence._conc_serve;
CREATE TABLE pathways_evidence._conc_serve (
  event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id uuid NOT NULL, track text NOT NULL, item_id text NOT NULL,
  logged_by text NOT NULL DEFAULT 'server',
  item_delivery_id uuid, serve_request_key text,
  server_recorded_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX conc_delivery_uq ON pathways_evidence._conc_serve (item_delivery_id) WHERE logged_by='server';
CREATE UNIQUE INDEX conc_idem_uq ON pathways_evidence._conc_serve (member_id, serve_request_key, item_id) WHERE logged_by='server';
CREATE TABLE pathways_evidence._conc_binding (
  attempt_id bigint PRIMARY KEY, item_delivery_id uuid UNIQUE NOT NULL,
  bound_at timestamptz NOT NULL DEFAULT now());
SQL

M='dddddddd-0000-4000-8000-0000000000aa'
run_race () {  # $1 = A's epilogue (COMMIT|ROLLBACK), $2 = tag
cat > /tmp/conc_A.sql <<SQL
BEGIN;
INSERT INTO $S._conc_serve (member_id,track,item_id,item_delivery_id,serve_request_key)
  VALUES ('$M','rbt','1',gen_random_uuid(),'K$2');
SELECT 'A inserted ' || clock_timestamp();
SELECT pg_sleep(3);
$1;
SELECT 'A $1 ' || clock_timestamp();
SQL
cat > /tmp/conc_B.sql <<SQL
SELECT 'B start ' || clock_timestamp();
INSERT INTO $S._conc_serve (member_id,track,item_id,item_delivery_id,serve_request_key)
  VALUES ('$M','rbt','1',gen_random_uuid(),'K$2') ON CONFLICT (member_id, serve_request_key, item_id) WHERE logged_by='server' DO NOTHING;
SELECT 'B done ' || clock_timestamp();
SQL
psql "$CONN" -X -qAt -f /tmp/conc_A.sql > /tmp/conc_A_out.txt 2>&1 &
PA=$!
sleep 1
psql "$CONN" -X -qAt -f /tmp/conc_B.sql > /tmp/conc_B_out.txt 2>&1
wait $PA
echo "--- $2 (A $1) ---"; cat /tmp/conc_A_out.txt /tmp/conc_B_out.txt
psql "$CONN" -X -qAt -c "SELECT '$2 rows=' || count(*) FROM $S._conc_serve WHERE serve_request_key='K$2';"
}
run_race COMMIT CC
run_race ROLLBACK CR

# C2: concurrent answers, one delivery -> exactly one binding
DID=$(psql "$CONN" -X -qAt -c "SELECT item_delivery_id FROM $S._conc_serve WHERE serve_request_key='KCC';")
cat > /tmp/conc_C.sql <<SQL
INSERT INTO $S._conc_binding (attempt_id, item_delivery_id) VALUES (-8801, '$DID');
SELECT 'C1 ok';
SQL
cat > /tmp/conc_D.sql <<SQL
INSERT INTO $S._conc_binding (attempt_id, item_delivery_id) VALUES (-8802, '$DID');
SELECT 'C2 ok';
SQL
psql "$CONN" -X -qAt -f /tmp/conc_C.sql > /tmp/conc_C_out.txt 2>&1 &
PC=$!
psql "$CONN" -X -qAt -f /tmp/conc_D.sql > /tmp/conc_D_out.txt 2>&1
wait $PC
echo "--- binding race ---"; cat /tmp/conc_C_out.txt /tmp/conc_D_out.txt
psql "$CONN" -X -qAt -c "SELECT 'bindings for delivery=' || count(*) FROM $S._conc_binding WHERE item_delivery_id='$DID';"
psql "$CONN" -X -qAt -c "DROP TABLE pathways_evidence._conc_binding, pathways_evidence._conc_serve;"
psql "$CONN" -X -qAt -c "SELECT 'residue: ' || count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='pathways_evidence' AND c.relname LIKE '\_conc%';"
