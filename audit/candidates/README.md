# Audit candidate queue (unreviewed)

Staged into `pathways_evidence.item_audit_flag` (Supabase) on 2026-10-26.

- `pilot-flags.jsonl` - Tab pilot audit, 24 model flags on 12 items. 17
  source_verified (quoted text matches the live bank), 7 quote_mismatch
  (rationales quote paraphrased text; trust IDs/flag types, verify quotes).
- `script-flags.jsonl` - prescreen.py (Tab rubric v1) run against the full
  live 1000-item bank, 1473 mechanical candidates. Known noise classes:
  citation_chapter_title_mismatch (30) is one false-positive class (Cooper
  Ch.5 keyword map too strict); why_tempting_role_conflict (162) is inflated
  by a narrow contrast-word regex.
- `prescreen.py` - the exact script that produced script-flags.jsonl.

All rows are candidates, not verdicts: verification_status/adjudication_status
gate everything, hold_inference stays false until a human reviewer confirms.
No flag automatically unpublishes, edits, or disables evidence.
