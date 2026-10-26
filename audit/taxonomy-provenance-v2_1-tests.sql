-- Taxonomy provenance audit v2.1 tests. Rolled back; nothing persists.
-- Suite = v2 tests (T5d revised for anti-laundering marker) + T9 full row identity,
-- T10 deterministic same-tx tip selection, T11 savepoint rollback, T12 prospective A3.
BEGIN;
SET LOCAL TimeZone = 'UTC';
\ir /tmp/ehc21_body.sql
\ir /home/sandbox/pathways-repo/supabase/TAXONOMY_PROVENANCE_AUDIT_V2_DRAFT.sql
\ir /home/sandbox/pathways-repo/supabase/TAXONOMY_PROVENANCE_AUDIT_V2_1_DRAFT.sql
CREATE TEMP TABLE _r(n serial, test text, actual text, expected text, pass boolean);
INSERT INTO public.questions (id,track,area,body,options,answer,explanation,published,created_at) OVERRIDING SYSTEM VALUE
SELECT i,'rbt','TEST','synthetic stem '||i,'[{"t":"a"},{"t":"b"},{"t":"c","x":0},{"t":"d"}]'::jsonb,0,'synthetic',true,'2025-01-01T00:00:00Z'::timestamptz
FROM generate_series(1,10) g(i) ON CONFLICT (id) DO UPDATE SET created_at=EXCLUDED.created_at, published=true;
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
-- baselines (chain tips, in seq order)
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

-- T5 baseline immutability + reviewer auth + supersession (v2.1: anti-laundering marker)
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
  -- T5e stale supersession target (not the current chain tip) must fail loudly
  BEGIN PERFORM pathways_evidence.taxonomy_capture_baseline('rbt','2','bbbbbbbb-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000099');
    INSERT INTO _r VALUES (DEFAULT,'T5e non-tip supersession','ACCEPTED (BAD)','refused',false);
  EXCEPTION WHEN OTHERS THEN INSERT INTO _r VALUES (DEFAULT,'T5e non-tip supersession','refused '||SQLSTATE,'refused',true); END;
END $$;
-- supersession: drifted item 6 re-certified explicitly; old row preserved; failure MARKED (v2.1)
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','6','bbbbbbbb-0000-4000-8000-000000000001',
  (SELECT baseline_id FROM pathways_evidence.taxonomy_baseline WHERE item_id='6' ORDER BY baseline_seq DESC LIMIT 1), 'TEST re-cert after drift');
INSERT INTO _r(test,actual,expected,pass) SELECT 'T5d supersession marks failure, no laundering',
  (SELECT count(*)::text FROM pathways_evidence.taxonomy_baseline WHERE item_id='6') || ' baselines, audit=' || pathways_evidence.taxonomy_audit('rbt','6')
  || ', superseded_failure=' || (SELECT superseded_failure FROM pathways_evidence.taxonomy_baseline WHERE item_id='6' ORDER BY baseline_seq DESC LIMIT 1),
  '2 baselines, audit=verified, superseded_failure=true',
  (SELECT count(*) FROM pathways_evidence.taxonomy_baseline WHERE item_id='6')=2 AND pathways_evidence.taxonomy_audit('rbt','6')='verified'
  AND EXISTS (SELECT 1 FROM pathways_evidence.taxonomy_baseline WHERE item_id='6' AND supersedes IS NOT NULL AND superseded_failure);

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

-- T9 full row identity (C2): two content versions of the same raw tag on item 9
INSERT INTO pathways_evidence.item_tag_review (track,item_id,content_version,raw_tag,alignment_status,assessable,transfer_status,reviewed_by,reviewed_at,surface_cluster_id) VALUES
 ('rbt','9','v1','tag_m','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_MV1'),
 ('rbt','9','v2','tag_m','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_MV2');
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','9','bbbbbbbb-0000-4000-8000-000000000001');
INSERT INTO _r(test,actual,expected,pass) SELECT 'T9a baseline keeps both versions',
  (SELECT string_agg(key,'+' ORDER BY key) FROM jsonb_object_keys((SELECT row_mapping FROM pathways_evidence.taxonomy_baseline WHERE item_id='9')) key),
  'tag_m@v1+tag_m@v2',
  (SELECT count(*) FROM jsonb_object_keys((SELECT row_mapping FROM pathways_evidence.taxonomy_baseline WHERE item_id='9')) key)=2;
-- logged UPDATE of the v1 row only: replay must apply it by full identity, v2 untouched -> verified
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id='C_MV1B' WHERE item_id='9' AND content_version='v1';
INSERT INTO _r(test,actual,expected,pass) SELECT 'T9b logged v1 update verified', pathways_evidence.taxonomy_audit('rbt','9'), 'verified', pathways_evidence.taxonomy_audit('rbt','9')='verified';
-- unlogged UPDATE of the v2 row only -> drift (the versions never collapse into one entry)
ALTER TABLE pathways_evidence.item_tag_review DISABLE TRIGGER log_item_tag_review;
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id='C_MV2X' WHERE item_id='9' AND content_version='v2';
ALTER TABLE pathways_evidence.item_tag_review ENABLE TRIGGER log_item_tag_review;
INSERT INTO _r(test,actual,expected,pass) SELECT 'T9c unlogged v2 update drift', pathways_evidence.taxonomy_audit('rbt','9'), 'drift', pathways_evidence.taxonomy_audit('rbt','9')='drift';

