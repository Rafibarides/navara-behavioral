-- ehc-v2-tests.sql : asserting suite for the EHC v2 proposal (Tab, 2026-10-26). Rolled back; nothing persists.
-- HOW TO RUN (throwaway Postgres 15 only): load ehc-scratch-schema.sql.txt (the real schema extract as runnable DDL),
-- copy ehc-v2.sql.txt to /tmp/ehc2_body.sql, then: psql -X -v ON_ERROR_STOP=1 -f ehc-v2-tests.sql
-- Every case is an assertion row; the file ends with RAISE EXCEPTION if any case failed, so psql exits non-zero.
-- Historical fixtures need server times in the past, so they are inserted with the two STAMP triggers disabled inside
-- this rolled-back transaction (a privileged backfill, as a migration would do). The guards stay on. Cases S1-S3
-- prove that with the stamps enabled a supplied time is overwritten, and the live cases (L*) use the real serve path.
BEGIN;
SET LOCAL TimeZone = 'UTC';
CREATE TEMP TABLE _shipped_before AS
  SELECT c.relname, pg_get_viewdef(c.oid) AS def, c.reloptions FROM pg_class c JOIN pg_namespace s ON s.oid = c.relnamespace
  WHERE s.nspname = 'pathways_evidence' AND c.relkind = 'v';
\ir /tmp/ehc2_body.sql
\ir /tmp/ehc2_body.sql
-- (applied twice on purpose: idempotency)
CREATE TEMP TABLE _r(n serial, gate text, test text, actual text, expected text, pass boolean);

-- ---------- fixtures (synthetic) ----------
-- Epoch 2026-01-01 on rbt, inventory attested 2026-01-01. Items 1-8 created 2025-01-01; fresh variants 20-22 and 30 created 2026-03-01.
INSERT INTO public.questions (id,track,area,body,options,answer,explanation,published,created_at) OVERRIDING SYSTEM VALUE
SELECT i,'rbt','TEST','synthetic stem '||i,'[{"t":"a"},{"t":"b"},{"t":"c"},{"t":"d"}]'::jsonb,0,'synthetic',
       i <> 8, CASE WHEN i >= 20 THEN '2026-03-01T00:00:00Z'::timestamptz ELSE '2025-01-01T00:00:00Z'::timestamptz END
FROM (SELECT generate_series(1,8) UNION ALL SELECT generate_series(20,22) UNION ALL SELECT 30) g(i)
ON CONFLICT (id) DO UPDATE SET created_at = EXCLUDED.created_at, published = EXCLUDED.published, body = EXCLUDED.body,
  options = EXCLUDED.options, answer = EXCLUDED.answer, explanation = EXCLUDED.explanation;
INSERT INTO pathways_evidence.sme_reviewer VALUES ('bbbbbbbb-0000-4000-8000-000000000001','TEST SYNTHETIC','TEST','{rbt,bcba}',true);
INSERT INTO pathways_evidence.item_quality_review (track,item_id,content_version,quality_status,citation_status,key_status,certified_pool,reviewer_id,reviewed_at)
SELECT 'rbt',i::text,'current','approved','approved','approved','practice','bbbbbbbb-0000-4000-8000-000000000001',now()
FROM unnest(ARRAY[1,2,3,4,5,6,7,8,20,21,22,30]) i;
INSERT INTO pathways_evidence.item_tag_review (track,item_id,content_version,raw_tag,alignment_status,assessable,transfer_status,reviewed_by,reviewed_at,surface_cluster_id)
SELECT 'rbt',v.item,'current',v.tag,'approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),v.cl
FROM (VALUES ('6','tag_z','C_OTHER'),('1','tag_x','C_TEST'),('2','tag_x','C_TEST'),('3','tag_x','C_TEST'),('4','tag_y',NULL),
             ('5','tag_x','C_TEST'),('6','tag_x','C_TEST'),('7','tag_x','C_OLD'),('8','tag_x','C_TEST'),
             ('20','tag_x','C_NEWVAR'),('21','tag_x','C_NEWVAR'),('22','tag_x','C_TEST'),('30','tag_y','C_EDIT')) v(item,tag,cl);
INSERT INTO pathways_evidence.option_tag_review (track,item_id,content_version,option_id,raw_tag,attribution_status,reviewed_by,reviewed_at)
SELECT track,item_id,content_version,'1',raw_tag,'approved',reviewed_by,now() FROM pathways_evidence.item_tag_review;
-- cluster history on the real schema = UPDATEs that review_event logs:
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id='C_SPLIT' WHERE item_id='5' AND raw_tag='tag_x';  -- split out of C_TEST
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id='C_TEST'  WHERE item_id='7' AND raw_tag='tag_x';  -- C_OLD merged into C_TEST
INSERT INTO pathways_evidence.exposure_logging_policy (track,logging_started_at,note,inventory_attested_at,inventory_attested_by)
VALUES ('rbt','2026-01-01T00:00:00Z','TEST epoch','2026-01-01T00:00:00Z','TEST builder');
INSERT INTO auth.users (id,aud,role,email,created_at)
SELECT ('cccccccc-0000-4000-8000-0000000000'||lpad(n::text,2,'0'))::uuid,'authenticated','authenticated','e'||n||'@synthetic.invalid',
       CASE WHEN n IN (4,5,6,7,29,30,31) THEN '2025-06-01T00:00:00Z'::timestamptz ELSE '2026-01-10T00:00:00Z'::timestamptz END
FROM generate_series(1,40) n;  -- ADAPTED: member 30 given a pre-epoch account row (attempts FK to auth.users on real schema); G5 expected class preserved via account_created
CREATE TEMP TABLE _m AS SELECT n, ('cccccccc-0000-4000-8000-0000000000'||lpad(n::text,2,'0'))::uuid AS id FROM generate_series(1,40) n;
ALTER TABLE pathways_evidence.item_presentation_event DISABLE TRIGGER ehc_v2_b_stamp;
ALTER TABLE pathways_evidence.attempt_delivery_binding DISABLE TRIGGER ehc_v2_a_stamp;

