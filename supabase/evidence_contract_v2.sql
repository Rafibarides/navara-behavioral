-- NAVARA PATHWAYS - Evidence contract v2 (staging merge)
-- Builder merge of: ChatGPT v1 contract + Tab v1.1 review + ChatGPT cross-audit,
-- reconciled against the REAL production schema. All review content remains
-- human-gated and fail-closed; nothing here seeds approvals, exposes member
-- data, or changes shipped behavior. item_audit_flag (v1 queue) is preserved.
-- Merge decisions and open policy holds are documented per section.
-- Open policy holds (NOT decided here): member-local-day fallback timezone;
-- sessions-vs-days rule change (shipped distinct-days rule preserved).
BEGIN;
SET search_path = pathways_evidence, public;

-- Recreate review tables with production (lowercase) track casing. v1 tables
-- are empty by construction, so drop-and-recreate loses nothing.
DROP VIEW IF EXISTS pathways_evidence.member_pattern_candidates CASCADE;
DROP VIEW IF EXISTS pathways_evidence.member_first_encounters CASCADE;
DROP VIEW IF EXISTS pathways_evidence.label_variant_audit CASCADE;
DROP VIEW IF EXISTS pathways_evidence.misconception_coverage_manifest CASCADE;
DROP VIEW IF EXISTS pathways_evidence.current_item_tag CASCADE;
DROP VIEW IF EXISTS pathways_evidence.tag_inventory CASCADE;
DROP VIEW IF EXISTS pathways_evidence.pathways_source_attempts CASCADE;
DROP VIEW IF EXISTS pathways_evidence.pathways_source_items CASCADE;
DROP VIEW IF EXISTS pathways_evidence.pathways_source_options CASCADE;
DROP TABLE IF EXISTS pathways_evidence.tag_merge_proposal;
DROP TABLE IF EXISTS pathways_evidence.label_variant_proposal;
DROP TABLE IF EXISTS pathways_evidence.tag_display_proposal;
DROP TABLE IF EXISTS pathways_evidence.option_tag_review;
DROP TABLE IF EXISTS pathways_evidence.item_tag_review;
DROP TABLE IF EXISTS pathways_evidence.item_quality_review;

CREATE TABLE pathways_evidence.item_quality_review (
  track text NOT NULL CHECK (track IN ('rbt','bcba')),
  item_id text NOT NULL,
  content_version text NOT NULL,
  quality_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (quality_status IN ('unreviewed','in_review','approved','held','rejected')),
  citation_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (citation_status IN ('unreviewed','approved','held','rejected')),
  key_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (key_status IN ('unreviewed','approved','held','rejected')),
  -- F4: disjoint pools. NULL until the SME certifies one. Item-level scheduling
  -- constraint only; NOT construct-level certification per tag (cross-audit D5).
  certified_pool text CHECK (certified_pool IN ('practice','reassessment_reserve')),
  reviewer_id uuid,
  reviewed_at timestamptz,
  reason text,
  PRIMARY KEY (track,item_id,content_version),
  CHECK (quality_status <> 'approved' OR (key_status='approved' AND citation_status='approved' AND certified_pool IS NOT NULL AND reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL))
);

