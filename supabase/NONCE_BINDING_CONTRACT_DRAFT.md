# Nonce / Idempotency / Answer-Binding Transactional Contract - DRAFT (nothing applied)

Pins the executable semantics for serve + answer binding. Verified against the actual
EHC v2 SQL (/downloads ehc-v2.sql, reproduced 90/90 + 12/12 on the real schema).
Two confirmed code gaps in v2 are marked [GAP]; everything else is v2 behavior as tested.

## 1. Serve request identity

- A serve request is (member, request_key). The request key is a client-generated
  uuid per logical quiz fetch; it identifies a RETRY, never proves a delivery occurred.
- [GAP-1] v2 stores no request fingerprint. Same key with a different item list
  silently EXTENDS the delivery set (new items insert, old items return original ids);
  same key with different track/context/round is not rejected. Contract: on first use,
  persist request_fingerprint = sha256(track | context | round_id | sorted item_ids |
  selection params). Any later call with the same key and a different fingerprint must
  RAISE, never extend or silently reuse.
- Retry (same key, same fingerprint): return the ORIGINAL item_delivery_ids, original
  content versions (from the delivery rows, not current question rows), original order.
  v2 implements this via ON CONFLICT (member_id, serve_request_key, item_id) DO NOTHING
  + read-back by key. Verified in tests (idempotency cases).
- Genuine re-serve: new request key, mints new item_delivery_ids. A re-served item's
  earlier delivery still consumes freshness via the exposure views.

## 2. Concurrency

- Two concurrent calls with the same (member, key, item): the partial unique index
  ipe_serve_idem_uq makes the second transaction wait for the first, then skip via
  ON CONFLICT. Exactly one logical delivery per item results. v2 behavior, correct.
- Server time ties: now() is transaction-start; two concurrent serves of sibling items
  can share a timestamp. Eligibility already treats ties as prior (<=), and own-showing
  exclusion is by delivery identity, so ties cannot manufacture freshness. Verified in
  the attack suite (A7).
- [SPEC] Retry after entitlement change between original and retry: retry returns the
  ORIGINAL recorded delivery (evidence integrity) but content re-release on retry must
  re-check current entitlement and published status; if the item was unpublished or
  entitlement revoked, the retry returns the delivery ids WITHOUT content and the
  client must use its cached copy or fail the set. (Policy choice, flagged, not decided.)

## 3. Entitlement and release (definer boundary)

- [GAP-2] v2's serve_items validates that items EXIST for the track but never checks
  published = true and never checks member entitlement (plan/track). Its own Gate 1
  checklist requires the definer RPC to re-check both; the SQL does not. As written, a
  service_role caller (or any future member wrapper) can serve unpublished items to
  anyone. Contract: inside serve_items, (a) derive allowed tracks/plan from
  public.profiles for p_member; (b) require published = true for every served item;
  (c) reject empty-after-filtering with a distinct entitlement error, never a silent
  empty set (invoker adaptive_set's silent-zero behavior must not be reproduced).
- Positive property to keep: serve_items returns body + options only - the answer key
  and explanation are NOT released at serve time. Post-cutover, key/explanation release
  belongs to the answer-submission path after the attempt is recorded.

## 4. Answer binding

- attempt_delivery_binding: attempt_id PK, item_delivery_id UNIQUE, bound_at
  server-stamped (trigger overwrites any supplied value). Append-only. Guard refuses:
  other member's delivery, other item's delivery, ghost/NULL delivery, client-row
  delivery, already-bound delivery. All verified in the 90-case suite (G1-G3) and
  attack A8.
- One attempt per delivery: item_delivery_id UNIQUE makes concurrent double-answers
  to one delivery resolve to exactly one binding; the loser's insert fails.
- [SPEC] Post-cutover the attempt write itself becomes RPC-only (member direct INSERT
  on public.attempts revoked or left accepted-but-unbound = unknown, per the contract's
  Gate 1 item 7). attempts.created_at stays client-influenced for legacy rows but is
  never read for ordering in v2; bound_at is the authoritative answer time.
- Validation at answer time: delivery belongs to auth.uid(), item matches, track
  matches member's entitled track, chosen option index within options cardinality,
  content hash unchanged since delivery (else the answer records but can never be
  fresh - v2 classifies content_changed).

## 5. Acceptance harness (to build against v2 on real schema, rolled back)

1. Same key + same params, sequential retry -> identical delivery ids, one row per item.
2. Same key + same params, two concurrent sessions -> one logical delivery set.
3. Same key + added item -> RAISE (fingerprint mismatch). [currently fails: GAP-1]
4. Same key + different track/context/round -> RAISE. [currently fails: GAP-1]
5. Unpublished item in request -> RAISE entitlement/publication error. [GAP-2]
6. Member without paid plan via member wrapper -> entitlement error, nothing served. [GAP-2]
7. Cross-member delivery id at answer -> refused (v2 guard, regression check).
8. Two concurrent answers, one delivery -> exactly one attempt + one binding.
9. Answer with option index out of range -> rejected.
10. Item edited between serve and answer -> attempt records, class content_changed,
    never fresh (v2 test 24/m24 covers; keep as regression).
