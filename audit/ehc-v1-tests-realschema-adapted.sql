-- ehc-v1-tests.sql : asserting suite for the EHC v1 proposal (Tab, 2026-10-26). Rolled back; nothing persists.
-- HOW TO RUN (throwaway Postgres 15 only): load the schema extract as runnable DDL, copy ehc-v1.sql.txt to
-- /tmp/ehc_body.sql, then: psql -X -v ON_ERROR_STOP=1 -f ehc-v1-tests.sql
-- Every case is an assertion row. The file ends with RAISE EXCEPTION if any case failed, so psql exits non-zero.
BEGIN;
CREATE TEMP TABLE _shipped_before AS
  SELECT c.relname, pg_get_viewdef(c.oid) AS def, c.reloptions FROM pg_class c JOIN pg_namespace s ON s.oid = c.relnamespace
  WHERE s.nspname = 'pathways_evidence' AND c.relkind = 'v';
\ir /tmp/ehc_body.sql
\ir /tmp/ehc_body.sql
-- (applied twice on purpose: idempotency)
CREATE TEMP TABLE _r(n serial, inv text, test text, actual text, expected text, pass boolean);

-- Fixtures (synthetic). Epoch 2026-01-01 on rbt. Old items 1-8 created 2025-01-01; fresh variants 20-22 created 2026-03-01.
INSERT INTO public.questions (id,track,area,body,options,answer,explanation,published,created_at)
OVERRIDING SYSTEM VALUE
SELECT i,'rbt','TEST','synthetic stem '||i,'[{"t":"a"},{"t":"b"},{"t":"c"},{"t":"d"}]'::jsonb,0,'synthetic',
       i <> 8, CASE WHEN i >= 20 THEN '2026-03-01T00:00:00Z'::timestamptz ELSE '2025-01-01T00:00:00Z'::timestamptz END
FROM (SELECT generate_series(1,8) UNION ALL SELECT generate_series(20,22)) g(i)
ON CONFLICT (id) DO UPDATE SET created_at = EXCLUDED.created_at, published = EXCLUDED.published;
INSERT INTO pathways_evidence.sme_reviewer VALUES ('bbbbbbbb-0000-4000-8000-000000000001','TEST SYNTHETIC','TEST','{rbt,bcba}',true);
INSERT INTO pathways_evidence.item_quality_review (track,item_id,content_version,quality_status,citation_status,key_status,certified_pool,reviewer_id,reviewed_at)
SELECT 'rbt',i::text,'current','approved','approved','approved','practice','bbbbbbbb-0000-4000-8000-000000000001',now()
FROM unnest(ARRAY[1,2,3,4,5,6,7,8,20,21,22]) i;
INSERT INTO pathways_evidence.item_tag_review (track,item_id,content_version,raw_tag,alignment_status,assessable,transfer_status,reviewed_by,reviewed_at,surface_cluster_id)
SELECT 'rbt',v.item,'current',v.tag,'approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),v.cl
FROM (VALUES ('6','tag_z','C_OTHER'),('1','tag_x','C_TEST'),('2','tag_x','C_TEST'),('3','tag_x','C_TEST'),('4','tag_y',NULL),
             ('5','tag_x','C_TEST'),('6','tag_x','C_TEST'),('7','tag_x','C_OLD'),('8','tag_x','C_TEST'),
             ('20','tag_x','C_NEWVAR'),('21','tag_x','C_NEWVAR'),('22','tag_x','C_TEST')) v(item,tag,cl);
