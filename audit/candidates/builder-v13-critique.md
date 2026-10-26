# Builder critique: prescreen v1.3 numeric check on the live bank (2026-10-26)

Independent finding, read-only rerun of prescreen-v1.3 `screen` against the
2026-10-25 live bank export (1000 items). Candidates: 1388 (v1.2: 1381).

## What v1.3 fixes (confirmed on the real bank)
- The 1638 class is removed: no numeric flag fires on item 1638. Word-form
  normalization works.
- 44/46/93 classify as designed: 44 low crossref_only, 93 low crossref_only,
  46 high text candidate.

## What v1.3 breaks: 9 new blockers, all false positives
The (c) check compares numbers found in the KEY OPTION TEXT against numbers
found anywhere in the explanation, with no referent matching. Every new
blocker is this class (or a final-sentence variant):

| item | key text number | explanation number | actual relationship |
|---|---|---|---|
| 1822 | "first dressing step" (ordinal) | "2-minute drop" | unrelated quantities |
| 2161 | "90% accuracy" | "all three risks" | unrelated quantities |
| 1424 | "first response" (ordinal) | "FI 2 minutes" (the answer's own value) | unrelated; consistent |
| 1613 | "within 5 s" | "two observers" | unrelated quantities |
| 1942 | "steps 5 through 8" | "four unmastered steps" | AGREE: steps 5-8 are four steps |
| 1484 | "2 to 20 seconds" | "other three choices" | unrelated quantities |
| 1767 | "5 s or more; 30 s" | "two observers" | unrelated quantities |
| 1515 | key "5 seconds" | final sentence names distractor values to explain them away ("Twenty-five is the total, 4 is the middle, 7 is the range") | contrast-unaware final-sentence rule |
| 1614 | key "50%" | "two-opportunity session" | weak reading inside a hyphenated compound - per the v1.3 spec this must be suppressed, not raised; a normalizer bug |

## Root cause and proposed fix
The check treats "number in key" and "number in explanation" as comparable
without establishing that they measure the same thing. Normalization widened
recall into prose ordinals and counts, multiplying exactly this flaw.

Proposed direction (draft, for SME/coordinator review):
1. Restrict (c) to items whose key IS a numeric answer (the keyed option's
   text is a bare quantity: "5 seconds", "50%", "FI 2 minutes" style) - the
   1515/1614/1424 shape. A key that merely CONTAINS a number ("within 5 s of
   the peer arriving", "steps 5 through 8") is not a numeric key; skip (c).
2. For numeric keys, compare the key's quantity set against the explanation's
   FINAL-ANSWER position only (the value the explanation arrives at), not
   every number in the explanation. Intermediate working (2+9+3+4+7) and
   counts of other things (risks, observers, steps) are not the answer.
3. Final-sentence rule must be contrast-aware: a sentence that names
   distractor values to attribute them ("X is the total, Y is the middle")
   is teaching, not endorsing. At minimum require the keyed value's absence
   AND no attribution verb pattern before flagging.
4. Weak readings inside hyphenated/attributive compounds ("two-opportunity
   session", "half-hour") must never reach the comparison set - fix the
   normalizer's span handling per the v1.3 spec.

Until then: treat all numeric (c) blockers as a consistency-report tier, not
queue blockers. This matches ChatGPT's text-difference vs semantic-conflict
split.
