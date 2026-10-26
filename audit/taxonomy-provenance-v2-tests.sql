-- Taxonomy provenance audit v2 tests. Rolled back; nothing persists.
BEGIN;
SET LOCAL TimeZone = 'UTC';
\ir /tmp/ehc21_body.sql
\ir /home/sandbox/pathways-repo/supabase/TAXONOMY_PROVENANCE_AUDIT_V2_DRAFT.sql
CREATE TEMP TABLE _r(n serial, test text, actual text, expected text, pass boolean);
INSERT INTO public.questions (id,track,area,body,options,answer,explanation,published,created_at) OVERRIDING SYSTEM VALUE
SELECT i,'rbt','TEST','synthetic stem '||i,'[{"t":"a"},{"t":"b"},{"t":"c","x":0},{"t":"d"}]'::jsonb,0,'synthetic',true,'2025-01-01T00:00:00Z'::timestamptz
FROM generate_series(1,6) g(i) ON CONFLICT (id) DO UPDATE SET created_at=EXCLUDED.created_at, published=true;
INSERT INTO pathways_evidence.sme_reviewer VALUES ('bbbbbbbb-0000-4000-8000-000000000001','TEST SYNTHETIC','TEST','{rbt,bcba}',true);
INSERT INTO pathways_evidence.exposure_logging_policy (track,logging_started_at,note,inventory_attested_at,inventory_attested_by)
VALUES ('rbt','2026-01-01T00:00:00Z','TEST','2026-01-01T00:00:00Z','TEST');
-- pre-log legacy rows (trigger off), as pre-instrumentation history would be
ALTER TABLE pathways_evidence.item_tag_review DISABLE TRIGGER log_item_tag_review;
INSERT INTO pathways_evidence.item_tag_review (track,item_id,content_version,raw_tag,alignment_status,assessable,transfer_status,reviewed_by,reviewed_at,surface_cluster_id) VALUES
 ('rbt','1','current','tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST'),
 ('rbt','2','current','tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST'),
 ('rbt','4','current','tag_y','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_OTHER'),
 ('rbt','5','current','tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST'),
 ('rbt','6','current','tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST');
ALTER TABLE pathways_evidence.item_tag_review ENABLE TRIGGER log_item_tag_review;
-- baselines
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','1','bbbbbbbb-0000-4000-8000-000000000001');
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','2','bbbbbbbb-0000-4000-8000-000000000001');
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','4','bbbbbbbb-0000-4000-8000-000000000001');
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','5','bbbbbbbb-0000-4000-8000-000000000001');
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','6','bbbbbbbb-0000-4000-8000-000000000001');

-- T1 logged split of item 5 -> verified
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id='C_SPLIT' WHERE item_id='5' AND raw_tag='tag_x';
INSERT INTO _r(test,actual,expected,pass) SELECT 'T1 logged split verified', pathways_evidence.taxonomy_audit('rbt','5'), 'verified', pathways_evidence.taxonomy_audit('rbt','5')='verified';

-- T2a unlogged UPDATE (item 6) -> drift
ALTER TABLE pathways_evidence.item_tag_review DISABLE TRIGGER log_item_tag_review;
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id='C_SPLIT2' WHERE item_id='6' AND raw_tag='tag_x';
ALTER TABLE pathways_evidence.item_tag_review ENABLE TRIGGER log_item_tag_review;
INSERT INTO _r(test,actual,expected,pass) SELECT 'T2a unlogged update', pathways_evidence.taxonomy_audit('rbt','6'), 'drift', pathways_evidence.taxonomy_audit('rbt','6')='drift';

-- T2b unlogged DELETE (item 4 loses its row silently) -> drift
ALTER TABLE pathways_evidence.item_tag_review DISABLE TRIGGER log_item_tag_review;
DELETE FROM pathways_evidence.item_tag_review WHERE item_id='4' AND raw_tag='tag_y';
ALTER TABLE pathways_evidence.item_tag_review ENABLE TRIGGER log_item_tag_review;
INSERT INTO _r(test,actual,expected,pass) SELECT 'T2b unlogged delete', pathways_evidence.taxonomy_audit('rbt','4'), 'drift', pathways_evidence.taxonomy_audit('rbt','4')='drift';

-- T2c unlogged INSERT (item 4 gains a row silently) -> drift
ALTER TABLE pathways_evidence.item_tag_review DISABLE TRIGGER log_item_tag_review;
INSERT INTO pathways_evidence.item_tag_review (track,item_id,content_version,raw_tag,alignment_status,assessable,transfer_status,reviewed_by,reviewed_at,surface_cluster_id)
VALUES ('rbt','4','current','tag_z','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_BOGUS');
ALTER TABLE pathways_evidence.item_tag_review ENABLE TRIGGER log_item_tag_review;
INSERT INTO _r(test,actual,expected,pass) SELECT 'T2c unlogged insert', pathways_evidence.taxonomy_audit('rbt','4'), 'drift', pathways_evidence.taxonomy_audit('rbt','4')='drift';

-- T3 granularity: item 2 unaffected
INSERT INTO _r(test,actual,expected,pass) SELECT 'T3 unrelated verified', pathways_evidence.taxonomy_audit('rbt','2'), 'verified', pathways_evidence.taxonomy_audit('rbt','2')='verified';
-- T4 unattested
INSERT INTO _r(test,actual,expected,pass) SELECT 'T4 no baseline', pathways_evidence.taxonomy_audit('rbt','3'), 'unattested', pathways_evidence.taxonomy_audit('rbt','3')='unattested';

