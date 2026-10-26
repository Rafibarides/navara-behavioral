# Privilege-Cutover Matrix - DRAFT (nothing applied; verified against live DB 2026-10-26 ~01:53 ET)

Maps every path that reads `public.questions`, its security mode, the columns it can
expose, and the cutover action required before serve_items becomes the only
protected-content path. Cutover itself is owner-gated; this is the spec it would execute.

## Content-bearing objects (must change)

| Object | Mode | Granted to | Exposes | Cutover action |
|---|---|---|---|---|
| `public.questions` direct SELECT (R1/R2) | RLS policy "paid members read published questions" | authenticated (paid/staff) | ALL columns incl. body/options/answer/explanation/citation | Regrant column-level: keep SELECT(id,track,area,published,question_type,difficulty,outline_tag,created_at); revoke body/options/answer/explanation/citation. RLS policy stays on top. Must ship in the same deploy as the client serve_items switch. |
| `public.adaptive_set` (R3) | SECURITY INVOKER, returns SETOF questions | authenticated | FULL rows; caller-controlled p_tags/p_limit = enumeration endpoint for any paid member | Replace: revoke EXECUTE from authenticated; adaptive selection moves inside the definer serve path which re-checks published+paid/staff itself. |
| Static bundle R4 (`src/pathways/data/questions.js`, 20 items) | n/a (offline) | everyone | 20 sample items incl. keys | No DB action possible. Owner sample-overlap policy decides whether sample exposure is recorded or overlapping paid items are excluded from freshness claims. Until then: unknown exposure, never freshness-supporting. |

## Metadata-only objects (keep; verify column deps survive)

| Object | Mode | Returns | questions columns needed | Notes |
|---|---|---|---|---|
| `public.member_evidence` | invoker | tag/label/counts/areas | `area` only | Keep `area` in the readable set. |
| `public.member_missed_questions` | invoker | question_id, missed_at | none (attempts only) | Client fetches content separately - that leg goes through serve_items post-cutover. |
| `public.admin_question_stats` | definer + is_admin() guard | aggregates + left(body,90) | body (admin) | Admin path unchanged; is_admin() guard verified present. |
| `public.admin_tag_coverage`, `admin_content_quality`, `admin_area_coverage` | definer + is_admin() guard | aggregates only | options parsed internally, not returned | Unchanged. Guards verified present. |
| `pathways_evidence.pathways_source_items/attempts/options` | views, owner postgres | - | all (internal) | NO grants to anon/authenticated/service_role (verified). Unchanged. |

## Denial tests (post-cutover acceptance, real JWTs, staging)

Under anon, sample(no plan), self-study, guided, expired-plan, staff, admin:
1. Direct SELECT body/options/answer/explanation/citation -> permission denied for every non-staff role; id/track/area still readable for paid.
2. adaptive_set EXECUTE -> denied for authenticated; admin/staff path unaffected.
3. serve_items: entitled member gets content + delivery ids; unpaid/expired -> explicit entitlement error (NOT silent empty set - distinguishes denial from no-inventory).
4. Every previously available route retried: any successful content retrieval must correspond to a committed served_exposure row.
5. Regression: practice, timed, targeted review, adaptive all return working sets for entitled members; member_evidence dashboard unchanged (area dependency preserved).
6. Enumeration: serve_items rejects p_limit/page abuse beyond route policy (batch cap per route), and item ids outside the member's track/entitlement.

## Verified facts this matrix rests on (live DB, this session)

- All 4 admin RPCs have working is_admin() guards (verified in function source).
- adaptive_set is SECURITY INVOKER: unpaid members silently get 0 rows today; paid members can pull the full published bank in arbitrary-limit random pages.
- No pathways_evidence view/table is granted to member roles.
- No live view uses security_invoker today; the three source views run as owner postgres but are ungranted, so they do not bypass RLS for members.
- The RLS policy is the ONLY thing between a paid JWT and the full bank today; there is no column-level restriction at all.
