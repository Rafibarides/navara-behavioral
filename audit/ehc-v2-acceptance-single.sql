-- EHC v2 acceptance harness, single-session part. Rolled back; nothing persists.
-- Documents CURRENT behavior of the actual v2 SQL for the nonce/binding contract cases.
\unset ON_ERROR_STOP
BEGIN;
SET LOCAL TimeZone = 'UTC';
\ir /tmp/ehc2_body.sql
CREATE TEMP TABLE _r(n serial, case_id text, description text, actual text, expected text, pass boolean);
INSERT INTO auth.users (id,aud,role,email,created_at) VALUES
  ('dddddddd-0000-4000-8000-0000000000aa','authenticated','authenticated','h1@synthetic.invalid','2026-01-10T00:00:00Z'),
  ('dddddddd-0000-4000-8000-0000000000bb','authenticated','authenticated','h2@synthetic.invalid','2026-01-10T00:00:00Z');
INSERT INTO pathways_evidence.exposure_logging_policy (track,logging_started_at,note) VALUES ('rbt','2026-01-01T00:00:00Z','TEST');
CREATE TEMP TABLE _m AS SELECT 'dddddddd-0000-4000-8000-0000000000aa'::uuid AS a, 'dddddddd-0000-4000-8000-0000000000bb'::uuid AS b;

-- Case 1: retry same key + same items -> identical delivery ids, one row per item
CREATE TEMP TABLE _c1a AS SELECT * FROM pathways_evidence.serve_items((SELECT a FROM _m),'rbt',ARRAY['1','2'],'R1','practice','K1');
CREATE TEMP TABLE _c1b AS SELECT * FROM pathways_evidence.serve_items((SELECT a FROM _m),'rbt',ARRAY['1','2'],'R1','practice','K1');
INSERT INTO _r(case_id,description,actual,expected,pass)
SELECT 'C1','retry same key+items returns original ids', 
       (SELECT count(*) FROM _c1a) || ' rows, ids_equal=' || (SELECT bool_and(a.item_delivery_id = b.item_delivery_id) FROM _c1a a JOIN _c1b b ON a.item_id=b.item_id),
       '2 rows, ids_equal=true',
       (SELECT count(*) FROM _c1a)=2 AND (SELECT bool_and(a.item_delivery_id=b.item_delivery_id) FROM _c1a a JOIN _c1b b ON a.item_id=b.item_id);

-- Case 3: same key + added item (fingerprint mismatch should RAISE post-fix; document current)
CREATE TEMP TABLE _c3 AS SELECT * FROM pathways_evidence.serve_items((SELECT a FROM _m),'rbt',ARRAY['1','2','3'],'R1','practice','K1');
INSERT INTO _r(case_id,description,actual,expected,pass)
SELECT 'C3','same key, added item 3: CURRENT behavior', 
       'item3 served=' || (SELECT count(*) FROM _c3 WHERE item_id='3') || ', item1 id unchanged=' || (SELECT (c.item_delivery_id = o.item_delivery_id) FROM _c3 c JOIN _c1a o ON o.item_id='1' WHERE c.item_id='1'),
       'POST-FIX: raise fingerprint mismatch (GAP-1)', true;

-- Case 4: same key, different track+item (real bank: ids are per-track ranges, so the
-- pure same-item cross-track confusion cannot occur - serve_items raises unknown-item first)
CREATE TEMP TABLE _c4 AS SELECT * FROM pathways_evidence.serve_items((SELECT a FROM _m),'bcba',ARRAY['1709'],'R2','practice','K1');
INSERT INTO _r(case_id,description,actual,expected,pass)
SELECT 'C4','same key K1, bcba item 1709 after rbt items: CURRENT behavior',
       'bcba item served under reused key=' || (SELECT count(*) FROM _c4),
       'POST-FIX: raise fingerprint mismatch (GAP-1); note same-item cross-track confusion is impossible with per-track id ranges', true;

-- Case 5: unpublished item must be refused (GAP-2)
-- (live bank is 100% published; flip item 5 inside this rolled-back tx to simulate)
UPDATE public.questions SET published=false WHERE id=5;
CREATE TEMP TABLE _c5 AS SELECT * FROM pathways_evidence.serve_items((SELECT a FROM _m),'rbt',ARRAY['5'],'R3','practice','K5');
INSERT INTO _r(case_id,description,actual,expected,pass)
SELECT 'C5','unpublished item: CURRENT behavior', 'served rows=' || (SELECT count(*) FROM _c5),
       'POST-FIX: raise publication/entitlement error (GAP-2)', true;

-- Case 7: cross-member binding refused (regression; must PASS today)
CREATE TEMP TABLE _d AS SELECT * FROM pathways_evidence.serve_items((SELECT a FROM _m),'rbt',ARRAY['4'],'R4','practice','K7');
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms) OVERRIDING SYSTEM VALUE
  VALUES (-7701,(SELECT b FROM _m),4,true,'practice',now(),1,1000);
DO $$ BEGIN
  BEGIN
    INSERT INTO pathways_evidence.attempt_delivery_binding (attempt_id,item_delivery_id) VALUES (-7701,(SELECT item_delivery_id FROM _d LIMIT 1));
    INSERT INTO _r(case_id,description,actual,expected,pass) VALUES ('C7','cross-member binding','ACCEPTED (BAD)','refused',false);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _r(case_id,description,actual,expected,pass) VALUES ('C7','cross-member binding','refused: '||SQLSTATE,'refused',true);
  END;
END $$;

TABLE _r;
SELECT count(*) FILTER (WHERE pass) || '/' || count(*) || ' passed (C3/C4/C5 document current gap behavior by design)' AS summary FROM _r;
ROLLBACK;
