-- ehc-adv-ab-v2.sql : the same adversarial cases for ChatGPT's defects (a) and (b), against EHC v2 / v2.1 (Tab, 2026-10-26).
-- Throwaway Postgres 15 only, real-schema extract (ehc-scratch-schema.sql.txt), synthetic rows, rolled back.
-- Copy the body under test to /tmp/ehc2_body.sql, then: psql -X -v ON_ERROR_STOP=1 -v strict=true -f ehc-adv-ab-v2.sql
-- With strict=true the file ends in RAISE EXCEPTION if any case is unsafe. "Safe" = never first_known / never 'fresh'.
-- Fixture times are inserted with the two stamp triggers disabled inside this rolled-back transaction (as in ehc-v2-tests).
BEGIN;
SET LOCAL TimeZone = 'UTC';
\ir /tmp/ehc21_body.sql
-- ---------- fixtures (synthetic) ----------
-- Epoch 2026-01-01 on rbt, inventory attested 2026-01-01. Items 1-8 created 2025-01-01; fresh variants 20-22 and 30 created 2026-03-01.
INSERT INTO public.questions (id,track,area,body,options,answer,explanation,published,created_at) OVERRIDING SYSTEM VALUE
SELECT i,'rbt','TEST','synthetic stem '||i,'[{"t":"a"},{"t":"b"},{"t":"c"},{"t":"d"}]'::jsonb,0,'synthetic',
       i <> 8, CASE WHEN i = 40 THEN '2026-01-01T00:00:00Z'::timestamptz WHEN i >= 20 THEN '2026-03-01T00:00:00Z'::timestamptz ELSE '2025-01-01T00:00:00Z'::timestamptz END
FROM (SELECT generate_series(1,8) UNION ALL SELECT generate_series(20,22) UNION ALL SELECT 30 UNION ALL SELECT 9 UNION ALL SELECT 40) g(i)
ON CONFLICT (id) DO UPDATE SET created_at = EXCLUDED.created_at, published = EXCLUDED.published, body = EXCLUDED.body,
  options = EXCLUDED.options, answer = EXCLUDED.answer, explanation = EXCLUDED.explanation;
INSERT INTO pathways_evidence.sme_reviewer VALUES ('bbbbbbbb-0000-4000-8000-000000000001','TEST SYNTHETIC','TEST','{rbt,bcba}',true);
INSERT INTO pathways_evidence.item_quality_review (track,item_id,content_version,quality_status,citation_status,key_status,certified_pool,reviewer_id,reviewed_at)
SELECT 'rbt',i::text,'current','approved','approved','approved','practice','bbbbbbbb-0000-4000-8000-000000000001',now()
FROM unnest(ARRAY[1,2,3,4,5,6,7,8,9,20,21,22,30,40]) i;
INSERT INTO pathways_evidence.item_tag_review (track,item_id,content_version,raw_tag,alignment_status,assessable,transfer_status,reviewed_by,reviewed_at,surface_cluster_id)
SELECT 'rbt',v.item,'current',v.tag,'approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),v.cl
FROM (VALUES ('6','tag_z','C_OTHER'),('1','tag_x','C_TEST'),('2','tag_x','C_TEST'),('3','tag_x','C_TEST'),('4','tag_y',NULL),
             ('5','tag_x','C_TEST'),('6','tag_x','C_TEST'),('7','tag_x','C_OLD'),('8','tag_x','C_TEST'),
             ('20','tag_x','C_NEWVAR'),('9','tag_y',NULL),('40','tag_x','C_EPOCHVAR'),('21','tag_x','C_NEWVAR'),('22','tag_x','C_TEST'),('30','tag_y','C_EDIT')) v(item,tag,cl);
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
FROM generate_series(1,40) n;  -- ADAPTED: member 30 pre-epoch account row (attempts FK on real schema)
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