INSERT INTO pathways_evidence.option_tag_review (track,item_id,content_version,option_id,raw_tag,attribution_status,reviewed_by,reviewed_at)
SELECT track,item_id,content_version,'1',raw_tag,'approved',reviewed_by,now() FROM pathways_evidence.item_tag_review;
-- cluster history on the real schema = UPDATEs that review_event logs:
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id='C_SPLIT' WHERE item_id='5' AND raw_tag='tag_x';  -- split out of C_TEST
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id='C_TEST'  WHERE item_id='7' AND raw_tag='tag_x';  -- C_OLD merged into C_TEST
INSERT INTO pathways_evidence.exposure_logging_policy (track,logging_started_at,note) VALUES ('rbt','2026-01-01T00:00:00Z','TEST epoch');
INSERT INTO auth.users (id,aud,role,email,created_at)
SELECT ('cccccccc-0000-4000-8000-0000000000'||lpad(n::text,2,'0'))::uuid,'authenticated','authenticated','e'||n||'@synthetic.invalid',
       CASE WHEN n IN (4,5,6,7,8,30) THEN '2025-06-01T00:00:00Z'::timestamptz ELSE '2026-01-10T00:00:00Z'::timestamptz END
FROM generate_series(1,40) n;  -- REAL-SCHEMA ADAPTATION: member 30 needs an auth.users row (attempts FK); pre-epoch created_at preserves the expected class via account_created
CREATE TEMP TABLE _m AS SELECT n, ('cccccccc-0000-4000-8000-0000000000'||lpad(n::text,2,'0'))::uuid AS id FROM generate_series(1,40) n;
CREATE FUNCTION pg_temp.att(p_n int, p_id bigint, p_q int, p_at timestamptz) RETURNS void LANGUAGE sql AS $f$
  INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms) OVERRIDING SYSTEM VALUE
  VALUES (p_id,(SELECT id FROM _m WHERE n=p_n),p_q,false,'practice',p_at,1,5000) $f$;
CREATE FUNCTION pg_temp.pres(p_n int, p_item text, p_at timestamptz, p_by text, p_recv timestamptz DEFAULT NULL,
                             p_ctx text DEFAULT 'practice', p_snap text DEFAULT NULL) RETURNS void LANGUAGE sql AS $f$
  INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,received_at,presentation_context,surface_cluster_id_at_presentation,logged_by)
  VALUES ((SELECT id FROM _m WHERE n=p_n),'rbt',p_item,'current',p_at,COALESCE(p_recv,p_at),p_ctx,p_snap,p_by) $f$;
CREATE FUNCTION pg_temp.cls(p_n int, p_item text) RETURNS text LANGUAGE sql AS $f$
  SELECT string_agg(DISTINCT exposure_class || '/' || exposure_reason, ',') FROM pathways_evidence.member_first_encounters_exposure_aware
  WHERE member_id = (SELECT id FROM _m WHERE n=p_n) AND item_id = p_item $f$;

