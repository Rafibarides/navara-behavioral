// Within-plan opt-in only. Authenticated principal supplied by server, never request payload.
import { policyHash } from "./program.mjs";
export function initialLessonState(memberId, policy, now) {
  return {
    memberId,
    policyVersion: policy.id,
    policyHash: policyHash(policy),
    domainCounts: {},
    sessionAnswered: 0,
    sessionStarted: now,
    sessionSeq: 1,
    exposures: [],
    helpedFamilies: [],
    firstAnsweredItems: [],
    answerReceiptIds: [],
    declinedContrasts: [],
  };
}
export function optInActivation({ program, sql, policy, manifest, track }) {
  return {
    async run(identity, command) {
      if (
        identity?.track !== track || track !== "rbt" ||
        identity?.plan !== "guided"
      ) throw Error("guided_rbt_required");
      if (command.action === "enroll_lessons" || command.action === "status") {
        const enrolled = await sql.begin(async (tx) => {
          await tx`select pg_advisory_xact_lock(hashtextextended('bcba-program:'||${identity.id},0))`;
          const a =
            await tx`select pathways_bcba.lock_member_access(${identity.id}::uuid,${track}) ok`;
          if (!a[0]?.ok) throw Error("guided_rbt_required");
          const r = await tx`select pathways_bcba.lock_release_enabled() ok`;
          if (!r[0]?.ok) throw Error("release_unavailable");
          const unique =
            await tx`select id from pathways_bcba.policy_version where status='approved' and withdrawn_at is null and authority_ref is not null and policy->>'track'=${track}`;
          if (unique.length !== 1 || unique[0].id !== policy.id) {
            throw Error("serving_configuration_not_unique");
          }
          const p =
            await tx`select pathways_bcba.lock_policy_assert(${policy.id},${
              policyHash(policy)
            },${tx.json(policy)}) ok`;
          if (!p[0]?.ok) throw Error("policy_changed");
          const m =
            await tx`select pathways_bcba.lock_manifest_assert(${manifest.version},${
              tx.json(manifest.payload)
            },${policy.id},false) ok`;
          if (!m[0]?.ok) throw Error("manifest_changed");
          const existing =
            await tx`select member_id from pathways_bcba.program_state where member_id=${identity.id}::uuid`;
          if (existing.length) return true;
          if (command.action === "status") return false;
          const rows = await tx`select clock_timestamp()::text now`;
          const state = initialLessonState(identity.id, policy, rows[0].now);
          await tx`insert into pathways_bcba.program_state(member_id,policy_version,state,enrollment_evidence) values(${identity.id}::uuid,${policy.id},${
            tx.json(state)
          },${
            "Authenticated member explicitly selected Start Guided lessons; request " +
            command.nonce
          }) on conflict(member_id) do nothing`;
          return true;
        });
        if (!enrolled) return { enrollmentRequired: true };
        if (command.action === "enroll_lessons") {
          return program.run(identity, {
            ...command,
            action: "status",
            payload: {},
          });
        }
      }
      return program.run(identity, command);
    },
  };
}
