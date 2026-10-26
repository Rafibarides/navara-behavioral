-- SUPERSEDED by TAXONOMY_PROVENANCE_AUDIT_V2_DRAFT.sql (source critique: baseline laundering, non-row-level replay, weak chain check, scope). Kept for history.
-- -- TAXONOMY PROVENANCE AUDIT - DRAFT (nothing applied; for review alongside EHC v2.1)
-- Builder, 2026-10-26. Bounded answer to the integrity precondition: an attestation
-- timestamp declares completeness; this audit VERIFIES it per item, from two
-- independent real sources (the review_event log vs the live item_tag_review table),
-- never by inventing history. Per-item granularity: one bad cluster cannot poison
-- unrelated items, and an unattested item can never reach first_known.
--
-- Live-state note (verified 2026-10-26): item_tag_review, option_tag_review,
-- item_quality_review and review_event are ALL EMPTY on live. There is no cluster
-- taxonomy yet; the only dependence keys are item-identity keys. The audit's B0
-- baseline is captured when SME review first assigns clusters.

-- ===== 1. Baseline (B0): the attested starting mapping, per item =====
CREATE TABLE IF NOT EXISTS pathways_evidence.taxonomy_baseline (
  track text NOT NULL,
  item_id text NOT NULL,
  keys_at_baseline text[] NOT NULL,          -- full dependence-key set at capture
  captured_at timestamptz NOT NULL DEFAULT now(),
  captured_by text NOT NULL,
  PRIMARY KEY (track, item_id)
);
ALTER TABLE pathways_evidence.taxonomy_baseline ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pathways_evidence.taxonomy_baseline FROM PUBLIC, anon, authenticated;

-- Capture B0 for one item from its CURRENT mapping (item_tag_review + source items).
-- This is a human-attested starting point, recorded; it proves nothing about the past.
CREATE OR REPLACE FUNCTION pathways_evidence.taxonomy_capture_baseline(p_track text, p_item text, p_by text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $f$
  INSERT INTO pathways_evidence.taxonomy_baseline (track, item_id, keys_at_baseline, captured_by)
  SELECT p_track, p_item, coalesce(array_agg(DISTINCT k), '{}'), p_by
  FROM (SELECT k FROM pathways_evidence.item_dependence_key WHERE track = p_track AND item_id = p_item) d
  ON CONFLICT (track, item_id) DO UPDATE SET keys_at_baseline = EXCLUDED.keys_at_baseline,
       captured_at = now(), captured_by = EXCLUDED.captured_by;
$f$;
REVOKE ALL ON FUNCTION pathways_evidence.taxonomy_capture_baseline(text,text,text) FROM PUBLIC, anon, authenticated;

-- ===== 2. Reconstruction: replay review_event for an item since its baseline =====
-- Independent source #1: the append-only event log. Reconstructs what the mapping
-- SHOULD be now if every change was logged. Compared against independent source #2:
-- the live item_tag_review rows. Any divergence is an unlogged change or a chain gap.
CREATE OR REPLACE FUNCTION pathways_evidence.taxonomy_audit(p_track text, p_item text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $f$
DECLARE
  b pathways_evidence.taxonomy_baseline%ROWTYPE;
  running text[];
  e record;
  current_keys text[];
BEGIN
  SELECT * INTO b FROM pathways_evidence.taxonomy_baseline WHERE track = p_track AND item_id = p_item;
  IF NOT FOUND THEN RETURN 'unattested'; END IF;

  running := b.keys_at_baseline;
  FOR e IN
    SELECT op, old_row, new_row, at FROM pathways_evidence.review_event
    WHERE table_name = 'item_tag_review' AND at >= b.captured_at
      AND (old_row->>'item_id' = p_item OR new_row->>'item_id' = p_item)
      AND coalesce(old_row->>'track', new_row->>'track') = p_track
    ORDER BY at, event_id
  LOOP
    -- chain continuity: an UPDATE/DELETE's old_row cluster must be consistent with
    -- the running reconstruction (the old cluster, if any, must be present or absent as recorded)
    IF e.op = 'UPDATE' OR e.op = 'DELETE' THEN
      IF (e.old_row->>'surface_cluster_id') IS DISTINCT FROM NULL
         AND NOT (e.old_row->>'surface_cluster_id' = ANY(running))
         AND e.old_row->>'surface_cluster_id' <> ALL(coalesce(running,'{}')) THEN
        RETURN 'chain_gap';
      END IF;
    END IF;
    running := array(SELECT DISTINCT k FROM unnest(running || coalesce(e.new_row->>'surface_cluster_id', e.old_row->>'surface_cluster_id')) k) ;
  END LOOP;

  SELECT coalesce(array_agg(DISTINCT k), '{}') INTO current_keys
  FROM (SELECT k FROM pathways_evidence.item_dependence_key WHERE track = p_track AND item_id = p_item) d;

  -- The live mapping's cluster keys must be reachable from the baseline + logged events.
  -- Sticky keys: running only grows; current live clusters must be a subset of running,
  -- and every running key must still be justified (either still live or recorded as moved-from).
  IF EXISTS (SELECT 1 FROM unnest(current_keys) k WHERE k LIKE 'C\_%' ESCAPE '\' AND NOT (k = ANY(running))) THEN
    RETURN 'drift';          -- a live cluster the baseline+events cannot explain: unlogged change
  END IF;
  RETURN 'verified';
END $f$;
REVOKE ALL ON FUNCTION pathways_evidence.taxonomy_audit(text,text) FROM PUBLIC, anon, authenticated;

-- ===== 3. Gate integration (executable draft): wrapper over the v2.1 consumer =====
-- Downgrades first_known -> unknown (reason taxonomy_unverified) whenever the answered
-- item's audit is not 'verified'. v2.1's own views stay untouched; this wrapper is the
-- only consumer change. Track-wide inventory_attested_at stays necessary but is no
-- longer sufficient; per-item status is the granularity. An item with NO cluster claims
-- (all of live today) audits 'verified' once its baseline captured the empty cluster
-- set - item-identity dependence is intact without clusters.
CREATE OR REPLACE VIEW pathways_evidence.member_first_encounters_taxonomy_gated
WITH (security_invoker = true) AS
SELECT c.*,
  CASE WHEN c.exposure_class = 'first_known_exposure'
            AND pathways_evidence.taxonomy_audit(c.track, c.item_id) <> 'verified'
       THEN 'unknown_exposure_history' ELSE c.exposure_class END AS exposure_class_taxonomy_gated,
  CASE WHEN c.exposure_class = 'first_known_exposure'
            AND pathways_evidence.taxonomy_audit(c.track, c.item_id) <> 'verified'
       THEN 'taxonomy_unverified' ELSE c.exposure_reason END AS exposure_reason_taxonomy_gated,
  CASE WHEN c.exposure_class = 'first_known_exposure'
            AND pathways_evidence.taxonomy_audit(c.track, c.item_id) <> 'verified'
       THEN false ELSE c.eligible_opportunity_exposure_aware END AS eligible_opportunity_taxonomy_gated
FROM pathways_evidence.member_first_encounters_exposure_aware c;
REVOKE ALL ON pathways_evidence.member_first_encounters_taxonomy_gated FROM PUBLIC, anon, authenticated;

-- ===== 4. Tests are in audit/taxonomy-provenance-tests.sql =====
