-- v4 exposure evaluation cases - ROLLED BACK, nothing persists.
BEGIN;
\ir /tmp/v4_body.sql

-- synthetic reviewer + review rows (items 1,2 rbt; 1709 bcba; version 'current')
INSERT INTO pathways_evidence.sme_reviewer VALUES ('bbbbbbbb-0000-4000-8000-000000000001','TEST SYNTHETIC','TEST','{rbt,bcba}',true);
INSERT INTO pathways_evidence.item_quality_review (track,item_id,content_version,quality_status,citation_status,key_status,certified_pool,reviewer_id,reviewed_at) VALUES
 ('rbt','1','current','approved','approved','approved','practice','bbbbbbbb-0000-4000-8000-000000000001',now()),
 ('rbt','2','current','approved','approved','approved','practice','bbbbbbbb-0000-4000-8000-000000000001',now()),
 ('bcba','1709','current','approved','approved','approved','practice','bbbbbbbb-0000-4000-8000-000000000001',now());
INSERT INTO pathways_evidence.item_tag_review (track,item_id,content_version,raw_tag,alignment_status,assessable,transfer_status,reviewed_by,reviewed_at,surface_cluster_id) VALUES
 ('rbt','1','current','test_exposure_tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST'),
 ('rbt','2','current','test_exposure_tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST'),
 ('bcba','1709','current','test_exposure_tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),NULL);
INSERT INTO pathways_evidence.option_tag_review (track,item_id,content_version,option_id,raw_tag,attribution_status,reviewed_by,reviewed_at) VALUES
 ('rbt','1','current','0','test_exposure_tag_x','approved','bbbbbbbb-0000-4000-8000-000000000001',now()),
 ('rbt','2','current','1','test_exposure_tag_x','approved','bbbbbbbb-0000-4000-8000-000000000001',now()),
 ('bcba','1709','current','0','test_exposure_tag_x','approved','bbbbbbbb-0000-4000-8000-000000000001',now());
INSERT INTO pathways_evidence.exposure_logging_policy (track,logging_started_at,note) VALUES ('rbt','2026-01-01T00:00:00Z','TEST epoch');


INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
SELECT '00000000-0000-0000-0000-000000000000', ('aaaaaaaa-0000-4000-8000-0000000000e'||n)::uuid, 'authenticated','authenticated',
       'test-e'||n||'@synthetic.invalid','',now(),now(),now(),'','','',''
FROM generate_series(1,8) n;
-- synthetic attempts (negative ids) + presentations
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms) OVERRIDING SYSTEM VALUE VALUES
 (-9001,'aaaaaaaa-0000-4000-8000-0000000000e1',1,false,'practice','2026-02-01T12:00:00Z',0,5000),
 (-9002,'aaaaaaaa-0000-4000-8000-0000000000e2',1,true,'practice','2026-02-01T12:00:00Z',2,5000),
 (-9003,'aaaaaaaa-0000-4000-8000-0000000000e3',2,true,'practice','2026-02-01T12:00:00Z',0,5000),
 (-9004,'aaaaaaaa-0000-4000-8000-0000000000e4',1,true,'practice','2025-12-01T12:00:00Z',2,5000),
 (-9006,'aaaaaaaa-0000-4000-8000-0000000000e6',1709,true,'practice','2026-02-01T12:00:00Z',3,5000),
 (-9007,'aaaaaaaa-0000-4000-8000-0000000000e7',2,true,'practice','2026-02-01T12:00:00Z',0,5000),
 (-9008,'aaaaaaaa-0000-4000-8000-0000000000e8',1,true,'practice','2026-02-01T12:00:00Z',2,5000);
INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,delivery_id,surface_cluster_id_at_presentation) VALUES
 ('aaaaaaaa-0000-4000-8000-0000000000e1','rbt','1','current','2026-01-15T12:00:00Z','DLV-T1',NULL),
 ('aaaaaaaa-0000-4000-8000-0000000000e2','rbt','1','current','2026-02-01T11:58:00Z','DLV-T2',NULL),
 ('aaaaaaaa-0000-4000-8000-0000000000e3','rbt','1','current','2026-01-20T12:00:00Z','DLV-T3',NULL),
 ('aaaaaaaa-0000-4000-8000-0000000000e7','rbt','1','current','2026-01-20T12:00:00Z','DLV-T3B','C_TEST'),
 ('aaaaaaaa-0000-4000-8000-0000000000e8','rbt','1','current','2026-02-01T11:58:00Z','DLV-T2B',NULL);

SELECT 'T1 prior unanswered presentation disqualifies later answer' AS test,
       (SELECT exposure_class FROM pathways_evidence.member_first_encounters_exposure_aware
         WHERE member_id='aaaaaaaa-0000-4000-8000-0000000000e1' AND item_id='1') AS actual,
       'excluded_prior_exposure' AS expected;
SELECT 'T2 immediate UNBOUND presentation: fail-closed disqualify (association gap documented)' AS test,
       (SELECT exposure_class FROM pathways_evidence.member_first_encounters_exposure_aware
         WHERE member_id='aaaaaaaa-0000-4000-8000-0000000000e2' AND item_id='1') AS actual,
       'excluded_prior_exposure' AS expected;
SELECT 'T3 pre-clustering exposure: current cluster of seen item covers merged item' AS test,
       (SELECT exposure_class FROM pathways_evidence.member_first_encounters_exposure_aware
         WHERE member_id='aaaaaaaa-0000-4000-8000-0000000000e3' AND item_id='2') AS actual,
       'excluded_prior_exposure' AS expected;
