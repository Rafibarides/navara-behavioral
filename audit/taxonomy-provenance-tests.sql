-- Taxonomy provenance audit tests. Rolled back; nothing persists.
BEGIN;
SET LOCAL TimeZone = 'UTC';
\ir /tmp/ehc21_body.sql
\ir /home/sandbox/pathways-repo/supabase/TAXONOMY_PROVENANCE_AUDIT_DRAFT.sql
CREATE TEMP TABLE _r(n serial, test text, actual text, expected text, pass boolean);

-- fixtures
INSERT INTO public.questions (id,track,area,body,options,answer,explanation,published,created_at) OVERRIDING SYSTEM VALUE
SELECT i,'rbt','TEST','synthetic stem '||i,'[{"t":"a"},{"t":"b"},{"t":"c"},{"t":"d"}]'::jsonb,0,'synthetic',
       true, '2025-01-01T00:00:00Z'::timestamptz
FROM generate_series(1,6) g(i) ON CONFLICT (id) DO UPDATE SET created_at = EXCLUDED.created_at, published = true;
INSERT INTO pathways_evidence.sme_reviewer VALUES ('bbbbbbbb-0000-4000-8000-000000000001','TEST SYNTHETIC','TEST','{rbt,bcba}',true);
INSERT INTO pathways_evidence.item_tag_review (track,item_id,content_version,raw_tag,alignment_status,assessable,transfer_status,reviewed_by,reviewed_at,surface_cluster_id) VALUES
 ('rbt','1','current','tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST'),
 ('rbt','2','current','tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST'),
 ('rbt','5','current','tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST');
-- item 6's ORIGINAL mapping predates the log (trigger off, as a pre-log legacy row would):
ALTER TABLE pathways_evidence.item_tag_review DISABLE TRIGGER log_item_tag_review;
INSERT INTO pathways_evidence.item_tag_review (track,item_id,content_version,raw_tag,alignment_status,assessable,transfer_status,reviewed_by,reviewed_at,surface_cluster_id) VALUES
 ('rbt','6','current','tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST');
ALTER TABLE pathways_evidence.item_tag_review ENABLE TRIGGER log_item_tag_review;
INSERT INTO pathways_evidence.exposure_logging_policy (track,logging_started_at,note,inventory_attested_at,inventory_attested_by)
VALUES ('rbt','2026-01-01T00:00:00Z','TEST epoch','2026-01-01T00:00:00Z','TEST');

-- baselines (B0) for items 1,2,5,6 - captured now, AFTER the review rows above
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','1','TEST');
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','2','TEST');
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','5','TEST');
SELECT pathways_evidence.taxonomy_capture_baseline('rbt','6','TEST');

-- T1: logged split of item 5 (C_TEST -> C_SPLIT) keeps it verified
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id = 'C_SPLIT' WHERE item_id='5' AND raw_tag='tag_x';
INSERT INTO _r(test,actual,expected,pass)
VALUES ('T1 logged split stays verified', pathways_evidence.taxonomy_audit('rbt','5'), 'verified', pathways_evidence.taxonomy_audit('rbt','5')='verified');

-- T2 negative control: UNLOGGED change to item 6 (trigger disabled, as a bulk migration would do)
ALTER TABLE pathways_evidence.item_tag_review DISABLE TRIGGER log_item_tag_review;
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id = 'C_SPLIT2' WHERE item_id='6' AND raw_tag='tag_x';
ALTER TABLE pathways_evidence.item_tag_review ENABLE TRIGGER log_item_tag_review;
INSERT INTO _r(test,actual,expected,pass)
VALUES ('T2 unlogged change detected as drift', pathways_evidence.taxonomy_audit('rbt','6'), 'drift', pathways_evidence.taxonomy_audit('rbt','6')='drift');

-- T3 granularity: unrelated item 2 remains verified despite item 6 drift
INSERT INTO _r(test,actual,expected,pass)
VALUES ('T3 unrelated item stays verified', pathways_evidence.taxonomy_audit('rbt','2'), 'verified', pathways_evidence.taxonomy_audit('rbt','2')='verified');

-- T4 unattested item (3, no baseline)
INSERT INTO _r(test,actual,expected,pass)
VALUES ('T4 no baseline = unattested', pathways_evidence.taxonomy_audit('rbt','3'), 'unattested', pathways_evidence.taxonomy_audit('rbt','3')='unattested');