CREATE FUNCTION pg_temp.srv(p_n int, p_item text, p_at timestamptz, p_presented timestamptz DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql AS $f$
DECLARE v uuid := gen_random_uuid();
BEGIN
  PERFORM set_config('pathways_evidence.serve_writer','on',true);
  INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,received_at,presentation_context,
     delivery_id,event_type,logged_by,item_delivery_id,server_recorded_at,serve_request_key,dependence_keys_at_delivery,content_hash_at_delivery)
  SELECT (SELECT id FROM _m WHERE n=p_n),'rbt',p_item,'current',coalesce(p_presented,p_at),p_at,'practice','ROUND-'||p_n,'served_exposure','server',
         v,p_at,'fx-'||v,(SELECT array_agg(DISTINCT k ORDER BY k) FROM pathways_evidence.item_dependence_key WHERE track='rbt' AND item_id=p_item),
         pathways_evidence.content_hash(q.body,q.options,q.answer,q.explanation,q.citation)
  FROM public.questions q WHERE q.id::text = p_item;
  PERFORM set_config('pathways_evidence.serve_writer','off',true);
  RETURN v;
END $f$;
CREATE FUNCTION pg_temp.ack(p_n int, p_item text, p_delivery uuid, p_ingested timestamptz, p_presented timestamptz) RETURNS void LANGUAGE sql AS $f$
  INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,received_at,event_type,logged_by,item_delivery_id,server_recorded_at)
  VALUES ((SELECT id FROM _m WHERE n=p_n),'rbt',p_item,'current',p_presented,p_presented,'display_acknowledged','client',p_delivery,p_ingested) $f$;
CREATE FUNCTION pg_temp.cli(p_n int, p_item text, p_ingested timestamptz, p_presented timestamptz, p_by text DEFAULT 'client') RETURNS void LANGUAGE sql AS $f$
  INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,received_at,logged_by,server_recorded_at)
  VALUES ((SELECT id FROM _m WHERE n=p_n),'rbt',p_item,'current',p_presented,p_presented,p_by,p_ingested) $f$;
CREATE FUNCTION pg_temp.att(p_n int, p_id bigint, p_q int, p_at timestamptz) RETURNS void LANGUAGE sql AS $f$
  INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms) OVERRIDING SYSTEM VALUE
  VALUES (p_id,(SELECT id FROM _m WHERE n=p_n),p_q,false,'practice',p_at,1,5000) $f$;
CREATE FUNCTION pg_temp.bind(p_att bigint, p_delivery uuid, p_at timestamptz) RETURNS void LANGUAGE sql AS $f$
  INSERT INTO pathways_evidence.attempt_delivery_binding (attempt_id,item_delivery_id,bound_at) VALUES (p_att,p_delivery,p_at) $f$;
-- serve + answer + bind in one line (answer 2 minutes after the delivery)
CREATE FUNCTION pg_temp.sab(p_n int, p_att bigint, p_q int, p_at timestamptz) RETURNS uuid LANGUAGE plpgsql AS $f$
DECLARE d uuid; BEGIN
  d := pg_temp.srv(p_n, p_q::text, p_at - interval '2 minutes');
  PERFORM pg_temp.att(p_n, p_att, p_q, p_at); PERFORM pg_temp.bind(p_att, d, p_at); RETURN d; END $f$;
CREATE FUNCTION pg_temp.cls(p_n int, p_item text) RETURNS text LANGUAGE sql AS $f$
  SELECT string_agg(DISTINCT exposure_class || '/' || exposure_reason, ',') FROM pathways_evidence.member_first_encounters_exposure_aware
  WHERE member_id = (SELECT id FROM _m WHERE n=p_n) AND item_id = p_item $f$;
CREATE FUNCTION pg_temp.cla(p_att text) RETURNS text LANGUAGE sql AS $f$
  SELECT string_agg(DISTINCT exposure_class || '/' || exposure_reason, ',') FROM pathways_evidence.member_first_encounters_exposure_aware WHERE attempt_id = p_att $f$;
CREATE FUNCTION pg_temp.fr(p_n int, p_item text) RETURNS text LANGUAGE sql AS $f$
  SELECT pathways_evidence.member_item_freshness((SELECT id FROM _m WHERE n=p_n),'rbt',p_item) $f$;
-- expect an error: returns the SQLSTATE, or 'no error'
CREATE FUNCTION pg_temp.err(p_sql text) RETURNS text LANGUAGE plpgsql AS $f$
BEGIN EXECUTE p_sql; RETURN 'no error'; EXCEPTION WHEN OTHERS THEN RETURN SQLSTATE; END $f$;