SELECT 'T3b snapshot cluster covers merged item' AS test,
       (SELECT exposure_class FROM pathways_evidence.member_first_encounters_exposure_aware
         WHERE member_id='aaaaaaaa-0000-4000-8000-0000000000e7' AND item_id='2') AS actual,
       'excluded_prior_exposure' AS expected;
SELECT 'T4 pre-epoch attempt stays unknown' AS test,
       (SELECT exposure_class FROM pathways_evidence.member_first_encounters_exposure_aware
         WHERE member_id='aaaaaaaa-0000-4000-8000-0000000000e4' AND item_id='1') AS actual,
       'unknown_exposure_history' AS expected;
SELECT 'T4b no epoch declared (bcba) stays unknown' AS test,
       (SELECT exposure_class FROM pathways_evidence.member_first_encounters_exposure_aware
         WHERE member_id='aaaaaaaa-0000-4000-8000-0000000000e6' AND item_id='1709') AS actual,
       'unknown_exposure_history' AS expected;
SELECT 'T2c control: unbound presentation disqualifies even in-epoch (motivates binding; T2b shows the bound case)' AS test,
       (SELECT exposure_class FROM pathways_evidence.member_first_encounters_exposure_aware
         WHERE member_id='aaaaaaaa-0000-4000-8000-0000000000e8' AND item_id='1') AS actual,
       'excluded_prior_exposure' AS expected;

-- REAL staged binding: attempt -9005 carries delivery_id in the real column
-- (no view shim - the draft now reads attempts.delivery_id directly).
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms,delivery_id) OVERRIDING SYSTEM VALUE VALUES
 (-9005,'aaaaaaaa-0000-4000-8000-0000000000e5',1,true,'practice','2026-02-01T12:00:00Z',2,5000,'DLV-T2B');
INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,delivery_id) VALUES
 ('aaaaaaaa-0000-4000-8000-0000000000e5','rbt','1','current','2026-02-01T11:58:00Z','DLV-T2B');
SELECT 'T2b BOUND immediate presentation: own delivery does not disqualify (real staged delivery_id column)' AS test,
       (SELECT exposure_class FROM pathways_evidence.member_first_encounters_exposure_aware
         WHERE member_id='aaaaaaaa-0000-4000-8000-0000000000e5' AND item_id='1') AS actual,
       'first_known_exposure' AS expected;

-- Edge cases on the binding/time logic (synthetic members e9, ea, eb)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) VALUES
 ('00000000-0000-0000-0000-000000000000','aaaaaaaa-0000-4000-8000-0000000000e9','authenticated','authenticated','test-e9@synthetic.invalid','',now(),now(),now(),'','','',''),
 ('00000000-0000-0000-0000-000000000000','aaaaaaaa-0000-4000-8000-0000000000ea','authenticated','authenticated','test-ea@synthetic.invalid','',now(),now(),now(),'','','',''),
 ('00000000-0000-0000-0000-000000000000','aaaaaaaa-0000-4000-8000-0000000000eb','authenticated','authenticated','test-eb@synthetic.invalid','',now(),now(),now(),'','','','');
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms,delivery_id) OVERRIDING SYSTEM VALUE VALUES
 (-9009,'aaaaaaaa-0000-4000-8000-0000000000e9',1,true,'practice','2026-02-01T12:00:00Z',2,5000,'DLV-E9'),
 (-9010,'aaaaaaaa-0000-4000-8000-0000000000ea',1,true,'practice','2026-02-01T12:00:00Z',2,5000,'DLV-E10'),
 (-9011,'aaaaaaaa-0000-4000-8000-0000000000eb',1,true,'practice','2026-02-01T12:00:00Z',2,5000,'DLV-E11');
INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,delivery_id) VALUES
 ('aaaaaaaa-0000-4000-8000-0000000000e9','rbt','1','current','2026-02-01T12:05:00Z','DLV-E9X'),
 ('aaaaaaaa-0000-4000-8000-0000000000ea','rbt','1','current','2026-02-01T11:58:00Z',NULL),
 ('aaaaaaaa-0000-4000-8000-0000000000eb','rbt','1','current','2026-02-01T11:58:00Z','DLV-OTHER');
SELECT 'T5 post-answer presentation (review re-display) does not disqualify the answer' AS test,
       (SELECT exposure_class FROM pathways_evidence.member_first_encounters_exposure_aware
         WHERE member_id='aaaaaaaa-0000-4000-8000-0000000000e9' AND item_id='1') AS actual,
       'first_known_exposure' AS expected;
SELECT 'T5b post-answer re-display IS recorded in the authoritative exposure history' AS test,
       (SELECT count(*)::text FROM pathways_evidence.member_item_exposure
         WHERE member_id='aaaaaaaa-0000-4000-8000-0000000000e9' AND item_id='1') AS actual,
       '2' AS expected;
SELECT 'T6 NULL-delivery presentation (pre-instrumentation row) with bound attempt: fail-closed disqualify' AS test,
       (SELECT exposure_class FROM pathways_evidence.member_first_encounters_exposure_aware
         WHERE member_id='aaaaaaaa-0000-4000-8000-0000000000ea' AND item_id='1') AS actual,
       'excluded_prior_exposure' AS expected;
SELECT 'T7 delivery mismatch (different session): disqualify' AS test,
       (SELECT exposure_class FROM pathways_evidence.member_first_encounters_exposure_aware
         WHERE member_id='aaaaaaaa-0000-4000-8000-0000000000eb' AND item_id='1') AS actual,
       'excluded_prior_exposure' AS expected;
ROLLBACK;
