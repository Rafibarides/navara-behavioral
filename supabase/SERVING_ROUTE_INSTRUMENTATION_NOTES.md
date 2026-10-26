# Serving-route instrumentation prep (design note, DRAFT - nothing deployed)

Purpose: before member_item_exposure (v4) can be truthfully populated, every
route that DISPLAYS a live-bank question to a member must log an
item_presentation_event row. Transaction-side validation cannot substitute.
This note maps the actual serving routes in the current code so the
instrumentation change is a bounded, enumerable diff.

## Serving routes (live mode; navara-site/src/pathways/lib/db.js)

1. Practice.jsx:48 -> fetchQuestions({track, limit:12}) -> sb.from('questions')
   .eq('track').eq('published').range(offset...) then client shuffle.
   Random practice set, 12 items.
2. Mock.jsx:30 -> fetchQuestions({track, limit:10}) — member-facing label is
   "Timed set" (never "mock"). 10 items.
3. Practice.jsx:43 -> fetchAdaptiveSet({track, misconceptions, limit:10}).
   Adaptive set by misconception tag.
4. Practice.jsx:37 -> fetchMissedQuestions(tag) -> rpc member_missed_questions
   then questions.in(id,...). Review-mode RE-display of missed questions.
   Re-display is exposure too (event_type='review'?), and these items were
   already answered — the event still belongs in presentation history.

## NOT live-bank exposure (must NOT log, or log as a distinct class)

- fetchSample / bundled ../data/questions.js fallback: the 20-question
  placeholder sample bank (not the published bank). Exposure to sample items
  does not bind to a live item id and must not inflate item history.

## Display vs fetch granularity

fetchQuestions returns the whole set at once; the quiz renders items one at a
time. Exposure truth = per-question DISPLAYED (quiz advanced to it), not
per-set fetched. Fetch-time logging over-logs abandoned sets. Instrumentation
point is the quiz render step in Practice/Mock, keyed by item id.

## What the instrumentation change needs (each piece is its own small diff)

a. item_presentation_event: already exists (v2: member_id, item_id,
   event_type, route, presented_at). v3 guards make it append-only.
   Needs an explicit event_type taxonomy for: practice_display, timed_display,
   adaptive_display, review_display. Sample-bank displays excluded.
b. delivery/session id: a per-quiz-session uuid generated client-side at set
   start, stamped on each display event AND on the resulting attempts row
   (attempts needs a delivery_id column - the v4 draft's
   answer_delivery_id placeholder). This binds "displayed" to "answered"
   (v4 T2b positive path).
c. Logging channel: a security definer RPC (e.g. log_item_presentation(p_item_id,
   p_event_type, p_delivery_id)) callable by authenticated members, logging
   only their own row, ignoring unknown item ids, returning void.
   NOTE: member-facing RPC creation is NOT authorized (owner decision). This
   is the single blocked piece; (a)/(b) schema prep can be staged without it.
d. Logging epoch: only after the RPC ships and is verified does exposure
   history become observable; views must keep epoch-aware fail-closed wording
   ("no recorded exposure", not "unseen") until then.
e. RLS: item_presentation_event currently deny-all to members; the RPC path
   is definer-owned so no member policy is needed on the table itself.

## Client-side call site sketch (no behavior change yet)

In the quiz render step (Practice/Mock), on advancing to question i:
  log_item_presentation(item.id, 'practice_display', deliveryId)
Fire-and-forget; failure must never block the quiz.

## Verification plan once authorized

- Synthetic member: run a practice set, assert one row per displayed item,
  correct event_type, same delivery_id, attempt rows carry it.
- Abandon mid-set: only displayed items logged.
- Sample-bank path: zero rows.
- Then v4 T2b real-positive path becomes testable without the OR REPLACE shim.

## Failure handling (added with the reliability draft)

Fire-and-forget logging loses some displays (offline, RPC error, storage
blocked). The design accepts that and makes loss DETECTABLE instead of
assuming completeness:

- Client: failed logs go to a localStorage retry queue (cap 500), flushed on
  next Practice/Mock mount and on the browser 'online' event. Signed-out
  quizzes are never logged or queued (their attempts are not persisted either).
- Server: every bound attempt implies its display should exist.
  delivery_gap_report (draft) compares expected vs logged displays per
  (member, item, delivery): missing_display rows are residual loss after
  retries; display_after_answer rows are late queue flushes (>30s skew).
- Epoch gate: exposure_logging_health (draft) marks a track epoch_eligible
  only when a 30-day window of bound deliveries shows nonzero volume and zero
  gaps. No epoch declaration while logging is lossy; until then
  member_first_encounters_exposure_aware keeps returning
  unknown_exposure_history - fail-closed by construction, never repaired by
  inference.
- Known overlap to resolve in review: item_presentation_event already had a
  presentation_context column; event_type (staged) duplicates its intent.
  Coordinator should rule which one the RPC writes.
