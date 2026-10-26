-- TAXONOMY PROVENANCE AUDIT v2 - DRAFT (supersedes v1 draft; nothing applied)
-- Builder, 2026-10-26. Targeted fixes for the source critique's demonstrated holes:
--  (1) baselines are append-only certification rows; recapture = explicit supersession,
--      old rows preserved; captured_by must be an active sme_reviewer, never free text.
--      BOUNDARY (explicit): the reviewer-registry lookup proves p_reviewer NAMES an
--      active reviewer; it does NOT prove the CALLER is that reviewer. Real caller
--      authorization (role-to-reviewer binding, tested under real roles) is
--      integration work and remains untested - do not treat this check as auth.
--  (2) current-state reconciliation is ROW-LEVEL replay (per track/item/version/tag
--      row identity), SEPARATE from the sticky historical dependence union.
--  (3) chain continuity compares an UPDATE/DELETE old_row against the EXPECTED prior
--      state of that exact row, not "cluster present somewhere".
--  (4) ordering and horizon by event_id (identity), not timestamps; the baseline
--      records the event horizon it captured under a table lock.
--  (5) option_tag_review / misconception attribution is OUT OF SCOPE (documented
--      boundary): this audit certifies cluster-dependence integrity only.
--  (6) the gate audits the answered item AND every dependence-key partner.
-- Scope/honesty: a baseline certifies mappings AS OF its capture instant, never
-- retroactively; relationships never recorded anywhere remain undiscoverable - the
-- prospective first-SME baseline is the remedy, and it supports no retroactive
-- concept-independence claims.

CREATE TABLE IF NOT EXISTS pathways_evidence.taxonomy_baseline (
  baseline_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track text NOT NULL,
  item_id text NOT NULL,
  row_mapping jsonb NOT NULL,            -- {row_key: full row} at capture
  keys_at_baseline text[] NOT NULL,      -- sticky dependence-key set at capture
  event_horizon bigint NOT NULL,         -- max review_event.event_id visible at capture
  captured_at timestamptz NOT NULL DEFAULT now(),
  captured_by uuid NOT NULL,             -- must reference an active sme_reviewer
  supersedes uuid REFERENCES pathways_evidence.taxonomy_baseline (baseline_id),
  note text
);
ALTER TABLE pathways_evidence.taxonomy_baseline ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pathways_evidence.taxonomy_baseline FROM PUBLIC, anon, authenticated;
-- append-only: no update, no delete (supersession is a new row)
CREATE OR REPLACE FUNCTION pathways_evidence.taxonomy_baseline_append_only() RETURNS trigger
LANGUAGE plpgsql AS $f$ BEGIN RAISE EXCEPTION 'taxonomy_baseline is append-only (% refused)', TG_OP USING ERRCODE='42501'; END $f$;
DROP TRIGGER IF EXISTS taxonomy_baseline_append_only ON pathways_evidence.taxonomy_baseline;
CREATE TRIGGER taxonomy_baseline_append_only BEFORE UPDATE OR DELETE ON pathways_evidence.taxonomy_baseline
  FOR EACH ROW EXECUTE FUNCTION pathways_evidence.taxonomy_baseline_append_only();
CREATE OR REPLACE FUNCTION pathways_evidence.taxonomy_baseline_no_truncate() RETURNS trigger
LANGUAGE plpgsql AS $f$ BEGIN RAISE EXCEPTION 'taxonomy_baseline may not be truncated' USING ERRCODE='42501'; END $f$;
DROP TRIGGER IF EXISTS taxonomy_baseline_no_truncate ON pathways_evidence.taxonomy_baseline;
CREATE TRIGGER taxonomy_baseline_no_truncate BEFORE TRUNCATE ON pathways_evidence.taxonomy_baseline
  FOR EACH STATEMENT EXECUTE FUNCTION pathways_evidence.taxonomy_baseline_no_truncate();

