-- evidence_contract_v4_draft.sql - DRAFT ONLY, NOT APPLIED.
-- Scope: ONE correction, per owner instruction - a single authoritative
-- exposure history for both personal evidence (first encounters) and future
-- reserve freshness, preserving unknown historical exposure. No member-facing
-- RPCs, no behavior change to shipped views. The exposure-aware view is added
-- ALONGSIDE member_first_encounters; switching pattern candidates to it is an
-- owner decision, because with no logging epoch declared every historical
-- attempt classifies unknown_exposure_history (fail-closed, and a behavior
-- change).
--
-- Cross-audit items addressed: E1 (single exposure authority), E2 partially
-- (delivery binding column only; server-side logging and logger authority are
-- prerequisites to declaring an epoch, documented here, not built), E5 (not
-- applicable: the applied manifest has no transfer_approved_clusters; noted
-- for the reassessment phase). E3 (verifier authority separation) deferred:
-- acceptable while only owner-side psql writes flags; required before any
-- application role gains write access.
BEGIN;

-- 1. Delivery binding for future server-side logging (E2 prerequisite) ------
-- A presentation event is authoritative only when the server that DELIVERED
-- the item writes it. delivery_id is the server-issued set/session identifier
-- the future instrumentation will supply; client-supplied rows without it
-- must never back a freshness claim. No logging epoch may be declared in
-- exposure_logging_policy until every display route writes these rows
-- server-side (see TESTING_NOTES.md for authority limits).
ALTER TABLE pathways_evidence.item_presentation_event
  ADD COLUMN delivery_id text;

-- 2. The single authoritative exposure history -------------------------------
-- Two certain sources, one view. An attempt row proves exposure by answer
-- time; a presentation event proves exposure at presentation time. Everything
-- else about the past is UNKNOWN - this view makes no claims about
-- completeness before a track's logging epoch.
CREATE OR REPLACE VIEW pathways_evidence.member_item_exposure AS
SELECT p.member_id, p.track, p.item_id, p.presented_at AS exposure_at,
       'presentation'::text AS exposure_source,
       p.surface_cluster_id_at_presentation AS cluster_at_exposure,
       p.delivery_id
FROM pathways_evidence.item_presentation_event p
UNION ALL
SELECT a.member_id, a.track, a.item_id, a.answered_at,
       'attempt_implied'::text,
       NULL::text, NULL::text
FROM pathways_evidence.pathways_source_attempts a;

-- 3. Exposure-aware first encounters (additive; shipped view untouched) ------
-- exposure_class per attempt:
--   excluded_prior_exposure   - a certain prior exposure exists (prior attempt
--                               on the item or its current cluster, or a
--                               logged presentation of the item/cluster)
--   unknown_exposure_history  - no prior exposure recorded, but the attempt
--                               predates the track's logging epoch (or no
--                               epoch is declared), so unlogged prior displays
--                               cannot be ruled out
--   first_known_exposure      - no prior exposure recorded AND the attempt is
--                               inside the logged epoch
-- Cluster matching uses the presentation's snapshot cluster when recorded and
-- the item's current cluster otherwise - cluster reassignment must not
-- retrospectively create or erase independence.
CREATE OR REPLACE VIEW pathways_evidence.member_first_encounters_exposure_aware AS
WITH fe AS (
  SELECT * FROM pathways_evidence.member_first_encounters
), epoch AS (
  SELECT track, logging_started_at FROM pathways_evidence.exposure_logging_policy
), annotated AS (
  SELECT fe.*,
    EXISTS (
      SELECT 1 FROM pathways_evidence.member_item_exposure x
      WHERE x.member_id=fe.member_id AND x.track=fe.track
        AND x.exposure_at < fe.answered_at
        AND (x.item_id = fe.item_id
             OR COALESCE(x.cluster_at_exposure, 'ITEM:'||x.item_id)
                = COALESCE(fe.reviewed_cluster_id, 'ITEM:'||fe.item_id))
        AND NOT (x.exposure_source='attempt_implied' AND x.exposure_at = fe.answered_at)
    ) AS has_prior_exposure,
    (SELECT e.logging_started_at FROM epoch e WHERE e.track=fe.track) AS epoch_start
  FROM fe
)
SELECT a.*,
  CASE
    WHEN a.has_prior_exposure THEN 'excluded_prior_exposure'
    WHEN a.epoch_start IS NULL OR a.answered_at < a.epoch_start THEN 'unknown_exposure_history'
    ELSE 'first_known_exposure'
  END AS exposure_class,
  -- Eligibility upgrade path: same rules as the shipped view, plus exposure.
  (a.eligible_opportunity AND NOT a.has_prior_exposure
   AND a.epoch_start IS NOT NULL AND a.answered_at >= a.epoch_start) AS eligible_opportunity_exposure_aware
FROM annotated a;

-- 4. Single-authority rule for the reassessment phase ------------------------
-- When reserve selection is built, it MUST read member_item_exposure (this
-- view) for freshness - never a separate attempts-only history. That is the
-- E1 correction: one history, two consumers.
COMMENT ON VIEW pathways_evidence.member_item_exposure IS
  'The single authoritative exposure history. first-encounter eligibility and future reserve freshness both read this view. Completeness is knowable only at/after exposure_logging_policy.logging_started_at for the track; earlier history is unknown by design.';

ROLLBACK;  -- draft validation runs this file then rolls back; apply removes this line after owner review
