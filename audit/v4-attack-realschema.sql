-- Tab's v4 attack, adapted to the REAL schema + REAL staged delivery_id binding.
-- Changes from the original: no scratch prereqs, no OR REPLACE shim (attempts
-- carry delivery_id directly), auth.users insert uses the proven minimal
-- column list, questions (5,6) insert dropped (real published items exist).
-- Rolled back; nothing persists.
BEGIN;
\ir /tmp/v4_body.sql
CREATE TEMP TABLE _r(n serial, test text, actual text, expected text, pass boolean);
INSERT INTO pathways_evidence.sme_reviewer VALUES ('bbbbbbbb-0000-4000-8000-000000000001','TEST SYNTHETIC','TEST','{rbt,bcba}',true);
INSERT INTO pathways_evidence.item_quality_review (track,item_id,content_version,quality_status,citation_status,key_status,certified_pool,reviewer_id,reviewed_at)
SELECT 'rbt',i::text,'current','approved','approved','approved','practice','bbbbbbbb-0000-4000-8000-000000000001',now() FROM unnest(ARRAY[1,2,3,4,5,6]) i;
INSERT INTO pathways_evidence.item_tag_review (track,item_id,content_version,raw_tag,alignment_status,assessable,transfer_status,reviewed_by,reviewed_at,surface_cluster_id) VALUES
 ('rbt','6','current','tag_z','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_OTHER'),
 ('rbt','1','current','tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST'),
 ('rbt','2','current','tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST'),
 ('rbt','3','current','tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST'),
 ('rbt','4','current','tag_y','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),NULL),
 ('rbt','5','current','tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_SPLIT'),
 ('rbt','6','current','tag_x','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),'C_TEST');
INSERT INTO pathways_evidence.exposure_logging_policy VALUES ('rbt','2026-01-01T00:00:00Z','TEST epoch');
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
SELECT '00000000-0000-0000-0000-000000000000', ('aaaaaaaa-0000-4000-8000-0000000001'||lpad(n::text,2,'0'))::uuid, 'authenticated','authenticated',
       'ta'||n||'@synthetic.invalid','',now(),
       CASE WHEN n=11 THEN '2025-06-01T00:00:00Z'::timestamptz ELSE '2026-01-10T00:00:00Z'::timestamptz END,
       now(),'','','',''
FROM generate_series(11,19) n;
CREATE TEMP TABLE _m AS SELECT n, ('aaaaaaaa-0000-4000-8000-0000000001'||lpad(n::text,2,'0'))::uuid AS id FROM generate_series(11,19) n;

-- A1 member active BEFORE the epoch
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms) OVERRIDING SYSTEM VALUE VALUES
 (-9101,(SELECT id FROM _m WHERE n=11),4,true,'practice','2025-11-01T12:00:00Z',0,5000),
 (-9102,(SELECT id FROM _m WHERE n=11),1,true,'practice','2026-02-01T12:00:00Z',2,5000);
-- A2 rename-merge
INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,delivery_id,surface_cluster_id_at_presentation)
 VALUES ((SELECT id FROM _m WHERE n=12),'rbt','3','current','2026-01-20T12:00:00Z','D12a','C_OLD');
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms) OVERRIDING SYSTEM VALUE VALUES
 (-9121,(SELECT id FROM _m WHERE n=12),1,true,'practice','2026-02-01T12:00:00Z',2,5000);
-- A3 split (policy-dependent expectation)
INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,delivery_id,surface_cluster_id_at_presentation)
 VALUES ((SELECT id FROM _m WHERE n=13),'rbt','1','current','2026-01-20T12:00:00Z','D13a','C_TEST');
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,delivery_id,chosen_option,ms) OVERRIDING SYSTEM VALUE VALUES
 (-9131,(SELECT id FROM _m WHERE n=13),5,true,'practice','2026-02-01T12:00:00Z',NULL,2,5000);
-- A4 multi-tag item
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms) OVERRIDING SYSTEM VALUE VALUES
 (-9141,(SELECT id FROM _m WHERE n=14),6,true,'practice','2026-01-20T12:00:00Z',1,5000),
 (-9142,(SELECT id FROM _m WHERE n=14),1,true,'practice','2026-02-01T12:00:00Z',2,5000);
-- A5 sibling in same delivery
INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,delivery_id) VALUES
 ((SELECT id FROM _m WHERE n=15),'rbt','2','current','2026-02-01T11:50:00Z','DLV-SET'),
 ((SELECT id FROM _m WHERE n=15),'rbt','1','current','2026-02-01T11:58:00Z','DLV-SET');
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,delivery_id,chosen_option,ms) OVERRIDING SYSTEM VALUE VALUES
 (-9151,(SELECT id FROM _m WHERE n=15),1,true,'practice','2026-02-01T12:00:00Z','DLV-SET',2,5000);