-- T10 deterministic tip selection (C3): two captures in ONE transaction share captured_at;
-- the unlogged mutation between them produced NO event, so both baselines also share
-- event_horizon. v2's ordering was ambiguous here; baseline_seq must pick the tip (B).
INSERT INTO pathways_evidence.item_tag_review (track,item_id,content_version,raw_tag,alignment_status,assessable,transfer_status,reviewed_by,reviewed_at,surface_cluster_id)
VALUES ('rbt','10','current','tag_d','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_D1');
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','10','bbbbbbbb-0000-4000-8000-000000000001');
ALTER TABLE pathways_evidence.item_tag_review DISABLE TRIGGER log_item_tag_review;
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id='C_D2' WHERE item_id='10';
ALTER TABLE pathways_evidence.item_tag_review ENABLE TRIGGER log_item_tag_review;
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','10','bbbbbbbb-0000-4000-8000-000000000001',
  (SELECT baseline_id FROM pathways_evidence.taxonomy_baseline WHERE item_id='10' ORDER BY baseline_seq DESC LIMIT 1), 'TEST tip recert');
INSERT INTO _r(test,actual,expected,pass) SELECT 'T10 same-tx tip is deterministic',
  (SELECT count(DISTINCT captured_at)::text FROM pathways_evidence.taxonomy_baseline WHERE item_id='10') || ' captured_at values, audit=' || pathways_evidence.taxonomy_audit('rbt','10')
  || ', failure=' || (SELECT superseded_failure::text FROM pathways_evidence.taxonomy_baseline WHERE item_id='10' ORDER BY baseline_seq DESC LIMIT 1),
  '1 captured_at values, audit=verified, failure=true',
  (SELECT count(DISTINCT captured_at) FROM pathways_evidence.taxonomy_baseline WHERE item_id='10')=1
  AND pathways_evidence.taxonomy_audit('rbt','10')='verified'
  AND (SELECT superseded_failure FROM pathways_evidence.taxonomy_baseline WHERE item_id='10' ORDER BY baseline_seq DESC LIMIT 1);

-- T11 savepoint rollback: an unlogged mutation that is ROLLED BACK leaves no event and no drift
SAVEPOINT sp11;
ALTER TABLE pathways_evidence.item_tag_review DISABLE TRIGGER log_item_tag_review;
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id='C_ROLLEDBACK' WHERE item_id='2' AND raw_tag='tag_x';
ROLLBACK TO SAVEPOINT sp11;
INSERT INTO _r(test,actual,expected,pass) SELECT 'T11a rolled-back mutation invisible', pathways_evidence.taxonomy_audit('rbt','2'), 'verified', pathways_evidence.taxonomy_audit('rbt','2')='verified';
-- and the logging trigger was restored by the savepoint rollback: a logged UPDATE still chains cleanly
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id='C_T11' WHERE item_id='2' AND raw_tag='tag_x';
INSERT INTO _r(test,actual,expected,pass) SELECT 'T11b logged update after rollback verified', pathways_evidence.taxonomy_audit('rbt','2'), 'verified', pathways_evidence.taxonomy_audit('rbt','2')='verified';

-- T12 prospective A3 (C1+C4): certified relationship -> bound encounter -> unlogged split
-- -> fail closed -> failure-marked supersession -> OLD encounter STILL closed, NEW certifies.
INSERT INTO pathways_evidence.item_tag_review (track,item_id,content_version,raw_tag,alignment_status,assessable,transfer_status,reviewed_by,reviewed_at,surface_cluster_id) VALUES
 ('rbt','7','current','tag_a','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_A3'),
 ('rbt','8','current','tag_a','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_A3');
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','7','bbbbbbbb-0000-4000-8000-000000000001');
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','8','bbbbbbbb-0000-4000-8000-000000000001');
INSERT INTO auth.users (id,aud,role,email,created_at) VALUES
 ('eeeeeeee-0000-4000-8000-0000000000ab','authenticated','authenticated','tv21old@synthetic.invalid','2026-01-10T00:00:00Z'),
 ('eeeeeeee-0000-4000-8000-0000000000ac','authenticated','authenticated','tv21new@synthetic.invalid','2026-01-10T00:00:00Z');
