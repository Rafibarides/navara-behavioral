-- v4 reliability tests - ROLLED BACK, nothing persists.
-- Timestamps are now()-relative because the health window is 30 days.
BEGIN;
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

SELECT 'R1 missing display detected for unlogged item' AS test,
       (SELECT count(*)::text FROM pathways_evidence.delivery_gap_report
         WHERE delivery_id='DLV-R1' AND item_id='2' AND gap_kind='missing_display') AS actual, '1' AS expected;
SELECT 'R1 on-time logged item produces no gap row' AS test,
       (SELECT count(*)::text FROM pathways_evidence.delivery_gap_report
         WHERE delivery_id='DLV-R1' AND item_id='1') AS actual, '0' AS expected;
SELECT 'R2 fully logged delivery produces no gap rows' AS test,
       (SELECT count(*)::text FROM pathways_evidence.delivery_gap_report
         WHERE delivery_id='DLV-R2') AS actual, '0' AS expected;
SELECT 'R3 late-flushed display flagged display_after_answer' AS test,
       (SELECT count(*)::text FROM pathways_evidence.delivery_gap_report
         WHERE delivery_id='DLV-R3' AND gap_kind='display_after_answer') AS actual, '1' AS expected;
SELECT 'R4 summary: rbt gaps detected (answered deliveries)' AS test,
       (SELECT expected_displays||'/'||missing_displays||'/'||late_displays||'/'||no_detected_answered_gaps
         FROM pathways_evidence.answered_delivery_gap_summary WHERE track='rbt') AS actual, '4/1/1/false' AS expected;
SELECT 'R5 summary: clean bcba delivery shows no detected gaps' AS test,
       (SELECT expected_displays||'/'||missing_displays||'/'||late_displays||'/'||no_detected_answered_gaps
         FROM pathways_evidence.answered_delivery_gap_summary WHERE track='bcba') AS actual, '1/0/0/true' AS expected;
SELECT 'R6 unbound (pre-instrumentation) attempts never enter the gap report' AS test,
       (SELECT count(*)::text FROM pathways_evidence.delivery_gap_report g
         JOIN public.attempts a ON a.delivery_id IS NULL AND a.question_id::text=g.item_id AND a.user_id=g.member_id) AS actual, '0' AS expected;
SELECT 'R7 CHARACTERIZATION: an unlogged display of an UNANSWERED item is invisible (documented blindness)' AS test,
       (SELECT count(*)::text FROM pathways_evidence.delivery_gap_report g
         WHERE g.delivery_id='DLV-R5') AS actual, '0' AS expected;
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
SELECT 'R8 duplicate flush of same (member,item,delivery) collapses to one row' AS test,
       (SELECT count(*)::text FROM pathways_evidence.item_presentation_event WHERE delivery_id='DLV-R9') AS actual, '1' AS expected;
ROLLBACK;