-- A6 same item twice under long-lived delivery id
INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,delivery_id) VALUES
 ((SELECT id FROM _m WHERE n=16),'rbt','1','current','2026-01-15T12:00:00Z','DLV-LONG'),
 ((SELECT id FROM _m WHERE n=16),'rbt','1','current','2026-02-01T11:58:00Z','DLV-LONG');
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,delivery_id,chosen_option,ms) OVERRIDING SYSTEM VALUE VALUES
 (-9161,(SELECT id FROM _m WHERE n=16),1,true,'practice','2026-02-01T12:00:00Z','DLV-LONG',2,5000);
-- A7 timestamp tie
INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,delivery_id) VALUES
 ((SELECT id FROM _m WHERE n=17),'rbt','1','current','2026-02-01T12:00:00Z','D17a'),
 ((SELECT id FROM _m WHERE n=17),'rbt','2','current','2026-02-01T12:00:00Z','D17b');
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,delivery_id,chosen_option,ms) OVERRIDING SYSTEM VALUE VALUES
 (-9171,(SELECT id FROM _m WHERE n=17),1,true,'practice','2026-02-01T12:00:00Z','D17a',2,5000),
 (-9172,(SELECT id FROM _m WHERE n=17),2,true,'practice','2026-02-01T12:00:00Z','D17b',0,5000);
-- A8 ghost delivery (no presentation row at all)
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,delivery_id,chosen_option,ms) OVERRIDING SYSTEM VALUE VALUES
 (-9181,(SELECT id FROM _m WHERE n=18),1,true,'practice','2026-02-01T12:00:00Z','D-GHOST',2,5000);
-- A9 control
INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,delivery_id) VALUES
 ((SELECT id FROM _m WHERE n=19),'rbt','1','current','2026-02-01T11:58:00Z','D19a');
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,delivery_id,chosen_option,ms) OVERRIDING SYSTEM VALUE VALUES
 (-9191,(SELECT id FROM _m WHERE n=19),1,true,'practice','2026-02-01T12:00:00Z','D19a',2,5000);

CREATE TEMP VIEW _c AS SELECT m.n, f.item_id, f.exposure_class FROM pathways_evidence.member_first_encounters_exposure_aware f JOIN _m m ON m.id=f.member_id;
INSERT INTO _r(test,actual,expected) VALUES
 ('A1 [demo 4] member active pre-epoch; in-epoch first answer must stay unknown', (SELECT exposure_class FROM _c WHERE n=11 AND item_id='1'), 'unknown_exposure_history'),
 ('A2 [demo 3] exposure snapshot C_OLD, C_OLD merged into C_TEST', (SELECT exposure_class FROM _c WHERE n=12 AND item_id='1'), 'excluded_prior_exposure'),
 ('A3 [demo 3, POLICY] exposure snapshot C_TEST, answered item later split to C_SPLIT', (SELECT exposure_class FROM _c WHERE n=13 AND item_id='5'), 'excluded_prior_exposure'),
 ('A4 [demo 3] prior answer on a multi-tag item that shares C_TEST', (SELECT string_agg(DISTINCT exposure_class,',') FROM _c WHERE n=14 AND item_id='1'), 'excluded_prior_exposure'),
 ('A5 [demo 1] sibling shown earlier in the same delivery (set)', (SELECT exposure_class FROM _c WHERE n=15 AND item_id='1'), 'excluded_prior_exposure'),
 ('A6 [demo 1] same item shown 2 weeks earlier under the same delivery id', (SELECT exposure_class FROM _c WHERE n=16 AND item_id='1'), 'excluded_prior_exposure'),
 ('A7 [demo 1] timestamp tie between cluster siblings: not both first_known', (SELECT CASE WHEN count(*)<=1 THEN 'at_most_one' ELSE count(*)||' first_known' END FROM _c WHERE n=17 AND exposure_class='first_known_exposure'), 'at_most_one'),
 ('A8 [demo 4] bound to a delivery with no presentation row (logging gap)', (SELECT exposure_class FROM _c WHERE n=18 AND item_id='1'), 'unknown_exposure_history'),
 ('A9 [demo 2] control: post-epoch member, own bound presentation only', (SELECT exposure_class FROM _c WHERE n=19 AND item_id='1'), 'first_known_exposure'),
 ('S1 new views carry security_invoker=true', (SELECT string_agg(c.relname||'='||coalesce(array_to_string(c.reloptions,','),'(none)'),' ; ' ORDER BY c.relname) FROM pg_class c JOIN pg_namespace s ON s.oid=c.relnamespace WHERE s.nspname='pathways_evidence' AND c.relname IN ('member_item_exposure','member_first_encounters_exposure_aware')),
     'member_first_encounters_exposure_aware=security_invoker=true ; member_item_exposure=security_invoker=true');
UPDATE _r SET pass = (actual IS NOT DISTINCT FROM expected);
SELECT n, CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END AS result, test, actual, expected FROM _r ORDER BY n;
ROLLBACK;