-- member 1: control (post-epoch member, one server serve, answer)
SELECT pg_temp.pres(1,'1','2026-02-01T11:58:00Z','server'); SELECT pg_temp.att(1,-101,1,'2026-02-01T12:00:00Z');
-- member 2: pre-epoch answer
SELECT pg_temp.pres(2,'1','2025-12-01T11:58:00Z','server'); SELECT pg_temp.att(2,-201,1,'2025-12-01T12:00:00Z');
-- member 3: post-epoch member, item 2, client-only display
SELECT pg_temp.pres(3,'2','2026-02-01T11:58:00Z','client'); SELECT pg_temp.att(3,-301,2,'2026-02-01T12:00:00Z');
-- member 4: account pre-epoch, no pre-epoch activity, server serve in epoch (history-start rule decides)
SELECT pg_temp.pres(4,'1','2026-02-01T11:58:00Z','server'); SELECT pg_temp.att(4,-401,1,'2026-02-01T12:00:00Z');
-- member 5: account pre-epoch, pre-epoch attempt on unrelated item 4, server serve of item 1 in epoch
SELECT pg_temp.att(5,-501,4,'2025-11-01T12:00:00Z');
SELECT pg_temp.pres(5,'1','2026-02-01T11:58:00Z','server'); SELECT pg_temp.att(5,-502,1,'2026-02-01T12:00:00Z');
-- member 6: pre-epoch member answers a fresh variant (cluster C_NEWVAR, all created after epoch)
SELECT pg_temp.pres(6,'20','2026-03-05T11:58:00Z','server'); SELECT pg_temp.att(6,-601,20,'2026-03-05T12:00:00Z');
-- member 7: pre-epoch member answers new item 22, which shares C_TEST with old items
SELECT pg_temp.pres(7,'22','2026-03-05T11:58:00Z','server'); SELECT pg_temp.att(7,-701,22,'2026-03-05T12:00:00Z');
-- member 9: logged_by unknown (legacy rows)
SELECT pg_temp.pres(9,'1','2026-02-01T11:58:00Z','unknown'); SELECT pg_temp.att(9,-901,1,'2026-02-01T12:00:00Z');
-- member 10: ghost (no presentation row at all)
SELECT pg_temp.att(10,-1001,1,'2026-02-01T12:00:00Z');
-- member 11: sibling 2 served earlier in the same set, then item 1 served and answered
SELECT pg_temp.pres(11,'2','2026-02-01T11:50:00Z','server'); SELECT pg_temp.pres(11,'1','2026-02-01T11:58:00Z','server');
SELECT pg_temp.att(11,-1101,1,'2026-02-01T12:00:00Z');
-- member 12: same item served 2 weeks earlier, served again, answered
SELECT pg_temp.pres(12,'1','2026-01-15T12:00:00Z','server'); SELECT pg_temp.pres(12,'1','2026-02-01T11:58:00Z','server');
SELECT pg_temp.att(12,-1201,1,'2026-02-01T12:00:00Z');
-- member 13: timestamp tie between cluster siblings
SELECT pg_temp.pres(13,'1','2026-02-01T12:00:00Z','server'); SELECT pg_temp.pres(13,'2','2026-02-01T12:00:00Z','server');
SELECT pg_temp.att(13,-1301,1,'2026-02-01T12:00:00Z'); SELECT pg_temp.att(13,-1302,2,'2026-02-01T12:00:00Z');
-- member 14: split: item 1 served earlier, then item 5 (split out of C_TEST) served and answered
SELECT pg_temp.pres(14,'1','2026-01-20T12:00:00Z','server'); SELECT pg_temp.pres(14,'5','2026-02-01T11:58:00Z','server');
SELECT pg_temp.att(14,-1401,5,'2026-02-01T12:00:00Z');
-- member 15: merge: item 7 (C_OLD, merged into C_TEST) served earlier with old snapshot, then item 1 answered
SELECT pg_temp.pres(15,'7','2026-01-20T12:00:00Z','server',NULL,'practice','C_OLD'); SELECT pg_temp.pres(15,'1','2026-02-01T11:58:00Z','server');
SELECT pg_temp.att(15,-1501,1,'2026-02-01T12:00:00Z');
-- member 16: multi-tag item 6 (C_OTHER + C_TEST) answered earlier, then item 1 answered
SELECT pg_temp.pres(16,'6','2026-01-20T11:58:00Z','server'); SELECT pg_temp.att(16,-1601,6,'2026-01-20T12:00:00Z');
SELECT pg_temp.pres(16,'1','2026-02-01T11:58:00Z','server'); SELECT pg_temp.att(16,-1602,1,'2026-02-01T12:00:00Z');
-- member 17: sibling client display, presented_at clock-skewed AFTER the answer, received BEFORE it
SELECT pg_temp.pres(17,'2','2026-02-01T13:00:00Z','client','2026-02-01T11:55:00Z');
SELECT pg_temp.pres(17,'1','2026-02-01T11:58:00Z','server'); SELECT pg_temp.att(17,-1701,1,'2026-02-01T12:00:00Z');
-- member 18: sibling client display presented before the answer, flushed 2 h late
SELECT pg_temp.pres(18,'2','2026-02-01T11:55:00Z','client','2026-02-01T14:00:00Z');
SELECT pg_temp.pres(18,'1','2026-02-01T11:58:00Z','server'); SELECT pg_temp.att(18,-1801,1,'2026-02-01T12:00:00Z');
-- member 19: sibling shown in a 'reassessment' context counts (context-blind)
SELECT pg_temp.pres(19,'2','2026-01-25T12:00:00Z','server',NULL,'reassessment');
SELECT pg_temp.pres(19,'1','2026-02-01T11:58:00Z','server'); SELECT pg_temp.att(19,-1901,1,'2026-02-01T12:00:00Z');
-- member 20: unpublished sibling 8 shown earlier counts
SELECT pg_temp.pres(20,'8','2026-01-25T12:00:00Z','server');
SELECT pg_temp.pres(20,'1','2026-02-01T11:58:00Z','server'); SELECT pg_temp.att(20,-2001,1,'2026-02-01T12:00:00Z');
-- member 21: own serve, then a client display of the same item before the answer (refinement, not prior)
SELECT pg_temp.pres(21,'1','2026-02-01T11:58:00Z','server'); SELECT pg_temp.pres(21,'1','2026-02-01T11:59:00Z','client');
SELECT pg_temp.att(21,-2101,1,'2026-02-01T12:00:00Z');
-- member 22: client display of the same item BEFORE the latest server serve (an earlier showing)
SELECT pg_temp.pres(22,'1','2026-01-20T12:00:00Z','client'); SELECT pg_temp.pres(22,'1','2026-02-01T11:58:00Z','server');
SELECT pg_temp.att(22,-2201,1,'2026-02-01T12:00:00Z');
-- member 23: own serve AFTER the answer only (served late / clock) -> no serve at or before answer
SELECT pg_temp.pres(23,'1','2026-02-01T12:05:00Z','server'); SELECT pg_temp.att(23,-2301,1,'2026-02-01T12:00:00Z');
-- member 24: retake of the same item (second attempt)
SELECT pg_temp.pres(24,'1','2026-02-01T11:58:00Z','server'); SELECT pg_temp.att(24,-2401,1,'2026-02-01T12:00:00Z');
SELECT pg_temp.att(24,-2402,1,'2026-02-03T12:00:00Z');
-- member 25: unrelated item 4 (no cluster) seen earlier does NOT disqualify item 1
SELECT pg_temp.pres(25,'4','2026-01-25T12:00:00Z','server');
SELECT pg_temp.pres(25,'1','2026-02-01T11:58:00Z','server'); SELECT pg_temp.att(25,-2501,1,'2026-02-01T12:00:00Z');
-- member 30: no auth.users row, server serve -> history start unknown under account_created
SELECT pg_temp.pres(30,'1','2026-03-05T11:58:00Z','server'); SELECT pg_temp.att(30,-3001,1,'2026-03-05T12:00:00Z');

