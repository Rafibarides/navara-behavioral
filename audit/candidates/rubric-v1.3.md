# Navara Pathways: content-audit rubric v1.3 (delta on v1.2)

PROPOSED, uncertified. This is a review-queue design for a human SME (a BCBA) to certify. A flag is a hypothesis, not a verdict; agreement between Tab, ChatGPT, Instinct or a builder script certifies nothing.
Author: Tab (Nisan's assistant), 2026-10-26. rubric-v1.2.md stands except where this file replaces or amends it.
Quoting convention: double quotes enclose only byte-exact item text (verified by script against the builder's 44/46/93 file); backticks mark labels and normalizer examples.
Companion file: prescreen-v1.3.py.txt (built-in fixtures 62/62 pass; 63/63 with the check that the embedded 44/46/93 strings are byte-exact in the builder's file).
Unchanged and still open: the America/New_York timezone fallback is Nisan's call, not shipped. The 1439 hold and the 37/40 downgrade remain proposals for the SME.

What changed and why:
- Item 1638 showed that the v1.2 number check read digits only. A number written as a word was invisible to it, so a format difference produced a blocker. Fixed in prescreen [P5]; 5.1 now caps format differences below blocker.
- The exact texts of 44, 46 and 93 show all three are compatible divergences: none teaches a different answer. v1.2's 5.1 had no tier for that. 5.1 now adds (a0) at low severity, plus (f) for cross-references the citation does not list.
- 5.3 is replaced by a per-track supervisor-cue position, and 5.4 adds a generic cue-asymmetry check.

## 5.1 key_explanation_divergence (replaces v1.2 5.1)

**Criterion.** The item explanation, the keyed option's explanation and the key must assert the same answer and the same reason. Texts are compared AFTER format normalization: case, whitespace, quote marks, dashes, final punctuation, and number form (number words and numerals, ordinals, percentages, and the safe fractions; prescreen [P5]). Fire when any of these hold:
- (a0) **textual divergence, same conclusion.** The two explanations differ but assert the same action or conclusion for the same reason. Subclasses:
  - format_only: the difference disappears under normalization;
  - crossref_only: the only difference is a parenthetical see-also cross-reference to code sections, and every section it names is already in the item's citation field;
  - paraphrase: different words, same conclusion, e.g. one text adds a detail compatible with the key.
- (a) the explanations differ and do not assert the same action or conclusion, or give a different reason;
- (b) the item explanation argues for, or best matches, a non-keyed option;
- (c) after normalization, a numeric or computed value in the explanation does not match the key, or matches a distractor;
- (d) a distractor's own explanation calls it correct, with no contrast;
- (e) the key's explanation contradicts the stem's facts;
- (f) a cross-reference in either explanation names a section the citation field does not list.

**Severity (review urgency).**
- Blocker: (b), (c), (e) only, where the explanation teaches or computes a different answer.
- **Hard cap:** a difference that disappears under format normalization never reaches blocker. (c) needs a value disagreement after normalization. Ambiguous number readings (`one`, `second`, `a third` not followed by `of`, `half-hour`) may suppress a numeric flag but never raise one.
- High: (a), (d), (f).
- Low: (a0), all subclasses.

**Scope and hold.** Item scope. hold_inference is true only for blockers, as in v1.2. (a0) never holds.

**Stage.** S (prescreen v1.3 `reconcile`) labels every row with divergence_class:
- identical: no row;
- format_only: low;
- crossref_only: low;
- crossref_not_in_citation: high, (f);
- text: high candidate.

M reads each `text` row and proposes paraphrase (a0, low), (a) high, or (b)/(e) blocker. H adjudicates.

**Route.**
- (a0): editor_sync_explanations. Pick the canonical text, then make both identical, or let them differ only by cross-references the citation already lists.
- (a) and (d): sme_reconcile_key_explanation.
- (f): sme_verify_citation.
- Blockers: pull_and_sme_rewrite.

**Regression fixtures (all in prescreen-v1.3 `fixtures`).**
- 44, 46 and 93, using the builder's exact texts. Recall floor 3/3 holds: each yields at least one row. Their anchors verify byte-exact.
  - 44: crossref_only, low. The item explanation adds "(see also Section 3.02)"; the citation lists 3.02.
  - 93: crossref_only, low. The item explanation adds "(see also Sections 1.08 and 2.03)"; the citation lists both.
  - 46: S emits a high `text` candidate. Tab's M-stage proposal is (a0) paraphrase, low. "services pause until one is assigned" and "they should not provide behavior-technician services" state the same action, and both agree with the key.
  - Proposed sync: make the item explanation canonical, because it also matches the key's request for a new supervisor. This is a suggested_fix for the SME, not a quote.
- 44 with a citation that lacks 3.02 must yield (f), high, routed to sme_verify_citation.
- 1638: the explanation sentence is from Instinct's mail. The key text was not supplied, so the fixture reconstructs a digit key. Expected: no row. The fixture also shows that the v1.2 digit-only logic reproduces the false positive.
- Mirror and true-positive fixtures: a word-form key against a digit explanation gives no row; a synthetic explanation of five call-outs against a key of 3 still blocks.
- Four format-only pairs, each must give exactly one low format_only row and no blocker.

**Why the wording changed.** Read strictly, v1.2's (a) would not fire on any of 44/46/93, because each pair asserts the same conclusion. Only S's generic exact-inequality check caught them. They are real textual divergences, worth syncing, but none teaches a different answer. (a0) records them at low severity, keeps the recall floor, and reserves high and blocker for actual disagreement.

**FP prior.**
- S format_only / crossref_only: the class is deterministic, so FP risk is in the severity call, not the detection.
- S `text`: high as a candidate. Most are expected to land as (a0) paraphrase at M.
- (c) after [P5]: the 1638 class is removed. Word-number keys are now inside the check (new reach), and their blocker rate needs measuring on the bank run.

## 5.3 Supervisor cue, per track (replaces v1.2 5.3)

Builder recount (live bank): RBT 120/500 keys vs 44/1500 distractors; BCBA 6/500 vs 35/1500.

| Track | key rate | distractor rate | ratio R | P(key given the option mentions supervisor/BCBA) | baseline |
|---|---|---|---|---|---|
| RBT | 24.0% | 2.9% | 8.18 | 73% (120/164) | 25% |
| BCBA | 1.2% | 2.3% | 0.51 | 15% (6/41) | 25% |

For 4-option items, P(key | cue) = R/(R+3). R=2 corresponds to 40%; R=0.5 corresponds to 14%.

**RBT: a strong key cue.** Picking the supervisor option is right 73% of the time it is available, against a 25% baseline. Proposal:
- Interim target: R ≤ 2 (P ≤ 40%) in every RBT stratum (track × question_type × outline area) with ≥8 hits.
- Track target: R 0.8–1.25 (P about 21–29%). Do not overshoot below 0.8, which would build a reverse cue.
- Worked arithmetic, holding the option count at 4:
  - rewrite about 40 keys (120 to 80) and convert about 148 distractors (44 to 192): R 1.25;
  - the same 40 key rewrites with 196 distractors converted (to 240): R 1.0;
  - no key rewrites at all needs about 244 distractors converted for R 1.25.
  - Phase 1 (R 2.0) is about 30 key rewrites plus about 91 distractors.
- Three levers, cheapest first:
  1. **Attach the clause to a wrong action.** Add the same tell-your-supervisor clause to an existing distractor whose error is the action itself (stopping extinction, adding an unplanned consequence). It keeps that distractor's misconception tag. SME check: the clause must not make the distractor defensible.
  2. **Wrong-escalation distractors.** These are plausible because asking the supervisor when unsure is a real RBT norm. Each needs a misconception tag (proposed: over_escalates_in_plan_action, defers_routine_task_to_supervisor). Patterns:
     - escalating instead of acting, when the plan already authorizes an immediate safety step (draft shape: stop and call your supervisor before doing anything);
     - deferring a routine in-plan task (draft shape: ask your supervisor before running today's scheduled probe);
     - seeking permission for something the written plan already specifies.
     Prefer replacing distractors already flagged implausible_distractor.
  3. **Key rewrites** only where reporting is not the substantive action. Name the in-plan action in the option and keep the notify step in the explanation. Leave keys alone where reporting IS the correct RBT action (scope, ethics, safety reporting).
- Also watch the notify_report family (tell/inform/notify), so the cue does not just move to new words.

**BCBA: a weak reverse cue.** Never picking the consult option is the shortcut; it is right 85% of the time it applies.
- On the supervisor family alone, R = 0.51 is in the watch band, not past the 0.5 flag line. One-sided binomial p ≈ 0.08 on 6 of 41.
- Do NOT add supervisor-mentioning wrong distractors; they would deepen the reverse cue.
- Instead, run the cue-asymmetry check (5.4) on the broader BCBA families (consult_refer_collaborate, more_data, notify_report), per stratum, in either direction.
- Where the distractor side dominates, add or rewrite items so that consulting, referring or collecting more data IS the key:
  - scope of competence: the client's need is outside the BCBA's training, so consult or refer;
  - a medical rule-out before behavioral treatment;
  - data too thin or unstable to support a decision.
- Where the key side dominates (e.g. more-data options keyed too often), add plausible wrong deferral distractors: delaying when the data already support a decision.

**Process for both tracks (no bulk auto-edits).**
1. The builder runs prescreen-v1.3 `cues` and lists the flagged strata.
2. The model drafts one proposal row per item: flag cue_asymmetry_candidate, low, item scope, no hold. The row carries verbatim anchors and a suggested_fix naming the lever and draft text.
3. A named SME approves or rejects each item. Approved edits become new item versions under the existing versioning rules. No script writes item text.
4. Work in batches of about 25 items, and rerun `cues` after each batch. Stop at the target.
5. Thresholds and targets are proposals for the SME and Nisan.

## 5.4 Generic cue-asymmetry check (new; bank-level report, not a row)

For each track (and each track × question_type × outline area stratum) and each phrase family:
- k = keys containing the family / all keys;
- d = distractors containing it / all distractors;
- R = k/d;
- P(key | cue) = key hits / all hits.

Status:
- flag_key_cue: R ≥ 2;
- flag_distractor_cue: R ≤ 0.5;
- both require at least min_count hits (proposed 20 per track, 8 per stratum);
- watch: R between 1.5 and 2, or between 0.5 and 0.67;
- ok otherwise;
- below_min_count: fewer hits than the minimum.

The one-sided binomial p against 1/options is reported for the SME but is not a gate.

Families in v1.3:
- supervisor;
- consult_refer_collaborate;
- more_data;
- notify_report;
- absolute.

The family patterns are in prescreen-v1.3 CUE_FAMILIES, and an SME can add more. On the BCBA track, `BCBA` in an option can mean the examinee, so the SME should check supervisor-family hits there by reading them.

Pilot (14 items): every family is below the minimum count, as expected. RBT supervisor is 4/8 keys vs 1/24 distractors.

## 6. FP table, rows amended
| Flag | Detector | FP prior | Change |
|---|---|---|---|
| key_explanation_divergence (c) numeric | S | the 1638 class is removed | [P5] normalization, weak readings cannot raise |
| key_explanation_divergence (a0) format_only / crossref_only | S | deterministic class; low | new subclasses |
| key_explanation_divergence `text` | S then M | S: most expected to be (a0) | unchanged detection, severity set at M |
| cue asymmetry | bank | n/a | a report, not a row |

## 7. Prescreen v1.3 (prescreen-v1.3.py.txt)
- [P5] Number normalization covers:
  - 0–20, the tens, and hundred (`one hundred and twenty`, `a hundred`);
  - hyphenated and spaced compounds;
  - ordinals (first/1st, twenty-first/21st);
  - percentages (`forty percent`, `40 percent`, `40%`, `40 per cent`);
  - the safe fractions: half, a third of, one/two thirds, `X and a half`.

  `a` is never a number on its own. Weak readings (`one`, `second`, `a third` not followed by `of`, `half-hour`, the value of a digit fraction) can suppress a flag but never raise one. `numbers `<text>`` shows what the normalizer reads.
- [P6] divergence_class and the format cap (5.1).
- [P7] `cues` command, and a cue_asymmetry_by_track block in the bank report.
- Fixtures: 62/62 built-in pass. That is v1.2's 17, the 19 normalizer units, 9 for the 1638 class (v1.2 reproduction, regression, mirror, two true positives, percent, fraction, ordinal, the weak-one guard), 4 format pairs, 8 for 44/46/93 (3 class/severity, 3 anchor verifications, recall floor, citation-gap case), and 5 cue checks.
- With `--exact-texts <builder file>`, a 63rd check asserts that all 21 embedded 44/46/93 strings are byte-exact in the builder's file: 63/63 pass.
- Pilot: `screen` gives the same 13 candidates as v1.2, and `verify` still passes 24/24 rows (76 anchors).
- Not yet measured: the effect on the 1,381 bank candidates. Please rerun S bank-wide and report counts by divergence_class, and blockers before and after.

## 8. Calibration (amends v1.2 section 8)
- Step 3 is done in fixtures (44/46/93 real, recall 3/3). The SME confirms the (a0) reading of 46.
- New step: the builder reruns S + V bank-wide with v1.3 and reports:
  - the blocker count before and after;
  - the number of (c) rows that newly fire on word-number keys;
  - `cues` per track and stratum.