-- old encounter bound 2026-06-02 (delivery 2026-06-01): backdated via stamp trigger off (test-only)
SELECT set_config('pathways_evidence.serve_writer','on',true) \g /dev/null
ALTER TABLE pathways_evidence.item_presentation_event DISABLE TRIGGER ehc_v2_b_stamp;
CREATE TEMP TABLE _d_old AS
WITH ins AS (
INSERT INTO pathways_evidence.item_presentation_event
  (member_id, track, item_id, content_version, presentation_context, event_type, logged_by,
   item_delivery_id, serve_request_key, server_recorded_at, dependence_keys_at_delivery, content_hash_at_delivery)
SELECT 'eeeeeeee-0000-4000-8000-0000000000ab','rbt','8','current','practice','served_exposure','server',
       gen_random_uuid(),'A3-OLD','2026-06-01T00:00:00Z', ARRAY['C_A3','ITEM:8'],
       pathways_evidence.content_hash(q.body,q.options,q.answer,q.explanation,q.citation)
FROM public.questions q WHERE q.id=8 RETURNING item_delivery_id
) SELECT * FROM ins;
ALTER TABLE pathways_evidence.item_presentation_event ENABLE TRIGGER ehc_v2_b_stamp;
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms) OVERRIDING SYSTEM VALUE
  VALUES (-7801,'eeeeeeee-0000-4000-8000-0000000000ab',8,true,'practice','2026-06-02T00:00:00Z',2,5000);
INSERT INTO pathways_evidence.attempt_delivery_binding (attempt_id,item_delivery_id,bound_at)
  VALUES (-7801,(SELECT item_delivery_id FROM _d_old),'2026-06-02T00:00:00Z');
INSERT INTO _r(test,actual,expected,pass) SELECT 'T12a certified pair: old encounter first_known',
  (SELECT exposure_class_taxonomy_gated FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-7801'),
  'first_known_exposure',
  (SELECT exposure_class_taxonomy_gated='first_known_exposure' FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-7801');
-- unlogged split of partner item 7
ALTER TABLE pathways_evidence.item_tag_review DISABLE TRIGGER log_item_tag_review;
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id='C_A3_SPLIT' WHERE item_id='7';
ALTER TABLE pathways_evidence.item_tag_review ENABLE TRIGGER log_item_tag_review;
INSERT INTO _r(test,actual,expected,pass) SELECT 'T12b unlogged split fails closed',
  (SELECT exposure_class_taxonomy_gated || '/' || exposure_reason_taxonomy_gated FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-7801'),
  'unknown_exposure_history/taxonomy_unverified',
  (SELECT exposure_class_taxonomy_gated='unknown_exposure_history' FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-7801');
-- failure-marked supersession of item 7: certifies the future only
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','7','bbbbbbbb-0000-4000-8000-000000000001',
  (SELECT baseline_id FROM pathways_evidence.taxonomy_baseline WHERE item_id='7' ORDER BY baseline_seq DESC LIMIT 1), 'TEST recert after unlogged split');
INSERT INTO _r(test,actual,expected,pass) SELECT 'T12c recert marks failure + verifies prospectively',
  pathways_evidence.taxonomy_audit('rbt','7') || '/' || (SELECT superseded_failure::text FROM pathways_evidence.taxonomy_baseline WHERE item_id='7' ORDER BY baseline_seq DESC LIMIT 1),
  'verified/true',
  pathways_evidence.taxonomy_audit('rbt','7')='verified'
  AND (SELECT superseded_failure FROM pathways_evidence.taxonomy_baseline WHERE item_id='7' ORDER BY baseline_seq DESC LIMIT 1);
-- THE anti-laundering assertion: the OLD encounter (bound before the failure-marked recert) stays closed
INSERT INTO _r(test,actual,expected,pass) SELECT 'T12d old encounter NOT laundered by recert',
  (SELECT exposure_class_taxonomy_gated FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-7801'),
  'unknown_exposure_history',
  (SELECT exposure_class_taxonomy_gated='unknown_exposure_history' FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-7801');
-- a NEW encounter after the recert certifies prospectively
CREATE TEMP TABLE _s_new AS SELECT * FROM pathways_evidence.serve_items('eeeeeeee-0000-4000-8000-0000000000ac','rbt',ARRAY['8'],'R3','practice','A3-NEW');
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms) OVERRIDING SYSTEM VALUE
  VALUES (-7802,'eeeeeeee-0000-4000-8000-0000000000ac',8,true,'practice','2027-01-01T00:00:00Z',2,5000);
INSERT INTO pathways_evidence.attempt_delivery_binding (attempt_id,item_delivery_id,bound_at)
  VALUES (-7802,(SELECT item_delivery_id FROM _s_new),'2027-01-01T00:00:00Z');
INSERT INTO _r(test,actual,expected,pass) SELECT 'T12e new encounter certifies prospectively',
  (SELECT exposure_class_taxonomy_gated FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-7802'),
  'first_known_exposure',
  (SELECT exposure_class_taxonomy_gated='first_known_exposure' FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-7802');

TABLE _r;
SELECT count(*) FILTER (WHERE pass) || '/' || count(*) || ' passed' AS summary FROM _r;
DO $$ DECLARE f int; BEGIN SELECT count(*) INTO f FROM _r WHERE NOT pass; IF f>0 THEN RAISE EXCEPTION 'v2.1 audit suite: % FAILED', f; END IF; END $$;
ROLLBACK;
