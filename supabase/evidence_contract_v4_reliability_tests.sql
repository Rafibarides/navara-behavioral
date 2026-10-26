-- v4 reliability tests - ROLLED BACK, nothing persists.
-- Timestamps are now()-relative because the health window is 30 days.
\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE _r(n serial, test text, actual text, expected text, pass boolean);
\ir /tmp/v4_reliability_body.sql

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) VALUES
 ('00000000-0000-0000-0000-000000000000','cccccccc-0000-4000-8000-0000000000a1','authenticated','authenticated','test-a1@synthetic.invalid','',now(),now(),now(),'','','',''),
 ('00000000-0000-0000-0000-000000000000','cccccccc-0000-4000-8000-0000000000a2','authenticated','authenticated','test-a2@synthetic.invalid','',now(),now(),now(),'','','','');

-- DLV-R1: items 1,2 answered; only item 1's display logged -> item 2 gap
-- DLV-R2: item 1 answered + logged on time -> clean
-- DLV-R3: item 2 answered; display flushed 2h late -> display_after_answer
INSERT INTO public.attempts (id,user_id,question_id,correct,kind,created_at,chosen_option,ms,delivery_id) OVERRIDING SYSTEM VALUE VALUES
 (-9101,'cccccccc-0000-4000-8000-0000000000a1',1,true,'practice',now()-interval '1 hour',2,5000,'DLV-R1'),
 (-9102,'cccccccc-0000-4000-8000-0000000000a1',2,false,'practice',now()-interval '1 hour',0,5000,'DLV-R1'),
 (-9103,'cccccccc-0000-4000-8000-0000000000a1',1,true,'practice',now()-interval '2 hours',2,5000,'DLV-R2'),
 (-9104,'cccccccc-0000-4000-8000-0000000000a1',2,true,'practice',now()-interval '3 hours',0,5000,'DLV-R3'),
 (-9105,'cccccccc-0000-4000-8000-0000000000a2',1709,true,'practice',now()-interval '1 hour',1,5000,'DLV-R4');
-- R7 fixture note: DLV-R5 never appears in attempts and its display was never
-- logged - the gap report must stay empty for it, proving the blindness.
INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,delivery_id,event_type) VALUES
 ('cccccccc-0000-4000-8000-0000000000a1','rbt','1','current',now()-interval '1 hour 1 minute','DLV-R1','practice_display'),
 ('cccccccc-0000-4000-8000-0000000000a1','rbt','1','current',now()-interval '2 hours 1 minute','DLV-R2','practice_display'),
 ('cccccccc-0000-4000-8000-0000000000a1','rbt','2','current',now()-interval '1 hour','DLV-R3','practice_display'),
 ('cccccccc-0000-4000-8000-0000000000a2','bcba','1709','current',now()-interval '1 hour 1 minute','DLV-R4','practice_display');

INSERT INTO _r(test,actual,expected) VALUES ('R1 missing display detected for unlogged item',
       (SELECT count(*)::text FROM pathways_evidence.delivery_gap_report WHERE delivery_id='DLV-R1' AND item_id='2' AND gap_kind='missing_display'),
       '1');
INSERT INTO _r(test,actual,expected) VALUES ('R1 on-time logged item produces no gap row',
       (SELECT count(*)::text FROM pathways_evidence.delivery_gap_report WHERE delivery_id='DLV-R1' AND item_id='1'),
       '0');
INSERT INTO _r(test,actual,expected) VALUES ('R2 fully logged delivery produces no gap rows',
       (SELECT count(*)::text FROM pathways_evidence.delivery_gap_report WHERE delivery_id='DLV-R2'),
       '0');
INSERT INTO _r(test,actual,expected) VALUES ('R3 late-flushed display flagged display_after_answer',
       (SELECT count(*)::text FROM pathways_evidence.delivery_gap_report WHERE delivery_id='DLV-R3' AND gap_kind='display_after_answer'),
       '1');
INSERT INTO _r(test,actual,expected) VALUES ('R4 summary: rbt gaps detected (answered deliveries)',
       (SELECT expected_displays||'/'||missing_displays||'/'||late_displays||'/'||no_detected_answered_gaps FROM pathways_evidence.answered_delivery_gap_summary WHERE track='rbt'),
       '4/1/1/false');
INSERT INTO _r(test,actual,expected) VALUES ('R5 summary: clean bcba delivery shows no detected gaps',
       (SELECT expected_displays||'/'||missing_displays||'/'||late_displays||'/'||no_detected_answered_gaps FROM pathways_evidence.answered_delivery_gap_summary WHERE track='bcba'),
       '1/0/0/true');
INSERT INTO _r(test,actual,expected) VALUES ('R6 unbound (pre-instrumentation) attempts never enter the gap report',
       (SELECT count(*)::text FROM pathways_evidence.delivery_gap_report g JOIN public.attempts a ON a.delivery_id IS NULL AND a.question_id::text=g.item_id AND a.user_id=g.member_id),
       '0');
INSERT INTO _r(test,actual,expected) VALUES ('R7 CHARACTERIZATION: an unlogged display of an UNANSWERED item is invisible (documented blindness)',
       (SELECT count(*)::text FROM pathways_evidence.delivery_gap_report g WHERE g.delivery_id='DLV-R5'),
       '0');
-- R8 idempotency: the draft unique index makes retried/duplicate flushes one row
CREATE UNIQUE INDEX item_presentation_event_delivery_uniq
  ON pathways_evidence.item_presentation_event (member_id, item_id, delivery_id)
  WHERE delivery_id IS NOT NULL;
INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,delivery_id,event_type) VALUES
 ('cccccccc-0000-4000-8000-0000000000a2','bcba','1709','current',now(),'DLV-R9','practice_display')
 ON CONFLICT (member_id, item_id, delivery_id) WHERE delivery_id IS NOT NULL DO NOTHING;
INSERT INTO pathways_evidence.item_presentation_event (member_id,track,item_id,content_version,presented_at,delivery_id,event_type) VALUES
 ('cccccccc-0000-4000-8000-0000000000a2','bcba','1709','current',now(),'DLV-R9','practice_display')
 ON CONFLICT (member_id, item_id, delivery_id) WHERE delivery_id IS NOT NULL DO NOTHING;
INSERT INTO _r(test,actual,expected) VALUES ('R8 duplicate flush of same (member,item,delivery) collapses to one row',
       (SELECT count(*)::text FROM pathways_evidence.item_presentation_event WHERE delivery_id='DLV-R9'),
       '1');
UPDATE _r SET pass = (actual IS NOT DISTINCT FROM expected);
SELECT n, CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END AS result, test, actual, expected FROM _r ORDER BY n;
DO $$
DECLARE fails int;
BEGIN
  SELECT count(*) INTO fails FROM _r WHERE NOT pass;
  IF fails > 0 THEN RAISE EXCEPTION '% assertions FAILED', fails; END IF;
END $$;
ROLLBACK;