-- ---------- scenarios (T = 2026-02-01) ----------
\o /dev/null
SELECT pg_temp.sab(1,-101,1,'2026-02-01T12:00:00Z');                                    -- m1 control
SELECT pg_temp.sab(2,-201,1,'2025-12-01T12:00:00Z');                                    -- m2 delivery before epoch
SELECT pg_temp.cli(3,'2','2026-02-01T11:59:00Z','2026-02-01T11:58:00Z'); SELECT pg_temp.att(3,-301,2,'2026-02-01T12:00:00Z'); -- m3 client-only, unbound
SELECT pg_temp.sab(4,-401,1,'2026-02-01T12:00:00Z');                                    -- m4 account pre-epoch
SELECT pg_temp.att(5,-501,4,'2025-11-01T12:00:00Z'); SELECT pg_temp.sab(5,-502,1,'2026-02-01T12:00:00Z'); -- m5 pre-epoch activity
SELECT pg_temp.sab(6,-601,20,'2026-03-05T12:00:00Z');                                   -- m6 pre-epoch member, fresh-variant key set
SELECT pg_temp.sab(7,-701,22,'2026-03-05T12:00:00Z');                                   -- m7 pre-epoch member, new item sharing old key
SELECT pg_temp.cli(8,'2',NULL,'2026-01-20T12:00:00Z','unknown'); SELECT pg_temp.sab(8,-801,1,'2026-02-01T12:00:00Z'); -- m8 legacy sibling row
SELECT pg_temp.att(9,-901,1,'2026-02-01T12:00:00Z');                                    -- m9 ghost (binding attempted below)
SELECT pg_temp.srv(10,'2','2026-02-01T11:50:00Z'); SELECT pg_temp.sab(10,-1001,1,'2026-02-01T12:00:00Z'); -- m10 sibling served earlier
SELECT pg_temp.srv(11,'2','2026-01-15T12:00:00Z'); SELECT pg_temp.sab(11,-1101,1,'2026-02-01T12:00:00Z'); -- m11 abandoned sibling delivery
SELECT pg_temp.srv(12,'1','2026-01-15T12:00:00Z'); SELECT pg_temp.sab(12,-1201,1,'2026-02-01T12:00:00Z'); -- m12 same item, earlier abandoned delivery
DO $$ DECLARE a uuid; b uuid; BEGIN                                                      -- m13 siblings in one serve call (same instant)
  a := pg_temp.srv(13,'1','2026-02-01T11:58:00Z'); b := pg_temp.srv(13,'2','2026-02-01T11:58:00Z');
  PERFORM pg_temp.att(13,-1301,1,'2026-02-01T12:00:00Z'); PERFORM pg_temp.bind(-1301,a,'2026-02-01T12:00:00Z');
  PERFORM pg_temp.att(13,-1302,2,'2026-02-01T12:01:00Z'); PERFORM pg_temp.bind(-1302,b,'2026-02-01T12:01:00Z'); END $$;
SELECT pg_temp.srv(14,'1','2026-01-20T12:00:00Z'); SELECT pg_temp.sab(14,-1401,5,'2026-02-01T12:00:00Z'); -- m14 split stays dependent
SELECT pg_temp.srv(15,'7','2026-01-20T12:00:00Z'); SELECT pg_temp.sab(15,-1501,1,'2026-02-01T12:00:00Z'); -- m15 merged item exposure
SELECT pg_temp.srv(16,'2','2026-01-20T12:00:00Z'); SELECT pg_temp.sab(16,-1601,6,'2026-02-01T12:00:00Z'); -- m16 multi-tag answered item
DO $$ DECLARE d uuid; BEGIN                                                              -- m17 own ack with a wild client clock
  d := pg_temp.sab(17,-1701,1,'2026-02-01T12:00:00Z');
  PERFORM pg_temp.ack(17,'1',d,'2026-02-01T11:59:00Z','2000-01-01T00:00:00Z'); END $$;
DO $$ DECLARE d uuid; BEGIN                                                              -- m18 sibling served AFTER the answer, ack claims year 2000
  PERFORM pg_temp.sab(18,-1801,1,'2026-02-01T12:00:00Z');
  d := pg_temp.srv(18,'2','2026-02-01T12:30:00Z');
  PERFORM pg_temp.ack(18,'2',d,'2026-02-01T12:31:00Z','2000-01-01T00:00:00Z'); END $$;
SELECT pg_temp.sab(19,-1901,1,'2026-02-01T12:00:00Z'); SELECT pg_temp.sab(19,-1902,2,'2026-02-01T12:35:00Z'); -- m19 later sibling answer
SELECT pg_temp.cli(20,'2','2026-02-01T11:59:00Z','2026-02-01T11:59:00Z'); SELECT pg_temp.sab(20,-2001,1,'2026-02-01T12:00:00Z'); -- m20 unreferenced display, ingested before
SELECT pg_temp.cli(21,'2','2026-02-01T12:30:00Z','2026-02-01T11:00:00Z'); SELECT pg_temp.sab(21,-2101,1,'2026-02-01T12:00:00Z'); -- m21 ingested after, client says before
SELECT pg_temp.att(22,-2201,2,'2027-06-01T00:00:00Z'); SELECT pg_temp.sab(22,-2202,1,'2026-02-01T12:00:00Z'); -- m22 unbound sibling attempt, future clock
SELECT pg_temp.sab(23,-2301,2,'2026-02-01T11:05:00Z'); SELECT pg_temp.sab(23,-2302,1,'2026-02-01T12:00:00Z'); -- m23 bound sibling answer earlier
SELECT pg_temp.sab(24,-2401,30,'2026-03-05T12:00:00Z');                                 -- m24 content edited after delivery (edit below)
SELECT pg_temp.srv(25,'4','2026-01-20T12:00:00Z'); SELECT pg_temp.sab(25,-2501,1,'2026-02-01T12:00:00Z'); -- m25 unrelated item: no over-reach
SELECT pg_temp.sab(30,-3001,1,'2026-02-01T12:00:00Z');                                  -- m30 no auth.users row
SELECT pg_temp.sab(28,-2801,3,'2026-02-01T12:00:00Z'); SELECT pg_temp.sab(28,-2802,3,'2026-02-03T12:00:00Z'); -- m28 retake
SELECT pg_temp.sab(29,-2901,1,'2026-02-01T12:00:00Z');                                  -- m29 pre-epoch account, only server activity
SELECT pg_temp.cli(31,'4',NULL,'2025-12-01T00:00:00Z','unknown'); SELECT pg_temp.sab(31,-3101,1,'2026-02-01T12:00:00Z'); -- m31 pre-epoch account + legacy row
SELECT pg_temp.srv(34,'2','2026-02-01T11:00:00Z','2030-01-01T00:00:00Z'); SELECT pg_temp.sab(34,-3401,1,'2026-02-01T12:00:00Z'); -- m34 presented_at in the future on the sibling
SELECT pg_temp.srv(35,'8','2026-01-20T12:00:00Z');                                      -- m35 split AFTER the exposure
UPDATE pathways_evidence.item_tag_review SET surface_cluster_id='C_LATE_SPLIT' WHERE item_id='8' AND raw_tag='tag_x';
SELECT pg_temp.sab(35,-3501,2,'2026-02-01T12:00:00Z');
DO $$ DECLARE d uuid; BEGIN                                                              -- m36 sibling delivered at exactly the answer instant
  PERFORM pg_temp.srv(36,'2','2026-02-01T12:00:00Z');
  d := pg_temp.srv(36,'1','2026-02-01T11:58:00Z');
  PERFORM pg_temp.att(36,-3601,1,'2026-02-01T12:00:00Z'); PERFORM pg_temp.bind(-3601,d,'2026-02-01T12:00:00Z'); END $$;
