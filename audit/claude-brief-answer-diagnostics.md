# Navara Pathways - Answer-Choice Diagnostic Design Brief (for external design critique)

Purpose: design critique of how an exam-prep system should interpret chosen answers
(correct AND incorrect) as evidence of understanding, and how it should choose what to
ask next. Please critique the design and answer the numbered questions in section 5.
Scope: educational measurement design only. No student data appears in this brief.

## 1. Product context

- Navara Pathways: practice exam preparation for two national behavior-analysis
  credentials (RBT and BCBA tracks), 500 published questions per track, 1000 total.
- Content is national-certification scope only. The product must not make clinical or
  diagnostic claims about students; it reports practice evidence and patterns.
- Design philosophy: fail closed. One wrong answer is never a pattern. The system
  prefers saying "not enough evidence" over a wrong claim.

## 2. What exists today (actual implemented behavior)

Question bank structure. Each question has a stem, 4 options, one keyed answer, an
explanation, a citation, plus classification fields (content area, outline section,
question type recall/scenario/judgment, difficulty easy/medium/hard).

Per-option diagnostic metadata. Every WRONG option was written as a diagnostic probe
and carries four fields:
- misconception_tag: the specific misunderstanding this distractor is built to detect
- why_tempting: why a student would plausibly choose it
- confuses_with: the concept pair the choice confuses
- remediation_pointer: what to restudy
Coverage: 100% of the 3000 distractors carry these fields; correct options carry none
(a correct choice is not a probe).

Attempt recording. Each answered question stores: the chosen option index, the
misconception tag and confusion pair copied from the chosen option, milliseconds on
question, the mode (practice/timed/targeted/review), correctness, and a server
timestamp.

Pattern evidence (live). A member-facing evidence function aggregates FIRST responses
only (retakes excluded), rolling 30-day window:
- A tag becomes an "emerging" pattern only after 2+ misses on 2+ distinct questions.
- "Recurring" requires 3+ misses, across 2+ days, 6+ opportunities (questions faced
  where a wrong option carried the tag), and a 40%+ miss rate on those opportunities.
- The system deliberately does NOT compute "improving" or "resolved": no fresh-item
  reassessment exists yet, so no closure claims are made.
Review mode returns the exact first-response questions missed on a tag. An adaptive
function builds targeted practice sets from the member's active misconception tags.
An internal staff view summarizes patterns per member; an admin function ranks tags by
member demand and coverage thinness to ORDER a future expert review.

## 3. Known gaps (stated honestly)

G1. Correct answers carry no diagnostic context. Only wrong choices map to
    misconceptions. A correct answer currently contributes correctness + timing and
    nothing about WHY it might still be weak (lucky guess, slow recall, near-miss
    deliberation between two options).
G2. The distractor tags were assigned when the bank was authored and have never been
    independently reviewed by a subject-matter expert. Review tables exist but are
    empty. Tag accuracy is unvalidated.
G3. Attempts are not yet bound to the exact content version shown (a per-delivery
    content-identity binding is designed, not built). If a question is edited,
    historical answers blur.
G4. No uncertainty model: the system cannot distinguish a real knowledge gap from a
    guess, confusing wording, or remembering a previously seen question.
G5. Exposure history integrity (what was shown, when, in what version) is under active
    hardening; until it is proven, freshness/seen-before signals are incomplete.

## 4. Design directions under consideration (critique these)

D1. Correct-answer evidence: treat correct answers as graded-confidence evidence using
    only behavioral signals already capturable: response latency relative to the
    item's difficulty and the member's own baseline, first-response vs changed
    selection (if tracked), and consecutive-correct streaks across DISTINCT questions
    sharing a tag. Never infer intent from a single choice.
D2. Uncertainty model: per-tag state (e.g., a simple Bayesian/BKT-style estimate over
    first-response evidence) instead of pure rule thresholds, with explicit minimum
    evidence before the state may influence what is served.
D3. Reassessment: a suspected gap is tested with a FRESH, never-exposed question that
    independently targets the same misconception; "resolved" only after correct first
    responses on multiple independent fresh items, never from repeating a seen item.
D4. Expert validation workflow: sample tags for SME review ordered by member demand
    and coverage thinness; define inter-rater expectations and a resolution path when
    reviewers disagree with the bank's current mapping.
D5. Next-question selection: choose items that maximize information about the member's
    weakest evidenced tags while respecting exposure independence (a near-duplicate of
    a seen item does not count as independent evidence).

## 5. Questions for critique

Q1. For correct answers specifically: which behavioral signals are defensible evidence
    of fragile vs solid understanding, and which common signals (e.g., fast response)
    are too noisy to use at all? What should NEVER be inferred from a correct choice?
Q2. Is the rule-threshold approach (section 2) a reasonable foundation, and at what
    point does a probabilistic per-tag model earn its complexity? What minimum data
    makes such a model safe to act on?
Q3. Reassessment design: how many independent fresh-item confirmations should
    "resolved" require, and what independence criteria matter most (surface features,
    option overlap, passage of time)?
Q4. Expert validation: what sampling/review protocol would you use to validate ~1000
    questions' distractor-to-misconception mappings efficiently, and what inter-rater
    disagreement rate should trigger re-mapping vs reviewer adjudication?
Q5. Next-question selection: practical selection strategies that reduce uncertainty
    fastest without overfitting to noisy early evidence or repeating seen items?
Q6. Anything in sections 2-4 that is unsound, overclaimed, or missing.
