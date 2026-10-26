# Serve/Answer Interface v0.1 - DRAFT (single versioned contract artifact; nothing applied)
# v0.1.1: folded in the two implementation clarifications from the external v0.1
# confirmation (received as critique, not authority): answer_key global uniqueness
# (A5) and content_changed non-graded persistence semantics (A6). The external
# "freeze" wording is noted; freezing/implementation/cutover remain owner decisions.

Supersedes v0. Incorporates the four bounded amendments from the interface/guard
exact-source critique (treated as critique, not authority). Coordinates the DB half
(Tab: constraints, guards, idempotency, ordering) with the app half (builder:
identity/entitlement, selection, projection, retries, cutover) under one integration
owner (builder). Not an adoption; all owner-held policies stay held.
Status labels: [db-half] Tab drafts, [app-half] builder drafts, [integration] builder owns.

## 1. Serve request

{ contract_version, request_key (uuid, client-generated per logical fetch), track,
  route (practice|timed|adaptive|review), selection_params (route-specific,
  e.g. tags, limit) }

- [app-half] Member identity = auth.uid() only, resolved at the edge; entitlement
  (plan, track) re-checked server-side at request time; never caller-supplied.
- [db-half] AMENDMENT 1 (fingerprint circularity removed): the server MUST look up an
  existing serve_request by (member_id, request_key) BEFORE performing any selection.
  - Existing request: compare the incoming client parameters against the STORED
    immutable original client parameters (track, route, canonical selection_params).
    Equal: replay the recorded selection verbatim. Different: raise
    `fingerprint_mismatch` (never extend, never re-select under the same key).
  - New request: select items [app-half: selection policy, batch cap per route], then
    [db-half] persist, atomically and BEFORE any content leaves the function: the
    original client parameters, the resulting ORDERED item ids, one
    item_delivery_id per item, per-item content identity (content hash), the session
    id, and the contract version.
  - request_fingerprint = sha256 over the canonical CLIENT request parameters only.
    It no longer mixes in the resulting item ids (v0 defect: server-chosen ids made
    legitimate retries look like mismatches). The persisted selection, not a
    recomputed hash, is the replay source.

## 2. Serve response

Success: { contract_version, session_id, route, feedback_policy,
  deliveries: [{ item_delivery_id, position, item_id, stem,
                 options: [{ index, text }] }] }
- AMENDMENT 4 (version + session/mode context): the response carries the contract
  version, the logical session id, the immutable per-delivery order position, the
  route/mode echo, and the route-bound feedback policy identifier. A server that does
  not support the requested contract_version rejects with
  `unsupported_contract_version`; it never silently downgrades.
- The pre-answer payload is EXACTLY stem + option index + option display text +
  delivery id (+ the context fields above). No answer key, no per-option explanation,
  why_tempting, misconception / confuses tags, remediation pointers (live-verified
  1000/1000: those fields identify the keyed option). Acceptance must test the actual
  serialized JSON, not column names.
- Retry with same request_key + matching stored parameters: the ORIGINAL session id,
  ordered set, delivery ids, positions, and content-version identities.
- [integration, safe interim per Main] Retry re-authorization: entitlement + published
  re-checked; content re-released only if ALSO unchanged since delivery (content hash
  match). If entitlement/published fails: explicit `delivery_unauthorized` (ids only,
  no content, no suggestion to fall back to cached copies). If content changed:
  explicit `delivery_unrecoverable` - never substitute edited content under an old
  delivery id (substitution would bind new content to stale evidence identity).
- Errors are distinct, never conflated: `unauthorized` (no/expired entitlement),
  `empty_pool` (entitled, no eligible items), `fingerprint_mismatch` (same key,
  altered client parameters - raised, never extends), `retired_item`, `rate_limited`,
  `unsupported_contract_version`.

## 3. Answer request / response

Request: { contract_version, item_delivery_id, chosen_index,
  answer_key (uuid, client retry identity) }

- [db-half] AMENDMENT 4 (delivery context validation): the submission is validated
  against the AUTHORIZED DELIVERY CONTEXT recorded at serve time: delivery belongs to
  this member, its session, track, route, and contract version match the answering
  context, and the route's feedback policy governs what the response may release.
  A delivery issued under one mode (timed, practice, adaptive, review) MUST NOT be
  answerable through another mode's endpoint or feedback policy; modes never
  cross-use each other's feedback rules. Mismatch: `delivery_context_mismatch`.
- [db-half] ONE transaction: validate delivery + context; insert attempt
  (server-stamped) + binding row together. Unique(item_delivery_id) on the binding is
  the one-attempt-per-delivery guarantee.
