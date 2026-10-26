-- v4 reliability draft: failure/retry/latency detection for serving-route
-- instrumentation. DRAFT, NOT APPLIED. Fire-and-forget display logging means
-- some displays WILL be lost (offline, RPC error, swallowed catch). This draft
-- makes those losses DETECTABLE and gates epoch declaration on their absence,
-- instead of assuming every display logged.
--
-- Principle: attempts.delivery_id tells us which displays SHOULD exist
-- (every answered item was displayed). Comparing expected vs logged displays
-- yields a measurable gap rate. History is never repaired by inference:
-- gaps stay gaps; they only block freshness claims and epoch declaration.

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

-- 3. Logging health per track + epoch eligibility ----------------------------
-- A track may declare its logging epoch only when, over a lookback window of
-- bound deliveries, the gap count is zero AND volume is nonzero (an empty
-- window proves nothing). Until declared, member_first_encounters_exposure_aware
-- already returns unknown_exposure_history - fail-closed by construction.
CREATE OR REPLACE VIEW pathways_evidence.exposure_logging_health AS
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
        AND COALESCE(g.late_displays,0) = 0) AS epoch_eligible
FROM expected e LEFT JOIN gaps g ON g.track = e.track;

ROLLBACK;  -- draft: validation runs then rolls back