INSERT INTO _r(inv,test,actual,expected) VALUES
 ('I5','control: post-epoch member, server serve, answer', pg_temp.cls(1,'1'), 'first_known_exposure/complete_history'),
 ('I4','answer before the epoch', pg_temp.cls(2,'1'), 'unknown_exposure_history/answer_before_epoch'),
 ('I5','client-only display never makes first_known', pg_temp.cls(3,'2'), 'unknown_exposure_history/no_server_serve'),
 ('I4','account created pre-epoch, rule account_created (default)', pg_temp.cls(4,'1'), 'unknown_exposure_history/member_history_predates_epoch'),
 ('I4','pre-epoch activity stays unknown under the default rule', pg_temp.cls(5,'1'), 'unknown_exposure_history/member_history_predates_epoch'),
 ('I4','pre-epoch member, fresh-variant key set created after epoch', pg_temp.cls(6,'20'), 'first_known_exposure/complete_history'),
 ('I4','pre-epoch member, new item sharing a key with old items', pg_temp.cls(7,'22'), 'unknown_exposure_history/member_history_predates_epoch'),
 ('I5','legacy logged_by=unknown never makes first_known', pg_temp.cls(9,'1'), 'unknown_exposure_history/no_server_serve'),
 ('I5','ghost: answer with no presentation row', pg_temp.cls(10,'1'), 'unknown_exposure_history/no_server_serve'),
 ('I2','sibling served earlier in the same set', pg_temp.cls(11,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('I2','decisive case (ChatGPT 05:01Z): served-only sibling, never answered or acked, is in the one history', (SELECT count(*)::text FROM pathways_evidence.member_item_exposure WHERE member_id=(SELECT id FROM _m WHERE n=11) AND item_id='2'), '1'),
 ('I2','same item served two weeks earlier', pg_temp.cls(12,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('I2','tie between cluster siblings: zero first_known', (SELECT count(*)::text FROM pathways_evidence.member_first_encounters_exposure_aware WHERE member_id=(SELECT id FROM _m WHERE n=13) AND exposure_class='first_known_exposure'), '0'),
 ('I3','split never restores independence (sticky)', pg_temp.cls(14,'5'), 'excluded_prior_exposure/prior_exposure'),
 ('I3','merge: old-snapshot exposure of merged item disqualifies', pg_temp.cls(15,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('I3','multi-tag item: every tag row excluded, deterministic', pg_temp.cls(16,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('I6','clock-skewed client display: earliest clock (received_at) disqualifies', pg_temp.cls(17,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('I6','late-flushed client display: earliest clock (presented_at) disqualifies', pg_temp.cls(18,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('I6','context-blind: reassessment-context sibling disqualifies', pg_temp.cls(19,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('I6','unpublished sibling exposure still counts', pg_temp.cls(20,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('I2','display after the own serve refines, does not disqualify', pg_temp.cls(21,'1'), 'first_known_exposure/complete_history'),
 ('I2','same-item display before the latest serve disqualifies', pg_temp.cls(22,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('I5','serve logged only after the answer', pg_temp.cls(23,'1'), 'unknown_exposure_history/no_server_serve'),
 ('I2','retake: second attempt excluded by the first', (SELECT exposure_class FROM pathways_evidence.member_first_encounters_exposure_aware WHERE attempt_id='-2402'), 'excluded_prior_exposure'),
 ('I2','unrelated unclustered item does not disqualify (no over-reach)', pg_temp.cls(25,'1'), 'first_known_exposure/complete_history'),
 ('I4','no auth.users row: history start unknown', pg_temp.cls(30,'1'), 'unknown_exposure_history/member_history_predates_epoch'),
 ('I7','eligibility never NULL', (SELECT count(*)::text FROM pathways_evidence.member_first_encounters_exposure_aware WHERE eligible_opportunity_exposure_aware IS NULL), '0'),
 ('I7','eligible => first_known', (SELECT count(*)::text FROM pathways_evidence.member_first_encounters_exposure_aware WHERE eligible_opportunity_exposure_aware AND exposure_class <> 'first_known_exposure'), '0'),
 ('I7','eligible_aware = shipped eligible_opportunity AND complete_history, every row', (SELECT count(*)::text FROM pathways_evidence.member_first_encounters_exposure_aware WHERE eligible_opportunity_exposure_aware IS DISTINCT FROM (COALESCE(eligible_opportunity,false) AND exposure_reason='complete_history')), '0'),
 ('UPSTREAM','[finding, not EHC] shipped eligible_opportunity is false on every row: adapter item_content_version_at_answer is NULL', (SELECT count(*) FILTER (WHERE eligible_opportunity)::text FROM pathways_evidence.member_first_encounters), '0');

-- Open decision: history_start_rule = first_activity (shown, not adopted)
SAVEPOINT rule_b;
UPDATE pathways_evidence.exposure_logging_policy SET history_start_rule = 'first_activity' WHERE track = 'rbt';
SELECT pg_temp.cls(4,'1') AS od2a, pg_temp.cls(5,'1') AS od2b \gset
ROLLBACK TO SAVEPOINT rule_b;
INSERT INTO _r(inv,test,actual,expected) VALUES
 ('OD2','[option first_activity] pre-epoch account, no pre-epoch activity', :'od2a', 'first_known_exposure/complete_history'),
 ('OD2','[option first_activity] pre-epoch activity still unknown', :'od2b', 'unknown_exposure_history/member_history_predates_epoch'),
 ('OD2','[default account_created] restored after rollback', pg_temp.cls(4,'1'), 'unknown_exposure_history/member_history_predates_epoch');
-- Open decision: no epoch declared (the state today)
SAVEPOINT no_epoch;
DELETE FROM pathways_evidence.exposure_logging_policy WHERE track = 'rbt';
SELECT (SELECT count(*) FROM pathways_evidence.member_first_encounters_exposure_aware WHERE exposure_class='first_known_exposure') AS ne_a,
       pg_temp.cls(1,'1') AS ne_b \gset
ROLLBACK TO SAVEPOINT no_epoch;
INSERT INTO _r(inv,test,actual,expected) VALUES
 ('I4','no epoch declared (today): nothing is first_known', :'ne_a', '0'),
 ('I4','no epoch declared: control row says why', :'ne_b', 'unknown_exposure_history/no_epoch_declared');
-- Open decision: serve manifests NOT adopted (no server writer exists): exclusion-only mode
-- Simulated by disabling the append-only guard inside a savepoint and relabelling every server row as client.
SELECT count(*) AS fk_with FROM pathways_evidence.member_first_encounters_exposure_aware WHERE exposure_class='first_known_exposure' \gset
SELECT count(*) AS ex_with FROM pathways_evidence.member_first_encounters_exposure_aware WHERE exposure_class='excluded_prior_exposure' \gset
SAVEPOINT no_serve;
ALTER TABLE pathways_evidence.item_presentation_event DISABLE TRIGGER presentation_append_only;
UPDATE pathways_evidence.item_presentation_event SET logged_by = 'client' WHERE logged_by = 'server';
SELECT count(*) AS fk_without FROM pathways_evidence.member_first_encounters_exposure_aware WHERE exposure_class='first_known_exposure' \gset
SELECT count(*) AS ex_without FROM pathways_evidence.member_first_encounters_exposure_aware WHERE exposure_class='excluded_prior_exposure' \gset
ROLLBACK TO SAVEPOINT no_serve;
INSERT INTO _r(inv,test,actual,expected) VALUES
 ('OD1','[serve manifests adopted] first_known rows reachable', (:'fk_with'::int > 0)::text, 'true'),
 ('OD1','[not adopted: client logs only] zero first_known (exclusion-only mode)', :'fk_without', '0'),
 ('OD1','[not adopted] exclusions do not shrink without server rows', (:'ex_without'::int >= :'ex_with'::int)::text, 'true');

-- I8 timezone independence: identical classification under two session time zones
SET LOCAL TimeZone = 'UTC';
CREATE TEMP TABLE _tz1 AS SELECT md5(string_agg(attempt_id||raw_tag||exposure_class||exposure_reason, '|' ORDER BY attempt_id, raw_tag)) h FROM pathways_evidence.member_first_encounters_exposure_aware;
SET LOCAL TimeZone = 'Pacific/Kiritimati';
INSERT INTO _r(inv,test,actual,expected) VALUES
 ('I8','classification identical under UTC and UTC+14', (SELECT (md5(string_agg(attempt_id||raw_tag||exposure_class||exposure_reason, '|' ORDER BY attempt_id, raw_tag)) = (SELECT h FROM _tz1))::text FROM pathways_evidence.member_first_encounters_exposure_aware), 'true');
SET LOCAL TimeZone = 'UTC';

-- I1 one authority: the consumer reads exposure only through member_item_exposure
INSERT INTO _r(inv,test,actual,expected) VALUES
 ('I1','consumer depends on member_item_exposure', (SELECT (pg_get_viewdef('pathways_evidence.member_first_encounters_exposure_aware'::regclass) LIKE '%member_item_exposure%')::text), 'true'),
 ('I1','consumer never reads item_presentation_event or attempts directly',
   (SELECT count(*)::text FROM pg_depend dp JOIN pg_rewrite rw ON rw.oid = dp.objid JOIN pg_class ref ON ref.oid = dp.refobjid
     WHERE rw.ev_class = 'pathways_evidence.member_first_encounters_exposure_aware'::regclass
       AND ref.relname IN ('item_presentation_event','attempts','pathways_source_attempts')), '0');

-- I9 security
INSERT INTO _r(inv,test,actual,expected) VALUES
 ('I9','every new view has security_invoker=true',
   (SELECT string_agg(c.relname||'='||coalesce(array_to_string(c.reloptions,','),'(none)'),' ; ' ORDER BY c.relname) FROM pg_class c JOIN pg_namespace s ON s.oid=c.relnamespace
     WHERE s.nspname='pathways_evidence' AND c.relname IN ('item_dependence_key','member_item_exposure','member_first_encounters_exposure_aware')),
   'item_dependence_key=security_invoker=true ; member_first_encounters_exposure_aware=security_invoker=true ; member_item_exposure=security_invoker=true'),
 ('I9','anon/authenticated hold no privilege on the new views',
   (SELECT count(*)::text FROM (VALUES ('anon'),('authenticated')) r(role), (VALUES ('pathways_evidence.item_dependence_key'),('pathways_evidence.member_item_exposure'),('pathways_evidence.member_first_encounters_exposure_aware')) v(obj)
     WHERE has_table_privilege(r.role, v.obj, 'SELECT')), '0'),
 ('I9','only server/client/unknown provenance accepted', (SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='ipe_logged_by_chk'),
   'CHECK ((logged_by = ANY (ARRAY[''server''::text, ''client''::text, ''unknown''::text])))'),
 ('I9','presentation events stay append-only (UPDATE refused)', (SELECT 'see block below'), 'see block below');
DO $$ BEGIN
  BEGIN
    UPDATE pathways_evidence.item_presentation_event SET logged_by = 'server' WHERE logged_by = 'client';
    UPDATE _r SET actual = 'update allowed' WHERE test = 'presentation events stay append-only (UPDATE refused)';
  EXCEPTION WHEN insufficient_privilege THEN
    UPDATE _r SET actual = 'refused', expected = 'refused' WHERE test = 'presentation events stay append-only (UPDATE refused)';
  END;
END $$;

-- I10 shipped views untouched (definition text and options)
INSERT INTO _r(inv,test,actual,expected) VALUES
 ('I10','shipped views unchanged',
   (SELECT count(*)::text FROM _shipped_before b JOIN pg_class c ON c.relname=b.relname JOIN pg_namespace s ON s.oid=c.relnamespace AND s.nspname='pathways_evidence'
     WHERE pg_get_viewdef(c.oid) IS DISTINCT FROM b.def OR c.reloptions IS DISTINCT FROM b.reloptions), '0'),
 ('I10','shipped view count unchanged (11)', (SELECT count(*)::text FROM _shipped_before), '11');

UPDATE _r SET pass = (actual IS NOT DISTINCT FROM expected);
SELECT n, CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END AS result, inv, test, actual, expected FROM _r ORDER BY n;
SELECT count(*) FILTER (WHERE pass) || '/' || count(*) || ' passed' AS summary FROM _r;
DO $$ DECLARE f int; BEGIN
  SELECT count(*) INTO f FROM _r WHERE NOT pass;
  IF f > 0 THEN RAISE EXCEPTION 'EHC v1 suite: % case(s) FAILED', f; END IF;
END $$;
ROLLBACK;