-- T5 baseline immutability + reviewer auth + supersession
DO $$ BEGIN
  BEGIN UPDATE pathways_evidence.taxonomy_baseline SET note='x';
    INSERT INTO _r VALUES (DEFAULT,'T5a baseline UPDATE','ACCEPTED (BAD)','refused',false);
  EXCEPTION WHEN OTHERS THEN INSERT INTO _r VALUES (DEFAULT,'T5a baseline UPDATE','refused '||SQLSTATE,'refused',true); END;
  BEGIN DELETE FROM pathways_evidence.taxonomy_baseline;
    INSERT INTO _r VALUES (DEFAULT,'T5b baseline DELETE','ACCEPTED (BAD)','refused',false);
  EXCEPTION WHEN OTHERS THEN INSERT INTO _r VALUES (DEFAULT,'T5b baseline DELETE','refused '||SQLSTATE,'refused',true); END;
  BEGIN PERFORM pathways_evidence.taxonomy_capture_baseline('rbt','1','dddddddd-0000-4000-8000-000000000099');
    INSERT INTO _r VALUES (DEFAULT,'T5c unknown reviewer','ACCEPTED (BAD)','refused',false);
  EXCEPTION WHEN OTHERS THEN INSERT INTO _r VALUES (DEFAULT,'T5c unknown reviewer','refused '||SQLSTATE,'refused',true); END;
END $$;
-- supersession: drifted item 6 re-certified explicitly; old row preserved
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','6','bbbbbbbb-0000-4000-8000-000000000001',
  (SELECT baseline_id FROM pathways_evidence.taxonomy_baseline WHERE item_id='6' ORDER BY captured_at LIMIT 1), 'TEST re-cert after drift');
INSERT INTO _r(test,actual,expected,pass) SELECT 'T5d supersession preserves chain + verifies',
  (SELECT count(*)::text FROM pathways_evidence.taxonomy_baseline WHERE item_id='6') || ' baselines, audit=' || pathways_evidence.taxonomy_audit('rbt','6'),
  '2 baselines, audit=verified',
  (SELECT count(*) FROM pathways_evidence.taxonomy_baseline WHERE item_id='6')=2 AND pathways_evidence.taxonomy_audit('rbt','6')='verified'
  AND EXISTS (SELECT 1 FROM pathways_evidence.taxonomy_baseline WHERE item_id='6' AND supersedes IS NOT NULL);

-- T6 row-level chain continuity: fake UPDATE event with wrong old_row for item 1 -> chain_gap
INSERT INTO pathways_evidence.review_event (table_name,op,old_row,new_row) VALUES
 ('item_tag_review','UPDATE',
  '{"track":"rbt","item_id":"1","content_version":"current","raw_tag":"tag_x","surface_cluster_id":"C_BOGUS"}'::jsonb,
  '{"track":"rbt","item_id":"1","content_version":"current","raw_tag":"tag_x","surface_cluster_id":"C_TEST"}'::jsonb);
INSERT INTO _r(test,actual,expected,pass) SELECT 'T6 row-level chain gap', pathways_evidence.taxonomy_audit('rbt','1'), 'chain_gap', pathways_evidence.taxonomy_audit('rbt','1')='chain_gap';

-- T7 gate: answered item 2 verified, partner item 1 chain_gap -> downgraded
INSERT INTO auth.users (id,aud,role,email,created_at) VALUES ('eeeeeeee-0000-4000-8000-0000000000aa','authenticated','authenticated','tv2@synthetic.invalid','2026-01-10T00:00:00Z');
ALTER TABLE pathways_evidence.attempt_delivery_binding DISABLE TRIGGER ehc_v2_a_stamp;
SELECT set_config('pathways_evidence.serve_writer','on',true) \g /dev/null
CREATE TEMP TABLE _s2 AS SELECT * FROM pathways_evidence.serve_items('eeeeeeee-0000-4000-8000-0000000000aa','rbt',ARRAY['2'],'R1','practice','K1');
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms) OVERRIDING SYSTEM VALUE
  VALUES (-7701,'eeeeeeee-0000-4000-8000-0000000000aa',2,true,'practice',now(),2,5000);
INSERT INTO pathways_evidence.attempt_delivery_binding (attempt_id,item_delivery_id,bound_at)
  VALUES (-7701,(SELECT item_delivery_id FROM _s2),'2027-01-01T00:00:00Z');
INSERT INTO _r(test,actual,expected,pass) SELECT 'T7 partner chain_gap downgrades first_known',
  (SELECT exposure_class_taxonomy_gated || '/' || exposure_reason_taxonomy_gated FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-7701'),
  'unknown_exposure_history/taxonomy_unverified',
  (SELECT exposure_class_taxonomy_gated='unknown_exposure_history' AND exposure_reason_taxonomy_gated='taxonomy_unverified'
   FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-7701');

-- T8 live posture
INSERT INTO _r(test,actual,expected,pass) SELECT 'T8 live item 100 unattested', pathways_evidence.taxonomy_audit('rbt','100'), 'unattested', pathways_evidence.taxonomy_audit('rbt','100')='unattested';

TABLE _r;
SELECT count(*) FILTER (WHERE pass) || '/' || count(*) || ' passed' AS summary FROM _r;
DO $$ DECLARE f int; BEGIN SELECT count(*) INTO f FROM _r WHERE NOT pass; IF f>0 THEN RAISE EXCEPTION 'v2 audit suite: % FAILED', f; END IF; END $$;
ROLLBACK;