SELECT pg_temp.att(37,-3701,2,'2025-10-01T00:00:00Z');                                  -- m37 only an unbound attempt (freshness agreement)
UPDATE public.questions SET explanation = 'synthetic, edited after delivery' WHERE id = 30;

\o
-- ---------- Gate 3: binding to the exact delivery ----------
CREATE TEMP TABLE _d AS SELECT m.n, e.item_id, e.item_delivery_id FROM pathways_evidence.item_presentation_event e JOIN _m m ON m.id = e.member_id WHERE e.logged_by = 'server';
SELECT pg_temp.att(9,-902,2,'2026-02-01T12:05:00Z'); SELECT pg_temp.att(10,-1002,2,'2026-02-01T12:05:00Z');
INSERT INTO _r(gate,test,actual,expected) VALUES
 ('G3','ghost: binding to a delivery id that does not exist is refused', pg_temp.err($$SELECT pg_temp.bind(-901, gen_random_uuid(), '2026-02-01T12:00:00Z')$$), '23503'),
 ('G3','NULL delivery id is refused (guard or NOT NULL)', (SELECT CASE WHEN e IN ('23502','23503') THEN 'refused' ELSE e END FROM pg_temp.err($$SELECT pg_temp.bind(-901, NULL, '2026-02-01T12:00:00Z')$$) e), 'refused'),
 ('G3','answer bound to ANOTHER member''s delivery is refused',
   pg_temp.err(format('SELECT pg_temp.bind(-901, %L, %L)', (SELECT item_delivery_id FROM _d WHERE n=1 AND item_id='1'), '2026-02-01T12:00:00Z')), '23514'),
 ('G3','answer bound to ANOTHER item''s delivery is refused',
   pg_temp.err(format('SELECT pg_temp.bind(-1002, %L, %L)', (SELECT item_delivery_id FROM _d WHERE n=10 AND item_id='1'), '2026-02-01T12:05:00Z')), '23514'),
 ('G3','setup: a legitimate late answer binds to m10''s unanswered sibling delivery (allowed)',
   pg_temp.err(format('SELECT pg_temp.bind(-1002, %L, %L)', (SELECT item_delivery_id FROM _d WHERE n=10 AND item_id='2'), '2026-02-01T12:05:00Z')), 'no error'),
 ('G3','binding to a client row''s delivery id is refused',
   pg_temp.err($$SELECT pg_temp.ack(9,'2','dddddddd-0000-4000-8000-000000000009','2026-02-01T12:01:00Z','2026-02-01T12:01:00Z'); SELECT pg_temp.bind(-902,'dddddddd-0000-4000-8000-000000000009','2026-02-01T12:05:00Z')$$), '23503'),
 ('G3','a binding cannot precede its delivery',
   pg_temp.err(format('SELECT pg_temp.bind(-902, %L, %L)', pg_temp.srv(9,'2','2026-02-01T12:10:00Z'), '2026-02-01T12:05:00Z')), '23514');
-- the sibling delivery for m10 (item 2, 11:50) was legitimately bound just above; binding it again must fail:
INSERT INTO _r(gate,test,actual,expected) VALUES
 ('G3','the same delivery cannot be bound twice',
   pg_temp.err(format('SELECT pg_temp.att(10,-1003,2,%L); SELECT pg_temp.bind(-1003, %L, %L)', '2026-02-01T12:06:00Z', (SELECT item_delivery_id FROM _d WHERE n=10 AND item_id='2'), '2026-02-01T12:06:00Z')), '23505'),
 ('G3','an attempt cannot be bound twice',
   pg_temp.err(format('SELECT pg_temp.bind(-101, %L, %L)', pg_temp.srv(1,'1','2026-02-02T00:00:00Z'), '2026-02-02T00:01:00Z')), '23505'),
 ('G3','bindings are append-only (UPDATE refused)', pg_temp.err($$UPDATE pathways_evidence.attempt_delivery_binding SET bound_at = bound_at WHERE attempt_id = -101$$), '42501'),
 ('G3','bindings are append-only (DELETE refused)', pg_temp.err($$DELETE FROM pathways_evidence.attempt_delivery_binding WHERE attempt_id = -101$$), '42501'),
 ('G3','ghost answer stays unknown (no bound delivery)', pg_temp.cls(9,'1'), 'unknown_exposure_history/no_bound_delivery'),
 ('G3','client-only display never certifies', pg_temp.cls(3,'2'), 'unknown_exposure_history/no_bound_delivery');

