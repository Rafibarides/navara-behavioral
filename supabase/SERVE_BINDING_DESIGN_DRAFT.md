# Per-Item Server Delivery Binding - Design Draft (draft-only, nothing applied)

Status: design draft resolving the gaps demonstrated in the v4 real-schema attacks and
converged by the EHC v1 contract + two external design critiques. Not approved, not applied.
All epoch / sample / batch-size choices remain owner proposals. No RPC, consumer switch,
or deployment is authorized by this document.

## 1. Route inventory (verified against live DB + client code, 2026-10-26)

Protected-bank content reaches the browser through exactly these paths today:

| # | Route | Mechanism | Recording point today |
|---|-------|-----------|----------------------|
| R1 | Practice free set (limit 12), Mock timed set (limit 10) | Direct PostgREST `questions.select('*')`, policy "paid members read published questions" (published + paid plan/staff) | NONE - pure SELECT |
| R2 | Practice targeted review | `member_missed_questions` RPC returns ids only, then R1-style direct SELECT for content | NONE |
| R3 | Practice adaptive set | `adaptive_set` RPC (security INVOKER) returns full content | Server function exists but writes nothing |
| R4 | Sample quiz, DEMO mode, Mock/Practice fallbacks | Bundled static `src/pathways/data/questions.js` (20 items) | Impossible - offline bundle |

Completeness hazards confirmed:
- H1: PostgREST is itself a public surface. Any paid member's JWT can SELECT the full
  published bank directly, outside the app. Instrumenting app code paths alone cannot
  close this; direct table read must be revoked for member roles when the contract ships.
- H2: Static bundle (R4) bypasses any server contract by construction. Concept overlap
  with the live bank is preserved-unknown (token-Jaccard max 0.43, no stem duplicates,
  reported separately). Needs an explicit sample-exposure policy decision, not code.
- H3: No client-side question caching found on main (localStorage holds only
  pw_pending_profile). Pagination is random-offset; no prefetch.
- H4: `adaptive_set` is security invoker - it silently returns 0 rows for non-paid
  members rather than erroring. Not a defect for this contract, but instrumentation
  inside it inherits invoker semantics; the serve writer must be definer-side.

## 2. Minimal contract (converged core)

One authoritative server delivery event per item instance, committed before content
release; attempts bind their exact delivery; everything uncertain fails closed.

### 2.1 serve_items RPC (new, security definer, member-scoped)

Input: track, route (practice|timed|adaptive|review), selection params, client request
nonce (idempotency). For each selected item instance, atomically in one transaction:

1. Insert one `pathways_evidence.item_presentation_event` row per item:
   - `id` = server-generated item_delivery_id (uuid, gen_random_uuid())
   - logged_by='server', event_type='served', member_id=auth.uid(), track,
     question_id, surface_cluster_id_at_presentation (snapshot),
     item_content_version_at_serve (snapshot - closes the NULL-version gap at the
     source instead of inferring later), served_at=now() (server clock only),
     delivery group id (round/set grouping, never item-level proof), route,
     request_nonce
2. Return content rows + their item_delivery_ids.

Retry semantics: same (member, request_nonce) returns the ORIGINAL delivery ids and
content (unique constraint on member+nonce), never duplicates. A genuinely new serve
(new nonce) mints new delivery ids.

Release rule: content is returned only for rows committed in this transaction. The
function raises (and releases nothing) if any insert fails.

### 2.2 Attempt binding

`recordAttempt` becomes an RPC (or validated insert) carrying item_delivery_id:
- Server validates the delivery exists, belongs to auth.uid(), matches the answered
  question_id, and is unanswered (one attempt per delivery; a re-serve yields a new
  delivery and may be answered again - freshness classification is the exposure
  layer's job, not the write path's).
- `attempts.delivery_id` (inert staging column, already present) carries the binding.
- Cross-member / cross-item / ghost delivery references are rejected at write time
  (closes the class ChatGPT's binding requirement targets; EHC already fails closed
  on the read side).

### 2.3 Eligibility (EHC v1 views, unchanged semantics)

first_known still requires a server serve of the same item at/before the answer,
no prior exposure on any shared key, epoch + history coverage, ties exclude.
With binding, the answer's own showing IS its bound delivery - the "latest serve"
approximation is replaced by an exact pointer when present, and historical
(unbound) attempts keep the conservative approximation.

### 2.4 Timestamp rule (resolves critique point b against actual EHC SQL)

Verified: EHC v1 does use `LEAST(presented_at, received_at)` as exposure_at with
client-provenance presented_at (contract line 14, body line 51). In EHC's eligibility
logic the manipulation direction is fail-closed only (client can move an exposure
earlier = more exclusion; cannot erase or post-date exposure past an answer, and the
own-showing anchor takes the LATEST serve). Even so, for the binding design:
- Authoritative ordering uses served_at (server) and the attempts row's server
  created_at only.
- presented_at stays as diagnostic telemetry, never consulted for eligibility.
- exposure_at for server rows = served_at; for legacy client rows, keep LEAST as a
  conservative historical approximation, clearly labeled non-authoritative.

### 2.5 Dependence-key integrity (critique's added attack - already covered)

EHC snapshots surface_cluster_id_at_presentation at presentation time; renames/merges
keep historical exposure (A2 passes), logged splits stay sticky-dependent (A3 passes
with the split recorded as a review_event), unlogged splits fail closed to
unknown_exposure_history. A taxonomy change cannot manufacture freshness; a merge can
only add exclusion. No change needed beyond keeping review_event recording mandatory
when SMEs split/merge (workflow is an owner decision, already held).

## 3. What this deliberately does NOT do

- No revocation of direct questions read yet (would break the live app today; must
  ship with the client switch in one deploy, and only after owner go).
- No epoch declaration, no consumer switch, no member RPC enablement, no sample-bank
  policy. All remain owner-held proposals.
- No manifest table separate from the per-item ledger (both critiques converge:
  per-item records are the authority; a manifest may group, never replace).

## 4. Genuinely consequential product choices for the owner (not implementation questions)

1. Served-consumes-freshness tolerance: a served-but-never-displayed item conservatively
   loses freshness (false negatives by design). Page size (10 timed / 12 practice today)
   sets how much reserve this consumes. Per-item vs per-page serving is a product
   tolerance call.
2. Sample-bank overlap policy: 20 bundled items ship in the client; concept overlap with
   the paid bank is unknown. Either record identifying sample exposure or exclude
   overlapping material from freshness-sensitive claims.
3. Epoch anchor: account_created vs first_activity vs logging-start; all proposals on
   the table, none decided.
