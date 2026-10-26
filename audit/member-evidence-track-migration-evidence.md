# Track-Scoped Member Evidence - Migration Evidence (builder, 2026-10-26) - DRAFT, nothing applied

Recommendation backed by the evidence below: DROP-IN REPLACEMENT (CREATE OR REPLACE
on the original names), not caller migration. Live mutation stays held until
readiness/authority is resolved; this document only establishes that the replacement
path is the grounded one.

## 1. Caller surface (verified by repo search 2026-10-26)

Exactly two call sites, both in navara-site/src/pathways/lib/db.js:
- fetchMemberEvidence()  -> sb.rpc('member_evidence')
- fetchMissedQuestions() -> sb.rpc('member_missed_questions', { p_tag: tag })
No other callers in site code or SQL. Both functions are SECURITY INVOKER, granted
EXECUTE to authenticated (adaptive_p1.sql:94, review_missed.sql:20).

Signatures are identical between originals and scoped versions:
- member_evidence() returns the same 10-column shape, same names/types/order.
- member_missed_questions(text) returns the same 2-column shape.
Therefore CREATE OR REPLACE under the original names requires ZERO caller changes;
the scoped draft bodies were wrapped under the original names in the test to prove
the replacement is expressible as-is (see test header).

## 2. Behavioral evidence (8/8, real schema, rolled back; audit/member-evidence-track-migration-tests.sql)

- M1 cross-track defect fixed under the REPLACED names: member with rbt profile and
  misses in both tracks on a shared tag no longer gets a cross-track pattern (0 rows
  vs 3/3 unscoped); missed list returns only the own-track question.
- M2 single-track regression: a same-track member's pattern (2/2/emerging) and missed
  list (2 rows) are IDENTICAL before/after replacement. No behavior change for the
  common case.
- M3 null-track profile (signup trigger default, never chose a track): fails closed,
  0 rows, no error.
- M4/M5 simulated member role (SET ROLE authenticated + request.jwt.claims):
  functions execute, and RLS confines results to the caller's own attempts.
- M6 anon: permission denied (42501), same posture as originals.
- Boundary: M4-M6 SIMULATE the PostgREST role via SET ROLE + JWT claims; real-JWT
  acceptance remains post-implementation cutover work. Original function bodies on
  live are untouched (verified post-run: scoped functions do not exist, fixtures gone).

## 3. Remaining steps (held under current boundary)

1. Owner/Main go for the live replacement (one migration: CREATE OR REPLACE x2,
   grants unchanged - already present on the original names).
2. Post-apply verification: rerun M1-M6 against live as the acceptance suite.
3. Real-JWT (PostgREST) acceptance as part of the broader cutover work.