-- ---------- core classification ----------
INSERT INTO _r(gate,test,actual,expected) VALUES
 ('G5','control: post-epoch member, served, bound, answered', pg_temp.cls(1,'1'), 'first_known_exposure/complete_history'),
 ('G5','control is an eligible opportunity (legitimate eligibility stays possible)',
   (SELECT bool_and(eligible_opportunity_exposure_aware)::text FROM pathways_evidence.member_first_encounters_exposure_aware WHERE attempt_id='-101'), 'true'),
 ('G5','pre-epoch delivery', pg_temp.cls(2,'1'), 'unknown_exposure_history/delivery_before_epoch'),
 ('G5','account created pre-epoch (default rule account_created)', pg_temp.cls(4,'1'), 'unknown_exposure_history/member_history_predates_epoch'),
 ('G5','pre-epoch activity on an unrelated item', pg_temp.cla('-502'), 'unknown_exposure_history/member_history_predates_epoch'),
 ('G5','pre-epoch member, fresh-variant key set (all created after the epoch)', pg_temp.cls(6,'20'), 'first_known_exposure/complete_history'),
 ('G5','pre-epoch member, new item sharing a key with old items', pg_temp.cls(7,'22'), 'unknown_exposure_history/member_history_predates_epoch'),
 ('G5','no auth.users row: history start unknown', pg_temp.cls(30,'1'), 'unknown_exposure_history/member_history_predates_epoch'),
 ('G5','missing: legacy sibling row with no server time', pg_temp.cls(8,'1'), 'unknown_exposure_history/unordered_history'),
 ('G4','sibling served earlier', pg_temp.cls(10,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('G5','abandoned: sibling delivered, never answered or acknowledged', pg_temp.cls(11,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('G5','duplicate: same item delivered earlier and abandoned, then re-served', pg_temp.cls(12,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('G4','ambiguous: siblings served in one call (same instant): zero first_known',
   (SELECT count(*)::text FROM pathways_evidence.member_first_encounters_exposure_aware WHERE member_id=(SELECT id FROM _m WHERE n=13) AND exposure_class='first_known_exposure'), '0'),
 ('G4','tie: sibling delivered at exactly the answer instant', pg_temp.cls(36,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('G4','split after an earlier exposure never restores independence (sticky)', pg_temp.cls(14,'5'), 'excluded_prior_exposure/prior_exposure'),
 ('G4','split AFTER exposure: old exposure still disqualifies', pg_temp.cls(35,'2'), 'excluded_prior_exposure/prior_exposure'),
 ('G4','delivery snapshot carries the key set in force at serve time',
   (SELECT array_to_string(dependence_keys_at_delivery, ',') FROM pathways_evidence.item_presentation_event WHERE logged_by='server' AND member_id=(SELECT id FROM _m WHERE n=35) AND item_id='8'), 'C_TEST,ITEM:8'),
 ('G4','merge: exposure of the merged-in item disqualifies', pg_temp.cls(15,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('G4','multi-tag item: every tag row excluded, one deterministic answer', pg_temp.cls(16,'6'), 'excluded_prior_exposure/prior_exposure'),
 ('G4','client clock ignored: own ack claiming year 2000 changes nothing', pg_temp.cls(17,'1'), 'first_known_exposure/complete_history'),
 ('G4','out-of-order: sibling served after the answer does not invalidate it, even with an ack claiming year 2000', pg_temp.cls(18,'1'), 'first_known_exposure/complete_history'),
 ('G4','later sibling answer: earlier answer stays first_known', pg_temp.cla('-1901'), 'first_known_exposure/complete_history'),
 ('G4','later sibling answer itself is excluded', pg_temp.cla('-1902'), 'excluded_prior_exposure/prior_exposure'),
 ('G4','unreferenced client display ingested before the answer disqualifies', pg_temp.cls(20,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('G4','out-of-order: client display ingested after the answer (client claims before) is uncertain, never fresh', pg_temp.cls(21,'1'), 'unknown_exposure_history/unordered_history'),
 ('G4','unbound sibling attempt (client clock says 2027) is uncertain, never fresh', pg_temp.cla('-2202'), 'unknown_exposure_history/unordered_history'),
 ('G4','presented_at in 2030 on an earlier sibling delivery cannot hide it', pg_temp.cls(34,'1'), 'excluded_prior_exposure/prior_exposure'),
 ('G4','bound sibling answer earlier disqualifies', pg_temp.cla('-2302'), 'excluded_prior_exposure/prior_exposure'),
 ('G4','content edited after delivery: version mismatch', pg_temp.cls(24,'30'), 'unknown_exposure_history/content_changed'),
 ('G5','unrelated unclustered item does not disqualify (no over-reach)', pg_temp.cls(25,'1'), 'first_known_exposure/complete_history'),
 ('G5','retake: first answer first_known', pg_temp.cla('-2801'), 'first_known_exposure/complete_history'),
 ('G5','retake: second answer excluded', pg_temp.cla('-2802'), 'excluded_prior_exposure/prior_exposure');

-- property sweep, written against the RAW tables (independent of the views): no first_known row has a
-- missing binding, a non-server delivery, a pre-epoch delivery, or any other exposure of a key-sharing item that
-- is not provably after the answer.
INSERT INTO _r(gate,test,actual,expected) VALUES
 ('G5','sweep: every first_known row has a server delivery and a binding to it, at/after the effective epoch',
   (SELECT count(*)::text FROM pathways_evidence.member_first_encounters_exposure_aware f
     WHERE f.exposure_class='first_known_exposure' AND NOT EXISTS (
       SELECT 1 FROM pathways_evidence.attempt_delivery_binding b
       JOIN pathways_evidence.item_presentation_event d ON d.item_delivery_id=b.item_delivery_id AND d.logged_by='server'
       JOIN pathways_evidence.exposure_logging_policy pol ON pol.track=d.track
       WHERE b.attempt_id::text=f.attempt_id AND d.member_id=f.member_id AND d.item_id=f.item_id
         AND d.server_recorded_at >= GREATEST(pol.logging_started_at, pol.inventory_attested_at))), '0'),
 ('G5','sweep: no first_known row has another exposure of a key-sharing item not provably after the answer',
   (SELECT count(*)::text FROM pathways_evidence.member_first_encounters_exposure_aware f
     JOIN pathways_evidence.attempt_delivery_binding b ON b.attempt_id::text=f.attempt_id
     WHERE f.exposure_class='first_known_exposure' AND EXISTS (
       SELECT 1 FROM pathways_evidence.item_dependence_key k1
       JOIN pathways_evidence.item_dependence_key k2 ON k2.track=k1.track AND k2.k=k1.k
       WHERE k1.track=f.track AND k1.item_id=f.item_id AND (
         EXISTS (SELECT 1 FROM pathways_evidence.item_presentation_event p
                 WHERE p.member_id=f.member_id AND p.track=f.track AND p.item_id=k2.item_id
                   AND p.item_delivery_id IS DISTINCT FROM b.item_delivery_id
                   AND (p.server_recorded_at IS NULL OR p.server_recorded_at <= b.bound_at
                        OR (p.logged_by <> 'server' AND NOT EXISTS (SELECT 1 FROM pathways_evidence.item_presentation_event s
                             WHERE s.logged_by='server' AND s.item_delivery_id=p.item_delivery_id AND s.member_id=p.member_id
                               AND s.item_id=p.item_id AND s.server_recorded_at > b.bound_at))))
         OR EXISTS (SELECT 1 FROM public.attempts a2 LEFT JOIN pathways_evidence.attempt_delivery_binding b2 ON b2.attempt_id=a2.id
                    WHERE a2.user_id=f.member_id AND a2.question_id::text=k2.item_id AND a2.id::text<>f.attempt_id
                      AND (b2.bound_at IS NULL OR b2.bound_at <= b.bound_at))))), '0'),
 ('G5','eligibility never NULL', (SELECT count(*)::text FROM pathways_evidence.member_first_encounters_exposure_aware WHERE eligible_opportunity_exposure_aware IS NULL), '0'),
 ('G5','eligible implies first_known', (SELECT count(*)::text FROM pathways_evidence.member_first_encounters_exposure_aware WHERE eligible_opportunity_exposure_aware AND exposure_class<>'first_known_exposure'), '0'),
 ('G5','consumer row count equals the shipped view (no rows dropped or duplicated)',
   ((SELECT count(*) FROM pathways_evidence.member_first_encounters_exposure_aware) = (SELECT count(*) FROM pathways_evidence.member_first_encounters))::text, 'true');

-- ---------- reserve freshness reads the same history (executable agreement) ----------
INSERT INTO _r(gate,test,actual,expected) VALUES
 ('AGREE','abandoned sibling delivery consumes reserve freshness of the cluster', pg_temp.fr(11,'3'), 'exposed'),
 ('AGREE','every attempt the consumer excluded as prior: its item reads exposed',
   (SELECT count(*)::text FROM pathways_evidence.member_first_encounters_exposure_aware f
     WHERE f.exposure_class='excluded_prior_exposure' AND pathways_evidence.member_item_freshness(f.member_id,f.track,f.item_id) <> 'exposed'), '0'),
 ('AGREE','an unbound attempt alone makes the cluster exposed', pg_temp.fr(37,'3'), 'exposed'),
 ('AGREE','untouched fresh variant for a post-epoch member is fresh', pg_temp.fr(1,'21'), 'fresh'),
 ('AGREE','pre-epoch member, old cluster never touched: unknown, not fresh', pg_temp.fr(4,'20') || '|' || pg_temp.fr(4,'4'), 'fresh|unknown'),
 ('AGREE','retired (unpublished) item: its delivery still counts', (SELECT pg_temp.fr(35,'8') || '|' || (SELECT published::text FROM public.questions WHERE id=8)), 'exposed|false');

-- ---------- Gate 2 (and stamps): live serve path, real clock ----------
ALTER TABLE pathways_evidence.item_presentation_event ENABLE TRIGGER ehc_v2_b_stamp;
ALTER TABLE pathways_evidence.attempt_delivery_binding ENABLE TRIGGER ehc_v2_a_stamp;
CREATE TEMP TABLE _l1 AS SELECT * FROM pathways_evidence.serve_items((SELECT id FROM _m WHERE n=32),'rbt',ARRAY['4','20'],'ROUND-L','practice','req-L1');
CREATE TEMP TABLE _l2 AS SELECT * FROM pathways_evidence.serve_items((SELECT id FROM _m WHERE n=32),'rbt',ARRAY['4','20'],'ROUND-L','practice','req-L1');
CREATE TEMP TABLE _l3 AS SELECT * FROM pathways_evidence.serve_items((SELECT id FROM _m WHERE n=33),'rbt',ARRAY['21'],'ROUND-L','practice','req-A');
CREATE TEMP TABLE _l4 AS SELECT * FROM pathways_evidence.serve_items((SELECT id FROM _m WHERE n=33),'rbt',ARRAY['21'],'ROUND-L','practice','req-B');
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,chosen_option,ms) OVERRIDING SYSTEM VALUE
VALUES (-3201,(SELECT id FROM _m WHERE n=32),4,true,'practice',0,4000);
INSERT INTO pathways_evidence.attempt_delivery_binding (attempt_id,item_delivery_id,bound_at)
VALUES (-3201,(SELECT item_delivery_id FROM _l1 WHERE item_id='4'),'2000-01-01T00:00:00Z');   -- supplied time must be overwritten
INSERT INTO _r(gate,test,actual,expected) VALUES
 ('G2','serve_items records one served_exposure row per item and returns the content with its id',
   (SELECT count(*)::text || '/' || (SELECT count(*) FROM pathways_evidence.item_presentation_event e JOIN _l1 USING (item_delivery_id) WHERE e.logged_by='server' AND e.event_type='served_exposure')::text
      || '/' || bool_and(body IS NOT NULL)::text FROM _l1), '2/2/true'),
 ('G2','rows are visible before content is returned (same call, same transaction)',
   (SELECT count(*)::text FROM _l1 l WHERE NOT EXISTS (SELECT 1 FROM pathways_evidence.item_presentation_event e WHERE e.item_delivery_id=l.item_delivery_id)), '0'),
 ('G5','duplicate: a retried request returns the same ids and writes nothing new',
   ((SELECT array_agg(item_delivery_id ORDER BY item_id) FROM _l1) = (SELECT array_agg(item_delivery_id ORDER BY item_id) FROM _l2))::text || '/' ||
   (SELECT count(*) FROM pathways_evidence.item_presentation_event WHERE member_id=(SELECT id FROM _m WHERE n=32))::text, 'true/2'),
 ('G2','same item served twice in one round (two requests): two distinct identities',
   ((SELECT item_delivery_id FROM _l3) <> (SELECT item_delivery_id FROM _l4))::text, 'true'),
 ('G2','a batch from one call shares one server instant (simultaneous, so no independence between siblings)',
   (SELECT count(DISTINCT server_recorded_at)::text FROM pathways_evidence.item_presentation_event e JOIN _l1 USING (item_delivery_id)), '1'),
 ('G4','server time is stamped: the supplied binding time (year 2000) was overwritten',
   (SELECT (bound_at >= now())::text FROM pathways_evidence.attempt_delivery_binding WHERE attempt_id=-3201), 'true'),
 ('G5','live end-to-end: served, answered, bound => first_known and eligible',
   (SELECT string_agg(DISTINCT exposure_class||'/'||eligible_opportunity_exposure_aware::text, ',') FROM pathways_evidence.member_first_encounters_exposure_aware WHERE attempt_id='-3201'),
   'first_known_exposure/true'),
 ('G2','serve_items refuses an unknown item', pg_temp.err($$SELECT * FROM pathways_evidence.serve_items((SELECT id FROM _m WHERE n=32),'rbt',ARRAY['999999'],'R','practice','req-x')$$), '23503'),
 ('G2','serve_items refuses an unknown member', pg_temp.err($$SELECT * FROM pathways_evidence.serve_items('eeeeeeee-0000-4000-8000-000000000000','rbt',ARRAY['4'],'R','practice','req-y')$$), '23503'),
 ('G2','a served_exposure row written outside serve_items is refused',
   pg_temp.err($$INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,logged_by,event_type,item_delivery_id,serve_request_key,dependence_keys_at_delivery,content_hash_at_delivery)
               VALUES ((SELECT id FROM _m WHERE n=32),'rbt','4','current','server','served_exposure',gen_random_uuid(),'forged','{}','x')$$), '42501'),
 ('G2','an incomplete server row is refused even on the serve path',
   pg_temp.err($$SELECT set_config('pathways_evidence.serve_writer','on',true); INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,logged_by) VALUES ((SELECT id FROM _m WHERE n=32),'rbt','4','current','server')$$), '23514'),
 ('G4','server time is stamped: a client row''s supplied server_recorded_at (year 2000) is overwritten',
   pg_temp.err($$DO $x$ BEGIN PERFORM set_config('pathways_evidence.serve_writer','off',true);
      INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,logged_by,server_recorded_at)
      VALUES ((SELECT id FROM _m WHERE n=40),'rbt','4','current','client','2000-01-01T00:00:00Z');
      IF (SELECT min(server_recorded_at) FROM pathways_evidence.item_presentation_event WHERE member_id=(SELECT id FROM _m WHERE n=40)) < now() THEN RAISE EXCEPTION 'not stamped' USING ERRCODE='P0001'; END IF; END $x$ $$), 'no error');
SELECT set_config('pathways_evidence.serve_writer','off',true);

-- ---------- policy options and epoch gates (changed, measured, restored) ----------
UPDATE pathways_evidence.exposure_logging_policy SET history_start_rule='first_activity' WHERE track='rbt';
INSERT INTO _r(gate,test,actual,expected) VALUES
 ('OD2','[option first_activity] pre-epoch account, only server-ordered activity after the epoch', pg_temp.cls(29,'1'), 'first_known_exposure/complete_history'),
 ('OD2','[option first_activity] a legacy row with no server time keeps it unknown', pg_temp.cls(31,'1'), 'unknown_exposure_history/member_history_predates_epoch'),
 ('OD2','[option first_activity] pre-epoch activity still unknown', pg_temp.cla('-502'), 'unknown_exposure_history/member_history_predates_epoch');
UPDATE pathways_evidence.exposure_logging_policy SET history_start_rule='account_created' WHERE track='rbt';
INSERT INTO _r(gate,test,actual,expected) VALUES
 ('OD2','[default account_created] restored', pg_temp.cls(29,'1'), 'unknown_exposure_history/member_history_predates_epoch');
UPDATE pathways_evidence.exposure_logging_policy SET inventory_attested_at=NULL WHERE track='rbt';
INSERT INTO _r(gate,test,actual,expected) VALUES
 ('G1','inventory not attested: nothing is first_known', (SELECT count(*)::text FROM pathways_evidence.member_first_encounters_exposure_aware WHERE exposure_class='first_known_exposure'), '0'),
 ('G1','inventory not attested: control says why', pg_temp.cls(1,'1'), 'unknown_exposure_history/no_epoch_declared'),
 ('G1','inventory not attested: reserve freshness is unknown, never fresh', pg_temp.fr(1,'21'), 'unknown');
UPDATE pathways_evidence.exposure_logging_policy SET inventory_attested_at='2026-03-01T00:00:00Z' WHERE track='rbt';
INSERT INTO _r(gate,test,actual,expected) VALUES
 ('G1','epoch = later of logging start and attestation: a delivery between them is pre-epoch', pg_temp.cls(1,'1'), 'unknown_exposure_history/delivery_before_epoch');
UPDATE pathways_evidence.exposure_logging_policy SET inventory_attested_at='2026-01-01T00:00:00Z' WHERE track='rbt';
DELETE FROM pathways_evidence.exposure_logging_policy WHERE track='rbt';
INSERT INTO _r(gate,test,actual,expected) VALUES
 ('G5','no epoch declared (today): nothing is first_known', (SELECT count(*)::text FROM pathways_evidence.member_first_encounters_exposure_aware WHERE exposure_class='first_known_exposure'), '0');
INSERT INTO pathways_evidence.exposure_logging_policy (track,logging_started_at,note,inventory_attested_at,inventory_attested_by)
VALUES ('rbt','2026-01-01T00:00:00Z','TEST epoch','2026-01-01T00:00:00Z','TEST builder');
INSERT INTO _r(gate,test,actual,expected) VALUES ('G5','policy restored: control first_known again', pg_temp.cls(1,'1'), 'first_known_exposure/complete_history');

-- ---------- time zone ----------
CREATE TEMP TABLE _tz1 AS SELECT md5(string_agg(attempt_id||raw_tag||exposure_class||exposure_reason, '|' ORDER BY attempt_id, raw_tag)) h FROM pathways_evidence.member_first_encounters_exposure_aware;
SET LOCAL TimeZone = 'Pacific/Kiritimati';
INSERT INTO _r(gate,test,actual,expected) VALUES
 ('G4','classification identical under UTC and UTC+14', (SELECT (md5(string_agg(attempt_id||raw_tag||exposure_class||exposure_reason, '|' ORDER BY attempt_id, raw_tag)) = (SELECT h FROM _tz1))::text FROM pathways_evidence.member_first_encounters_exposure_aware), 'true');
SET LOCAL TimeZone = 'UTC';

-- ---------- one authority, security, additivity ----------
INSERT INTO _r(gate,test,actual,expected) VALUES
 ('I1','consumer and reserve freshness both read member_item_exposure',
   ((pg_get_viewdef('pathways_evidence.member_first_encounters_exposure_aware'::regclass) LIKE '%member_item_exposure%')
    AND (SELECT prosrc LIKE '%member_item_exposure%' FROM pg_proc WHERE proname='member_item_freshness'))::text, 'true'),
 ('I1','consumer never reads item_presentation_event, attempts or bindings directly',
   (SELECT count(*)::text FROM pg_depend dp JOIN pg_rewrite rw ON rw.oid = dp.objid JOIN pg_class ref ON ref.oid = dp.refobjid
     WHERE rw.ev_class = 'pathways_evidence.member_first_encounters_exposure_aware'::regclass
       AND ref.relname IN ('item_presentation_event','attempts','pathways_source_attempts','attempt_delivery_binding')), '0'),
 ('SEC','every EHC view has security_invoker=true',
   (SELECT count(*)::text FROM pg_class c JOIN pg_namespace s ON s.oid=c.relnamespace
     WHERE s.nspname='pathways_evidence' AND c.relname IN ('item_dependence_key','member_item_exposure','member_history_coverage','member_first_encounters_exposure_aware')
       AND 'security_invoker=true' = ANY (c.reloptions)), '4'),
 ('SEC','anon/authenticated: no privilege on EHC views or the binding table',
   (SELECT count(*)::text FROM (VALUES ('anon'),('authenticated')) r(role), (VALUES ('pathways_evidence.item_dependence_key'),('pathways_evidence.member_item_exposure'),
      ('pathways_evidence.member_history_coverage'),('pathways_evidence.member_first_encounters_exposure_aware'),('pathways_evidence.attempt_delivery_binding')) v(obj)
     WHERE has_table_privilege(r.role, v.obj, 'SELECT') OR has_table_privilege(r.role, v.obj, 'INSERT')), '0'),
 ('SEC','anon/authenticated cannot execute serve_items or member_item_freshness; service_role can execute serve_items',
   (SELECT count(*) FILTER (WHERE has_function_privilege(r, f, 'EXECUTE'))::text FROM unnest(ARRAY['anon','authenticated']) r,
      unnest(ARRAY['pathways_evidence.serve_items(uuid,text,text[],text,text,text)','pathways_evidence.member_item_freshness(uuid,text,text)']) f)
   || '/' || has_function_privilege('service_role','pathways_evidence.serve_items(uuid,text,text[],text,text,text)','EXECUTE')::text, '0/true'),
 ('SEC','serve_items is SECURITY DEFINER with a pinned empty search_path',
   (SELECT prosecdef::text || '/' || array_to_string(proconfig, ',') FROM pg_proc WHERE proname='serve_items'), 'true/search_path=""'),
 ('SEC','binding table has row level security on', (SELECT relrowsecurity::text FROM pg_class WHERE oid='pathways_evidence.attempt_delivery_binding'::regclass), 'true'),
 ('SEC','authenticated calling serve_items is refused', pg_temp.err($$SET LOCAL ROLE authenticated; SELECT * FROM pathways_evidence.serve_items(NULL,'rbt',ARRAY['4'],'R','practice','k')$$), '42501'),
 ('G4','review log (dependence version history) cannot be truncated', pg_temp.err($$TRUNCATE pathways_evidence.review_event$$), '42501'),
 ('ADD','shipped views unchanged (definition and options)',
   (SELECT count(*)::text FROM _shipped_before b JOIN pg_class c ON c.relname=b.relname JOIN pg_namespace s ON s.oid=c.relnamespace AND s.nspname='pathways_evidence'
     WHERE pg_get_viewdef(c.oid) IS DISTINCT FROM b.def OR c.reloptions IS DISTINCT FROM b.reloptions), '0'),
 ('ADD','shipped view count unchanged (11)', (SELECT count(*)::text FROM _shipped_before), '11');
RESET ROLE;

UPDATE _r SET pass = (actual IS NOT DISTINCT FROM expected);
SELECT n, CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END AS result, gate, test, actual, expected FROM _r ORDER BY n;
SELECT count(*) FILTER (WHERE pass) || '/' || count(*) || ' passed' AS summary FROM _r;
DO $$ DECLARE f int; BEGIN
  SELECT count(*) INTO f FROM _r WHERE NOT pass;
  IF f > 0 THEN RAISE EXCEPTION 'EHC v2 suite: % case(s) FAILED', f; END IF;
END $$;
ROLLBACK;
