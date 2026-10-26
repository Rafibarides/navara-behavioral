# Evidence-schema test method notes

## Append-only guard: what was proven, and what was NOT

The v3 append-only triggers (`forbid_mutation` on `item_presentation_event`,
`review_event`) were validated 2026-10-26 as follows:

- A probe row was INSERTed, then DELETE was attempted and correctly refused
  with `insufficient_privilege` ("append-only (DELETE refused)").
- The probe row was then removed by the TABLE OWNER temporarily disabling the
  trigger (`ALTER TABLE ... DISABLE TRIGGER`), deleting, and re-enabling.

Consequence: these triggers are a workflow guard against ordinary writes,
NOT unbypassable immutability. The table owner (and any role with ALTER
privilege, e.g. service_role) can disable or drop them. No report may
describe them as tamper-proof. If tamper-evidence is ever required, it needs
a different mechanism (e.g. WORM storage, hash chaining verified externally,
or a separate audit sink under a different role).

## Preferred probe method

Future trigger/constraint probes must run inside a transaction that ROLLS
BACK (`BEGIN; ...probe...; ROLLBACK;`) or use savepoints, so no test row can
outlive the test and no protection needs to be disabled for cleanup. The
review_event logging test on 2026-10-26 used this method (3 events logged,
all rolled back).

## RPC identity tests (2026-10-26)

- PostgREST HTTP, anon key only: 400 "not authorized".
- PostgREST HTTP, garbage bearer token: 401.
- PostgREST HTTP, real member JWT (Tester, role=member): 400 "not authorized".
- psql JWT-claim simulation, member identity: refused.
- psql JWT-claim simulation, admin identity: 1405 rows returned.
- NOT covered: a second distinct member account, service-role path,
  PostgREST behavior under a leaked-but-valid member JWT replayed cross-user
  (same as member test, since the RPC keys off is_admin(), not user id).