UPDATE public.questions SET published = false WHERE id = 9;   -- item 9: old (2025), unpublished, reviewed tag, no cluster
UPDATE auth.users SET created_at = '2026-01-01T00:00:00Z' WHERE id = 'cccccccc-0000-4000-8000-000000000034';   -- member 34: account created exactly AT the epoch
CREATE TEMP TABLE _r(n serial, defect text, test text, invariant text, actual text, expected_safe text, unsafe boolean);
\o /dev/null
DO $$ DECLARE d1 uuid; d2 uuid; BEGIN
  -- (a) ties and later presentations, same item (item 4 carries only its ITEM: key). T = 2026-02-01 12:00 UTC.
  d1 := pg_temp.srv(21,'4','2026-02-01T11:58:00Z'); d2 := pg_temp.srv(21,'4','2026-02-01T11:58:00Z');          -- A1 two deliveries tied
  PERFORM pg_temp.att(21,-2101,4,'2026-02-01T12:00:00Z'); PERFORM pg_temp.bind(-2101,d1,'2026-02-01T12:00:00Z');
  d1 := pg_temp.srv(22,'4','2026-02-01T11:55:00Z');                                                            -- A2 later client display, names no delivery
  PERFORM pg_temp.cli(22,'4','2026-02-01T11:58:00Z','2026-02-01T11:58:00Z');
  PERFORM pg_temp.att(22,-2201,4,'2026-02-01T12:00:00Z'); PERFORM pg_temp.bind(-2201,d1,'2026-02-01T12:00:00Z');
  d1 := pg_temp.srv(24,'4','2026-02-01T11:58:00Z');                                                            -- A3 legacy row tied, no server time
  PERFORM pg_temp.cli(24,'4',NULL,'2026-02-01T11:58:00Z','unknown');
  PERFORM pg_temp.att(24,-2401,4,'2026-02-01T12:00:00Z'); PERFORM pg_temp.bind(-2401,d1,'2026-02-01T12:00:00Z');
  d1 := pg_temp.srv(25,'4','2026-02-01T11:55:00Z'); d2 := pg_temp.srv(25,'4','2026-02-01T12:00:00Z');          -- A4 2nd delivery tied with the answer
  PERFORM pg_temp.att(25,-2501,4,'2026-02-01T12:00:00Z'); PERFORM pg_temp.bind(-2501,d1,'2026-02-01T12:00:00Z');
  d1 := pg_temp.srv(26,'4','2026-02-01T11:58:00Z');                                                            -- A5 client row ingested AFTER the answer, claiming an early display
  PERFORM pg_temp.cli(26,'4','2026-02-01T12:05:00Z','2026-02-01T11:00:00Z');
  PERFORM pg_temp.att(26,-2601,4,'2026-02-01T12:00:00Z'); PERFORM pg_temp.bind(-2601,d1,'2026-02-01T12:00:00Z');
  d1 := pg_temp.srv(23,'4','2026-02-01T11:55:00Z');                                                            -- C1 control: re-display ack of the SAME delivery
  PERFORM pg_temp.ack(23,'4',d1,'2026-02-01T11:58:00Z','2026-02-01T11:58:00Z');
  PERFORM pg_temp.att(23,-2301,4,'2026-02-01T12:00:00Z'); PERFORM pg_temp.bind(-2301,d1,'2026-02-01T12:00:00Z');
  PERFORM pg_temp.sab(27,-2701,4,'2026-02-01T12:00:00Z');                                                      -- C2 control: plain legit
  -- epoch-boundary ties (effective epoch = 2026-01-01T00:00:00Z)
  PERFORM pg_temp.sab(28,-2801,4,'2026-01-01T00:02:00Z');                                                      -- E1 delivery + history start exactly AT the epoch
  PERFORM pg_temp.sab(29,-2901,40,'2026-02-01T12:00:00Z');                                                     -- E2 pre-epoch member, variant created exactly AT the epoch
  -- (b) direct exposure of item 9 by post-epoch member 32 (an attempt; attempts do not depend on pathways_source_items)
  PERFORM pg_temp.att(32,-3201,9,'2026-02-01T12:00:00Z');
