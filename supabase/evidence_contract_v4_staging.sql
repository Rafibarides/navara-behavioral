-- Evidence contract v4 staging: inert schema pieces for serving-route
-- instrumentation. Applied: 2026-10-26. No behavior change:
--   * attempts.delivery_id is nullable, no backfill, nothing reads it yet.
--   * The member-facing logging RPC is intentionally NOT here - it stays in
--     evidence_contract_v4_rpc_draft.sql (not applied) under the
--     trust-boundary hold.

ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS delivery_id text;

COMMENT ON COLUMN public.attempts.delivery_id IS
  'Quiz-session binding: a per-session identifier generated at set start at set start, stamped on every attempt in the set and on matching item_presentation_event rows. NULL on all pre-instrumentation rows; NULL must never be treated as "no delivery" (fail-closed semantics, see v4 evaluation tests).';

CREATE INDEX IF NOT EXISTS attempts_user_delivery_idx
  ON public.attempts (user_id, delivery_id);

-- item_presentation_event gains a delivery binding the same way (table from
-- v2; append-only guards from v3 unchanged).
ALTER TABLE pathways_evidence.item_presentation_event
  ADD COLUMN IF NOT EXISTS delivery_id text;

COMMENT ON COLUMN pathways_evidence.item_presentation_event.delivery_id IS
  'Session identifier stamped at display time; joins display events to the attempts they produced. NULL until the logging route ships; NULL is unknown, not absent.';
