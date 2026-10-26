-- v4 reliability draft: failure/retry/latency detection for serving-route
-- instrumentation. DRAFT, NOT APPLIED. Fire-and-forget display logging means
-- some displays WILL be lost (offline, RPC error, swallowed catch). This draft
-- makes those losses DETECTABLE and gates epoch declaration on their absence,
-- instead of assuming every display logged.
--
-- Principle: attempts.delivery_id tells us which displays SHOULD exist
-- (every answered item was displayed). Comparing expected vs logged displays
-- yields a measurable gap rate FOR ANSWERED ITEMS ONLY. This report is NOT an
-- authoritative measure of all display loss: unlogged displays of unanswered
-- items (abandoned sets, skipped items) are structurally invisible to it.
-- History is never repaired by inference: gaps stay gaps; they only block
-- freshness claims and epoch declaration.

BEGIN;

-- 1. Expected displays: every bound attempt implies its item was displayed --
CREATE OR REPLACE VIEW pathways_evidence.delivery_expected_displays AS
SELECT a.delivery_id, a.user_id AS member_id, q.track,
       a.question_id::text AS item_id, a.created_at AS answered_at
FROM public.attempts a
JOIN public.questions q ON q.id = a.question_id
WHERE a.delivery_id IS NOT NULL AND a.question_id IS NOT NULL;

-- 2. Gap report: expected displays that are missing or arrived late ---------
-- missing_display: no presentation event for (member, item, delivery).
-- display_after_answer: presentation logged >30s after the answer - retry
-- delay, clock skew, or offline queue flush; still exposure, but its late
-- arrival would have made intermediate reads wrongly disqualify the answer.
CREATE OR REPLACE VIEW pathways_evidence.delivery_gap_report AS
SELECT d.delivery_id, d.member_id, d.track, d.item_id, d.answered_at,
       'missing_display'::text AS gap_kind
FROM pathways_evidence.delivery_expected_displays d
WHERE NOT EXISTS (
  SELECT 1 FROM pathways_evidence.item_presentation_event p
  WHERE p.member_id = d.member_id AND p.item_id = d.item_id
    AND p.delivery_id = d.delivery_id)
UNION ALL
SELECT d.delivery_id, d.member_id, d.track, d.item_id, d.answered_at,
       'display_after_answer'::text
FROM pathways_evidence.delivery_expected_displays d
JOIN pathways_evidence.item_presentation_event p
  ON p.member_id = d.member_id AND p.item_id = d.item_id
 AND p.delivery_id = d.delivery_id
WHERE p.presented_at > d.answered_at + interval '30 seconds';

-- 3. Answered-delivery gap detection per track -------------------------------
-- SCOPE LIMIT (load-bearing): expected displays are derived from ATTEMPTS, so
-- this detects missing displays of ANSWERED items only. A display the member
-- saw but never answered (abandoned set, skipped item) that was also never
-- logged leaves no trace anywhere - zero gaps here CANNOT establish epoch
-- completeness and must never be read as "all displays are being logged".
-- This view answers one question only: "of the displays we can prove should
-- exist, are any missing or late?" A nonzero gap count is positive evidence
-- of loss; a zero count is merely the absence of that evidence.
CREATE OR REPLACE VIEW pathways_evidence.answered_delivery_gap_summary AS
WITH expected AS (
  SELECT track, count(*) AS expected_displays,
         count(DISTINCT delivery_id) AS bound_deliveries
  FROM pathways_evidence.delivery_expected_displays
  WHERE answered_at >= now() - interval '30 days'
  GROUP BY track
), gaps AS (
  SELECT track,
         count(*) FILTER (WHERE gap_kind='missing_display') AS missing_displays,
         count(*) FILTER (WHERE gap_kind='display_after_answer') AS late_displays
  FROM pathways_evidence.delivery_gap_report
  WHERE answered_at >= now() - interval '30 days'
  GROUP BY track
)
SELECT e.track, e.bound_deliveries, e.expected_displays,
       COALESCE(g.missing_displays,0) AS missing_displays,
       COALESCE(g.late_displays,0) AS late_displays,
       (e.expected_displays > 0 AND COALESCE(g.missing_displays,0) = 0
        AND COALESCE(g.late_displays,0) = 0) AS no_detected_answered_gaps
FROM expected e LEFT JOIN gaps g ON g.track = e.track;

COMMENT ON VIEW pathways_evidence.answered_delivery_gap_summary IS
  'Detects loss among ANSWERED-item displays only. no_detected_answered_gaps=true is NOT evidence of logging completeness (unanswered displays are invisible to it) and does not by itself support a logging-epoch declaration.';

ROLLBACK;  -- draft: validation runs then rolls back
