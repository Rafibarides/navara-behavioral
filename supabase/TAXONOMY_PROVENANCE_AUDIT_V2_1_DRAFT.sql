-- TAXONOMY PROVENANCE AUDIT v2.1 - DRAFT (targeted delta on the v2 draft; nothing applied)
-- Builder, 2026-10-26. Four corrections from the v2 exact-source critique (received as
-- critique, not authority). Apply ON TOP OF TAXONOMY_PROVENANCE_AUDIT_V2_DRAFT.sql.
--
--  C1 SUPERSESSION ANTI-LAUNDERING. A new baseline certifies only the FUTURE. Capture
--     evaluates the item's audit status under the baseline being superseded BEFORE the
--     new snapshot exists; drift/chain_gap (or an already failure-marked chain) records
--     superseded_failure = true on the new row, sticky down the chain. The gate then
--     disqualifies any encounter bound BEFORE a failure-marked baseline's captured_at,
--     for the answered item and every dependence partner. Supersession can restore
--     PROSPECTIVE certification; it never rewrites past evidentiary completeness.
--  C2 FULL ROW IDENTITY. Replay and snapshot keys are raw_tag || '@' || content_version,
--     so two content versions of the same raw tag never collapse into one JSON entry.
--  C3 REVIEWER BINDING + DETERMINISTIC ORDERING. When a JWT context exists
--     (auth.uid() not null), the certifier IS the caller: p_reviewer must be null or
--     equal to auth.uid(). With no JWT (service/test context only), the parameter is
--     trusted context, NOT caller authentication - real caller-to-reviewer
--     authorization under member/staff roles remains integration work and is untested.
--     Baseline selection is ORDER BY baseline_seq (identity) - deterministic even when
--     captured_at ties (same-transaction captures share one now()). Supersession must
--     name the CURRENT latest baseline: concurrent supersessions cannot fork the chain;
--     the loser fails loudly.
--  v2.1.1 (2026-10-26): two bounded fixes from the v2.1 exact-source critique
--   (received as critique): (a) NULL-supersession bypass closed - an item with any
--   existing baseline refuses a p_supersedes IS NULL capture, so sticky failure
--   cannot be sidestepped by starting a parallel chain; (b) the failure-marked
--   baseline boundary now fails CLOSED on a timestamp tie (captured_at >=
--   encounter): an encounter concurrent with a failure-marked recertification is
--   ambiguous and never qualifies as post-certification.
--  C4 PROSPECTIVE A3 PROOF is on the test side (taxonomy-provenance-v2_1-tests.sql T12):
--     certified relationship -> bound encounter -> unlogged split -> first_known fails
--     closed -> failure-marked supersession -> the OLD encounter STILL fails closed,
--     a NEW post-supersession encounter certifies again.
--
-- DOCUMENTED SEMANTICS (carried + tightened from v2):
--  - reviewed_at is excluded from row comparison (volatile field; an unlogged change to
--    it alone is not drift). This is a deliberate certification-semantics exclusion.
--  - event_id is IDENTITY ALLOCATION order, not commit order. Capture locks
--    (SHARE ROW EXCLUSIVE on item_tag_review, SHARE on review_event) establish the
--    boundary; replay verifies old_row against the expected prior state of the exact
--    row, so a mis-ordered or fabricated event surfaces as chain_gap (fail-closed)
--    rather than silent acceptance.
--  - Baselines certify mappings AS OF capture only; relationships never recorded
--    anywhere remain undiscoverable; no retroactive concept-independence claims.
--  - option_tag_review / misconception attribution remains OUT OF SCOPE.

-- ===== C3: deterministic identity + C1 marker =====
ALTER TABLE pathways_evidence.taxonomy_baseline
  ADD COLUMN IF NOT EXISTS baseline_seq bigint GENERATED ALWAYS AS IDENTITY,
  ADD COLUMN IF NOT EXISTS superseded_failure boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS taxonomy_baseline_seq_uq
  ON pathways_evidence.taxonomy_baseline (baseline_seq);