-- Capture: consistent boundary via SHARE ROW EXCLUSIVE lock on the review table
-- (blocks concurrent mapping writes during capture), horizon = max event_id seen.
CREATE OR REPLACE FUNCTION pathways_evidence.taxonomy_capture_baseline(
    p_track text, p_item text, p_reviewer uuid, p_supersedes uuid DEFAULT NULL, p_note text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $f$
DECLARE
  v_horizon bigint; v_mapping jsonb; v_keys text[]; v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pathways_evidence.sme_reviewer WHERE reviewer_id = p_reviewer AND active AND p_track = ANY(tracks)) THEN
    RAISE EXCEPTION 'taxonomy_capture_baseline: % is not an active reviewer for track %', p_reviewer, p_track USING ERRCODE='42501';
  END IF;
  IF p_supersedes IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pathways_evidence.taxonomy_baseline
      WHERE baseline_id = p_supersedes AND track = p_track AND item_id = p_item) THEN
    RAISE EXCEPTION 'taxonomy_capture_baseline: supersedes must name a prior baseline of this item' USING ERRCODE='42501';
  END IF;
  LOCK TABLE pathways_evidence.item_tag_review IN SHARE ROW EXCLUSIVE MODE;
  LOCK TABLE pathways_evidence.review_event IN SHARE MODE;
  SELECT coalesce(max(event_id),0) INTO v_horizon FROM pathways_evidence.review_event WHERE table_name='item_tag_review';
  SELECT coalesce(jsonb_object_agg(raw_tag, to_jsonb(t)), '{}'::jsonb) INTO v_mapping
  FROM pathways_evidence.item_tag_review t WHERE t.track = p_track AND t.item_id = p_item;
  SELECT coalesce(array_agg(DISTINCT k), '{}') INTO v_keys
  FROM (SELECT k FROM pathways_evidence.item_dependence_key WHERE track = p_track AND item_id = p_item) d;
  INSERT INTO pathways_evidence.taxonomy_baseline
    (track, item_id, row_mapping, keys_at_baseline, event_horizon, captured_by, supersedes, note)
  VALUES (p_track, p_item, v_mapping, v_keys, v_horizon, p_reviewer, p_supersedes, p_note)
  RETURNING baseline_id INTO v_id;
  RETURN v_id;
END $f$;
REVOKE ALL ON FUNCTION pathways_evidence.taxonomy_capture_baseline(text,text,uuid,uuid,text) FROM PUBLIC, anon, authenticated;

