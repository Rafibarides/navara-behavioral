# Answer-Diagnostics Design Response (builder, 2026-10-26) - DRAFT, nothing applied

Integrated response to the external Claude critique of the answer-choice diagnostics
brief. The critique is design opinion, not authority. Every claim below marked
VERIFIED was checked against the live database or site code on 2026-10-26.

## A. Evaluation of the critique against the actual implementation

A1. Live "emerging"/"recurring" labels (critique Q6: overclaim risk on unvalidated
    tags) - PARTIALLY TRUE, mitigated in copy, not in substance.
    VERIFIED: the member dashboard shows "Worth reviewing" / "Recurring" pills from
    member_evidence, and BOTH the dashboard and the targeted-practice page already
    carry the exact disclaimer: "Tags are author-assigned and not yet
    expert-reviewed - they point at what to review, not a diagnosis of why you
    missed." The threshold logic is also explained to the member in plain language.
    Assessment: the current copy stays on the educational-observation side of the
    line. The critique's deeper point stands: the fail-closed discipline covers
    evidence COUNTING, not tag VALIDITY. Conclusion: the labels may remain as
    review pointers; nothing stronger (scores, mastery, remediation claims) may be
    built on the tags until the validation protocol (C3) has run. No copy change
    required now; no new claims allowed.

A2. Track separation - REAL DEFECT, VERIFIED LIVE, fix drafted and tested.
    10 misconception_tag strings exist in both tracks. member_evidence() and
    member_missed_questions(p_tag) have no track scope, so a member with attempts
    in both tracks gets mixed evidence on shared tags. Bounded today (one track per
    profile; sample-bank attempts carry no question id and are excluded), but wrong
    by construction. Deliverable: member_evidence_track_scope_draft.sql (new scoped
    functions, originals untouched, fail closed on missing profile), 5/5 rollback
    tests: current function demonstrably mixes (documentary), scoped functions
    exclude the other track, same-track patterns still report. Adoption (replace
    originals vs migrate callers) is an owner decision; not applied.

A3. Content-identity binding gates the rest (critique: G3 should block D2/D3) -
    AGREED, matches our own sequencing. The EHC serve/answer contract (interface
    v0.1.1) binds every answer to the exact delivered content before any consumer
    relies on it. Uncertainty modeling and reassessment (D2/D3) stay downstream of
    that binding. No change in plan; the critique confirms the ordering.

A4. Timing signals - AGREED AMBIGUOUS, and ours is weaker than the critique assumes.
    VERIFIED: ms is client-reported (device clock, single value per attempt); there
    is no first-click/change capture at all. Consequences: (a) "changed selection"
    evidence is NOT capturable today - it would need new instrumentation, and even
    then it is a weak within-item signal, not proof of fragility (we do not adopt
    the critique's stronger framing); (b) any latency use must be relative to the
    member's own baseline and item difficulty, and only after server-side capture
    exists. Current design stance: timing is not evidence for any label today.

A5. Retake blind spot (first-response-only) - ACKNOWLEDGED, design item opened.
    VERIFIED: member_evidence and area progress use first responses only; a member
    who retakes and corrects generates no remediation evidence. Reassessment-item
    outcomes need their own evidence class (C2), not a "first response" exception.

A6. 30-day window - AGREED HEURISTIC. No principled basis is recorded; it is now
    documented as an unjustified heuristic pending review, not a design constant.

## B. Not adopted from the critique (per owner's evaluation instruction)

- ALL numeric thresholds from the critique (8-10 opportunities per tag, kappa ~0.6,
  20% override re-mapping, 2-confirmation resolution, 3+ item streaks, 10% random
  stratum): recorded as unvalidated external heuristics. Any adoption requires
  calibration against our bank and an owner decision; none are silently settled here.
- "Changed selection proves fragility": rejected as stated (weak signal, and not
  capturable with current instrumentation).
- Universal fresh-item confirmation counts: rejected; reassessment stringency is a
  product/clinical-policy call for the owner, informed by the SME workflow.
- Cross-track tag aggregation: rejected outright (see A2; tags are track-local).

## C. Integrated design direction

C1. Correct-answer context (owner's standing requirement): the defensible route is a
    VALIDATED ITEM-SKILL MAPPING that applies to both correct and incorrect responses
    (each item classified by skill/competency - the bank already carries outline
    section, question type, difficulty), so a correct answer is evidence about the
    item's skills, not about which misconception was avoided. Backfilling distractor
    tags onto correct answers is explicitly rejected (invalid inference; the critique
    independently flags the same side-door risk). This mapping needs the same SME
    validation as the distractor tags before it feeds any member-facing claim.

C2. Reassessment evidence class: reassessment outcomes recorded distinctly (not as
    ordinary first responses); "resolved"/closure claims remain OFF until the owner
    sets the stringency policy after the SME workflow exists. Fresh-item independence
    criteria (construct > option-overlap > surface > time) recorded as design
    principles, not adopted thresholds.

C3. Tag-validation protocol (draft for the held SME-workflow decision, does not
    settle it): stratified sampling ordered by member demand and coverage thinness
    (admin_tag_coverage exists) PLUS a random baseline stratum; dual independent SME
    review (blind first pass, then shown original); agreement measured with a
    chance-corrected statistic; disagreement handling and any numeric thresholds set
    only after calibration data exists.

C4. Selection: future selection targets highest-uncertainty tags, never lowest-score;
    capped consecutive same-tag items; exposure independence enforced via the EHC
    contract. All post-binding (A3) and post-validation (C3).

## D. Work items (draft/test scope; none applied, no held decisions settled)

D1. [delivered with this memo] Track-scoped evidence functions + 5/5 rollback tests.
D2. Reassessment evidence-class spec (design note, next).
D3. Tag-validation protocol draft for the SME workflow decision (design note, next).
D4. Correct-answer item-skill mapping proposal (design note, next; needs SME input).
D5. Server-side timing capture proposal (weak-signal-only framing).
