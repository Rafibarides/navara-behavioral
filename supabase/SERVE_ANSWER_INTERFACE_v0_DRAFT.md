# Serve/Answer Interface v0 - DRAFT (single versioned contract artifact; nothing applied)

Coordinates the DB half (Tab: constraints, guards, idempotency, ordering) with the app
half (builder: identity/entitlement, selection, projection, retries, cutover) under one
integration owner (builder). Not an adoption; all owner-held policies stay held.
Status labels: [db-half] Tab drafts, [app-half] builder drafts, [integration] builder owns.

## 1. Serve request

{ request_key (uuid, client-generated per logical fetch), track, route
  (practice|timed|adaptive|review), selection_params (route-specific, e.g. tags, limit) }

- [app-half] Member identity = auth.uid() only, resolved at the edge; entitlement
  (plan, track) re-checked server-side at request time; never caller-supplied.
- [db-half] request_fingerprint = sha256(track | route | selection_params | sorted
  resulting item ids) persisted on first use of request_key.
- First call: server selects items [app-half: selection policy, batch cap per route],
  [db-half] commits one served_exposure row per item BEFORE any content leaves the
  function, records fingerprint.

## 2. Serve response

Success: { deliveries: [{ item_delivery_id, item_id, stem, options: [{ index, text }] }] }
- The pre-answer payload is EXACTLY stem + option index + option display text +
  delivery id. No answer key, no per-option explanation, why_tempting, misconception /
  confuses tags, remediation pointers (live-verified 1000/1000: those fields identify
  the keyed option). Acceptance must test the actual serialized JSON, not column names.
- Retry with same request_key + same fingerprint: the ORIGINAL ordered set, original
  delivery ids, original content-version identity.
- [integration, safe interim per Main] Retry re-authorization: entitlement + published
  re-checked; content re-released only if ALSO unchanged since delivery (content hash
  match). If entitlement/published fails: explicit `delivery_unauthorized` (ids only,
  no content, no suggestion to fall back to cached copies). If content changed:
  explicit `delivery_unrecoverable` - never substitute edited content under an old
  delivery id (substitution would bind new content to stale evidence identity).
- Errors are distinct, never conflated: `unauthorized` (no/ expired entitlement),
  `empty_pool` (entitled, no eligible items), `fingerprint_mismatch` (same key, altered
  request - raised, never extends), `retired_item`, `rate_limited`.

## 3. Answer request / response

Request: { item_delivery_id, chosen_index, answer_key (uuid, client retry identity) }
- [db-half] ONE transaction: validate delivery exists, belongs to this member, item
  and track match, chosen_index within option cardinality; insert attempt
  (server-stamped) + binding row together. Unique(item_delivery_id) on the binding is
  the one-attempt-per-delivery guarantee.
- Idempotent loser replay [db-half]: a concurrent or repeated submission for the same
  delivery does NOT error and does NOT orphan an attempt - it returns the already-
  accepted attempt (attempt id, server answer time, graded result). Same answer_key
  replay likewise returns the original.
- Answer response: { attempt_id, answered_at (server), correct, feedback } where
  feedback releases key + rationales only per the route's learning mode.
- An answer whose content hash no longer matches the delivery records but classifies
  content_changed (never fresh). [held policy: whether the UI still grades it]

## 4. Evidence consumers (DB half, v2.1)

- member_first_encounters_exposure_aware (+ taxonomy-gated wrapper draft): bound
  delivery, strict epoch, positive keyset, fail-closed unknowns.
- member_item_freshness: v2.1 P2 plus the advisory hardening below.
- [db-half, advisory delta] member_item_freshness positive key guard must precede BOTH
  freshness branches (history-covered AND fresh-keyset), not rely on the adapter
  invariant that source membership supplies ITEM: keys. Draft delta:
  supabase/freshness_key_guard_draft.sql (tested, rolled back).

## 5. Ownership (from the coordination ruling; integration owner = builder)

DB half (Tab proposes, builder independently validates before integration):
uniqueness, binding guards, fingerprint storage, server-stamped ordering, atomic
answer write, DB concurrency/failure-injection tests.
App half (builder): identity + entitlement resolution, selection policy + route
limits, content projection + feedback release, edge retries/resume, cutover matrix +
real-JWT denial tests, whole-contract acceptance.

## 6. Acceptance mapping (current truth)

- ehc-v2-acceptance-single.sql C1/C7 = passing guards. C3/C4/C5 = DOCUMENTARY gap
  reproductions (they characterize current failures; they are not post-fix acceptance).
  5/5 means "5 observations matched expectations", not "5 requirements satisfied".
- Concurrency driver = engine-level uniqueness evidence on exact DDL; end-to-end
  role-aware races remain post-implementation.
- Pre-implementation still owed: fingerprint storage + mismatch rejection (GAP-1 fix),
  entitlement/published checks (GAP-2 fix), sanitized projection, atomic answer RPC
  with idempotent replay, real-JWT cutover acceptance. All blocked on owner go for
  cutover; drafts/tests continue without it.