-- ===== C1 + C3: capture with caller binding, chain-locked supersession, failure marking =====
CREATE OR REPLACE FUNCTION pathways_evidence.taxonomy_capture_baseline(
    p_track text, p_item text, p_reviewer uuid, p_supersedes uuid DEFAULT NULL, p_note text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $f$
DECLARE
  v_horizon bigint; v_mapping jsonb; v_keys text[]; v_id uuid;
  v_caller uuid; v_reviewer uuid; v_prior record; v_prior_status text; v_failed boolean := false;
BEGIN
  -- C3: certifier identity from the trusted execution context when one exists.
  -- Locks BEFORE every chain/audit/snapshot read: a competing capture blocks here until any
  -- in-flight supersession commits, then re-reads the tip (READ COMMITTED) and fails
  -- loudly instead of forking the chain. The same locks bound the snapshot below.
  LOCK TABLE pathways_evidence.item_tag_review IN SHARE ROW EXCLUSIVE MODE;
  LOCK TABLE pathways_evidence.review_event IN SHARE MODE;
  v_caller := auth.uid();
  IF v_caller IS NOT NULL THEN
    IF p_reviewer IS NOT NULL AND p_reviewer <> v_caller THEN
      RAISE EXCEPTION 'taxonomy_capture_baseline: caller % may not certify as reviewer %', v_caller, p_reviewer
        USING ERRCODE = '42501';
    END IF;
    v_reviewer := v_caller;
  ELSE
    v_reviewer := p_reviewer;  -- service/test context only; NOT caller authentication (see header C3)
  END IF;
  IF v_reviewer IS NULL OR NOT EXISTS (SELECT 1 FROM pathways_evidence.sme_reviewer
      WHERE reviewer_id = v_reviewer AND active AND p_track = ANY(tracks)) THEN
    RAISE EXCEPTION 'taxonomy_capture_baseline: % is not an active reviewer for track %', v_reviewer, p_track
      USING ERRCODE = '42501';
  END IF;
  -- Locks BEFORE the chain/audit reads: a competing capture blocks here until any
  -- in-flight supersession commits, then re-reads the tip (READ COMMITTED) and fails
  -- loudly instead of forking the chain. The same locks bound the snapshot below.
  -- C1/C3: supersession must extend the CURRENT chain tip, and launders nothing.
  -- v2.1.1: initial capture is allowed ONLY when no baseline exists for the item;
  -- a NULL supersedes can never start a parallel chain (would bypass sticky failure).
  IF p_supersedes IS NULL AND EXISTS (SELECT 1 FROM pathways_evidence.taxonomy_baseline
      WHERE track = p_track AND item_id = p_item) THEN
    RAISE EXCEPTION 'taxonomy_capture_baseline: item % already has a baseline; recapture must name the CURRENT chain tip', p_item
      USING ERRCODE = '42501';
  END IF;
  IF p_supersedes IS NOT NULL THEN
    SELECT * INTO v_prior FROM pathways_evidence.taxonomy_baseline
      WHERE track = p_track AND item_id = p_item ORDER BY baseline_seq DESC LIMIT 1;
    IF NOT FOUND OR v_prior.baseline_id <> p_supersedes THEN
      RAISE EXCEPTION 'taxonomy_capture_baseline: supersedes must name the CURRENT latest baseline of this item'
        USING ERRCODE = '42501';
    END IF;
    v_prior_status := pathways_evidence.taxonomy_audit(p_track, p_item);   -- evaluated BEFORE the new row exists
    IF v_prior_status IN ('drift','chain_gap') OR v_prior.superseded_failure THEN
      v_failed := true;   -- unresolved integrity failure stays consequential, sticky down the chain
    END IF;
  END IF;
  SELECT coalesce(max(event_id),0) INTO v_horizon FROM pathways_evidence.review_event WHERE table_name='item_tag_review';
  SELECT coalesce(jsonb_object_agg(t.raw_tag || '@' || t.content_version, to_jsonb(t)), '{}'::jsonb) INTO v_mapping
  FROM pathways_evidence.item_tag_review t WHERE t.track = p_track AND t.item_id = p_item;
  SELECT coalesce(array_agg(DISTINCT k), '{}') INTO v_keys
  FROM (SELECT k FROM pathways_evidence.item_dependence_key WHERE track = p_track AND item_id = p_item) d;
  INSERT INTO pathways_evidence.taxonomy_baseline
    (track, item_id, row_mapping, keys_at_baseline, event_horizon, captured_by, supersedes, note, superseded_failure)
  VALUES (p_track, p_item, v_mapping, v_keys, v_horizon, v_reviewer, p_supersedes, p_note, v_failed)
  RETURNING baseline_id INTO v_id;
  RETURN v_id;
END $f$;
REVOKE ALL ON FUNCTION pathways_evidence.taxonomy_capture_baseline(text,text,uuid,uuid,text) FROM PUBLIC, anon, authenticated;

-- ===== C2 + C3: audit with full row identity and deterministic baseline selection =====
CREATE OR REPLACE FUNCTION pathways_evidence.taxonomy_audit(p_track text, p_item text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $f$
DECLARE
  b record; e record; expected jsonb; live jsonb; k text;
BEGIN
  SELECT * INTO b FROM pathways_evidence.taxonomy_baseline
  WHERE track = p_track AND item_id = p_item ORDER BY baseline_seq DESC LIMIT 1;   -- C3: deterministic
  IF NOT FOUND THEN RETURN 'unattested'; END IF;
  expected := b.row_mapping;
  FOR e IN SELECT op, old_row, new_row FROM pathways_evidence.review_event
           WHERE table_name='item_tag_review' AND event_id > b.event_horizon
             AND coalesce(old_row->>'track', new_row->>'track') = p_track
             AND coalesce(old_row->>'item_id', new_row->>'item_id') = p_item
           ORDER BY event_id
  LOOP
    k := coalesce(e.new_row->>'raw_tag', e.old_row->>'raw_tag') || '@' ||
         coalesce(e.new_row->>'content_version', e.old_row->>'content_version');   -- C2: full row identity
    IF e.op = 'INSERT' THEN
      IF expected ? k THEN RETURN 'chain_gap'; END IF;
      expected := jsonb_set(expected, ARRAY[k], e.new_row);
    ELSIF e.op = 'UPDATE' THEN
      IF NOT (expected ? k) OR ((expected->k) - 'reviewed_at') IS DISTINCT FROM (e.old_row - 'reviewed_at') THEN
        RETURN 'chain_gap';
      END IF;
      expected := jsonb_set(expected, ARRAY[k], e.new_row);
    ELSIF e.op = 'DELETE' THEN
      IF NOT (expected ? k) OR ((expected->k) - 'reviewed_at') IS DISTINCT FROM (e.old_row - 'reviewed_at') THEN
        RETURN 'chain_gap';
      END IF;
      expected := expected - k;
    END IF;
  END LOOP;
  SELECT coalesce(jsonb_object_agg(t.raw_tag || '@' || t.content_version, to_jsonb(t)), '{}'::jsonb) INTO live
  FROM pathways_evidence.item_tag_review t WHERE t.track = p_track AND t.item_id = p_item;
  IF (SELECT coalesce(jsonb_object_agg(key, value - 'reviewed_at'), '{}'::jsonb) FROM jsonb_each(expected))
     IS DISTINCT FROM
     (SELECT coalesce(jsonb_object_agg(key, value - 'reviewed_at'), '{}'::jsonb) FROM jsonb_each(live)) THEN
    RETURN 'drift';      -- covers unlogged UPDATE, unlogged DELETE (missing row), unlogged INSERT (extra row)
  END IF;
  RETURN 'verified';
END $f$;
REVOKE ALL ON FUNCTION pathways_evidence.taxonomy_audit(text,text) FROM PUBLIC, anon, authenticated;

-- ===== C1: gate predicate factored + failure-marked-supersession disqualification =====
CREATE OR REPLACE FUNCTION pathways_evidence.taxonomy_gate_ok(p_track text, p_item text, p_encounter_at timestamptz)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $f$
  SELECT pathways_evidence.taxonomy_audit(p_track, p_item) = 'verified'
     AND NOT EXISTS (SELECT 1 FROM pathways_evidence.item_dependence_key a
                     JOIN pathways_evidence.item_dependence_key p ON p.track = a.track AND p.k = a.k
                     WHERE a.track = p_track AND a.item_id = p_item
                       AND pathways_evidence.taxonomy_audit(p.track, p.item_id) <> 'verified')
     AND NOT EXISTS (SELECT 1 FROM pathways_evidence.taxonomy_baseline f
                     WHERE f.track = p_track AND f.superseded_failure
                       AND f.captured_at >= p_encounter_at         -- certifies only the future; a tie is ambiguous -> fails closed (v2.1.1)
                       AND (f.item_id = p_item
                            OR EXISTS (SELECT 1 FROM pathways_evidence.item_dependence_key a
                                       JOIN pathways_evidence.item_dependence_key p ON p.track = a.track AND p.k = a.k
                                       WHERE a.track = p_track AND a.item_id = p_item AND p.item_id = f.item_id)))
$f$;
REVOKE ALL ON FUNCTION pathways_evidence.taxonomy_gate_ok(text,text,timestamptz) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE VIEW pathways_evidence.member_first_encounters_taxonomy_gated
WITH (security_invoker = true) AS
SELECT c.*,
  CASE WHEN c.exposure_class = 'first_known_exposure'
            AND NOT pathways_evidence.taxonomy_gate_ok(c.track, c.item_id, c.server_answered_at)
       THEN 'unknown_exposure_history' ELSE c.exposure_class END AS exposure_class_taxonomy_gated,
  CASE WHEN c.exposure_class = 'first_known_exposure'
            AND NOT pathways_evidence.taxonomy_gate_ok(c.track, c.item_id, c.server_answered_at)
       THEN 'taxonomy_unverified' ELSE c.exposure_reason END AS exposure_reason_taxonomy_gated,
  CASE WHEN c.exposure_class = 'first_known_exposure'
            AND NOT pathways_evidence.taxonomy_gate_ok(c.track, c.item_id, c.server_answered_at)
       THEN false ELSE c.eligible_opportunity_exposure_aware END AS eligible_opportunity_taxonomy_gated
FROM pathways_evidence.member_first_encounters_exposure_aware c;
REVOKE ALL ON pathways_evidence.member_first_encounters_taxonomy_gated FROM PUBLIC, anon, authenticated;
