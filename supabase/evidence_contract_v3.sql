-- evidence_contract_v3.sql - INCREMENTAL hardening over applied v2.
-- Adopts the reviewed v1.2 pieces as ALTERs (no replacement, no data loss):
--   sme_reviewer + reviewer FKs; append-only review_event audit log;
--   exposure_logging_policy; presentation-event enrichment + append-only guard;
--   per-tag reserve_suitability; flag hold-target columns + open-hold index;
--   active_flag_hold / effective_option_attribution views; RLS deny-all.
-- NOT adopted (held, per owner policy): hard-coded tz fallback (unresolved),
-- member-facing public RPCs (need explicit authorization), full replacement.
BEGIN;

-- 1. SME reviewer registry --------------------------------------------------
CREATE TABLE IF NOT EXISTS pathways_evidence.sme_reviewer (
  reviewer_id uuid PRIMARY KEY,
  display_name text NOT NULL,
  credential text NOT NULL,
  tracks text[] NOT NULL DEFAULT '{rbt,bcba}',
  active boolean NOT NULL DEFAULT true
);

-- 2. Reviewer FKs (all review tables are empty of reviewer ids today) -------
ALTER TABLE pathways_evidence.item_quality_review
  ADD CONSTRAINT iqr_reviewer_fk FOREIGN KEY (reviewer_id) REFERENCES pathways_evidence.sme_reviewer(reviewer_id);
ALTER TABLE pathways_evidence.item_tag_review
  ADD CONSTRAINT itr_reviewer_fk FOREIGN KEY (reviewed_by) REFERENCES pathways_evidence.sme_reviewer(reviewer_id);
ALTER TABLE pathways_evidence.option_tag_review
  ADD CONSTRAINT otr_reviewer_fk FOREIGN KEY (reviewed_by) REFERENCES pathways_evidence.sme_reviewer(reviewer_id);
ALTER TABLE pathways_evidence.label_variant_proposal
  ADD CONSTRAINT lvp_reviewer_fk FOREIGN KEY (reviewed_by) REFERENCES pathways_evidence.sme_reviewer(reviewer_id);
ALTER TABLE pathways_evidence.tag_merge_proposal
  ADD CONSTRAINT tmp_reviewer_fk FOREIGN KEY (reviewer_id) REFERENCES pathways_evidence.sme_reviewer(reviewer_id);
ALTER TABLE pathways_evidence.tag_display_proposal
  ADD CONSTRAINT tdp_approver_fk FOREIGN KEY (approved_by) REFERENCES pathways_evidence.sme_reviewer(reviewer_id);

-- 3. Per-tag reserve suitability (D5 invariant, per item-tag, not item-level)
ALTER TABLE pathways_evidence.item_tag_review
  ADD COLUMN reserve_suitability text NOT NULL DEFAULT 'not_reviewed'
    CHECK (reserve_suitability IN ('not_reviewed','approved','rejected')),
  ADD CONSTRAINT itr_reserve_gate CHECK (reserve_suitability <> 'approved' OR (alignment_status='approved' AND reviewed_by IS NOT NULL));

-- 4. Flag hold-target columns + open-hold index ------------------------------
ALTER TABLE pathways_evidence.item_audit_flag
  ADD COLUMN affected_option_id text,
  ADD COLUMN affected_raw_tag text;
UPDATE pathways_evidence.item_audit_flag SET affected_option_id = option_id WHERE affected_option_id IS NULL;
CREATE INDEX IF NOT EXISTS item_audit_flag_open_hold_idx
  ON pathways_evidence.item_audit_flag (track,item_id,content_version) WHERE status='open' AND hold_inference;

-- 5. Active-hold + effective-attribution views (one definition of a hold) ---
CREATE OR REPLACE VIEW pathways_evidence.active_flag_hold AS
SELECT f.flag_id, f.track, f.item_id, f.content_version, f.scope,
       f.affected_option_id, f.affected_raw_tag, f.flag, f.severity,
       f.detector, f.verification_status, f.adjudication_status