CREATE TABLE pathways_evidence.item_tag_review (
  track text NOT NULL CHECK (track IN ('rbt','bcba')),
  item_id text NOT NULL,
  content_version text NOT NULL,
  raw_tag text NOT NULL,
  alignment_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (alignment_status IN ('unreviewed','in_review','approved','ambiguous','held','rejected')),
  assessable boolean NOT NULL DEFAULT false,
  -- F1: TWO keys. variant_family_id = generation lineage (reporting/retire
  -- cascade only). surface_cluster_id = SME-approved exposure-independence
  -- grouping; near-duplicates (real example: items 35/1439) share one.
  -- Cross-audit D4: transfer suitability is a SEPARATE human approval.
  variant_family_id text,
  surface_cluster_id text,
  transfer_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (transfer_status IN ('unreviewed','approved','held','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  PRIMARY KEY (track,item_id,content_version,raw_tag),
  CHECK (alignment_status <> 'approved' OR (assessable AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
  CHECK (transfer_status <> 'approved' OR (surface_cluster_id IS NOT NULL AND reviewed_by IS NOT NULL))
);

CREATE TABLE pathways_evidence.option_tag_review (
  track text NOT NULL CHECK (track IN ('rbt','bcba')),
  item_id text NOT NULL,
  content_version text NOT NULL,
  option_id text NOT NULL,
  raw_tag text NOT NULL,
  attribution_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (attribution_status IN ('unreviewed','approved','ambiguous','held','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  PRIMARY KEY(track,item_id,content_version,option_id,raw_tag),
  CHECK (attribution_status <> 'approved' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);

CREATE TABLE pathways_evidence.tag_display_proposal (
  track text NOT NULL CHECK (track IN ('rbt','bcba')),
  raw_tag text NOT NULL,
  canonical_label_candidate text NOT NULL,
  -- F5: explicit verdict required for dashboard readiness.
  verdict text CHECK (verdict IN ('specific','duplicate','split','unresolved')),
  proposal_status text NOT NULL DEFAULT 'pending'
    CHECK (proposal_status IN ('pending','approved','rejected','superseded')),
  decision_reason text,  -- mandatory on approval (cross-audit F5 addition)
  proposed_by text,
  proposed_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid,
  approved_at timestamptz,
  PRIMARY KEY (track,raw_tag),
  CHECK (proposal_status <> 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL AND verdict IS NOT NULL AND decision_reason IS NOT NULL))
);

CREATE TABLE pathways_evidence.label_variant_proposal (
  track text NOT NULL CHECK (track IN ('rbt','bcba')),
  raw_tag text NOT NULL,
  confuses_with_raw text NOT NULL,
  proposed_relation text NOT NULL DEFAULT 'unclassified'
    CHECK (proposed_relation IN ('unclassified','duplicate_alias','specific_subtype','distinct_concept','invalid_label')),
  proposed_normalized_label text,
  evidence_item_ids text[] NOT NULL DEFAULT '{}',
  decision_basis text,
  decision_status text NOT NULL DEFAULT 'pending'
    CHECK (decision_status IN ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  PRIMARY KEY (track,raw_tag,confuses_with_raw),
  CHECK (decision_status <> 'approved' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);

CREATE TABLE pathways_evidence.tag_merge_proposal (
  proposal_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track text NOT NULL CHECK (track IN ('rbt','bcba')),
  source_raw_tag text NOT NULL,
  target_raw_tag text NOT NULL,
  relation text NOT NULL CHECK (relation IN ('duplicate_alias','specific_subtype','related_not_merge')),
  rationale text NOT NULL,
  proposal_status text NOT NULL DEFAULT 'pending'
    CHECK (proposal_status IN ('pending','approved_for_display','rejected')),
  proposer text,
  reviewer_id uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(source_raw_tag <> target_raw_tag),
  CHECK(proposal_status <> 'approved_for_display' OR (reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL))
);

-- Cross-audit D1: append-only presentation events. Answers alone cannot
-- support "unseen" claims; an opened-but-unanswered item leaves no attempt.
-- Empty today: exposure history is collected prospectively from app
-- instrumentation, and unknown past exposure stays unknown (no claims).
CREATE TABLE pathways_evidence.item_presentation_event (
  event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id uuid NOT NULL,
  track text NOT NULL,
  item_id text NOT NULL,
  content_version text NOT NULL,
  presented_at timestamptz NOT NULL DEFAULT now()
);

-- ADAPTERS (builder mapping onto real tables; production is lowercase) --------
CREATE VIEW pathways_evidence.pathways_source_options AS
SELECT q.track,
       q.id::text AS item_id,
       (o.idx - 1)::text AS option_id,
       o.opt->>'misconception_tag' AS raw_tag,
       o.opt->>'confuses_with' AS confuses_with_raw,
       true AS is_wrong_option
FROM public.questions q
CROSS JOIN LATERAL jsonb_array_elements(q.options) WITH ORDINALITY AS o(opt, idx)
WHERE (o.idx - 1) <> q.answer
  AND NULLIF(btrim(o.opt->>'misconception_tag'), '') IS NOT NULL;

CREATE VIEW pathways_evidence.pathways_source_items AS
SELECT q.track,
       q.id::text AS item_id,
       q.published AS is_published,
       'current'::text AS content_version,  -- synthetic; no versioning exists
       NULL::text AS variant_family_id,
       NULL::text AS surface_cluster_id,
       NULL::timestamptz AS item_approved_at
FROM public.questions q;

CREATE VIEW pathways_evidence.pathways_source_attempts AS
SELECT a.id::text AS attempt_id,
       a.user_id AS member_id,
       a.question_id::text AS item_id,
       q.track,
       a.chosen_option::text AS chosen_option_id,
       a.created_at AS answered_at,
       a.correct AS is_correct,
       CASE WHEN a.kind IN ('practice','mock') THEN 'unaided' ELSE 'unknown' END AS answer_context,
       a.ms AS response_time_ms,
       NULL::text AS item_content_version_at_answer  -- never recorded -> fail closed
FROM public.attempts a
JOIN public.questions q ON q.id = a.question_id
WHERE a.question_id IS NOT NULL;

-- DOWNSTREAM VIEWS -------------------------------------------------------------
CREATE VIEW pathways_evidence.tag_inventory AS
SELECT DISTINCT track, raw_tag FROM pathways_evidence.pathways_source_options WHERE is_wrong_option = true
UNION
SELECT DISTINCT track, raw_tag FROM pathways_evidence.item_tag_review;

CREATE VIEW pathways_evidence.current_item_tag AS
SELECT t.track, t.raw_tag, i.item_id, i.content_version, i.is_published,
       t.alignment_status, t.assessable, t.transfer_status,
       COALESCE(t.surface_cluster_id, i.surface_cluster_id, 'ITEM:'||i.item_id) AS surface_cluster_id,
       COALESCE(t.variant_family_id, i.variant_family_id) AS variant_family_id,
       q.quality_status, q.key_status, q.citation_status, q.certified_pool,
       -- F3: opportunity ALSO requires at least one approved option attribution
       -- for the tag at this version (conservative current-model rule).
       COALESCE(i.is_published AND q.quality_status='approved' AND q.key_status='approved'
         AND q.citation_status='approved' AND t.alignment_status='approved'
         AND t.assessable
         AND EXISTS (SELECT 1 FROM pathways_evidence.option_tag_review ot
             WHERE ot.track=t.track AND ot.item_id=t.item_id
               AND ot.content_version=t.content_version AND ot.raw_tag=t.raw_tag
               AND ot.attribution_status='approved')
         -- unverified flags never hold; only human-CONFIRMED holds do
         AND NOT EXISTS (SELECT 1 FROM pathways_evidence.item_audit_flag f
             WHERE f.track=t.track AND f.item_id=t.item_id AND f.status='open'
               AND f.adjudication_status='confirmed' AND f.hold_inference
               AND f.scope='item'),
         false) AS eligible_practice,
       COALESCE(i.is_published AND q.quality_status='approved' AND q.key_status='approved'
         AND q.citation_status='approved' AND t.alignment_status='approved'
         AND t.assessable AND q.certified_pool='reassessment_reserve'
         AND COALESCE(t.surface_cluster_id, i.surface_cluster_id) IS NOT NULL,
         false) AS eligible_assessment,
       COALESCE(i.is_published AND q.quality_status='approved' AND q.key_status='approved'
         AND q.citation_status='approved' AND t.alignment_status='approved'
         AND t.assessable AND q.certified_pool='reassessment_reserve'
         AND t.transfer_status='approved'
         AND COALESCE(t.surface_cluster_id, i.surface_cluster_id) IS NOT NULL,
         false) AS eligible_transfer
FROM pathways_evidence.item_tag_review t
JOIN pathways_evidence.pathways_source_items i ON i.track=t.track AND i.item_id=t.item_id AND i.content_version=t.content_version
LEFT JOIN pathways_evidence.item_quality_review q
  ON q.track=i.track AND q.item_id=i.item_id AND q.content_version=i.content_version;

CREATE VIEW pathways_evidence.misconception_coverage_manifest AS
WITH base AS (
 SELECT inv.track,inv.raw_tag,
  (SELECT COUNT(DISTINCT so.item_id) FROM pathways_evidence.pathways_source_options so
   JOIN pathways_evidence.pathways_source_items si ON si.track=so.track AND si.item_id=so.item_id
   WHERE so.track=inv.track AND so.raw_tag=inv.raw_tag AND so.is_wrong_option=true
     AND si.is_published=true) AS distinct_published_items,
  COUNT(DISTINCT ci.item_id) AS distinct_reviewed_items,
  COUNT(DISTINCT ci.item_id) FILTER (WHERE ci.eligible_practice) AS eligible_practice_items,
  COUNT(DISTINCT ci.item_id) FILTER (WHERE ci.eligible_assessment) AS eligible_assessment_items,
  COUNT(DISTINCT ci.item_id) FILTER (WHERE ci.eligible_transfer) AS eligible_transfer_items,
  COUNT(DISTINCT ci.surface_cluster_id) FILTER (WHERE ci.eligible_assessment) AS fresh_assessment_clusters,
  COUNT(DISTINCT ci.surface_cluster_id) FILTER (WHERE ci.eligible_transfer) AS fresh_transfer_clusters,
  COUNT(DISTINCT ci.surface_cluster_id) FILTER (WHERE ci.eligible_practice AND ci.certified_pool='practice') AS practice_clusters,
  COUNT(DISTINCT ci.surface_cluster_id) FILTER (WHERE ci.eligible_assessment AND ci.certified_pool='reassessment_reserve') AS reserve_clusters,
  COUNT(*) FILTER (WHERE ci.alignment_status = 'approved') AS approved_associations,
  -- F6: blocked/unreviewed gating counts PUBLISHED items only, so an
  -- unpublished draft in review never flips a live tag offline.
  COUNT(*) FILTER (WHERE ci.is_published AND ci.alignment_status IN ('held','rejected','ambiguous')) AS blocked_associations,
  COUNT(*) FILTER (WHERE ci.is_published AND ci.alignment_status IN ('unreviewed','in_review')) AS unreviewed_associations
 FROM pathways_evidence.tag_inventory inv
 LEFT JOIN pathways_evidence.current_item_tag ci ON ci.track=inv.track AND ci.raw_tag=inv.raw_tag
 GROUP BY inv.track,inv.raw_tag
), labels AS (
 SELECT o.track,o.raw_tag,
 COUNT(DISTINCT NULLIF(BTRIM(o.confuses_with_raw),'')) AS raw_label_variants
 FROM pathways_evidence.pathways_source_options o WHERE o.is_wrong_option = true
 GROUP BY o.track,o.raw_tag
)
SELECT b.*, COALESCE(l.raw_label_variants,0) AS raw_label_variants,
 CASE WHEN b.approved_associations=0 AND b.blocked_associations>0 THEN 'held'
      WHEN b.approved_associations=0 THEN 'unreviewed'
      WHEN b.unreviewed_associations=0 AND b.blocked_associations=0 THEN 'approved'
      ELSE 'partially_approved' END AS review_status,
 dp.canonical_label_candidate,dp.proposal_status AS label_review_status, dp.verdict AS label_verdict,
 CASE WHEN dp.proposal_status='approved' THEN dp.canonical_label_candidate
      ELSE replace(b.raw_tag,'_',' ') END AS stable_display_label,
 b.reserve_clusters AS fresh_variant_reserve_total,  -- global inventory; member remainder needs presentation events (not built)
 (b.practice_clusters>=8 AND b.reserve_clusters>=5) AS coverage_8_5_met,  -- content-production target, not a validation threshold
 COALESCE(b.eligible_practice_items>=2 AND b.fresh_assessment_clusters>=1
  -- F5: requires approved specific/duplicate verdict AND no approved
  -- distinct_concept/invalid_label variant on the tag.
  AND dp.proposal_status='approved' AND dp.verdict IN ('specific','duplicate')
  AND NOT EXISTS (SELECT 1 FROM pathways_evidence.label_variant_proposal lv
      WHERE lv.track=b.track AND lv.raw_tag=b.raw_tag AND lv.decision_status='approved'
        AND lv.proposed_relation IN ('distinct_concept','invalid_label'))
  AND b.blocked_associations=0
  AND b.unreviewed_associations=0, false) AS dashboard_ready,
 COALESCE(b.practice_clusters>=6 AND b.blocked_associations=0
  AND b.unreviewed_associations=0, false) AS recurring_capable,
 false AS resolution_capable  -- remains disabled; needs transfer approval + delayed reassessment policy
FROM base b
LEFT JOIN labels l USING (track,raw_tag)
LEFT JOIN pathways_evidence.tag_display_proposal dp ON dp.track=b.track AND dp.raw_tag=b.raw_tag;

CREATE VIEW pathways_evidence.label_variant_audit AS
SELECT o.track,o.raw_tag,o.confuses_with_raw,
       COUNT(DISTINCT o.item_id) AS supporting_items,
       ARRAY_AGG(DISTINCT o.item_id) AS supporting_item_ids,
       p.proposed_relation,p.proposed_normalized_label,p.decision_status,
       d.canonical_label_candidate,d.proposal_status AS canonical_status, d.verdict AS canonical_verdict
FROM pathways_evidence.pathways_source_options o
LEFT JOIN pathways_evidence.label_variant_proposal p
 ON p.track=o.track AND p.raw_tag=o.raw_tag AND p.confuses_with_raw=o.confuses_with_raw
LEFT JOIN pathways_evidence.tag_display_proposal d
 ON d.track=o.track AND d.raw_tag=o.raw_tag
WHERE o.is_wrong_option=true
GROUP BY o.track,o.raw_tag,o.confuses_with_raw,p.proposed_relation,p.proposed_normalized_label,p.decision_status,d.canonical_label_candidate,d.proposal_status,d.verdict;

CREATE VIEW pathways_evidence.member_first_encounters AS
WITH base AS (
 SELECT a.*,
        i.content_version AS current_content_version,
        i.surface_cluster_id,
        i.variant_family_id,
        ROW_NUMBER() OVER (PARTITION BY a.member_id,a.track,a.item_id
          ORDER BY a.answered_at,a.attempt_id) AS item_encounter_rank
 FROM pathways_evidence.pathways_source_attempts a
 -- F10: LEFT JOIN so attempts on retired items are never dropped from history.
 LEFT JOIN pathways_evidence.pathways_source_items i ON i.track=a.track AND i.item_id=a.item_id
), cluster_numbered AS (
 SELECT b.*,
        ROW_NUMBER() OVER (
         PARTITION BY b.member_id,b.track,
          COALESCE(b.surface_cluster_id,'ITEM:'||b.item_id)
         ORDER BY b.answered_at,b.attempt_id
        ) AS global_cluster_encounter_rank
 FROM base b
), expanded AS (
 SELECT f.*,t.raw_tag,t.eligible_practice,t.eligible_assessment,
        t.eligible_transfer,t.surface_cluster_id AS reviewed_cluster_id,
        (f.item_content_version_at_answer IS NOT NULL AND
         f.item_content_version_at_answer=f.current_content_version) AS same_content_version
 FROM cluster_numbered f
 JOIN pathways_evidence.current_item_tag t
 ON t.track=f.track AND t.item_id=f.item_id AND t.content_version=f.current_content_version
)
SELECT e.member_id,e.track,e.raw_tag,e.item_id,e.attempt_id,e.chosen_option_id,
       e.answered_at,e.is_correct,e.response_time_ms,e.answer_context,
       e.item_encounter_rank,e.global_cluster_encounter_rank,e.reviewed_cluster_id,
       -- F1 fix: independence keyed on CLUSTER. Self-correction #2 reconciled:
       -- standalone flags include the cluster rank. F9: NULL correctness is
       -- never an opportunity.
       COALESCE(e.item_encounter_rank=1 AND e.global_cluster_encounter_rank=1
        AND e.answer_context='unaided' AND e.is_correct IS NOT NULL
        AND e.same_content_version AND e.eligible_practice, false) AS eligible_opportunity,
       COALESCE(e.item_encounter_rank=1 AND e.global_cluster_encounter_rank=1
        AND e.answer_context='unaided' AND e.is_correct IS NOT NULL
        AND e.same_content_version AND e.eligible_assessment, false) AS eligible_independent_assessment,
       COALESCE(e.item_encounter_rank=1 AND e.global_cluster_encounter_rank=1
        AND e.answer_context='unaided' AND e.is_correct IS NOT NULL
        AND e.same_content_version AND e.eligible_transfer, false) AS eligible_transfer_response,
       COALESCE(e.item_encounter_rank=1 AND e.global_cluster_encounter_rank=1
        AND e.answer_context='unaided'
        AND e.same_content_version AND e.eligible_practice
        AND e.is_correct IS FALSE AND EXISTS (
          SELECT 1 FROM pathways_evidence.option_tag_review ot
          WHERE ot.track=e.track AND ot.item_id=e.item_id
            AND ot.content_version=e.current_content_version
            AND ot.option_id=e.chosen_option_id AND ot.raw_tag=e.raw_tag
            AND ot.attribution_status='approved'), false) AS eligible_tagged_miss
FROM expanded e;

-- Spacing rule: SHIPPED distinct-days rule preserved. Days are UTC, matching
-- production member_evidence today. The member-local-day policy and its
-- fallback timezone are UNRESOLVED (no grounded member tz exists); changing
-- the unit or timezone is Nisan's explicit call, not made here.
CREATE VIEW pathways_evidence.member_pattern_candidates AS
WITH windowed AS (
 SELECT * FROM pathways_evidence.member_first_encounters
 WHERE answered_at >= now() - interval '30 days' AND answered_at <= now()
), sums AS (
 SELECT member_id,track,raw_tag,
   COUNT(DISTINCT item_id) FILTER (WHERE eligible_opportunity) AS opportunities,
   COUNT(DISTINCT item_id) FILTER (WHERE eligible_tagged_miss) AS misses,
   COUNT(DISTINCT ((answered_at AT TIME ZONE 'UTC')::date)) FILTER (WHERE eligible_tagged_miss) AS miss_days
 FROM windowed GROUP BY member_id,track,raw_tag
)
SELECT s.*, m.stable_display_label,m.review_status,m.dashboard_ready,m.recurring_capable,
 CASE WHEN m.dashboard_ready AND s.misses >=3 AND s.miss_days>=2
   AND s.opportunities>=6 AND s.misses::numeric/NULLIF(s.opportunities,0)>=0.40
   AND m.recurring_capable THEN 'recurring'
   WHEN m.dashboard_ready AND s.misses>=2 THEN 'emerging'
   ELSE 'hidden' END AS proposed_status,
 (s.misses>=2) AS production_panel_threshold_met,
 (s.misses>=3 AND s.miss_days>=2 AND s.opportunities>=6
   AND s.misses::numeric/NULLIF(s.opportunities,0)>=0.40) AS production_recurring_threshold_met
FROM sums s JOIN pathways_evidence.misconception_coverage_manifest m USING (track,raw_tag);

-- No member-facing RPC is created. Exposure of any member data requires a
-- separate, explicitly authorized step.
COMMIT;
