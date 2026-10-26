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

-- event_type taxonomy column (staged 2026-10-26, inert): values defined by
-- the RPC draft - practice_display, timed_display, adaptive_display,
-- review_display. Nullable; pre-instrumentation rows stay NULL (unknown, not
-- 'practice'). No CHECK constraint yet: the taxonomy may evolve in review.
ALTER TABLE pathways_evidence.item_presentation_event
  ADD COLUMN IF NOT EXISTS event_type text;

COMMENT ON COLUMN pathways_evidence.item_presentation_event.event_type IS
  'Which serving route displayed the item (practice_display, timed_display, adaptive_display, review_display). NULL until instrumentation ships; NULL is unknown.';

-- received_at (staged 2026-10-26, inert): server-side truth timestamp.
-- presented_at will carry the client-asserted display time (untrusted);
-- received_at is when the row reached the database. Late-flush and
-- clock-skew analysis must compare presented_at against received_at, never
-- trust presented_at alone.
ALTER TABLE pathways_evidence.item_presentation_event
  ADD COLUMN IF NOT EXISTS received_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN pathways_evidence.item_presentation_event.received_at IS
  'Server-recorded arrival time. presented_at is client-asserted and untrusted; received_at is the trustworthy clock.';