FROM pathways_evidence.item_audit_flag f
WHERE f.hold_inference AND f.status = 'open' AND f.adjudication_status <> 'rejected'
  AND (f.adjudication_status = 'accepted' OR f.verification_status = 'source_verified' OR f.detector = 'human');

CREATE OR REPLACE VIEW pathways_evidence.effective_option_attribution AS
SELECT ot.track, ot.item_id, ot.content_version, ot.option_id, ot.raw_tag
FROM pathways_evidence.option_tag_review ot
WHERE ot.attribution_status = 'approved'
  AND NOT EXISTS (SELECT 1 FROM pathways_evidence.active_flag_hold h
                   WHERE h.track=ot.track AND h.item_id=ot.item_id AND h.content_version=ot.content_version
                     AND h.scope='option_tag' AND h.affected_option_id=ot.option_id
                     AND (h.affected_raw_tag IS NULL OR h.affected_raw_tag=ot.raw_tag));

-- 6. Presentation-event enrichment + append-only guard -----------------------
ALTER TABLE pathways_evidence.item_presentation_event
  ADD COLUMN surface_cluster_id_at_presentation text,
  ADD COLUMN presentation_context text NOT NULL DEFAULT 'practice'
    CHECK (presentation_context IN ('practice','reassessment','review','other'));
CREATE INDEX IF NOT EXISTS ipe_member_item_idx ON pathways_evidence.item_presentation_event (member_id, track, item_id);

-- 7. Exposure logging policy: from when presentation history is knowable -----
CREATE TABLE IF NOT EXISTS pathways_evidence.exposure_logging_policy (
  track text PRIMARY KEY CHECK (track IN ('rbt','bcba')),
  logging_started_at timestamptz NOT NULL,
  note text
);

-- 8. Append-only machinery ---------------------------------------------------
CREATE OR REPLACE FUNCTION pathways_evidence.forbid_mutation() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION '% is append-only (% refused)', TG_TABLE_NAME, TG_OP USING ERRCODE = 'insufficient_privilege';
END $$;

CREATE TRIGGER presentation_append_only BEFORE UPDATE OR DELETE ON pathways_evidence.item_presentation_event
  FOR EACH ROW EXECUTE FUNCTION pathways_evidence.forbid_mutation();
CREATE TRIGGER presentation_no_truncate BEFORE TRUNCATE ON pathways_evidence.item_presentation_event
  FOR EACH STATEMENT EXECUTE FUNCTION pathways_evidence.forbid_mutation();

CREATE TABLE IF NOT EXISTS pathways_evidence.review_event (
  event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name text NOT NULL,
  op text NOT NULL,
  old_row jsonb,
  new_row jsonb,
  at timestamptz NOT NULL DEFAULT now(),
  db_user text NOT NULL DEFAULT current_user
);

CREATE OR REPLACE FUNCTION pathways_evidence.log_review_event() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  INSERT INTO pathways_evidence.review_event(table_name,op,old_row,new_row)
  VALUES (TG_TABLE_NAME, TG_OP,
          CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
          CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END);
  RETURN NULL;
END $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['item_quality_review','item_tag_review','option_tag_review','item_audit_flag',
                           'tag_display_proposal','label_variant_proposal','tag_merge_proposal',
                           'exposure_logging_policy'] LOOP
    EXECUTE format('CREATE TRIGGER log_%1$s AFTER INSERT OR UPDATE OR DELETE ON pathways_evidence.%1$I
                    FOR EACH ROW EXECUTE FUNCTION pathways_evidence.log_review_event()', t);
  END LOOP;
END $$;

CREATE TRIGGER review_event_append_only BEFORE UPDATE OR DELETE ON pathways_evidence.review_event
  FOR EACH ROW EXECUTE FUNCTION pathways_evidence.forbid_mutation();

-- 9. RLS deny-all on every evidence table (owner-only until policies are
--    deliberately written; admin access today flows through the security-
--    definer RPC, which bypasses RLS as the table owner).
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='pathways_evidence' LOOP
    EXECUTE format('ALTER TABLE pathways_evidence.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON pathways_evidence.%I FROM PUBLIC', t);
  END LOOP;
END $$;

COMMIT;