-- Audit: row-level current-state replay from the LATEST baseline, then exact compare
-- against live rows. Statuses: verified | drift | chain_gap | unattested.
CREATE OR REPLACE FUNCTION pathways_evidence.taxonomy_audit(p_track text, p_item text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $f$
DECLARE
  b record; e record; expected jsonb; live jsonb; k text;
BEGIN
  SELECT * INTO b FROM pathways_evidence.taxonomy_baseline
  WHERE track = p_track AND item_id = p_item ORDER BY captured_at DESC, event_horizon DESC LIMIT 1;
  IF NOT FOUND THEN RETURN 'unattested'; END IF;
  expected := b.row_mapping;
  FOR e IN SELECT op, old_row, new_row FROM pathways_evidence.review_event
           WHERE table_name='item_tag_review' AND event_id > b.event_horizon
             AND coalesce(old_row->>'track', new_row->>'track') = p_track
             AND coalesce(old_row->>'item_id', new_row->>'item_id') = p_item
           ORDER BY event_id
  LOOP
    k := coalesce(e.new_row->>'raw_tag', e.old_row->>'raw_tag');
    IF e.op = 'INSERT' THEN
      IF expected ? k THEN RETURN 'chain_gap'; END IF;               -- re-insert of an existing row key
      expected := jsonb_set(expected, ARRAY[k], e.new_row);
    ELSIF e.op = 'UPDATE' THEN
      IF NOT (expected ? k) OR ((expected->k) - 'reviewed_at') IS DISTINCT FROM (e.old_row - 'reviewed_at') THEN
        RETURN 'chain_gap';                                          -- old_row must equal expected prior row state
      END IF;
      expected := jsonb_set(expected, ARRAY[k], e.new_row);
    ELSIF e.op = 'DELETE' THEN
      IF NOT (expected ? k) OR ((expected->k) - 'reviewed_at') IS DISTINCT FROM (e.old_row - 'reviewed_at') THEN
        RETURN 'chain_gap';
      END IF;
      expected := expected - k;
    END IF;
  END LOOP;
  SELECT coalesce(jsonb_object_agg(raw_tag, to_jsonb(t)), '{}'::jsonb) INTO live
  FROM pathways_evidence.item_tag_review t WHERE t.track = p_track AND t.item_id = p_item;
  -- row-level equality modulo reviewed_at (volatile field)
  IF (SELECT coalesce(jsonb_object_agg(key, value - 'reviewed_at'), '{}'::jsonb) FROM jsonb_each(expected))
     IS DISTINCT FROM
     (SELECT coalesce(jsonb_object_agg(key, value - 'reviewed_at'), '{}'::jsonb) FROM jsonb_each(live)) THEN
    RETURN 'drift';      -- covers unlogged UPDATE, unlogged DELETE (missing row), unlogged INSERT (extra row)
  END IF;
  RETURN 'verified';
END $f$;
REVOKE ALL ON FUNCTION pathways_evidence.taxonomy_audit(text,text) FROM PUBLIC, anon, authenticated;

-- Gate v2: answered item AND every dependence-key partner must be verified.
CREATE OR REPLACE VIEW pathways_evidence.member_first_encounters_taxonomy_gated
WITH (security_invoker = true) AS
SELECT c.*,
  CASE WHEN c.exposure_class = 'first_known_exposure' AND NOT (
         pathways_evidence.taxonomy_audit(c.track, c.item_id) = 'verified'
         AND NOT EXISTS (SELECT 1 FROM pathways_evidence.item_dependence_key a
                         JOIN pathways_evidence.item_dependence_key p ON p.track = a.track AND p.k = a.k
                         WHERE a.track = c.track AND a.item_id = c.item_id
                           AND pathways_evidence.taxonomy_audit(p.track, p.item_id) <> 'verified'))
       THEN 'unknown_exposure_history' ELSE c.exposure_class END AS exposure_class_taxonomy_gated,
  CASE WHEN c.exposure_class = 'first_known_exposure' AND NOT (
         pathways_evidence.taxonomy_audit(c.track, c.item_id) = 'verified'
         AND NOT EXISTS (SELECT 1 FROM pathways_evidence.item_dependence_key a
                         JOIN pathways_evidence.item_dependence_key p ON p.track = a.track AND p.k = a.k
                         WHERE a.track = c.track AND a.item_id = c.item_id
                           AND pathways_evidence.taxonomy_audit(p.track, p.item_id) <> 'verified'))
       THEN 'taxonomy_unverified' ELSE c.exposure_reason END AS exposure_reason_taxonomy_gated,
  CASE WHEN c.exposure_class = 'first_known_exposure' AND NOT (
         pathways_evidence.taxonomy_audit(c.track, c.item_id) = 'verified'
         AND NOT EXISTS (SELECT 1 FROM pathways_evidence.item_dependence_key a
                         JOIN pathways_evidence.item_dependence_key p ON p.track = a.track AND p.k = a.k
                         WHERE a.track = c.track AND a.item_id = c.item_id
                           AND pathways_evidence.taxonomy_audit(p.track, p.item_id) <> 'verified'))
       THEN false ELSE c.eligible_opportunity_exposure_aware END AS eligible_opportunity_taxonomy_gated
FROM pathways_evidence.member_first_encounters_exposure_aware c;
REVOKE ALL ON pathways_evidence.member_first_encounters_taxonomy_gated FROM PUBLIC, anon, authenticated;
