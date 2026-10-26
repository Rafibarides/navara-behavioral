-- NAVARA PATHWAYS - Evidence contract v1 (staging validation build)
-- Review-table DDL and downstream views: ChatGPT Evidence Contract proposal
-- (2026-10-25), unverified review candidate, applied to an isolated schema.
-- Adapter views: builder-written mapping onto the real production tables.
-- No existing tables are modified. No review rows are seeded: every status
-- defaults to unreviewed, so every gate fails closed by construction.
-- Known honest gaps: no content_version exists in production (single
-- synthetic version 'current'); attempts carry no version-at-answer (NULL ->
-- nothing eligible for current claims); no variant families exist yet
-- (nothing assessment/transfer-eligible until an SME assigns them).
BEGIN;
CREATE SCHEMA IF NOT EXISTS pathways_evidence;
SET search_path = pathways_evidence, public;

CREATE TABLE IF NOT EXISTS pathways_evidence.item_quality_review (
  track text NOT NULL CHECK (track IN ('RBT','BCBA')),
  item_id text NOT NULL,
  content_version text NOT NULL,
  quality_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (quality_status IN ('unreviewed','in_review','approved','held','rejected')),
  citation_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (citation_status IN ('unreviewed','approved','held','rejected')),
  key_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (key_status IN ('unreviewed','approved','held','rejected')),
  reviewer_id uuid,
  reviewed_at timestamptz,
  reason text,
  PRIMARY KEY (track,item_id,content_version),
  CHECK (quality_status <> 'approved' OR (key_status='approved' AND citation_status='approved' AND reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS pathways_evidence.item_tag_review (
  track text NOT NULL CHECK (track IN ('RBT','BCBA')),
  item_id text NOT NULL,
  content_version text NOT NULL,
  raw_tag text NOT NULL,
  alignment_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (alignment_status IN ('unreviewed','in_review','approved','ambiguous','held','rejected')),
  assessable boolean NOT NULL DEFAULT false,
  use_class text NOT NULL DEFAULT 'practice'
    CHECK (use_class IN ('practice','assessment','transfer','both')),
  transfer_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (transfer_status IN ('unreviewed','approved','held','rejected')),
  variant_family_id text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  PRIMARY KEY (track,item_id,content_version,raw_tag),
  CHECK (alignment_status <> 'approved' OR (assessable AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
  CHECK (use_class NOT IN ('assessment','transfer','both') OR variant_family_id IS NOT NULL),
  CHECK (transfer_status <> 'approved' OR use_class IN ('transfer','both'))
);

CREATE TABLE IF NOT EXISTS pathways_evidence.option_tag_review (
  track text NOT NULL CHECK (track IN ('RBT','BCBA')),
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

CREATE TABLE IF NOT EXISTS pathways_evidence.tag_display_proposal (
  track text NOT NULL CHECK (track IN ('RBT','BCBA')),
  raw_tag text NOT NULL,
  canonical_label_candidate text NOT NULL,
  proposal_status text NOT NULL DEFAULT 'pending'
    CHECK (proposal_status IN ('pending','approved','rejected','superseded')),
  decision_reason text,
  proposed_by text,
  proposed_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid,
  approved_at timestamptz,
  PRIMARY KEY (track,raw_tag),
  CHECK (proposal_status <> 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS pathways_evidence.label_variant_proposal (
  track text NOT NULL CHECK (track IN ('RBT','BCBA')),
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

CREATE TABLE IF NOT EXISTS pathways_evidence.tag_merge_proposal (
  proposal_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track text NOT NULL CHECK (track IN ('RBT','BCBA')),
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

-- ADAPTER VIEWS (builder mapping onto real tables) ------------------------------
-- One row per wrong option that carries a misconception tag.
CREATE OR REPLACE VIEW pathways_evidence.pathways_source_options AS
SELECT upper(q.track) AS track,
       q.id::text AS item_id,
       (o.idx - 1)::text AS option_id,
       o.opt->>'misconception_tag' AS raw_tag,
       o.opt->>'confuses_with' AS confuses_with_raw,
       true AS is_wrong_option
FROM public.questions q
CROSS JOIN LATERAL jsonb_array_elements(q.options) WITH ORDINALITY AS o(opt, idx)
WHERE (o.idx - 1) <> q.answer
  AND NULLIF(btrim(o.opt->>'misconception_tag'), '') IS NOT NULL;

-- One row per item. 'current' is a synthetic single version: production has
-- no content versioning, so any content edit silently shares this version
-- until real versioning exists.
CREATE OR REPLACE VIEW pathways_evidence.pathways_source_items AS
SELECT upper(q.track) AS track,
       q.id::text AS item_id,
       q.published AS is_published,
       'current'::text AS content_version,
       NULL::text AS item_variant_family_id,
       NULL::timestamptz AS item_approved_at
FROM public.questions q;

-- One row per bank-question attempt. NULL-question_id sample-bank answers are
-- excluded. kind maps: practice/mock -> unaided; no guided/post_feedback
-- exists yet. item_content_version_at_answer is NULL (never recorded) ->
-- per the contract, nothing is eligible for current claims.
CREATE OR REPLACE VIEW pathways_evidence.pathways_source_attempts AS
SELECT a.id::text AS attempt_id,
       a.user_id AS member_id,
       a.question_id::text AS item_id,
       upper(q.track) AS track,
       a.chosen_option::text AS chosen_option_id,
       a.created_at AS answered_at,
       a.correct AS is_correct,
       CASE WHEN a.kind IN ('practice','mock') THEN 'unaided' ELSE 'unknown' END AS answer_context,
       a.ms AS response_time_ms,
       NULL::text AS item_content_version_at_answer
FROM public.attempts a
JOIN public.questions q ON q.id = a.question_id
WHERE a.question_id IS NOT NULL;

-- DOWNSTREAM VIEWS (ChatGPT proposal, unchanged logic) --------------------------
CREATE OR REPLACE VIEW pathways_evidence.tag_inventory AS
SELECT DISTINCT track, raw_tag FROM pathways_evidence.pathways_source_options WHERE is_wrong_option = true
UNION
SELECT DISTINCT track, raw_tag FROM pathways_evidence.item_tag_review;

CREATE OR REPLACE VIEW pathways_evidence.current_item_tag AS
SELECT t.track, t.raw_tag, i.item_id, i.content_version, i.is_published,
       t.alignment_status, t.assessable, t.use_class, t.transfer_status,
       COALESCE(t.variant_family_id, i.item_variant_family_id) AS variant_family_id,
       q.quality_status, q.key_status, q.citation_status,
       (i.is_published AND q.quality_status='approved' AND q.key_status='approved'
         AND q.citation_status='approved' AND t.alignment_status='approved'
         AND t.assessable) AS eligible_practice,
       (i.is_published AND q.quality_status='approved' AND q.key_status='approved'
         AND q.citation_status='approved' AND t.alignment_status='approved'
         AND t.assessable AND t.use_class IN ('assessment','both')
         AND COALESCE(t.variant_family_id, i.item_variant_family_id) IS NOT NULL) AS eligible_assessment,
       (i.is_published AND q.quality_status='approved' AND q.key_status='approved'
         AND q.citation_status='approved' AND t.alignment_status='approved'
         AND t.assessable AND t.use_class IN ('transfer','both') AND t.transfer_status='approved'
         AND COALESCE(t.variant_family_id, i.item_variant_family_id) IS NOT NULL) AS eligible_transfer
FROM pathways_evidence.item_tag_review t
JOIN pathways_evidence.pathways_source_items i ON i.track=t.track AND i.item_id=t.item_id AND i.content_version=t.content_version
LEFT JOIN pathways_evidence.item_quality_review q
  ON q.track=i.track AND q.item_id=i.item_id AND q.content_version=i.content_version;

CREATE OR REPLACE VIEW pathways_evidence.misconception_coverage_manifest AS
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
  COUNT(DISTINCT COALESCE(ci.variant_family_id,'ITEM:'||ci.item_id)) FILTER (WHERE ci.eligible_assessment) AS fresh_assessment_families,
  COUNT(DISTINCT ci.variant_family_id) FILTER (WHERE ci.eligible_transfer) AS fresh_transfer_families,
  COUNT(DISTINCT COALESCE(ci.variant_family_id,'ITEM:'||ci.item_id)) FILTER (WHERE ci.eligible_practice) AS independent_opportunity_families,
  COUNT(*) FILTER (WHERE ci.alignment_status = 'approved') AS approved_associations,
  COUNT(*) FILTER (WHERE ci.alignment_status IN ('held','rejected','ambiguous')) AS blocked_associations,
  COUNT(*) FILTER (WHERE ci.alignment_status IN ('unreviewed','in_review')) AS unreviewed_associations
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
 dp.canonical_label_candidate,dp.proposal_status AS label_review_status,
 CASE WHEN dp.proposal_status='approved' THEN dp.canonical_label_candidate
      ELSE replace(b.raw_tag,'_',' ') END AS stable_display_label,
 b.fresh_transfer_families AS fresh_variant_reserve_total,
 (b.eligible_practice_items>=2 AND b.fresh_assessment_families>=1
  AND dp.proposal_status='approved' AND b.blocked_associations=0
  AND b.unreviewed_associations=0) AS dashboard_ready,
 (b.independent_opportunity_families>=6 AND b.eligible_practice_items>=6 AND b.blocked_associations=0
  AND b.unreviewed_associations=0) AS recurring_capable,
 false AS resolution_capable
FROM base b
LEFT JOIN labels l USING (track,raw_tag)
LEFT JOIN pathways_evidence.tag_display_proposal dp ON dp.track=b.track AND dp.raw_tag=b.raw_tag;

CREATE OR REPLACE VIEW pathways_evidence.label_variant_audit AS
SELECT o.track,o.raw_tag,o.confuses_with_raw,
       COUNT(DISTINCT o.item_id) AS supporting_items,
       ARRAY_AGG(DISTINCT o.item_id) AS supporting_item_ids,
       p.proposed_relation,p.proposed_normalized_label,p.decision_status,
       d.canonical_label_candidate,d.proposal_status AS canonical_status
FROM pathways_evidence.pathways_source_options o
LEFT JOIN pathways_evidence.label_variant_proposal p
 ON p.track=o.track AND p.raw_tag=o.raw_tag AND p.confuses_with_raw=o.confuses_with_raw
LEFT JOIN pathways_evidence.tag_display_proposal d
 ON d.track=o.track AND d.raw_tag=o.raw_tag
WHERE o.is_wrong_option=true
GROUP BY o.track,o.raw_tag,o.confuses_with_raw,p.proposed_relation,p.proposed_normalized_label,p.decision_status,d.canonical_label_candidate,d.proposal_status;

CREATE OR REPLACE VIEW pathways_evidence.member_first_encounters AS
WITH base AS (
 SELECT a.*,
        i.content_version AS current_content_version,
        i.item_variant_family_id,
        ROW_NUMBER() OVER (PARTITION BY a.member_id,a.track,a.item_id
          ORDER BY a.answered_at,a.attempt_id) AS item_encounter_rank
 FROM pathways_evidence.pathways_source_attempts a
 JOIN pathways_evidence.pathways_source_items i ON i.track=a.track AND i.item_id=a.item_id
), family_numbered AS (
 SELECT b.*,
        ROW_NUMBER() OVER (
         PARTITION BY b.member_id,b.track,
          COALESCE(b.item_variant_family_id,'ITEM:'||b.item_id)
         ORDER BY b.answered_at,b.attempt_id
        ) AS global_family_encounter_rank
 FROM base b
), expanded AS (
 SELECT f.*,t.raw_tag,t.eligible_practice,t.eligible_assessment,
        t.eligible_transfer,t.variant_family_id,
        (f.item_content_version_at_answer IS NOT NULL AND
         f.item_content_version_at_answer=f.current_content_version) AS same_content_version
 FROM family_numbered f
 JOIN pathways_evidence.current_item_tag t
 ON t.track=f.track AND t.item_id=f.item_id AND t.content_version=f.current_content_version
)
SELECT e.member_id,e.track,e.raw_tag,e.item_id,e.attempt_id,e.chosen_option_id,
       e.answered_at,e.is_correct,e.response_time_ms,e.answer_context,
       e.item_encounter_rank,e.global_family_encounter_rank,e.variant_family_id,
       (e.item_encounter_rank=1 AND e.answer_context='unaided'
        AND e.same_content_version AND e.eligible_practice) AS eligible_opportunity,
       (e.item_encounter_rank=1 AND e.global_family_encounter_rank=1
        AND e.answer_context='unaided' AND e.same_content_version
        AND e.eligible_assessment) AS eligible_independent_assessment,
       (e.item_encounter_rank=1 AND e.global_family_encounter_rank=1
        AND e.answer_context='unaided' AND e.same_content_version
        AND e.eligible_transfer) AS eligible_transfer_response,
       (e.item_encounter_rank=1 AND e.answer_context='unaided'
        AND e.same_content_version AND e.eligible_practice
        AND NOT e.is_correct AND EXISTS (
          SELECT 1 FROM pathways_evidence.option_tag_review ot
          WHERE ot.track=e.track AND ot.item_id=e.item_id
            AND ot.content_version=e.current_content_version
            AND ot.option_id=e.chosen_option_id AND ot.raw_tag=e.raw_tag
            AND ot.attribution_status='approved')) AS eligible_tagged_miss
FROM expanded e;

CREATE OR REPLACE VIEW pathways_evidence.member_pattern_candidates AS
WITH windowed AS (
 SELECT * FROM pathways_evidence.member_first_encounters
 WHERE answered_at >= now() - interval '30 days' AND answered_at <= now()
), sums AS (
 SELECT member_id,track,raw_tag,
   COUNT(DISTINCT item_id) FILTER (WHERE eligible_opportunity AND global_family_encounter_rank=1) AS opportunities,
   COUNT(DISTINCT item_id) FILTER (WHERE eligible_tagged_miss AND global_family_encounter_rank=1) AS misses,
   COUNT(DISTINCT ((answered_at AT TIME ZONE 'UTC')::date)) FILTER (WHERE eligible_tagged_miss AND global_family_encounter_rank=1) AS miss_days
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

COMMIT;
