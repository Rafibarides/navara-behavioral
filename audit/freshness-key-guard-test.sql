BEGIN; SET LOCAL TimeZone = 'UTC';
\ir /tmp/ehc21_body.sql
\ir /home/sandbox/pathways-repo/supabase/freshness_key_guard_draft.sql
CREATE TEMP TABLE _r(test text, actual text, expected text, pass boolean);
INSERT INTO pathways_evidence.exposure_logging_policy (track,logging_started_at,note,inventory_attested_at,inventory_attested_by)
VALUES ('rbt','2026-01-01T00:00:00Z','TEST','2026-01-01T00:00:00Z','TEST');
INSERT INTO auth.users (id,aud,role,email,created_at) VALUES ('ffffffff-0000-4000-8000-0000000000aa','authenticated','authenticated','kg@synthetic.invalid','2026-02-01T00:00:00Z');
-- item 9 exists in questions + source inventory, but we remove its dependence keys (invariant broken on purpose)
CREATE OR REPLACE VIEW pathways_evidence.item_dependence_key WITH (security_invoker = true) AS
SELECT track, item_id, 'ITEM:' || item_id AS k FROM pathways_evidence.pathways_source_items WHERE item_id <> '9';
-- covered member (post-epoch account), keyless item 9 -> must be unknown, never fresh
INSERT INTO _r SELECT 'keyless item, covered member', pathways_evidence.member_item_freshness('ffffffff-0000-4000-8000-0000000000aa','rbt','9'), 'unknown',
  pathways_evidence.member_item_freshness('ffffffff-0000-4000-8000-0000000000aa','rbt','9') = 'unknown';
-- control: keyed item 10, covered member -> fresh (guard does not over-block)
INSERT INTO _r SELECT 'keyed item, covered member (control)', pathways_evidence.member_item_freshness('ffffffff-0000-4000-8000-0000000000aa','rbt','10'), 'fresh',
  pathways_evidence.member_item_freshness('ffffffff-0000-4000-8000-0000000000aa','rbt','10') = 'fresh';
TABLE _r;
DO $$ DECLARE f int; BEGIN SELECT count(*) INTO f FROM _r WHERE NOT pass; IF f>0 THEN RAISE EXCEPTION 'FAILED %', f; END IF; END $$;
ROLLBACK;
