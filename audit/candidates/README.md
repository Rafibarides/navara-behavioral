# Audit candidate queue (unreviewed)

Staged into `pathways_evidence.item_audit_flag` (Supabase). Read surface:
`public.admin_review_queue(p_status)` (admin-only, read-only; supabase/review_queue.sql).

Current open rows (2026-10-26):
- `pilot-flags-v1.2.jsonl` - Tab pilot audit v1.2, 24 model flags on 12 items,
  all byte-anchored (independently re-verified 24/24 against the live bank).
  hold_inference forced false on import: the item-1439 hold in the artifact is
  a model proposal, not human adjudication. 37/40 key items await SME ruling.
- `prescreen-v1.2.py` output - 1381 script candidates. v1.2 fixes the v1 noise
  classes (citation Ch.5 false positives 30 -> 0; why_tempting 162 -> 52) and
  adds key_explanation_divergence (8 blocker + 43 high; catches builder-found
  items 44/46/93). New noise class spotted: numeric key/explanation checks
  miss word-form numerals (item 1638 blocker is a false positive: "Three" vs
  "3"). Bank-level: RBT supervisor-cue asymmetry 120/500 keys vs 44/1500
  distractors; key positions balanced 251/250/249/250.

Closed (superseded, preserved): pilot-flags.jsonl v1 (24, 7 quote_mismatch),
prescreen.py v1 output (1473). All rows are candidates, never verdicts:
verification_status/adjudication_status gate everything; hold_inference stays
false until a human reviewer confirms. No flag auto-unpublishes or edits.