END $$;
\o
INSERT INTO _r(defect,test,invariant,actual,expected_safe) VALUES
 ('a','A1 two distinct deliveries of the same item tied at the same server time','real',pg_temp.cla('-2101'),'not first_known'),
 ('a','A2 a later client display that names no delivery (after the served anchor)','real',pg_temp.cla('-2201'),'not first_known'),
 ('a','A3 a legacy presentation tied at the anchor, no server time','real',pg_temp.cla('-2401'),'not first_known'),
 ('a','A4 a second delivery tied exactly with the answer''s bind time','real',pg_temp.cla('-2501'),'not first_known'),
 ('a','A5 client row ingested after the answer claiming an earlier display (client clock ignored)','real',pg_temp.cla('-2601'),'not first_known'),
 ('a','E1 delivery server-stamped exactly at the effective epoch','real',pg_temp.cla('-2801'),'not first_known'),
 ('a','E2 pre-epoch member; variant key set created exactly at the effective epoch','real',pg_temp.cla('-2901'),'not first_known'),
 ('a','E3 freshness: member whose account (history start) was created exactly at the epoch, old item never shown','real',pg_temp.fr(34,'3'),'not fresh'),
 ('ctl','C3 control: freshness for a post-epoch member, old item never shown','real',pg_temp.fr(28,'3'),NULL),
 ('b','B1 freshness: pre-epoch member, old item 9 (has its ITEM: key)','real',pg_temp.fr(31,'9'),'not fresh'),
 ('b','B4 freshness: pre-epoch member, item id that is not in the bank','real',pg_temp.fr(31,'999'),'not fresh'),
 ('ctl','C1 control: display ack of the SAME delivery stays one encounter','real',pg_temp.cla('-2301'),NULL),
 ('ctl','C2 control: legitimate first_known still reachable','real',pg_temp.cla('-2701'),NULL);
CREATE OR REPLACE VIEW pathways_evidence.pathways_source_items AS
SELECT track, id::text AS item_id, published AS is_published, 'current'::text AS content_version,
       NULL::text AS variant_family_id, NULL::text AS surface_cluster_id, NULL::timestamp with time zone AS item_approved_at
FROM public.questions q WHERE q.published;   -- SIMULATED invariant break (a plausible future filter); NOT the real definition

INSERT INTO _r(defect,test,invariant,actual,expected_safe) VALUES
 ('b','B0 item 9 key records','SIMULATED BREAK',(SELECT count(*)::text||' key rows' FROM pathways_evidence.item_dependence_key WHERE item_id='9'),NULL),
 ('b','B2 freshness: pre-epoch member, item 9 with ZERO key records','SIMULATED BREAK',pg_temp.fr(31,'9'),'not fresh'),
 ('b','B3 freshness: post-epoch member who ALREADY ANSWERED item 9 (zero key records)','SIMULATED BREAK',pg_temp.fr(32,'9'),'not fresh'),
 ('b','B5 serving item 9 with zero key records','SIMULATED BREAK',
    pg_temp.err($$SELECT * FROM pathways_evidence.serve_items('cccccccc-0000-4000-8000-000000000033','rbt',ARRAY['9'],'R','practice','adv-b5')$$),'refused'),
 ('b','B6 C5 view: member 32''s answer on item 9','SIMULATED BREAK',coalesce(pg_temp.cla('-3201'),'row absent from C5 (member_first_encounters drops it)'),'not first_known');
UPDATE _r SET unsafe = CASE expected_safe WHEN 'not first_known' THEN actual LIKE 'first_known%'
                                          WHEN 'not fresh' THEN actual = 'fresh'
                                          WHEN 'refused' THEN actual = 'no error' END
 WHERE expected_safe IS NOT NULL;
SELECT n, defect, CASE WHEN unsafe THEN 'UNSAFE' WHEN unsafe IS NULL THEN 'info' ELSE 'safe' END AS verdict, invariant, test, actual FROM _r ORDER BY n;
SELECT count(*) FILTER (WHERE unsafe) || ' unsafe of ' || count(*) FILTER (WHERE unsafe IS NOT NULL) || ' adversarial cases; controls: '
       || (SELECT string_agg(actual, ' | ' ORDER BY n) FROM _r WHERE defect = 'ctl') AS summary FROM _r;
\if :strict
DO $$ DECLARE f int; c int; BEGIN
  SELECT count(*) INTO f FROM _r WHERE unsafe;
  SELECT count(*) INTO c FROM _r WHERE defect = 'ctl' AND actual NOT LIKE 'first_known%' AND actual <> 'fresh';
  IF f > 0 OR c > 0 THEN RAISE EXCEPTION 'adversarial (a)/(b) suite: % unsafe case(s), % broken control(s)', f, c; END IF;
END $$;
\endif
ROLLBACK;