-- T5 log tampering refused (mutation loudness)
DO $$ BEGIN
  BEGIN
    UPDATE pathways_evidence.review_event SET old_row = '{"tampered":true}'::jsonb WHERE true;
    INSERT INTO _r(test,actual,expected,pass) VALUES ('T5a review_event UPDATE tamper','ACCEPTED (BAD)','refused',false);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _r(test,actual,expected,pass) VALUES ('T5a review_event UPDATE tamper','refused '||SQLSTATE,'refused',true);
  END;
  BEGIN
    DELETE FROM pathways_evidence.review_event WHERE true;
    INSERT INTO _r(test,actual,expected,pass) VALUES ('T5b review_event DELETE','ACCEPTED (BAD)','refused',false);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _r(test,actual,expected,pass) VALUES ('T5b review_event DELETE','refused '||SQLSTATE,'refused',true);
  END;
END $$;

-- T6 gate: bound-answer eligibility on drifted item 6 downgrades to unknown even with attested policy.
-- member serves item 1 (C_TEST exposure), then is served + answers item 6 (now drifted C_SPLIT2).
INSERT INTO auth.users (id,aud,role,email,created_at) VALUES ('eeeeeeee-0000-4000-8000-0000000000aa','authenticated','authenticated','tp@synthetic.invalid','2026-01-10T00:00:00Z');
ALTER TABLE pathways_evidence.attempt_delivery_binding DISABLE TRIGGER ehc_v2_a_stamp;
SELECT set_config('pathways_evidence.serve_writer','on',true) \g /dev/null
CREATE TEMP TABLE _s1 AS SELECT * FROM pathways_evidence.serve_items('eeeeeeee-0000-4000-8000-0000000000aa','rbt',ARRAY['1'],'R1','practice','K1');
CREATE TEMP TABLE _s6 AS SELECT * FROM pathways_evidence.serve_items('eeeeeeee-0000-4000-8000-0000000000aa','rbt',ARRAY['6'],'R2','practice','K2');
-- serves carry real now() times; answers bind at 2027 so serves are prior
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms) OVERRIDING SYSTEM VALUE
  VALUES (-6601,'eeeeeeee-0000-4000-8000-0000000000aa',6,true,'practice',now(),2,5000);
INSERT INTO pathways_evidence.attempt_delivery_binding (attempt_id,item_delivery_id,bound_at)
  VALUES (-6601,(SELECT item_delivery_id FROM _s6),'2027-01-01T00:00:00Z');
INSERT INTO _r(test,actual,expected,pass)
SELECT 'T6 drifted item 6 answer gated to unknown',
       (SELECT exposure_class_taxonomy_gated || '/' || exposure_reason_taxonomy_gated FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-6601'),
       'unknown_exposure_history/taxonomy_unverified',
       (SELECT exposure_class_taxonomy_gated='unknown_exposure_history' AND exposure_reason_taxonomy_gated='taxonomy_unverified' FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-6601');

-- T6b control: same setup on verified item 5 reaches a non-taxonomy reason (shows the wrapper only touches first_known)
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms) OVERRIDING SYSTEM VALUE
  VALUES (-6602,'eeeeeeee-0000-4000-8000-0000000000aa',5,true,'practice',now(),2,5000);
CREATE TEMP TABLE _s5 AS SELECT * FROM pathways_evidence.serve_items('eeeeeeee-0000-4000-8000-0000000000aa','rbt',ARRAY['5'],'R3','practice','K3');
INSERT INTO pathways_evidence.attempt_delivery_binding (attempt_id,item_delivery_id,bound_at)
  VALUES (-6602,(SELECT item_delivery_id FROM _s5),'2027-01-01T00:05:00Z');
INSERT INTO _r(test,actual,expected,pass)
SELECT 'T6b verified item 5: prior C_TEST exposure excludes (sticky via logged split)',
       (SELECT exposure_class_taxonomy_gated FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-6602'),
       'excluded_prior_exposure',
       (SELECT exposure_class_taxonomy_gated='excluded_prior_exposure' FROM pathways_evidence.member_first_encounters_taxonomy_gated WHERE attempt_id='-6602');

-- T7 live posture: a real live item with no baseline is unattested
INSERT INTO _r(test,actual,expected,pass)
VALUES ('T7 live item 100 has no baseline', pathways_evidence.taxonomy_audit('rbt','100'), 'unattested', pathways_evidence.taxonomy_audit('rbt','100')='unattested');

TABLE _r;
SELECT count(*) FILTER (WHERE pass) || '/' || count(*) || ' passed' AS summary FROM _r;
DO $$ DECLARE f int; BEGIN SELECT count(*) INTO f FROM _r WHERE NOT pass;
  IF f > 0 THEN RAISE EXCEPTION 'taxonomy audit suite: % FAILED', f; END IF; END $$;
ROLLBACK;
