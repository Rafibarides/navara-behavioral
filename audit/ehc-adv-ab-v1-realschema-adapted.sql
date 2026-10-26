-- ehc-adv-ab-v1.sql : adversarial reproduction of ChatGPT's two verified C5 defects against EHC v1 (Tab, 2026-10-26).
-- Throwaway Postgres 15 only, real-schema extract (ehc-scratch-schema.sql.txt), synthetic rows, rolled back.
-- Copy ehc-v1.sql.txt to /tmp/ehc_body.sql, then psql -X -v ON_ERROR_STOP=1 -f ehc-adv-ab-v1.sql
-- Each row: the SAFE verdict is "not first_known_exposure". unsafe=true means the defect fired.
BEGIN;
SET LOCAL TimeZone = 'UTC';
\ir /tmp/ehc_body.sql
CREATE TEMP TABLE _r(n serial, defect text, test text, invariant text, actual text, unsafe boolean);
-- Fixtures (synthetic). Epoch 2026-01-01 on rbt. Old items 1-8 created 2025-01-01; fresh variants 20-22 created 2026-03-01.
INSERT INTO public.questions (id,track,area,body,options,answer,explanation,published,created_at) OVERRIDING SYSTEM VALUE
SELECT i,'rbt','TEST','synthetic stem '||i,'[{"t":"a"},{"t":"b"},{"t":"c"},{"t":"d"}]'::jsonb,0,'synthetic',
       i <> 8, CASE WHEN i >= 20 THEN '2026-03-01T00:00:00Z'::timestamptz ELSE '2025-01-01T00:00:00Z'::timestamptz END
FROM (SELECT generate_series(1,9) UNION ALL SELECT generate_series(20,22)) g(i)
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
       CASE WHEN n IN (4,5,6,7,8) THEN '2025-06-01T00:00:00Z'::timestamptz ELSE '2026-01-10T00:00:00Z'::timestamptz END
FROM generate_series(1,40) n;  -- ADAPTED
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


UPDATE public.questions SET published = false WHERE id = 9;   -- item 9: old (2025), unpublished, reviewed tag, NO cluster anywhere
INSERT INTO pathways_evidence.item_tag_review (track,item_id,content_version,raw_tag,alignment_status,assessable,transfer_status,reviewed_by,reviewed_at,surface_cluster_id)
VALUES ('rbt','9','current','tag_y','approved',true,'unreviewed','bbbbbbbb-0000-4000-8000-000000000001',now(),NULL);
\o /dev/null
-- (a) anchor-timestamp ties / later presentations. Item 4 has only its ITEM: key, so only same-item logic is in play.
SELECT pg_temp.pres(21,'4','2026-02-01T11:58:00Z','server'); SELECT pg_temp.pres(21,'4','2026-02-01T11:58:00Z','server');
SELECT pg_temp.att(21,-2101,4,'2026-02-01T12:00:00Z');                        -- A1 two distinct server serves tied at the anchor
SELECT pg_temp.pres(22,'4','2026-02-01T11:55:00Z','server'); SELECT pg_temp.pres(22,'4','2026-02-01T11:58:00Z','client');
SELECT pg_temp.att(22,-2201,4,'2026-02-01T12:00:00Z');                        -- A2 a second (client) presentation after the server anchor
SELECT pg_temp.pres(23,'4','2026-02-01T11:58:00Z','server'); SELECT pg_temp.pres(23,'4','2026-02-01T11:58:00Z','unknown');
SELECT pg_temp.att(23,-2301,4,'2026-02-01T12:00:00Z');                        -- A3 legacy (unknown) presentation tied at the anchor
SELECT pg_temp.pres(24,'4','2026-02-01T11:55:00Z','server'); SELECT pg_temp.pres(24,'4','2026-02-01T11:58:00Z','server');
SELECT pg_temp.att(24,-2401,4,'2026-02-01T12:00:00Z');                        -- A4 control: earlier server serve, later re-serve (v1 catches)
SELECT pg_temp.pres(25,'4','2026-02-01T11:58:00Z','server'); SELECT pg_temp.att(25,-2501,4,'2026-02-01T12:00:00Z');  -- A5 control: legit
-- (b) item absent from item_dependence_key. Member 8's account predates the epoch.
SELECT pg_temp.pres(8,'9','2026-02-01T11:58:00Z','server'); SELECT pg_temp.att(8,-801,9,'2026-02-01T12:00:00Z');
\o
CREATE FUNCTION pg_temp.cla(p text) RETURNS text LANGUAGE sql AS $f$
  SELECT string_agg(DISTINCT exposure_class || '/' || exposure_reason, ',') FROM pathways_evidence.member_first_encounters_exposure_aware WHERE attempt_id = p $f$;