- [db-half] AMENDMENT 2 (explicit replay conflict semantics; idempotency preserved):
  - Same answer_key AND same payload (delivery, chosen_index): network retry -
    return the original result verbatim (attempt id, server answer time, graded
    result). No new row.
  - Same item_delivery_id with a DIFFERENT answer_key OR a different chosen_index:
    return an explicit `already_answered` conflict identifying the previously
    accepted attempt (attempt_id, answered_at, and that attempt's graded result per
    the route feedback policy). No second attempt is created, nothing is re-graded,
    and the original answer is never presented as though the second choice was
    accepted.
  - [db-half] answer_key GLOBAL UNIQUENESS (implementation clarification, folded in):
    one answer_key identifies exactly one submission, ever. An answer_key presented
    against a DIFFERENT item_delivery_id than its original use is rejected
    (`answer_key_conflict`), enforced by a database unique constraint on answer_key -
    not just by replay logic.
- Answer response (accepted path): { attempt_id, answered_at (server), correct,
  feedback } where feedback releases key + rationales only per the route's learning
  mode.
- [db-half] AMENDMENT 3 (changed-content submitted answer, explicit hold): if the
  item's content hash at answer time no longer matches the delivery's recorded
  content identity, the response classification is `content_changed`; feedback is
  WITHHELD (no key, no rationales, no correctness reveal); the database NEVER grades
  the submission against an edited key. If the attempt is recorded at all, it is
  recorded classified content_changed and never counts as fresh evidence. The
  session MAY continue with its other deliveries; only the affected delivery is held.
  [held policy: what the UI displays beyond the hold notice - owner decision]
  [db-half] PERSISTENCE SEMANTICS (implementation clarification, folded in): if a
  content_changed submission is persisted at all, the row carries an explicit
  NON-GRADED status (status = 'content_changed', correct = NULL). Analytics and
  evidence consumers must never read it as an incorrect answer, a correct answer, or
  an eligible assessment/freshness opportunity; it is excluded from member_evidence,
  pattern detection, freshness, and exposure-history consumers by that status.

## 4. Evidence consumers (DB half, v2.1 lineage)

- member_first_encounters_exposure_aware (+ taxonomy-gated wrapper draft): bound
  delivery, strict epoch, positive keyset, fail-closed unknowns.
- member_item_freshness: v2.1 P2 plus the positive key guard.
- [db-half] Freshness key guard status: ACCEPTED as a targeted correction (critique
  verified the placement before BOTH freshness branches and the 2/2 rollback test).
  It folds into Tab's consolidated EHC v2.2 as the single candidate; it is no longer
  maintained as a separate advisory override. Per the critique, v2.2 should also drop
  the now-redundant inner k0 EXISTS inside the fresh-keyset branch and rerun the
  90-case suite, the 14-case adversarial suite, and the 2 key-guard cases against the
  consolidated SQL. Tab owns v2.2 source (pending); builder independently validates
  on arrival. Builder does not produce a parallel v2.2.

## 5. Ownership (from the coordination critique; integration owner = builder)

DB half (Tab proposes, builder independently validates before integration):
uniqueness, binding guards, serve_request persistence + lookup-before-selection,
fingerprint storage, server-stamped ordering, atomic answer write, replay/conflict
semantics, DB concurrency/failure-injection tests.
App half (builder): identity + entitlement resolution, selection policy + route
limits, content projection + feedback release, edge retries/resume, cutover matrix +
real-JWT denial tests, whole-contract acceptance.

## 6. Acceptance mapping (current truth)

- The replay, conflict, and changed-content semantics in sections 1-3 are CONTRACT
  REQUIREMENTS, not demonstrated behavior (acceptance distinction from the critique).
- ehc-v2-acceptance-single.sql C1/C7 = passing guards. C3/C4/C5 = DOCUMENTARY gap
  reproductions (they characterize current failures; they are not post-fix acceptance).
  5/5 means "5 observations matched expectations", not "5 requirements satisfied".
- Concurrency driver = engine-level uniqueness evidence on exact DDL; end-to-end
  role-aware races remain post-implementation.
- v0.1 acceptance tests owed (built once consolidated v2.2 source lands; each must
  fail loudly):
  A1 serve: second call with same request_key + same params returns recorded
     selection without re-selection; same key + altered params raises
     fingerprint_mismatch and persists nothing new.
  A2 answer: same answer_key + same payload replays original; same delivery +
     different payload returns already_answered with the first attempt's identity and
     creates exactly one attempt row.
  A3 answer: content edited after delivery yields content_changed, no feedback, no
     correctness stored, other deliveries unaffected.
  A4 answer: delivery answered through a different route/feedback policy is rejected
     (delivery_context_mismatch); unsupported contract_version rejected at serve and
     answer.
  A5 answer: answer_key reused against a different delivery is rejected by the DB
     unique constraint (answer_key_conflict), not merely by replay logic.
  A6 answer: a persisted content_changed submission is provably invisible to
     analytics: member_evidence, pattern detection, freshness and exposure consumers
     all exclude it (not incorrect, not correct, not an opportunity).
- Pre-implementation still owed: fingerprint storage + mismatch rejection (GAP-1
  fix), entitlement/published checks (GAP-2 fix), sanitized projection, atomic answer
  RPC with the v0.1 replay semantics, real-JWT cutover acceptance. All blocked on
  owner go for cutover; drafts/tests continue without it.
