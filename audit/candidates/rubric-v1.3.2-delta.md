# Navara Pathways: rubric v1.3.2 delta (numeric subclass of 5.1)

PROPOSED, uncertified. This is a review-queue design for a human SME (a BCBA) to certify. Every script row is a candidate, never a verdict.
Author: Tab (Nisan's assistant), 2026-10-26. rubric-v1.3.md and the v1.3.1 delta still stand except where this delta amends them.
Companion file: prescreen-v1.3.2.py.txt. New code is tagged [P10], [P11] and [P12].

## Why
- Tab's v1.3.1 reply crossed with two later Instinct mails: the builder's critique with nine REAL repro cases (1822, 2161, 1424, 1484, 1515, 1613, 1614, 1767, 1942), and the builder's referent-aware draft. That draft cleared 8 of the 9 but added a new false-positive class on the live bank (27, 56, 1564, 1722, 1764, 1769, 1836, 1846, plus 1614 again). Its recommendation was to demote numeric (c) from blocker.
- Agreed. Three rounds of heuristics have each swapped one false-positive class for another, so a script should not hold an item on a number.

## [P10] Severity, amended again: numeric (c) is a consistency report
- Every script-stage numeric row is **LOW**: never high, and never a blocker from any automated stage.
- Each row carries:
  - `tier: consistency_report`
  - `route: sme_batch_consistency_report` (a batched review, not the blocker queue)
  - `hold_inference: false`
  - `blocker_requires: human_verified`
- `referent_match` is the batch's sort key, strongest first:
  1. `same_type_same_noun`
  2. `final_sentence_distractor`
  3. `type_only`
- Blocker is still possible, but only by an SME. The SME sets `verification_status: verified` and adjudicates that the explanation teaches a different answer. Only then do we route to `pull_and_sme_rewrite` with `hold_inference: true`.
- Unchanged: the (a0)/(f) tiers, the [P5] normalizer (1638 stays fixed), and the format-equivalence cap.

## [P11] Merged from the builder's draft (the points where it was better)
1. **Contrast/attribution-aware sentences.** Some sentences attribute values to a wrong procedure, e.g. "25 is the total / middle / median / range", "would give 72%", "comes from forgetting to divide", "if you only average...". These sentences never raise, either in the body comparison or in the final-sentence clause. v1.3.1 cleared real 1515 only because the distractor values there were untyped. With units added ("25 seconds is the total"), v1.3.1 still fired, and the builder's draft did not.
2. **Arithmetic operands never raise; only a computed result can.** Operands are numbers next to +, -, x, /, ÷, "divided by", "multiplied by", "plus", "minus" or "times". A result is a number after "=", "equals", "leaves" or "gives". Operands and attributed values can still AGREE with the key, so they can clear a row; they just can't raise one.
3. **Hyphen compounds are weak (builder critique point 4).** In "two-opportunity session", the number is a weak reading: it can agree or suppress, never raise. Duration and age compounds keep their strength ("a 2-minute drop", "a 3-year-old"). v1.3.1 cleared real 1614 only through a noun mismatch; now the span rule your v1.3 spec called for also holds.

## [P12] Fixtures: real repro replaces synthetic
- The nine synthetic v1.3.1 FP strings are gone. The builder's nine real cases are embedded byte-exact (`bank_evidence` from v13-numeric-fp-repro-7c197a2c.json). `--repro <file>` re-checks equality against the JSON.
  - The repro carries no stems, distractor explanations or citations, so those fields are empty in the fixtures. The (c) check reads only the key text, the explanations and the option texts.
- The v1.3 logic fires on all 9. Its rationales and anchors match the builder's flag rows exactly.
- New fixtures:
  - P11 suppression probes: typed attribution, "would give", "comes from", operand chains, the pooled-count 1614 shape, "first" beside a count, digit fraction, proportion vs percent, and 4/5 written three ways.
  - Computed-result true positives, which must still produce a LOW row: "= 7 tokens" vs key 5, a mean of 5 s vs key 6 s, 75% vs key 60%, and a final sentence endorsing a distractor.
- The P11 probes are SYNTHETIC. They are our guesses at the classes the builder named, not the texts of 27/56/1564/1722/1764/1769/1836/1846, which we do not have.

## Results (local, 2026-10-26)
- Built-in fixtures: 109/109 pass. With `--exact-texts` (44/46/93) and `--repro` (the nine): 111/111.
- Side-by-side on 34 probe cases, made of our v1.3.1 synthetic FP/TP/agreement fixtures plus the new P11 probes. Pass means no row where none is wanted, and a row where one is wanted:
  - v1.3.1: 31/34. It missed the three attribution probes.
  - v1.3.2: 34/34. This is partly circular: the P11 probes were written after seeing those misses.
  - Builder draft: 23/34.
    - Blockers on 5 should-not-fire cases: synthetic 1515, synthetic 1614, none/all, the operand-percent case, and the pooled-count case.
    - Missed 6 true positives: 3rd vs first trial, 5 s outside 2-4 s, five vs 3 call-outs, a computed mean, a computed percent, and a final sentence endorsing a distractor.
- Real repro, numeric rows per item:
  - v1.3 (reproducing the builder's run): 9 blockers.
  - v1.3.1: 0 on all 9.
  - v1.3.2: 0 on all 9.
  - Builder draft: 0 on 8; 1614 is still a blocker.
- Non-numeric rows on the nine: one, unchanged from v1.2. Item 1424 gets the high "explanation shares 4 content words with option 1 but 2 with the key" overlap row: "next correct answer" also appears in the variable-interval distractor. It is probably a false positive, and it is in the v1.2 baseline count.
- 14 pilot items: `screen` output is byte-identical to v1.3.1, 13 candidates and no numeric rows. `verify` on pilot-flags-v1.2.jsonl gives 24/24 rows and 76 anchors byte-exact (with `--inventory`; without it the one tag-inventory row cannot resolve).
- Not measured: the live bank, and the builder's eight new FP ids. That needs either their texts or a builder rerun reporting numeric rows by `referent_match`.

## Known limits
- "N seconds per trial" is typed as a count of "second", not a duration. It cannot raise against a duration key, but it also cannot agree with one.
- ATTRIBUTION is sentence-level and broad. A sentence that both endorses the key's value and attributes a distractor's value is skipped as a whole. That costs some recall, which is acceptable at the LOW report tier.
- Durations without role nouns can still pair unrelated quantities. At LOW in a batched report, that is now queue noise, not a hold.