INSERT INTO _r(defect,test,invariant,actual) VALUES
 ('a','A1 two distinct server serves of the same item tied at the anchor timestamp','real',pg_temp.cla('-2101')),
 ('a','A2 a second presentation (client) after the selected server anchor','real',pg_temp.cla('-2201')),
 ('a','A3 a legacy presentation tied at the anchor timestamp','real',pg_temp.cla('-2301')),
 ('a','A4 control: earlier serve then a later re-serve (expected caught)','real',pg_temp.cla('-2401')),
 ('b','B1 pre-epoch member, old item, real pathways_source_items (every question has an ITEM: key)','real',pg_temp.cla('-801')),
 ('b','B0 item 9 has a key record','real',(SELECT count(*)::text||' key rows' FROM pathways_evidence.item_dependence_key WHERE item_id='9'));
CREATE OR REPLACE VIEW pathways_evidence.pathways_source_items AS
SELECT track, id::text AS item_id, published AS is_published, 'current'::text AS content_version,
       NULL::text AS variant_family_id, NULL::text AS surface_cluster_id, NULL::timestamp with time zone AS item_approved_at
FROM public.questions q WHERE q.published;   -- SIMULATED invariant break (a plausible future filter); NOT the real definition

INSERT INTO _r(defect,test,invariant,actual) VALUES
 ('b','B0 item 9 has a key record','SIMULATED BREAK',(SELECT count(*)::text||' key rows' FROM pathways_evidence.item_dependence_key WHERE item_id='9')),
 ('b','B2 v1 fresh-keyset exception (keyset_postdates_epoch) evaluated for item 9 with ZERO key records','SIMULATED BREAK',(SELECT (pol.track IS NOT NULL AND NOT EXISTS (
     SELECT 1 FROM pathways_evidence.item_dependence_key k1
     JOIN pathways_evidence.item_dependence_key k2 ON k2.track = k1.track AND k2.k = k1.k
     LEFT JOIN public.questions q ON q.id::text = k2.item_id AND q.track = k2.track
     WHERE k1.track = 'rbt' AND k1.item_id = '9' AND (q.created_at IS NULL OR q.created_at < pol.logging_started_at)))::text
   FROM pathways_evidence.exposure_logging_policy pol WHERE pol.track = 'rbt')),
 ('b','B1 the same pre-epoch answer end-to-end (does the row reach C5 at all?)','SIMULATED BREAK',coalesce(pg_temp.cla('-801'),'row absent from C5 (member_first_encounters drops it)'));
INSERT INTO _r(defect,test,invariant,actual) VALUES ('ctl','A5 control: legitimate first_known still reachable','real (re-read)',pg_temp.cla('-2501'));
UPDATE _r SET unsafe = (actual LIKE 'first_known%') WHERE test NOT LIKE 'B0%' AND test NOT LIKE 'A5%' AND test NOT LIKE 'B2%';
UPDATE _r SET unsafe = (actual = 'true') WHERE test LIKE 'B2%';
SELECT n, defect, CASE WHEN unsafe THEN 'DEFECT FIRES' WHEN unsafe IS NULL THEN 'info' ELSE 'safe' END AS verdict, invariant, test, actual FROM _r ORDER BY n;
SELECT count(*) FILTER (WHERE unsafe) || ' unsafe of ' || count(*) FILTER (WHERE unsafe IS NOT NULL) || ' adversarial cases' AS summary FROM _r;
ROLLBACK;
