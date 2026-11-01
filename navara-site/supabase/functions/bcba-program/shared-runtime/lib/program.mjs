import { createHash } from "node:crypto";
import { figurePinDigest, validateFigurePin } from "./figure-pin.mjs";
// Private BCBA orchestration candidate. No production caller or approved defaults.
export class ProgramError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
const fail = (code) => {
  throw new ProgramError(code);
};
const instant = (x) => {
  const n = Date.parse(x);
  if (!Number.isFinite(n)) fail("invalid_server_time");
  return n;
};
export function policyHash(p) {
  const stable = (x) =>
    Array.isArray(x)
      ? x.map(stable)
      : x && typeof x === "object"
      ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, stable(x[k])]))
      : x;
  return createHash("sha256").update(JSON.stringify(stable(p))).digest("hex");
}
// Engine track binding (reviewer track-gate finding): the loader REQUIRES the
// policy to declare its track and to match the only track this engine serves.
// The track_readiness_facts draft's track_policy/track_manifest existence
// checks stay informational until this binding is what the loader enforces -
// now it is: a policy or manifest without the matching track key fails closed.
// Bounded BCBA binding ONLY: this engine serves the bcba track and nothing
// else. This constant does NOT enable, complete, or imply any other track's
// readiness or shared-track support; each other track needs its own reviewed
// policy/manifest/content and loader evidence before it can bind.
export const ENGINE_TRACK = "bcba";
export function validatePolicy(p, track = ENGINE_TRACK) {
  if (
    !p?.id || !p.approvalEvidence || !["draft", "approved"].includes(p.status)
  ) fail("explicit_policy_required");
  if (p.track !== track) fail("policy_track_mismatch");
  if (
    !Number.isSafeInteger(p.sessionSize) || p.sessionSize < 1 ||
    p.sessionSize > 40
  ) fail("invalid_session_size");
  if (
    !Number.isSafeInteger(p.minimumIndependentMisses) ||
    p.minimumIndependentMisses < 2
  ) fail("invalid_evidence_threshold");
  if (
    !Number.isSafeInteger(p.windowDays) || p.windowDays < 1 ||
    !Number.isSafeInteger(p.delayHours) || p.delayHours < 1
  ) fail("invalid_spacing");
  if (
    !Array.isArray(p.domains) || p.domains.length !== 9 ||
    new Set(p.domains.map((d) => d.id)).size !== 9 ||
    p.domains.some((d) => !d.id || !Number.isInteger(d.weight) || d.weight < 1)
  ) fail("nine_domain_blueprint_required");
  // itemReturn scoped shape (1712 v0.4.1, adopted 2026-10-28 under user
  // "Ask the chat"/"Great go" + room Claude#67838/dot#67839, hosted T1-T9 PASS
  // gate before ON): EXACTLY {enabled, spacing:{minSessionsLater>=1},
  // resolvedAfter>=1}; any other key/value/shape refuses, unknown keys reject.
  // Absent field = returns OFF (inert). Tunings are build values per spec
  // rules 3/7 (fixed clocks removed), never clinical policy; no caps/windows.
  if (p.itemReturn !== undefined) {
    const ir = p.itemReturn;
    if (!ir || typeof ir !== "object" || Array.isArray(ir)) {
      fail("item_return_not_approved");
    }
    if (
      JSON.stringify(Object.keys(ir).sort()) !==
        JSON.stringify(["enabled", "resolvedAfter", "spacing"])
    ) fail("item_return_not_approved");
    if (typeof ir.enabled !== "boolean") fail("item_return_not_approved");
    if (
      !ir.spacing || typeof ir.spacing !== "object" ||
      JSON.stringify(Object.keys(ir.spacing)) !== '["minSessionsLater"]'
    ) fail("item_return_not_approved");
    if (
      !Number.isSafeInteger(ir.spacing.minSessionsLater) ||
      ir.spacing.minSessionsLater < 1
    ) fail("item_return_not_approved");
    if (!Number.isSafeInteger(ir.resolvedAfter) || ir.resolvedAfter < 1) {
      fail("item_return_not_approved");
    }
    // resolvedAfter counts correct return answers in the CURRENT cycle only
    // (room #67886-4, 1712 rule 4 tuning): re-entry bumps the pair cycle, so a
    // prior cycle's corrects never resolve a re-opened pair. Any integer >=1.
  }
  return p;
}
export function qualifyContrast(
  { receipts, contrast, policy, now, coverageSince, track = ENGINE_TRACK },
) {
  validatePolicy(policy, track);
  const t = instant(now),
    since = instant(coverageSince),
    cutoff = Math.max(since, t - policy.windowDays * 86400000);
  if (
    !contrast?.approved || !contrast.reviewEvidence ||
    !contrast.mappingVersion || !contrast.id
  ) return { qualified: false, reason: "contrast_unreviewed" };
  const first = new Map();
  for (
    const r of [...receipts].sort((a, b) =>
      instant(a.serverAnsweredAt) - instant(b.serverAnsweredAt) ||
      String(a.id).localeCompare(String(b.id))
    )
  ) {
    if (
      r.memberId !== contrast.memberId || r.track !== track ||
      r.contrastId !== contrast.id ||
      r.mappingVersion !== contrast.mappingVersion
    ) continue;
    if (!r.familyId || first.has(r.familyId)) continue;
    first.set(r.familyId, r);
  }
  const excluded = [];
  const eligible = [...first.values()].filter((r) =>
    r.serverConfirmed && r.contentVerified && r.independenceVerified &&
    r.evidenceClass === "unassisted_first_response" && !r.helpBeforeAnswer &&
    !r.knownPriorExposure && instant(r.serverAnsweredAt) >= cutoff &&
    instant(r.serverAnsweredAt) <= t
  );
  for (const r of first.values()) {
    if (!eligible.includes(r)) {
      excluded.push({
        receiptId: r.id,
        familyId: r.familyId,
        reason: !r.serverConfirmed
          ? "unconfirmed"
          : !r.contentVerified
          ? "content_unverified"
          : !r.independenceVerified
          ? "independence_unverified"
          : r.helpBeforeAnswer
          ? "helped"
          : r.knownPriorExposure
          ? "known_prior_exposure"
          : r.evidenceClass !== "unassisted_first_response"
          ? "ineligible_evidence_class"
          : "outside_qualifying_window",
      });
    }
  }
  const matches = eligible.filter((r) =>
      r.correct === false && r.selectedMapping === contrast.id
    ),
    correct = eligible.filter((r) => r.correct === true);
  return {
    qualified: matches.length >= policy.minimumIndependentMisses &&
      correct.length === 0,
    reason: correct.length
      ? "mixed_responses"
      : matches.length >= policy.minimumIndependentMisses
      ? "repeated_selected_alternative"
      : "insufficient_independent_responses",
    receiptIds: matches.map((r) => r.id),
    correctReceiptIds: correct.map((r) => r.id),
    otherWrongReceiptIds: eligible.filter((r) =>
      r.correct === false && r.selectedMapping !== contrast.id
    ).map((r) => r.id),
    excluded,
    claim: "selected_answer_observation_only",
    since: new Date(cutoff).toISOString(),
  };
}
// Deterministic blueprint deficit, not random top-tag routing. Each item's owner
// is resolved by the server and its first response is the only coverage count.
export function nextDomain(
  policy,
  counts,
  excluded = [],
  track = ENGINE_TRACK,
) {
  validatePolicy(policy, track);
  const total = Object.values(counts).reduce((a, b) => a + b, 0),
    sum = policy.domains.reduce((a, b) => a + b.weight, 0);
  return [...policy.domains].filter((d) => !excluded.includes(d.id)).sort((
    a,
    b,
  ) =>
    ((total + 1) * b.weight / sum - (counts[b.id] || 0)) -
      ((total + 1) * a.weight / sum - (counts[a.id] || 0)) ||
    a.id.localeCompare(b.id)
  )[0]?.id || null;
}
export function decideNext({ state, policy, now, track = ENGINE_TRACK }) {
  validatePolicy(policy, track);
  instant(now);
  if (state.withdrawn) {
    return { kind: "unavailable", reason: "access_withdrawn" };
  }
  if (state.completedSession && !state.sessionStarted) {
    return { kind: "session_complete", summary: state.completedSession };
  }
  // Pending server delivery always wins, so refresh cannot allocate another case.
  if (state.pendingDelivery) {
    return {
      kind: "answer",
      deliveryId: state.pendingDelivery.id,
      phase: state.pendingDelivery.phase,
    };
  }
  // Session length counts ordinary blueprint responses only; an active episode
  // never consumes session budget, and a full session defers episode work to the
  // next session without losing it. A committed pending delivery still wins.
  if (state.sessionAnswered >= policy.sessionSize) {
    return { kind: "finish_session" };
  }
  const active = state.episode;
  if (active && !active.paused) {
    if (active.reserveReceipt && active.origin !== "catalog_followup") {
      return {
        kind: "episode_result",
        episodeId: active.id,
        receiptId: active.reserveReceipt.id,
        claim: "one_response_not_mastery",
      };
    }
    // 1508 immediate fresh checks: a catalog follow-up episode's prerequisite
    // (reviewed helped completion) was satisfied at creation; it serves its
    // cold-classified reserve checks IMMEDIATELY (dueAt=now) - never the 1712
    // delayed-return clock. Helped catalog receipts are NEVER inherited as
    // independent evidence: freshness is classified per-member from the live
    // ledgers against the RESERVE family only.
    if (active.origin === "catalog_followup") {
      const served = active.reserveReceipts?.length ?? 0;
      if (served >= (active.expectedReserves ?? 1)) {
        return {
          kind: "episode_result",
          episodeId: active.id,
          receiptId: active.reserveReceipt?.id,
          claim: "one_response_not_mastery",
          ...(active.inventoryNotice
            ? { inventoryNotice: active.inventoryNotice }
            : {}),
        };
      }
      return { kind: "later_check", episodeId: active.id };
    }
    // Catalog curriculum episodes complete on taught + helped-applied receipts
    // (documented instructional application, NEVER mastery). This branch sits
    // BEFORE the delayed-check branch: catalog modules have NO reserve inventory
    // (none authored/qualified), so scheduled/later_check never applies to them.
    const practiced = active.practiceReceipts?.length ??
      (active.practiceReceipt ? 1 : 0);
    const expectedPractice = active.practiceAssetCount ?? 1;
    if (
      active.catalogModuleId && active.teachingReceipt &&
      practiced >= expectedPractice
    ) {
      return {
        kind: "curriculum_result",
        episodeId: active.id,
        claim: "helped_application_not_mastery",
      };
    }
    if (
      practiced >= expectedPractice &&
      (active.practiceReceipt || active.practiceReceipts?.length)
    ) {
      if (instant(now) >= instant(active.dueAt)) {
        return { kind: "later_check", episodeId: active.id };
      }
      return {
        kind: "scheduled",
        episodeId: active.id,
        dueAt: active.dueAt,
        nextDomain: nextDomain(policy, state.domainCounts || {}, [], track),
      };
    }
    if (active.teachingReceipt) {
      return { kind: "helped_practice", episodeId: active.id };
    }
    return {
      kind: "teaching",
      episodeId: active.id,
      claim: active.origin === "explicit_choice"
        ? "learner_choice_not_inference"
        : "selected_answer_observation_only",
    };
  }
  if (state.suggestion?.qualified) {
    return {
      kind: "suggested_focus",
      contrastId: state.suggestion.contrastId,
      evidence: state.suggestion.evidence,
      claim: "selected_answer_observation_only",
    };
  }
  return {
    kind: "blueprint_case",
    domain: nextDomain(policy, state.domainCounts || {}, [], track),
  };
}

// ONE typed member source-exposure evaluator, shared by serve AND answer.
// Channels actually read (all five): answer_context receipts (version hash),
// pathways_evidence.learner_feedback_receipt (exact feedback content hash),
// public.attempts (bare, no verifiable version), item_presentation_event
// (stem-only presentation - recorded, NOT answer-bearing help), and
// teaching_exposure (content version; related_families OR payload selection
// familyId). A bridge attempt paired with a receipt/feedback record on the
// same item is the SAME answer-bearing event, so it is deduplicated to its
// versioned record; a surviving bare attempt is answer-bearing with unknown
// version, never known.
export async function memberSourceExposure(
  sql,
  memberId,
  {
    familyId = null,
    itemId = null,
    familyFor = null,
    excludeAttemptId = null,
    excludeDeliveryId = null,
    track,
  } = {},
) {
  if (!track) throw Error("explicit_track_required");
  const facts = [];
  const fam = familyFor || ((id) => "ITEM:" + id);
  // EVENT-level dedup: a versioned record (answer_context receipt_id, feedback
  // receipt attempt_id) identifies the SAME answer event as one public.attempts
  // row; only that event dedups. ANY other bare attempt on the same item stays
  // answer-bearing with unknown version - one known event never washes out
  // another unknown one.
  const versionedEvents = new Set();
  const excl = (a) =>
    excludeAttemptId != null && String(a) === String(excludeAttemptId);
  if (itemId != null) {
    for (
      const r
        of await sql`select context,receipt_id from pathways_bcba.answer_context where member_id=${memberId}::uuid and context->>'itemId'=${
          String(itemId)
        }`
    ) {
      if (excl(r.receipt_id)) continue;
      facts.push({
        kind: "receipt",
        family: r.context?.familyId || familyId || null,
        itemId: String(itemId),
        contentHash: r.context?.contentHash || null,
      });
      if (r.receipt_id) versionedEvents.add(String(r.receipt_id));
    }
    for (
      const r
        of await sql`select attempt_id,content_hash from pathways_evidence.learner_feedback_receipt where member_id=${memberId}::uuid and question_id=${itemId}`
    ) {
      if (excl(r.attempt_id)) continue;
      facts.push({
        kind: "feedback_receipt",
        family: familyId || fam(itemId),
        itemId: String(itemId),
        contentHash: r.content_hash || null,
      });
      if (r.attempt_id) versionedEvents.add(String(r.attempt_id));
    }
    for (
      const r
        of await sql`select id from pathways_bcba.member_attempts(${memberId}::uuid, ${itemId})`
    ) {
      if (excl(r.id) || versionedEvents.has(String(r.id))) continue;
      facts.push({
        kind: "attempt",
        family: familyId || fam(itemId),
        itemId: String(itemId),
        contentHash: null,
      });
    }
    if (
      (await sql`select 1 from pathways_evidence.item_presentation_event where member_id=${memberId}::uuid and track=${track} and item_id=${
        String(itemId)
      } ${
        excludeDeliveryId
          ? sql`and item_delivery_id is distinct from ${excludeDeliveryId}::uuid`
          : sql``
      } limit 1`).length
    ) {
      facts.push({
        kind: "presentation",
        family: familyId || fam(itemId),
        itemId: String(itemId),
      });
    }
  }
  if (familyId) {
    for (
      const r
        of await sql`select context,receipt_id from pathways_bcba.answer_context where member_id=${memberId}::uuid and context->>'familyId'=${familyId}`
    ) {
      if (excl(r.receipt_id)) continue;
      const it = r.context?.itemId != null ? String(r.context.itemId) : null;
      facts.push({
        kind: "receipt",
        family: familyId,
        itemId: it,
        contentHash: r.context?.contentHash || null,
      });
      if (r.receipt_id) versionedEvents.add(String(r.receipt_id));
    }
    for (
      const r
        of await sql`select question_id,attempt_id,content_hash from pathways_evidence.learner_feedback_receipt where member_id=${memberId}::uuid`
    ) {
      if (fam(r.question_id) !== familyId || excl(r.attempt_id)) continue;
      facts.push({
        kind: "feedback_receipt",
        family: familyId,
        itemId: String(r.question_id),
        contentHash: r.content_hash || null,
      });
      if (r.attempt_id) versionedEvents.add(String(r.attempt_id));
    }
    for (
      const r
        of await sql`select content_version from pathways_bcba.teaching_exposure where member_id=${memberId}::uuid and (${familyId}=any(related_families) or payload->'selection'->>'familyId'=${familyId})`
    ) {
      facts.push({
        kind: "teaching",
        family: familyId,
        contentVersion: r.content_version || null,
      });
    }
    for (
      const r
        of await sql`select id,question_id from pathways_bcba.member_attempts(${memberId}::uuid)`
    ) {
      if (
        fam(r.question_id) !== familyId || excl(r.id) ||
        versionedEvents.has(String(r.id))
      ) continue;
      facts.push({
        kind: "attempt",
        family: familyId,
        itemId: String(r.question_id),
        contentHash: null,
      });
    }
    for (
      const r
        of await sql`select item_id from pathways_evidence.item_presentation_event where member_id=${memberId}::uuid and track=${track} ${
          excludeDeliveryId
            ? sql`and item_delivery_id is distinct from ${excludeDeliveryId}::uuid`
            : sql``
        }`
    ) {
      if (fam(r.item_id) === familyId) {
        facts.push({
          kind: "presentation",
          family: familyId,
          itemId: String(r.item_id),
        });
      }
    }
  }
  return facts;
}
const ANSWER_BEARING = new Set([
  "receipt",
  "feedback_receipt",
  "attempt",
  "teaching",
]);
// EVERY answer-bearing fact must individually resolve to a KNOWN typed source
// matching the disposition pins: one known fact never washes out another
// unknown fact. Presentation-only exposure is not answer-bearing help and
// never by itself blocks an ordinary transfer.
export function evaluateTransfer(facts, pin) {
  const ab = facts.filter((x) => ANSWER_BEARING.has(x.kind));
  if (!ab.length) {
    return { status: "allowed", edge: "allowed_transfer_reviewed" };
  }
  const known = (x) =>
    ((x.kind === "receipt" || x.kind === "feedback_receipt") &&
      pin?.deliveryContentHash && x.contentHash &&
      x.contentHash === pin.deliveryContentHash) ||
    (x.kind === "teaching" && pin?.sourceTeachingVersion && x.contentVersion &&
      x.contentVersion === pin.sourceTeachingVersion);
  return ab.every(known)
    ? { status: "allowed", edge: "allowed_transfer_reviewed" }
    : { status: "unresolved", edge: "unresolved_source_version" };
}
function publicDelivery(d) {
  return {
    id: d.id,
    phase: d.phase,
    body: d.body,
    options: d.options?.map((o) => ({ text: o.text })),
    domain: d.selection?.domain || d.domain,
    figure: d.selection?.figure || d.figure || null,
    serveLabel: d.serveLabel || null,
    ...(d.returnMeta
      ? {
        returnMeta: {
          flag: true,
          enqueuedAt: d.returnMeta.enqueuedAt,
          contrast: !!d.returnMeta.contrast,
        },
      }
      : {}),
  };
}
// A teaching step reveals ONLY the evidence and the alternatives: the defensible
// index and the per-choice feedback stay server-side until the learner commits.
function publicTeachingStep(sel, step) {
  const s = sel.interaction.steps[step];
  return {
    step,
    totalSteps: sel.interaction.steps.length,
    evidence: s.evidence,
    learnerTask: s.learnerTask,
    alternatives: s.alternatives.map((t) => typeof t === "string" ? t : t.text),
    figure: s.figure || null,
  };
}
// Teaching exposure is PRESENTATION-owned, not completion-owned: the first serve of
// any answer-bearing step writes a partial-exposure record and marks the taught
// family and its related lineages helped immediately, so leaving mid-interaction
// can never erase exposure or let a related family return as a fresh check.
async function recordTeachingPresentation(
  tx,
  state,
  selection,
  step,
  now,
  uuid,
) {
  state.episode.teachingPresented = state.episode.teachingPresented || [];
  if (state.episode.teachingPresented.includes(step)) return;
  state.episode.teachingPresented.push(step);
  // The exposure record pins the EXACT figure version shown on this step (no
  // graph shown -> null, never a graph claim without the pinned asset).
  {
    const fig = selection.interaction?.steps?.[step]?.figure;
    await tx.recordTeaching({
      id: uuid(),
      episodeId: state.episode.id,
      selection,
      serverAt: now,
      evidenceClass: "teaching_presentation_partial",
      step,
      figureVersion: fig ? figurePinDigest(fig) : null,
    });
  }
  for (
    const family of [
      selection.familyId,
      ...(selection.disqualifyingFamilies || selection.relatedFamilies || []),
    ]
  ) {
    if (family && !state.helpedFamilies.includes(family)) {
      state.helpedFamilies.push(family);
    }
  }
}
function validateTeachingInteraction(selection) {
  const steps = selection.interaction?.steps;
  if (
    !Array.isArray(steps) || steps.length < 1 ||
    steps.some((s) =>
      !s || typeof s.evidence !== "string" ||
      typeof s.learnerTask !== "string" || !Array.isArray(s.alternatives) ||
      s.alternatives.length < 2 || !Number.isInteger(s.defensible) ||
      s.defensible < 0 || s.defensible >= s.alternatives.length ||
      !s.feedback ||
      s.alternatives.some((_, i) => typeof s.feedback[i] !== "string") ||
      (s.figure !== undefined && !validateFigurePin(s.figure))
    )
  ) fail("teaching_interaction_invalid");
}
function publicReceipt(r) {
  return {
    id: r.id,
    deliveryId: r.deliveryId,
    serverConfirmed: r.serverConfirmed,
    serverAnsweredAt: r.serverAnsweredAt,
    correct: r.correct,
    feedback: r.feedback,
    claim: r.claim,
    evidenceClass: r.evidenceClass,
    independenceVerified: r.independenceVerified,
    knownPriorExposure: r.knownPriorExposure,
    helpBeforeAnswer: r.helpBeforeAnswer,
    firstUnaidedItem: r.firstUnaidedItem,
    lineageResolved: r.lineageResolved,
    familyRegistryVersion: r.familyRegistryVersion,
    serveWriteDiscrepancy: r.serveWriteDiscrepancy,
  };
}
function publicSuggestion(s) {
  return s
    ? {
      contrastId: s.contrastId,
      qualified: s.qualified,
      evidence: {
        receiptIds: s.evidence.receiptIds,
        claim: "selected_answer_observation_only",
      },
    }
    : null;
}

export function createProgram(
  {
    repository,
    content,
    transport,
    policy,
    clock,
    uuid,
    production = false,
    manifest = null,
    allowLedgerless = false,
    track = ENGINE_TRACK,
  },
) {
  // Shared-track PREP ONLY: the track is a parameter so the binding points are
  // explicit, but NON-BCBA CONSTRUCTION IS REFUSED until the full
  // storage/transport/provider/exposure-graph track gates are designed and
  // reviewed (the graph, receipt filters, selection and provider queries still
  // carry bcba scope). A foreign-track engine is never partially enabled: it
  // cannot be constructed, so no staged RBT policy can pass into BCBA-scoped
  // data. No readiness is inferred for any track.
  // Track enablement registry (RBT gate): a track is servable ONLY when listed
  // here AND bound in-transaction to a reviewed approved policy+manifest+content
  // for that exact track. Listing without reviewed bindings still fails closed
  // at assertPolicy/assertManifest/lock_enrollment; enabling 'rbt' is a separate
  // reviewed install, not a config toggle.
  if (!["bcba", "rbt"].includes(track)) fail("unsupported_track");
  validatePolicy(policy, track);
  if (
    production &&
    (policy.status !== "approved" || policy.synthetic || !policy.authorityRef ||
      !policy.contentManifestVersion)
  ) fail("approved_production_policy_required");
  // Production serving requires the loaded-manifest binding: the repository
  // re-verifies version+payload+hash against the approved stored row INSIDE
  // every serving transaction (loader assertion alone proves nothing).
  if (production && !manifest?.payload) {
    fail("approved_production_manifest_required");
  }
  // EVERY-SERVE figure revalidation: stored selections/pending deliveries
  // bypass allocate, so replay/resume/feedback/answer must re-verify the
  // current asset bytes against the pin. A provider that serves figures must
  // supply verifyFigureAsset; a figure without a verifier fails closed.
  const verifyAsset = async (pin) => {
    if (typeof content.verifyFigureAsset !== "function") {
      fail("figure_verification_unavailable");
    }
    await content.verifyFigureAsset(pin);
  };
  async function run(identity, { nonce, action, payload = {} }) {
    if (
      !identity?.id || identity.track !== track || identity.plan !== "guided"
    ) fail("guided_bcba_required");
    if (
      !nonce ||
      ![
        "status",
        "start_session",
        "open_next",
        "answer",
        "teaching_commit",
        "accept_focus",
        "decline_focus",
        "finish_episode",
        "finish_session",
        "continue_curriculum",
      ].includes(action)
    ) fail("invalid_program_command");
    // Repository must perform lock/read/replay/mutate/receipt commit atomically.
    // No client state or client timestamps are admitted by this contract.
    return repository.transaction(identity.id, async (tx) => {
      await tx.assertCurrentAccess(identity);
      await tx.assertPolicy(policy, policyHash(policy));
      if (manifest?.payload) {
        if (manifest.payload.track !== track) fail("manifest_track_mismatch");
        if (typeof tx.assertManifest !== "function") {
          fail("manifest_binding_unsupported");
        }
        await tx.assertManifest(
          manifest.payload,
          manifest.version || policy.contentManifestVersion,
          policy.id,
        );
      }
      const encoded = JSON.stringify({ action, payload }),
        previous = await tx.operation(nonce);
      if (previous) {
        if (previous.encoded !== encoded) fail("nonce_payload_conflict");
        return previous.result;
      }
      const state = await tx.load();
      if (
        state.memberId !== identity.id || state.policyVersion !== policy.id ||
        state.policyHash !== policyHash(policy)
      ) fail("state_binding_mismatch");
      const now = clock();
      instant(now);
      let result;
      // 1508 helper: open one reviewed fresh-check follow-up episode. Eligible
      // reserve inventory is counted from the manifest's reviewed contrast roles
      // (never inferred); a short inventory vs the reviewed requiredChecks is an
      // HONEST notice, never a substitution with a different distinction.
      const openFollowUp = (t, prereqId) => {
        const c = (manifest?.payload?.contrasts || []).find((x) =>
          x.id === t.contrastId
        ) || null;
        const rlist = Array.isArray(c?.roles?.reserves)
          ? c.roles.reserves
          : (c?.roles?.reserve ? [c.roles.reserve] : []);
        const eligible = rlist.filter((r) =>
          r && r.itemId != null
        ).length;
        const required = t.requiredChecks ?? null;
        return {
          id: uuid(),
          contrastId: t.contrastId,
          origin: "catalog_followup",
          prerequisiteEpisodeId: prereqId,
          prerequisiteCompletion: "catalog_helped_completion",
          manifestVersion: manifest.version,
          mappingVersion: t.mappingVersion,
          expectedReserves: eligible || 1,
          requiredChecks: required,
          inventoryNotice: (required != null && eligible < required)
            ? ("fresh_check_inventory_short: " + t.contrastId + " eligible " +
              eligible + " of required " + required +
              " (honest gap, never substituted)")
            : null,
          dueAt: now,
          reserveReceipts: [],
          practiceReceipts: [],
          createdAt: now,
          paused: false,
        };
      };

      // Stale pinned catalog episode: the approved module bytes, sequence order,
      // or catalog section changed underneath an OPEN catalog episode. Retire
      // honestly - prior answers/exposure preserved in the immutable archive,
      // never a silent byte swap, never an automatic replacement.
      let curriculumRetired = null;
      if (
        state.episode?.catalogModuleId &&
        state.episode?.catalogContentVersion &&
        typeof content.catalogEpisodeCurrent === "function" &&
        !await content.catalogEpisodeCurrent({
          episode: state.episode,
          tx,
          manifest,
        })
      ) {
        const retired = {
          ...state.episode,
          paused: true,
          closed: true,
          closeReason: "curriculum_version_retired",
          closedAt: now,
        };
        await tx.recordDecline({
          id: uuid(),
          kind: "curriculum_version_retired",
          episodeId: state.episode.id,
          contrastId: state.episode.contrastId,
          catalogModuleId: state.episode.catalogModuleId,
          catalogContentVersion: state.episode.catalogContentVersion || null,
          serverAt: now,
          evidenceReceiptIds: state.episode.evidence?.receiptIds || [],
        });
        await tx.archiveEpisode(retired);
        // A pending delivery that only exists inside the retired episode retires
        // with it - never left answerable against a gone episode.
        if (
          state.pendingDelivery &&
          ["helped_practice", "later_check", "teaching"].includes(
            state.pendingDelivery.phase,
          )
        ) {
          await tx.recordDecline({
            id: uuid(),
            kind: "delivery_retired",
            deliveryId: state.pendingDelivery.id,
            phase: state.pendingDelivery.phase,
            familyId: state.pendingDelivery.selection?.familyId || null,
            outcome: "content_changed",
            serverAt: now,
          });
          state.pendingDelivery = null;
        }
        state.episode = null;
        curriculumRetired = {
          reason: "curriculum_version_retired",
          catalogModuleId: retired.catalogModuleId,
        };
        // Persist the cleared episode IN THE SAME transaction as the archive and
        // feedback rows: status returns early and would otherwise drop the save,
        // leaving the retired episode live and re-retiring on every later call.
        await tx.save(state);
      }
      // The single-offer surface gate, shared by status and the post-completion
      // continuation: actionable ONLY at an ordinary-case boundary with an active
      // session - never alongside a pending delivery/recovery, an open episode of
      // ANY origin, a qualified suggestion, a session-close, or a just-retired
      // episode (no automatic replacement in the retiring response).
      // Catalog resume identity: a catalog teaching intro carries the SERVER
      // title + recorded basis (never client-supplied), so the resume card names
      // the actual lesson and labels its skip honestly. resumed marks the
      // status path (an episode that already existed) vs a fresh continue.
      const withResume = async (result, st, resumed) => {
        if (
          result?.next?.kind !== "teaching" || !st.episode?.catalogModuleId ||
          typeof content.catalogModuleInfo !== "function"
        ) return result;
        const info = await content.catalogModuleInfo({
          episode: st.episode,
          manifest,
        });
        if (info) {
          result.catalogResume = {
            catalogModuleId: st.episode.catalogModuleId,
            title: info.title,
            basis: st.episode.evidence?.basis || "curriculum_sequence",
            resumed: !!resumed,
          };
        }
        return result;
      };
      const boundaryOffer = async (st, nx) => {
        if (
          curriculumRetired || nx.kind !== "blueprint_case" ||
          !st.sessionStarted || st.episode || st.pendingDelivery ||
          st.suggestion?.qualified ||
          typeof content.curriculumOffer !== "function"
        ) return null;
        return content.curriculumOffer({
          identity,
          state: st,
          policy,
          now,
          tx,
          manifest,
        });
      };
      if (action === "status") {
        // A stored pending delivery is NEVER rendered from state alone: revalidate
        // it against live content exactly like open_next does. If the content
        // changed or was withdrawn, status returns no delivery and an UNCONFIRMED
        // retirement notice (the recorded retirement still requires open_next) so
        // the UI can never show a stale question.
        let statusDelivery = null, statusRetired = null;
        if (state.pendingDelivery) {
          try {
            if (state.pendingDelivery.selection?.figure) {
              await verifyAsset(
                state.pendingDelivery.selection.figure,
              );
            }
            const fresh = await transport.replay(
              identity,
              state.pendingDelivery,
              tx,
            );
            statusDelivery = publicDelivery({
              ...fresh,
              phase: state.pendingDelivery.phase,
              selection: state.pendingDelivery.selection,
              serveLabel: state.pendingDelivery.serveLabel || null,
              returnMeta: state.pendingDelivery.selection?.returnMeta || null,
            });
          } catch (e) {
            if (!e?.terminal) throw e;
            statusRetired = { outcome: e.terminal, unconfirmed: true };
          }
        }
        const statusNext = decideNext({ state, policy, now, track });
        // SINGLE-OFFER curriculum surface (spec v0.3): actionable ONLY at an
        // ordinary-case boundary with an active session - never alongside a
        // pending delivery/recovery, an open episode of ANY origin, a qualified
        // suggestion, or a session-close. One primary action follows next.kind.
        const curriculumOffer = await boundaryOffer(state, statusNext);
        // Nonce replay contract (clarified, unchanged behavior): an exact retry
        // returns the RECORDED status snapshot, including history as of that
        // operation - never another member's data (the ledger is member-pinned),
        // just possibly stale. A fresh read uses a fresh nonce, which the client
        // generates on every command. History is member-safe by projection at the
        // repository boundary (pinned identity, never a client value).
        return withResume(
          {
            next: statusNext,
            delivery: statusDelivery,
            sessionProgress: {
              answered: state.sessionAnswered,
              planned: policy.sessionSize,
            },
            suggestion: publicSuggestion(state.suggestion),
            inventoryNotice: state.inventoryNotice || null,
            ...(typeof tx.history === "function"
              ? { history: await tx.history(5) }
              : {}),
            ...(statusRetired ? { retiredDelivery: statusRetired } : {}),
            ...(curriculumRetired ? { curriculumRetired } : {}),
            ...(curriculumOffer ? { curriculumOffer } : {}),
          },
          state,
          true,
        );
      }
      if (action === "start_session") {
        if (state.sessionStarted) {
          result = {
            next: decideNext({ state, policy, now, track }),
          };
        } else {
          state.sessionStarted = now;
          state.sessionSeq =
            (Number.isSafeInteger(state.sessionSeq) ? state.sessionSeq : 0) + 1;
          state.sessionAnswered = 0;
          state.sessionReceiptIds = [];
          state.completedSession = null;
          result = { next: decideNext({ state, policy, now, track }) };
        }
      } else if (action === "open_next") {
        if (!state.sessionStarted) fail("start_session_required");
        const next = decideNext({ state, policy, now, track });
        // 1712 returns (Guided-only, policy-gated): a due pair-coded miss comes
        // back in a LATER session (monotonic session seq), flagged. The queue
        // read, serve, and queue writes share THIS transaction. Pair codes are
        // content-authored; the engine never infers them. T5: the same code
        // missed in 2+ FAMILIES prefers a qualified unseen cold contrast item;
        // none qualified -> gap log + the missed item repeats (T6).
        let returnCtx = null;
        if (
          policy.itemReturn?.enabled === true &&
          next.kind === "blueprint_case" && !state.episode &&
          !state.pendingDelivery && !state.suggestion?.qualified && tx.sql &&
          typeof content.returnItem === "function"
        ) {
          const dueRows = await tx
            .sql`select * from pathways_bcba.return_queue where member_id=${identity.id}::uuid and track=${track} and status='open' and ${
            Number(state.sessionSeq ?? 0)
          }::int - enqueued_session_seq >= ${policy.itemReturn.spacing.minSessionsLater}::int order by enqueued_at asc limit 1`;
          const due = dueRows[0];
          if (due) {
            const famC = await tx
              .sql`select count(distinct family_id)::int c from pathways_bcba.return_queue where member_id=${identity.id}::uuid and track=${track} and pair_code=${due.pair_code}`;
            let rSel = null, contrast = false;
            if (famC[0].c >= 2) {
              if (typeof content.returnContrast === "function") {
                rSel = await content.returnContrast({
                  identity,
                  pairCode: due.pair_code,
                  state,
                  policy,
                  now,
                  tx,
                });
              }
              if (rSel) contrast = true;
              else {
                // Gap dedupe: one gap record per (member, track, pair) - the due check
                // re-runs on every open_next and must never log unboundedly.
                const seen = await tx
                  .sql`select 1 from pathways_bcba.return_gap_log where member_id=${identity.id}::uuid and track=${track} and pair_code=${due.pair_code} limit 1`;
                if (!seen[0]) {
                  await tx
                    .sql`insert into pathways_bcba.return_gap_log(member_id,track,pair_code,logged_at) values (${identity.id}::uuid,${track},${due.pair_code},${now})`;
                  await tx
                    .sql`insert into pathways_bcba.return_events(member_id,track,item_id,pair_code,kind,at) values (${identity.id}::uuid,${track},${due.item_id},${due.pair_code},'gap_logged',${now})`;
                }
              }
            }
            if (!rSel) {
              rSel = await content.returnItem({
                identity,
                itemId: due.item_id,
                expectedHash: due.enqueue_content_hash || null,
                state,
                policy,
                now,
                tx,
              });
            }
            if (rSel) {
              const missC = await tx
                .sql`select count(*)::int c from pathways_bcba.return_events where member_id=${identity.id}::uuid and track=${track} and pair_code=${due.pair_code} and kind in ('enqueued','answered_wrong')`;
              returnCtx = {
                due,
                selection: rSel,
                contrast,
                missCount: missC[0].c,
              };
            }
          }
        }
        if (next.kind === "answer") {
          // Live-validate, then reattach the OWNED stored phase/selection metadata:
          // the transport replay proves the content is unchanged but carries no
          // phase/domain - without this a reloaded helped/reserve case renders as an
          // ordinary one. Metadata comes from server state, never the client.
          try {
            if (state.pendingDelivery.selection?.figure) {
              await verifyAsset(
                state.pendingDelivery.selection.figure,
              );
            }
            const fresh = await transport.replay(
              identity,
              state.pendingDelivery,
              tx,
            );
            result = {
              delivery: publicDelivery({
                ...fresh,
                phase: state.pendingDelivery.phase,
                selection: state.pendingDelivery.selection,
                serveLabel: state.pendingDelivery.serveLabel || null,
                returnMeta: state.pendingDelivery.selection?.returnMeta || null,
              }),
            };
          } catch (e) {
            if (!e?.terminal) throw e;
            // Permanently invalid pending delivery (content_changed/timed_expired):
            // record the retirement, clear it, move the learner on. Never an answer
            // classification row; the delivery can never be served or answered again.
            await tx.recordDecline({
              id: uuid(),
              kind: "delivery_retired",
              deliveryId: state.pendingDelivery.id,
              phase: state.pendingDelivery.phase,
              familyId: state.pendingDelivery.selection?.familyId || null,
              outcome: e.terminal,
              serverAt: now,
            });
            state.pendingDelivery = null;
            result = {
              next: decideNext({ state, policy, now, track }),
              retiredDelivery: { outcome: e.terminal },
            };
          }
        } else if (
          next.kind === "teaching" && state.episode?.teachingSelection
        ) {
          for (
            const stp of state.episode.teachingSelection.interaction?.steps ||
              []
          ) if (stp.figure) await verifyAsset(stp.figure);
          await recordTeachingPresentation(
            tx,
            state,
            state.episode.teachingSelection,
            state.episode.teachingStep ?? 0,
            now,
            uuid,
          );
          result = {
            teachingStep: publicTeachingStep(
              state.episode.teachingSelection,
              state.episode.teachingStep ?? 0,
            ),
            next: {
              kind: "teaching",
              episodeId: state.episode.id,
              claim: state.episode.origin === "explicit_choice"
                ? "learner_choice_not_inference"
                : "selected_answer_observation_only",
            },
          };
        } else if (
          [
            "blueprint_case",
            "scheduled",
            "helped_practice",
            "later_check",
            "teaching",
          ].includes(next.kind)
        ) {
          state.inventoryNotice = null; // recomputed below on THIS serve; never carried stale
          let phase = next.kind === "scheduled" ? "blueprint_case" : next.kind;
          if (returnCtx) phase = "return_case";
          let selection = returnCtx
            ? returnCtx.selection
            : await content.allocate({
              identity,
              state,
              phase,
              domain: next.domain || next.nextDomain,
              episode: state.episode,
              policy,
              now,
              tx,
            });
          if (returnCtx && selection) {
            selection.returnServe = true;
            selection.returnMeta = {
              pairCode: returnCtx.due.pair_code,
              enqueuedAt: returnCtx.due.enqueued_at,
              contrast: returnCtx.contrast,
              pattern: returnCtx.missCount >= 2,
            };
          }
          if (phase === "blueprint_case" && selection?.unavailableDomain) {
            const exhausted = [selection.unavailableDomain];
            // Try the remaining blueprint deficits deterministically. Record the
            // domains skipped rather than silently crediting a substitute domain.
            const localCounts = { ...state.domainCounts };
            for (
              let i = 0;
              i < policy.domains.length - 1 && selection?.unavailableDomain;
              i++
            ) {
              const domain = nextDomain(policy, localCounts, exhausted, track);
              selection = await content.allocate({
                identity,
                state,
                phase,
                domain,
                episode: null,
                policy,
                now,
                tx,
              });
              if (selection?.unavailableDomain) exhausted.push(domain);
            }
            state.inventoryNotice = {
              domainsWithoutUnseenCases: exhausted,
              serverAt: now,
            };
            if (selection?.unavailableDomain) selection = null;
          }
          if (
            !selection && phase === "later_check" &&
            state.episode?.origin === "catalog_followup"
          ) {
            // 1508 honest gap close: THIS member's reserve is withheld (exposure,
            // disqualifying edge, repeat-same-sitting) or the binding pin no longer
            // matches. The episode can NEVER complete - waiting cannot cure it. It
            // closes with the unserved gap recorded (receipts preserved, nothing
            // substituted), and the next reviewed pending target opens. Ordinary
            // blueprint practice is NOT silently served in its place.
            const unserved = (state.episode.expectedReserves ?? 1) -
              (state.episode.reserveReceipts?.length ?? 0);
            const closed = {
              ...state.episode,
              closed: true,
              closeReason: "fresh_check_unserved_gap",
              unservedReserves: unserved,
              closedAt: now,
            };
            await tx.archiveEpisode(closed);
            state.episode = null;
            if (state.pendingFollowUps?.length) {
              const t = state.pendingFollowUps.shift();
              state.episode = openFollowUp(
                t,
                closed.prerequisiteEpisodeId || null,
              );
              if (state.episode.inventoryNotice) {state.inventoryNotice =
                  state.episode.inventoryNotice;}
            }
            result = {
              next: decideNext({ state, policy, now, track }),
              inventoryNotice: {
                freshCheckUnservedGap: true,
                contrastId: closed.contrastId,
                unservedReserves: unserved,
                serverAt: now,
              },
            };
          }
          if (
            !selection && phase === "later_check" && state.episode && !result
          ) {
            // Empty/unavailable reserve inventory: existing program intent is that
            // ordinary practice CONTINUES while the check is unavailable. This is a
            // legal server transition: the episode is retained (still pending, no
            // fresh-check claim anywhere), the unavailability is recorded for
            // honesty, and the member is served ordinary blueprint practice. Every
            // later open_next re-attempts the reserve first (decideNext still yields
            // later_check), so the check returns only if inventory actually exists.
            state.episode.inventoryDeferred = true;
            state.inventoryNotice = {
              reserveInventoryEmpty: true,
              serverAt: now,
            };
            phase = "blueprint_case";
            // Reuse the SAME deterministic ordinary allocation as the normal
            // blueprint path: try the next deficit domain, then every remaining
            // domain in order. No false exhaustion while another domain has cases.
            selection = await content.allocate({
              identity,
              state,
              phase,
              domain: next.domain ||
                nextDomain(policy, state.domainCounts || {}, [], track),
              episode: null,
              policy,
              now,
              tx,
            });
            if (selection?.unavailableDomain) {
              const exhausted = [selection.unavailableDomain];
              const localCounts = { ...state.domainCounts };
              for (
                let i = 0;
                i < policy.domains.length - 1 && selection?.unavailableDomain;
                i++
              ) {
                const domain = nextDomain(
                  policy,
                  localCounts,
                  exhausted,
                  track,
                );
                selection = await content.allocate({
                  identity,
                  state,
                  phase,
                  domain,
                  episode: null,
                  policy,
                  now,
                  tx,
                });
                if (selection?.unavailableDomain) exhausted.push(domain);
              }
              state.inventoryNotice = {
                ...state.inventoryNotice,
                domainsWithoutUnseenCases: exhausted,
              };
              if (selection?.unavailableDomain) selection = null;
            }
          }
          // Serve-time exposure label (reviewer Section B taxonomy, 2026-10-28):
          // computed ONCE in this transaction from the SAME memberSourceExposure
          // facts the write classifier recomputes independently at answer time.
          // OUTPUT ONLY - never eligibility, qualification, counts, or mastery
          // wording. Purpose (why served) stays separate from exposure facts (what
          // the ledger shows) and is never inferred from them. A serve-time read
          // failure labels unknown (fail closed); the label is never omitted. A
          // resolver SQL error aborts this transaction, same contract as answer.
          const serveLabelFor = async (sel) => {
            const purpose = phase === "blueprint_case"
              ? (sel.baselineCandidate ? "baseline" : "ordinary_blueprint")
              : phase === "later_check"
              ? "delayed_later_check"
              : phase === "helped_practice"
              ? "helped_practice"
              : phase === "return_case"
              ? "return_practice"
              : String(phase);
            const famKnown = !!sel.familyId &&
              !String(sel.familyId).startsWith("ITEM:");
            const srvVersion = content.registryVersion?.() || null;
            const resolved = famKnown && !!srvVersion;
            const base = {
              purpose,
              lineageResolved: resolved,
              familyRegistryVersion: resolved ? srvVersion : null,
              computedAt: now,
            };
            if (!tx.sql) {
              return { ...base, exposure: "unknown", reason: "no_ledger" };
            }
            let facts = null;
            try {
              facts = await memberSourceExposure(tx.sql, identity.id, {
                familyId: sel.familyId,
                itemId: sel.itemId ?? null,
                familyFor: content.itemFamilyFor
                  ? (id) => content.itemFamilyFor(id)
                  : null,
                track,
              });
            } catch (e) {
              return { ...base, exposure: "unknown", reason: "read_failure" };
            }
            if (facts.length) {
              const own = facts.filter((f) =>
                f.itemId != null && String(f.itemId) === String(sel.itemId)
              );
              return {
                ...base,
                exposure: "known_exposure",
                scope: own.length ? "item" : "family",
                kinds: [...new Set(facts.map((f) => f.kind))],
              };
            }
            return resolved
              ? { ...base, exposure: "validated_new_case" }
              : { ...base, exposure: "unknown", reason: "lineage_unresolved" };
          };
          let serveLabel = null;
          if (
            phase === "blueprint_case" && selection &&
            !selection.unavailableDomain
          ) {
            // Ordinary stays fresh-only while inventory allows: a known-exposure
            // ordinary candidate is set aside (at most 3 deterministic re-picks);
            // it is served only when no cleaner candidate exists - and then ALWAYS
            // labeled known_exposure with its source kinds and scope.
            const skipped = [];
            let firstExposed = null;
            while (selection) {
              const lbl = await serveLabelFor(selection);
              if (lbl.exposure !== "known_exposure") {
                serveLabel = lbl;
                break;
              }
              if (!firstExposed) firstExposed = { selection, lbl };
              skipped.push(selection.itemId);
              if (skipped.length >= 3) {
                selection = null;
                break;
              }
              selection = await content.allocate({
                identity,
                state,
                phase,
                domain: selection.domain,
                episode: null,
                policy,
                now,
                tx,
                excludeItemIds: skipped,
              });
              if (selection?.unavailableDomain) selection = null;
            }
            if (!selection && firstExposed) {
              selection = firstExposed.selection;
              serveLabel = firstExposed.lbl;
            }
          }
          if (!selection) {
            if (!result) {
              result = {
                next: { kind: "inventory_unavailable", phase },
                dueAt: state.episode?.dueAt || null,
              };
            }
          } else {
            if (
              selection.track !== track || !selection.contentHash ||
              !selection.version || !selection.familyId
            ) fail("unbound_content");
            if (
              ["later_check", "helped_practice", "teaching"].includes(phase) &&
              (!state.episode ||
                selection.contrastId !== state.episode.contrastId ||
                selection.manifestVersion !== state.episode.manifestVersion ||
                selection.mappingVersion !== state.episode.mappingVersion ||
                selection.role !==
                  ({
                    later_check: "reserve",
                    helped_practice: "practice",
                    teaching: "teaching",
                  }[phase]))
            ) fail("episode_content_binding_mismatch");
            if (
              phase === "later_check" &&
              (!selection.allocationId ||
                selection.episodeId !== state.episode.id)
            ) fail("reserve_allocation_binding_required");
            if (phase === "teaching" && selection.practiceAssetCount != null) {
              state.episode.practiceAssetCount = selection.practiceAssetCount;
              state.episode.practiceReceipts = state.episode.practiceReceipts ||
                [];
            }
            // Reserve freshness is a server-owned historical exposure graph decision:
            // the content layer must prove from the exposure/attempt/help ledgers (not
            // local arrays) that this family and its related lineages are unexposed,
            // and orchestration independently cross-checks the recorded lineage.
            // Disqualifying lineage (teaching exposure, structural or response-demand
            // overlap) is hard-blocked here. Shared-construct lineage is the content
            // layer's typed-graph decision behind exposureGraphVerified, so a mere
            // conceptual relation cannot silently exclude every reserve - and a
            // disqualifying one can never be waved through.
            // FAIL CLOSED: exposureGraphVerified must already reflect a reviewed,
            // typed-graph decision. Unresolved shared-construct exposure means the
            // content layer returns verified=false; orchestration never upgrades it.
            // Baseline-candidate cleanliness is a server-owned typed-ledger decision:
            // a selection carrying disqualifyingOnFeedback edges must arrive with
            // baselineEligibilityVerified from the content layer's same-transaction
            // ledger read; orchestration never upgrades it, and local helped/exposed
            // arrays cross-check the same families. FAIL CLOSED on any doubt.
            const baselineEdges = selection.disqualifyingOnFeedback || [];
            if (
              phase === "blueprint_case" && baselineEdges.length &&
              (selection.baselineEligibilityVerified !== true ||
                baselineEdges.some((e) =>
                  state.exposures.includes(e.family || e) ||
                  state.helpedFamilies.includes(e.family || e)
                ))
            ) fail("baseline_not_clean");
            const disqualifying = selection.disqualifyingFamilies ||
              selection.relatedFamilies || [];
            if (
              phase === "later_check" &&
              (!selection.independenceReviewed ||
                selection.exposureGraphVerified !== true ||
                state.exposures.includes(selection.familyId) ||
                state.helpedFamilies.includes(selection.familyId) ||
                selection.helped || disqualifying.some((f) =>
                  state.exposures.includes(f) ||
                  state.helpedFamilies.includes(f)
                ))
            ) {
              fail("reserve_not_independent");
            }
            if (phase === "teaching") {
              // Interactive fork: the selection carries authored steps. Serving a step
              // records nothing; the exposure receipt is written only when the learner
              // commits to the final step (teaching_commit), and it remains
              // evidenceClass teaching_exposure_not_completion - never completion.
              validateTeachingInteraction(selection);
              state.episode.teachingSelection = selection;
              state.episode.teachingStep = 0;
              state.episode.teachingSelections = [];
              state.episode.teachingPresented = [];
              await recordTeachingPresentation(
                tx,
                state,
                selection,
                0,
                now,
                uuid,
              );
              result = {
                teachingStep: publicTeachingStep(selection, 0),
                next: {
                  kind: "teaching",
                  episodeId: state.episode.id,
                  claim: state.episode.origin === "explicit_choice"
                    ? "learner_choice_not_inference"
                    : "selected_answer_observation_only",
                },
              };
            } else {
              // The label pins facts at SERVE DECISION time - computed BEFORE
              // transport.serve records this delivery's own presentation event (the
              // write classifier excludes that same event at answer time).
              if (!serveLabel) {
                serveLabel = await serveLabelFor(selection);
              }
              const delivery = await transport.serve(identity, selection, {
                nonce,
                phase,
                episodeId: state.episode?.id || null,
              }, tx);
              if (
                !delivery?.id || delivery.memberId !== identity.id ||
                delivery.contentHash !== selection.contentHash
              ) {
                fail("delivery_binding_mismatch");
              }
              delivery.serveLabel = serveLabel;
              if (returnCtx) {
                delivery.returnMeta = selection.returnMeta;
                // Served-flag write in the SAME transaction as the delivery: a served
                // return stays 'served' until answered or released (T7: never counted).
                await tx
                  .sql`update pathways_bcba.return_queue set status='served', served_delivery_id=${
                  String(delivery.id)
                }, served_at=${now} where member_id=${identity.id}::uuid and track=${track} and item_id=${returnCtx.due.item_id} and status='open'`;
                await tx
                  .sql`insert into pathways_bcba.return_events(member_id,track,item_id,pair_code,kind,at) values (${identity.id}::uuid,${track},${returnCtx.due.item_id},${returnCtx.due.pair_code},'served_flagged',${now})`;
              }
              state.pendingDelivery = { ...delivery, phase, selection };
              if (!state.exposures.includes(selection.familyId)) {
                state.exposures.push(selection.familyId);
              }
              result = {
                delivery: publicDelivery({
                  ...delivery,
                  phase,
                  domain: selection.domain,
                  figure: selection.figure || null,
                  returnMeta: delivery.returnMeta || null,
                }),
                inventoryNotice: state.inventoryNotice || null,
              };
            }
          }
        } else result = { next };
      } else if (action === "answer") {
        const d = state.pendingDelivery;
        if (!d || payload.deliveryId !== d.id) {
          fail("owned_pending_delivery_required");
        }
        if (d.selection?.figure) await verifyAsset(d.selection.figure);
        if (
          !Number.isInteger(payload.chosen) || payload.chosen < 0 ||
          payload.chosen >= d.optionCount
        ) fail("invalid_answer");
        let receipt;
        try {
          receipt = await transport.answer(identity, d, {
            nonce,
            chosen: payload.chosen,
          }, tx);
        } catch (e) {
          if (!e?.terminal) throw e;
          // Terminal delivery outcome (content_changed/timed_expired): the bridge's
          // recorded submission retires the delivery permanently; keep NO answer
          // classification row, clear the pending delivery, move the learner on.
          await tx.recordDecline({
            id: uuid(),
            kind: "delivery_retired",
            deliveryId: d.id,
            phase: d.phase,
            familyId: d.selection.familyId || null,
            outcome: e.terminal,
            serverAt: now,
          });
          state.pendingDelivery = null;
          result = {
            next: decideNext({ state, policy, now, track }),
            retiredDelivery: { outcome: e.terminal },
          };
          await tx.save(state);
          await tx.recordOperation(nonce, { encoded, result });
          return result;
        }
        if (
          !receipt?.id || !receipt.serverConfirmed ||
          receipt.memberId !== identity.id || receipt.deliveryId !== d.id ||
          receipt.contentHash !== d.contentHash ||
          receipt.chosenIndex !== payload.chosen ||
          typeof receipt.correct !== "boolean"
        ) fail("answer_not_confirmed");
        // Evidence classification is computed server-side from the ledgers/state at
        // answer time, never asserted by the client or inferred later: a response is
        // unassisted_first_response ONLY when nothing recorded shows a prior family
        // response, prior item presentation, or help on its family.
        const answeredFamily = d.selection.familyId;
        // Lineage provenance (reviewer adjudication 2026-10-28, disposition (b)
        // FAIL CLOSED): a family is RESOLVED only when it comes from the
        // registered family mapping. The 'ITEM:<id>' singleton is the engine's
        // own unmapped marker (contrast-provider itemFamily fallback), so an
        // all-source empty ledger over it proves only "this item was never
        // touched" - never the absence of an unregistered shared-lineage
        // sibling. Concept independence is claimed ONLY on resolved lineage;
        // the item-level observation is kept separately as firstUnaidedItem,
        // and the registry version that resolved the family is recorded on the
        // receipt (null = unresolved). LIMIT: a resolved family's independence
        // is only as complete as its registry - a registry omission can still
        // hide a sibling.
        let independenceVerified = !(state.answeredFamilies || []).includes(
            answeredFamily,
          ),
          knownPriorExposure = false,
          lineageResolved = !!answeredFamily &&
            !String(answeredFamily).startsWith("ITEM:"),
          firstUnaidedItem = null,
          resolverRegistryVersion = null;
        if (tx.sql) {
          const pf = await tx
            .sql`select 1 from pathways_bcba.answer_context where member_id=${identity.id}::uuid and context->>'familyId'=${answeredFamily} limit 1`;
          independenceVerified = pf.length === 0;
          const pe = await tx
            .sql`select 1 from pathways_evidence.item_presentation_event where member_id=${identity.id}::uuid and track=${track} and item_id=${
            String(d.selection.itemId)
          } and item_delivery_id is distinct from ${d.id}::uuid limit 1`;
          knownPriorExposure = pe.length > 0;
          // Shared 5-source exposure resolver (memberSourceExposure, same typed
          // facts the allocation gates use): a family - registered OR ITEM:
          // singleton - is fresh only when no record exists in ANY source:
          // receipts, feedback-only receipts, bare attempts, stem-only
          // presentations, teaching episodes. An unmapped singleton has no
          // registered lineage, so its freshness claim needs the same all-source
          // ledger proof; mappingApproved gating triggers is NOT lineage proof.
          // Exclusion is EVENT-scoped, never item-scoped: excludeDeliveryId drops
          // the current delivery's own presentation; excludeAttemptId drops the
          // current answer's own attempt row (already recorded by the answer
          // bridge before classification). Any PRIOR event on the same item
          // (earlier presentation, bare attempt, receipt) still counts.
          // Failure semantics: a RESOLVER SQL error aborts the whole answer
          // transaction atomically (Postgres aborted-tx state) - no receipt, no
          // partial write, fail closed at the cost of a failed answer. The catch
          // below covers NON-SQL failures only (e.g. familyFor throwing):
          // independenceVerified=false preserves uncertainty without inventing
          // exposure; knownPriorExposure stays fact-based. Any prior fact is prior
          // family exposure.
          if (answeredFamily) {
            let famFacts = null;
            try {
              famFacts = await memberSourceExposure(tx.sql, identity.id, {
                familyId: answeredFamily,
                familyFor: content.itemFamilyFor
                  ? (id) => content.itemFamilyFor(id)
                  : null,
                excludeDeliveryId: d.id,
                excludeAttemptId: receipt.id,
                track,
              });
            } catch (e) {
              independenceVerified = false;
              lineageResolved = false;
            }
            if (famFacts) {
              if (famFacts.length) knownPriorExposure = true;
              if (famFacts.some((f) => f.kind === "teaching")) {
                (state.helpedFamilies ||= []).includes(answeredFamily) ||
                  state.helpedFamilies.push(answeredFamily);
              }
            }
          }
          // Registry-version provenance is PART of resolution (reviewer
          // 2026-10-28): a provider that cannot name the registry/mapping version
          // it resolves from cannot prove WHICH registry resolved this family, so
          // lineage fails closed and the version pins null. Serve-time manifest
          // versions are recorded separately (context.manifestVersion) and are
          // NEVER resolver provenance - no fallback, no invented provenance.
          resolverRegistryVersion = content.registryVersion?.() || null;
          if (lineageResolved && !resolverRegistryVersion) {
            lineageResolved = false;
          }
          if (!lineageResolved) independenceVerified = false;
          // Item-level observation, ALWAYS item-scoped (never family-scoped) and
          // event-excluded like the family read: this exact item had no prior
          // presentation, attempt, feedback receipt or teaching. familyFor is
          // null here so a family-mapping read failure cannot hide item facts.
          firstUnaidedItem = (await memberSourceExposure(tx.sql, identity.id, {
            itemId: d.selection.itemId,
            excludeDeliveryId: d.id,
            excludeAttemptId: receipt.id,
            track,
          })).length === 0;
        } else if (!allowLedgerless) {
          // NO LEDGER and no explicit test-harness opt-in: classification must
          // never rest on episode-local arrays alone. This fails closed in EVERY
          // wiring - production, staging, or a future non-sql repository - unless
          // the caller explicitly declared allowLedgerless (in-memory tests only).
          // The answer is still recorded (facts preserved); only claims fail closed.
          independenceVerified = false;
          lineageResolved = false;
        }
        // Defense in depth for baseline candidates: recheck the typed
        // disqualifying-on-feedback lineage against the ledgers INSIDE this answer
        // transaction. A member who gained answer-bearing lineage feedback after
        // the delivery was served keeps their recorded receipt, but the response
        // is never clean-baseline evidence.
        // ONE typed evaluator for disqualifying-on-feedback lineage at answer time.
        // Every edge resolves to EXCLUDED (exact hash-pinned answer-bearing
        // feedback or cross-lineage teaching on the dispositioned source) or
        // UNKNOWN (missing itemId pin, missing/differing version pins, ordinary
        // attempt with no verifiable version). BOTH withhold clean-baseline status;
        // the record distinguishes them honestly. No id is ever derived from a
        // family name, and no missing pin passes as a match.
        let baselineLineageExposure = false, baselineLineageUnknown = false;
        if ((d.selection.disqualifyingOnFeedback || []).length && tx.sql) {
          const familyFor = content.itemFamilyFor
            ? (id) => content.itemFamilyFor(id)
            : null;
          for (const e of d.selection.disqualifyingOnFeedback) {
            if (typeof e !== "object" || !e.itemId) {
              baselineLineageUnknown = true;
              baselineLineageExposure = true;
              break;
            } // missing source pin is UNKNOWN, never no_exposure
            const facts = await memberSourceExposure(tx.sql, identity.id, {
              familyId: e.family || null,
              itemId: e.itemId,
              familyFor,
              track,
            });
            if (facts.some((f) => f.kind === "teaching")) {
              baselineLineageExposure = true;
              break;
            } // cross-lineage help burns cleanliness (any version)
            const ab = facts.filter((f) =>
              f.kind === "receipt" || f.kind === "feedback_receipt" ||
              f.kind === "attempt"
            );
            if (ab.length) {
              // EXCLUDED only on an exact feedback-hash pin match (receipt or feedback
              // ledger); any other answer-bearing fact is UNKNOWN version, never clean.
              if (
                e.deliveryContentHash &&
                ab.some((f) =>
                  f.kind !== "attempt" && f.contentHash &&
                  f.contentHash === e.deliveryContentHash
                )
              ) baselineLineageExposure = true;
              else {
                baselineLineageUnknown = true;
                baselineLineageExposure = true;
              }
              break;
            }
          }
        }
        // Baseline shared-lineage dispositions are re-evaluated at ANSWER time
        // with the same SERVE-time pin objects (serve-vs-answer parity with the
        // reserve path): unknown/mismatched shared source help landing between
        // delivery and answer keeps the receipt but is never clean-baseline.
        let baselineSharedUnknown = false;
        if (
          d.phase === "blueprint_case" &&
          (d.selection.sharedDispositions || []).length && tx.sql
        ) {
          const familyFor = content.itemFamilyFor
            ? (id) => content.itemFamilyFor(id)
            : null;
          for (const pin of d.selection.sharedDispositions) {
            const facts = await memberSourceExposure(tx.sql, identity.id, {
              familyId: pin.family,
              ...(pin.itemId != null ? { itemId: pin.itemId } : {}),
              familyFor,
              excludeAttemptId: receipt.id,
              track,
            });
            if (evaluateTransfer(facts, pin).status !== "allowed") {
              baselineSharedUnknown = true;
              break;
            }
          }
        }
        const helpBeforeAnswer = (state.helpedFamilies || []).includes(
          answeredFamily,
        );
        // Post-delivery reserve help recheck: freshness proved at ALLOCATION time is
        // not enough - help recorded on the reserve family or its disqualifying
        // lineages between serve and answer keeps the receipt but is never clean.
        let reserveHelpAfterDelivery = false;
        if (d.phase === "later_check") {
          const fams = [
            answeredFamily,
            ...(d.selection.disqualifyingFamilies ||
              d.selection.relatedFamilies || []),
          ];
          if (fams.some((f) => (state.helpedFamilies || []).includes(f))) {
            reserveHelpAfterDelivery = true;
          } else if (tx.sql) {
            const familyFor = content.itemFamilyFor
              ? (id) => content.itemFamilyFor(id)
              : null;
            for (const f of fams) {
              // EVERY answer-bearing source channel on the family: teaching, answer
              // receipts, the exact feedback-receipt ledger, and bare ordinary
              // attempts. The current answer's own attempt/feedback record is
              // excluded by its attempt id; stem-only presentations are not help.
              const facts = await memberSourceExposure(tx.sql, identity.id, {
                familyId: f,
                familyFor,
                excludeAttemptId: receipt.id,
                track,
              });
              if (
                facts.some((x) =>
                  x.kind === "teaching" || x.kind === "receipt" ||
                  x.kind === "feedback_receipt" || x.kind === "attempt"
                )
              ) {
                reserveHelpAfterDelivery = true;
                break;
              }
            }
          }
        }
        // Shared-lineage dispositions are re-evaluated at ANSWER time with the
        // SERVE-time pin objects: unknown/mismatched shared source help recorded
        // between delivery and answer keeps the receipt but is never clean.
        let reserveSharedUnknown = false;
        if (
          d.phase === "later_check" &&
          (d.selection.sharedDispositions || []).length && tx.sql
        ) {
          const familyFor = content.itemFamilyFor
            ? (id) => content.itemFamilyFor(id)
            : null;
          for (const pin of d.selection.sharedDispositions) {
            const facts = await memberSourceExposure(tx.sql, identity.id, {
              familyId: pin.family,
              familyFor,
              excludeAttemptId: receipt.id,
              track,
            });
            if (evaluateTransfer(facts, pin).status !== "allowed") {
              reserveSharedUnknown = true;
              break;
            }
          }
        }
        const factClean = !knownPriorExposure && !helpBeforeAnswer &&
          !baselineLineageExposure && !baselineSharedUnknown &&
          !reserveHelpAfterDelivery && !reserveSharedUnknown;
        // first_unaided_item_only: NO prior fact on the item or family in any
        // source, but lineage is UNRESOLVED - the observation is recorded and
        // named, concept independence is NOT claimed (neither fresh nor a
        // fabricated repeat). repeat_or_exposed stays strictly fact-based.
        const evidenceClass = independenceVerified && factClean
          ? "unassisted_first_response"
          : (helpBeforeAnswer || reserveHelpAfterDelivery
            ? "helped_or_assisted"
            : (!lineageResolved && factClean
              ? "first_unaided_item_only"
              : "repeat_or_exposed"));
        // Serve/write agreement (reviewer B-a): write classification is
        // authoritative - recomputed from the ledgers at answer time. A
        // validated_new_case serve that classifies WITH exposure now (or a
        // known_exposure serve classifying clean) means the facts changed between
        // serve and answer: the write result wins and the receipt records the
        // discrepancy. 'unknown' serve labels assert nothing and never disagree.
        let serveWriteDiscrepancy;
        if (
          d.serveLabel?.exposure === "validated_new_case" &&
          evidenceClass !== "unassisted_first_response"
        ) {
          serveWriteDiscrepancy = {
            serve: "validated_new_case",
            write: evidenceClass,
            at: now,
          };
        } else if (
          d.serveLabel?.exposure === "known_exposure" &&
          evidenceClass === "unassisted_first_response"
        ) {
          serveWriteDiscrepancy = {
            serve: "known_exposure",
            write: evidenceClass,
            at: now,
          };
        }
        const record = {
          ...receipt,
          phase: d.phase,
          contentVerified: true,
          independenceVerified,
          knownPriorExposure,
          helpBeforeAnswer,
          lineageResolved,
          firstUnaidedItem,
          familyRegistryVersion: lineageResolved
            ? resolverRegistryVersion
            : null,
          baselineLineageExposure: baselineLineageExposure || undefined,
          baselineLineageUnknown: baselineLineageUnknown || undefined,
          baselineSharedUnknown: baselineSharedUnknown || undefined,
          reserveSharedUnknown: reserveSharedUnknown || undefined,
          serveWriteDiscrepancy: serveWriteDiscrepancy || undefined,
          evidenceClass,
          context: {
            serveExposure: d.serveLabel?.exposure || null,
            servePurpose: d.serveLabel?.purpose || null,
            serveScope: d.serveLabel?.scope || null,
            itemId: d.selection.itemId,
            contentVersion: d.selection.version,
            episodeId: state.episode?.id || null,
            catalogModuleId: state.episode?.catalogModuleId || null,
            contentHash: d.contentHash,
            figureVersion: d.selection?.figure
              ? figurePinDigest(d.selection.figure)
              : null,
            familyId: d.selection.familyId,
            domain: d.selection.domain,
            outlineTag: d.selection.outlineTag,
            optionIndex: receipt.chosenIndex,
            mappingVersion: d.selection.mappingVersion || null,
            manifestVersion: d.selection.manifestVersion || null,
            transferEdges: d.selection.transferEdges?.length
              ? d.selection.transferEdges
              : undefined,
            selectedMapping: d.selection.mappingApproved
              ? d.selection.optionMappings?.[receipt.chosenIndex] || null
              : null,
            whyTempting:
              d.selection.optionContext?.[payload.chosen]?.whyTempting || null,
            remediationPointer:
              d.selection.optionContext?.[payload.chosen]?.remediationPointer ||
              null,
            mixUpCode:
              d.selection.optionContext?.[payload.chosen]?.mixUp?.code || null,
            mixUpTell:
              d.selection.optionContext?.[payload.chosen]?.mixUp?.tell || null,
            returnServe: d.selection.returnServe === true || undefined,
          },
          claim: "selected_response_not_cause",
        };
        await tx.recordAnswer(record);
        state.answerReceiptIds.push(receipt.id);
        state.pendingDelivery = null;
        // 1712 returns write path (Guided-only, policy-gated, SAME transaction as
        // the answer bridge): enqueue pair-coded misses, count repeat misses,
        // resolve corrected returns. Idempotent: queue PK + receipt-keyed events;
        // a replayed nonce never reaches these writes (operation replay returns
        // the recorded result). Self-study never reaches this program at all
        // (guided_bcba_required at entry), so T2 exclusion is structural.
        let returnInfo = null;
        if (policy.itemReturn?.enabled === true && tx.sql) {
          const mixCode =
            d.selection.optionContext?.[payload.chosen]?.mixUp?.code || null;
          const mixTell =
            d.selection.optionContext?.[payload.chosen]?.mixUp?.tell || null;
          const mixPair =
            d.selection.optionContext?.[payload.chosen]?.mixUp?.pair === true;
          const retItemId = String(d.selection.itemId ?? "");
          // Pair eligibility is an EXPLICIT reviewed flag (queue_eligible_pair), never
          // "any code != unclassified". A reviewed NONPAIR code keeps its post-answer
          // tell but never queues, never builds a pattern, never drives a return.
          if (
            !receipt.correct && mixCode && mixCode !== "unclassified" &&
            !mixPair
          ) {
            returnInfo = {
              pairCode: null,
              tellLine: mixTell,
              enqueued: false,
              pattern: false,
              resolved: false,
            };
          }
          if (
            !receipt.correct && mixCode && mixCode !== "unclassified" &&
            mixPair && retItemId
          ) {
            const fam = d.selection.familyId || ("ITEM:" + retItemId);
            // Re-entry (review finding 3): a RESOLVED or RELEASED row missed again is a
            // fresh miss of the mix-up - the row re-opens with the new session pin and
            // the miss is logged. Open/served rows are untouched (conflict -> no row).
            // The pair tell is content-authored (the missed option's mixUp.tell) and
            // STORED at enqueue (#67886-1): it survives option reordering and is shown
            // after a later CORRECT return, never invented from the right option.
            // Re-entry (#67886-2): the row re-opens as a NEW cycle (cycle+1) with the
            // new session pin; prior-cycle events stay untouched (history retained).
            const ins = await tx
              .sql`insert into pathways_bcba.return_queue(member_id,track,item_id,family_id,pair_code,tell_line,enqueued_at,enqueued_session_seq,enqueue_content_hash) values (${identity.id}::uuid,${track},${retItemId},${fam},${mixCode},${mixTell},${now},${
              Number(state.sessionSeq ?? 0)
            }::int,${
              d.contentHash || null
            }) on conflict (member_id,track,item_id) do update set status='open', pair_code=excluded.pair_code, family_id=excluded.family_id, tell_line=coalesce(excluded.tell_line,return_queue.tell_line), enqueued_at=excluded.enqueued_at, enqueued_session_seq=excluded.enqueued_session_seq, enqueue_content_hash=excluded.enqueue_content_hash, cycle=return_queue.cycle+1, served_delivery_id=null, served_at=null, resolved_at=null, resolved_receipt_id=null where return_queue.status in ('resolved','released') returning item_id, cycle`;
            if (ins[0]) {
              await tx
                .sql`insert into pathways_bcba.return_events(member_id,track,item_id,pair_code,receipt_id,kind,cycle,at) values (${identity.id}::uuid,${track},${retItemId},${mixCode},${
                String(receipt.id)
              },'enqueued',${ins[0].cycle},${now}) on conflict do nothing`;
              // Pattern (review finding 2): if this miss is the 2nd+ on the SAME code
              // (any item), the pattern is named after the answer - never hard-coded off.
              const mc = await tx
                .sql`select count(*)::int c from pathways_bcba.return_events where member_id=${identity.id}::uuid and track=${track} and pair_code=${mixCode} and kind in ('enqueued','answered_wrong')`;
              returnInfo = {
                pairCode: mixCode,
                tellLine: mixTell,
                enqueued: true,
                pattern: mc[0].c >= 2,
                resolved: false,
              };
            }
          }
          if (d.selection.returnServe && retItemId) {
            const rCode = d.selection.returnMeta?.pairCode || null;
            // Pair cycle = the highest cycle across the pair's queue rows (re-entry
            // bumps it): every answer-derived event is stamped with the current cycle.
            const [pc] = await tx
              .sql`select coalesce(max(cycle),1)::int c from pathways_bcba.return_queue where member_id=${identity.id}::uuid and track=${track} and pair_code=${rCode}`;
            const pairCycle = pc ? pc.c : 1;
            if (!receipt.correct) {
              // Repeat miss on a served return: counted for the pattern, item stays due.
              await tx
                .sql`insert into pathways_bcba.return_events(member_id,track,item_id,pair_code,receipt_id,kind,cycle,at) values (${identity.id}::uuid,${track},${retItemId},${rCode},${
                String(receipt.id)
              },'answered_wrong',${pairCycle},${now}) on conflict do nothing`;
              await tx
                .sql`update pathways_bcba.return_queue set status='open', served_delivery_id=null, served_at=null where member_id=${identity.id}::uuid and track=${track} and item_id=${retItemId} and status='served'`;
              const mc2 = await tx
                .sql`select count(*)::int c from pathways_bcba.return_events where member_id=${identity.id}::uuid and track=${track} and pair_code=${rCode} and kind in ('enqueued','answered_wrong')`;
              returnInfo = {
                pairCode: rCode,
                tellLine: mixTell,
                enqueued: false,
                pattern: mc2[0].c >= 2,
                resolved: false,
              };
            } else if (rCode) {
              // Correct RETURN answer (T4). Room #67886 (dot re-read of 1712 v0.4.1):
              // (3) an ELIGIBLE cold contrast may resolve the pair queue under the
              // threshold - never mastery; an exposed/helped contrast answer does NOT
              // resolve (repeat practice continues). An ordinary missed-item return
              // resolves per 1712 regardless of its (repeat) classification.
              // (4) resolvedAfter counts correct answers in the CURRENT cycle only -
              // a prior cycle's corrects never resolve a re-opened pair.
              await tx
                .sql`insert into pathways_bcba.return_events(member_id,track,item_id,pair_code,receipt_id,kind,cycle,at) values (${identity.id}::uuid,${track},${retItemId},${rCode},${
                String(receipt.id)
              },'answered_correct',${pairCycle},${now}) on conflict do nothing`;
              const rc = await tx
                .sql`select count(*)::int c from pathways_bcba.return_events where member_id=${identity.id}::uuid and track=${track} and pair_code=${rCode} and kind='answered_correct' and cycle=${pairCycle}`;
              const isContrast = d.selection.returnMeta?.contrast === true;
              const eligible = !isContrast ||
                evidenceClass === "unassisted_first_response" ||
                evidenceClass === "first_unaided_item_only";
              let resolved = false;
              if (eligible && rc[0].c >= policy.itemReturn.resolvedAfter) {
                await tx
                  .sql`update pathways_bcba.return_queue set status='resolved', resolved_at=${now}, resolved_receipt_id=${
                  String(receipt.id)
                } where member_id=${identity.id}::uuid and track=${track} and pair_code=${rCode} and status in ('open','served')`;
                await tx
                  .sql`insert into pathways_bcba.return_events(member_id,track,item_id,pair_code,receipt_id,kind,cycle,at) values (${identity.id}::uuid,${track},${retItemId},${rCode},${
                  String(receipt.id)
                },'resolved',${pairCycle},${now}) on conflict do nothing`;
                resolved = true;
              } else {
                // Below the threshold (or an ineligible contrast answer): a served row
                // returns to open and comes back in a later session; the pair stays active.
                await tx
                  .sql`update pathways_bcba.return_queue set status='open', served_delivery_id=null, served_at=null where member_id=${identity.id}::uuid and track=${track} and item_id=${retItemId} and status='served'`;
              }
              // Tell AFTER the answer comes from the QUEUED PAIR (stored at enqueue,
              // content-authored), never from the chosen option: a correct option
              // carries no tell and no wrong-answer wording is invented (#67886-1).
              const [qt] = await tx
                .sql`select tell_line from pathways_bcba.return_queue where member_id=${identity.id}::uuid and track=${track} and pair_code=${rCode} and tell_line is not null order by enqueued_at desc limit 1`;
              const missC = await tx
                .sql`select count(*)::int c from pathways_bcba.return_events where member_id=${identity.id}::uuid and track=${track} and pair_code=${rCode} and kind in ('enqueued','answered_wrong')`;
              returnInfo = {
                pairCode: rCode,
                tellLine: (qt && qt.tell_line) || mixTell,
                enqueued: false,
                pattern: missC[0].c >= 2,
                resolved,
              };
            }
          }
        }
        (state.answeredFamilies ??= []).includes(answeredFamily) ||
          state.answeredFamilies.push(answeredFamily);
        if (d.phase === "blueprint_case") {
          const domain = d.selection.domain;
          state.sessionAnswered++;
          (state.sessionReceiptIds ??= []).push(receipt.id);
          if (!state.firstAnsweredItems.includes(d.selection.itemId)) {
            state.firstAnsweredItems.push(d.selection.itemId);
            state.domainCounts[domain] = (state.domainCounts[domain] || 0) + 1;
          }
        }
        if (d.phase === "helped_practice") {
          (state.episode.practiceReceipts ??= []).push(record);
          state.episode.practiceReceipt = record;
          // dot 68393: SAME-episode sequence HP1->HP2; the delayed later_check is
          // scheduled only after the FINAL helped application is answered.
          if (
            state.episode.practiceReceipts.length >=
              (state.episode.practiceAssetCount ?? 1)
          ) {
            state.episode.dueAt = new Date(
              instant(receipt.serverAnsweredAt) + policy.delayHours * 3600000,
            ).toISOString();
          }
        }
        if (d.phase === "later_check") {
          state.episode.reserveReceipt = record;
          (state.episode.reserveReceipts = state.episode.reserveReceipts || [])
            .push(record);
        }
        // The content layer may propose a focus only from server-owned qualified
        // evidence. The learner's disagreement remains a first-class record.
        const suggestion = state.episode
          ? null
          : await content.suggest({ identity, state, policy, now, tx });
        if (
          suggestion && state.declinedContrasts.includes(suggestion.contrastId)
        ) fail("declined_contrast_not_reproposable");
        if (
          suggestion &&
          (!suggestion.qualified || !suggestion.evidence?.receiptIds?.length)
        ) fail("unqualified_suggestion");
        if (!state.suggestion) state.suggestion = suggestion;
        result = {
          receipt: publicReceipt(record),
          suggestion: publicSuggestion(state.suggestion),
          next: decideNext({ state, policy, now, track }),
          ...(returnInfo ? { returnInfo } : {}),
        };
      } else if (action === "teaching_commit") {
        const ep = state.episode,
          sel = ep?.teachingSelection,
          steps = sel?.interaction?.steps,
          step = ep?.teachingStep ?? 0,
          cur = steps?.[step];
        if (!sel || !cur) fail("active_teaching_step_required");
        if (cur.figure) await verifyAsset(cur.figure);
        if (
          !Number.isInteger(payload.choice) || payload.choice < 0 ||
          payload.choice >= cur.alternatives.length
        ) fail("invalid_teaching_choice");
        if (ep.teachingSelections[step] === undefined) {
          ep.teachingSelections[step] = payload.choice;
        }
        const chosen = ep.teachingSelections[step];
        const fb = {
          step,
          totalSteps: steps.length,
          evidence: cur.evidence,
          figure: cur.figure || null,
          chosen,
          defensible: cur.defensible,
          alternatives: cur.alternatives,
          feedback: cur.feedback,
          ...(cur.post_answer_transfer
            ? { postAnswerTransfer: cur.post_answer_transfer }
            : {}),
          lastStep: step === steps.length - 1,
        };
        if (step < steps.length - 1) {
          ep.teachingStep = step + 1;
          result = {
            teachingFeedback: fb,
            next: {
              kind: "teaching",
              episodeId: ep.id,
              claim: ep.origin === "explicit_choice"
                ? "learner_choice_not_inference"
                : "selected_answer_observation_only",
            },
          };
        } else {
          const receipt = await tx.recordTeaching({
            id: uuid(),
            episodeId: ep.id,
            selection: sel,
            serverAt: now,
            evidenceClass: "teaching_exposure_not_completion",
            selections: ep.teachingSelections.slice(),
          });
          ep.teachingReceipt = {
            ...receipt,
            evidenceClass: "teaching_exposure_not_completion",
          };
          for (
            const family of [
              sel.familyId,
              ...(sel.disqualifyingFamilies || sel.relatedFamilies || []),
            ]
          ) {
            if (family && !state.helpedFamilies.includes(family)) {
              state.helpedFamilies.push(family);
            }
          }
          delete ep.teachingSelection;
          delete ep.teachingStep;
          delete ep.teachingPresented;
          result = {
            teachingFeedback: fb,
            next: decideNext({ state, policy, now, track }),
          };
        }
      } else if (action === "continue_curriculum") {
        // Single-offer curriculum continue (spec v0.3): the payload must echo the
        // server's OWN recomputed offer - module, digest-bearing content version,
        // sequence version AND manifest version. Any mismatch fails closed
        // (offer_changed); the browser can never select an arbitrary module.
        if (state.episode && !state.episode.closed) {
          fail("existing_episode_requires_finish");
        }
        if (state.pendingDelivery) fail("pending_delivery_requires_answer");
        if (!state.sessionStarted) fail("start_session_required");
        if (state.suggestion?.qualified) {
          fail("pending_suggestion_requires_response");
        }
        if (typeof content.curriculumOffer !== "function") {
          fail("curriculum_unavailable");
        }
        // SAME safe boundary as the status surface: a stale/replayed offer echo
        // can never create an episode when the budget is exhausted, the session
        // is closing, or any other next-state supersedes the ordinary case.
        if (
          decideNext({ state, policy, now, track }).kind !== "blueprint_case"
        ) fail("offer_changed");
        const offer = await content.curriculumOffer({
          identity,
          state,
          policy,
          now,
          tx,
          manifest,
        });
        if (!offer) fail("no_curriculum_offer");
        if (
          payload?.catalogModuleId !== offer.catalogModuleId ||
          payload?.catalogContentVersion !== offer.catalogContentVersion ||
          payload?.sequenceVersion !== offer.sequenceVersion ||
          payload?.manifestVersion !== offer.manifestVersion
        ) fail("offer_changed");
        state.episode = {
          id: uuid(),
          contrastId: offer.contrastId,
          catalogModuleId: offer.catalogModuleId,
          origin: "explicit_choice",
          followUp: offer.followUp || null,
          practiceReceipts: [],
          evidence: {
            receiptIds: [],
            basis: offer.basis,
            sequenceVersion: offer.sequenceVersion,
          },
          catalogContentVersion: offer.catalogContentVersion,
          catalogOrder: offer.catalogOrder,
          sequenceVersion: offer.sequenceVersion,
          manifestVersion: offer.manifestVersion,
          mappingVersion: "catalog-sequence:" + offer.sequenceVersion,
          createdAt: now,
          paused: false,
        };
        result = { next: decideNext({ state, policy, now, track }) };
      } else if (action === "accept_focus") {
        if (state.episode && !state.episode.closed) {
          fail("existing_episode_requires_finish");
        }
        const s = state.suggestion;
        if (
          !s?.qualified || payload.contrastId !== s.contrastId ||
          !s.mappingVersion || !s.manifestVersion || !s.reviewEvidence
        ) fail("qualified_focus_required");
        state.episode = {
          id: uuid(),
          contrastId: s.contrastId,
          origin: "selected_answer_observation",
          evidence: structuredClone(s.evidence),
          manifestVersion: s.manifestVersion,
          mappingVersion: s.mappingVersion,
          createdAt: now,
          paused: false,
        };
        state.suggestion = null;
        result = { next: decideNext({ state, policy, now, track }) };
      } else if (action === "decline_focus") {
        if (state.suggestion) {
          await tx.recordDecline({
            id: uuid(),
            contrastId: state.suggestion.contrastId,
            serverAt: now,
            reason: payload.reason || "does_not_fit",
            evidenceReceiptIds: state.suggestion.evidence?.receiptIds || [],
          });
          state.declinedContrasts.push(state.suggestion.contrastId);
          state.suggestion = null;
        } else if (state.episode) {
          const archived = {
            ...state.episode,
            paused: true,
            closed: true,
            closeReason: "learner_declined",
            closedAt: now,
          };
          await tx.recordDecline({
            id: uuid(),
            episodeId: state.episode.id,
            contrastId: state.episode.contrastId,
            serverAt: now,
            reason: payload.reason || "does_not_fit",
            evidenceReceiptIds: state.episode.evidence?.receiptIds || [],
          });
          await tx.archiveEpisode(archived);
          state.declinedContrasts.push(state.episode.contrastId);
          state.episode = null;
        }
        result = { next: decideNext({ state, policy, now, track }) };
      } else if (action === "finish_episode") {
        if (state.episode?.catalogModuleId) {
          // Catalog instructional completion (spec v0.3): BOTH server-owned
          // receipts on THIS episode - taught (never completion as exposure) and
          // helped-applied. A WRONG helped answer still completes the application;
          // completion is instructional, NEVER mastery. The pinned module version
          // must still be current (stale episodes were retired at command entry).
          const ep = state.episode;
          if (
            ep.teachingReceipt?.evidenceClass !==
              "teaching_exposure_not_completion"
          ) fail("curriculum_completion_requires_taught");
          const prs = ep.practiceReceipts?.length
            ? ep.practiceReceipts
            : (ep.practiceReceipt ? [ep.practiceReceipt] : []);
          if (prs.length < (ep.practiceAssetCount ?? 1)) {
            fail("curriculum_completion_requires_applied");
          }
          for (const pr of prs) {
            if (
              pr.evidenceClass !== "helped_or_assisted" ||
              pr.serverConfirmed !== true
            ) fail("curriculum_completion_requires_applied");
          }
          // Authoritative binding against PERSISTED server records, not receipt
          // object presence: the teaching receipt must be THIS member's exposure
          // row for THIS episode at the PINNED module version, and the practice
          // receipt must be THIS member's confirmed helped_practice answer recorded
          // under THIS episode's manifest/sequence pins. Foreign/stale receipts
          // fail closed. A wrong helped answer still completes (application).
          const [trow] = await tx
            .sql`select 1 from pathways_bcba.teaching_exposure where id=${ep.teachingReceipt.id}::uuid and member_id=${identity.id}::uuid and episode_id=${ep.id}::uuid and content_version=${ep.catalogContentVersion} limit 1`;
          if (!trow) fail("curriculum_completion_requires_taught");
          // Episode-scoped: the persisted answer context carries the OWNED
          // episode/module at answer time (derived from server state, never the
          // client) - an actual earlier same-member receipt under the same
          // manifest/sequence pins can never complete a different episode/module.
          for (const pr of prs) {
            const [arow] = await tx
              .sql`select 1 from pathways_bcba.answer_context where member_id=${identity.id}::uuid and receipt_id=${
              String(pr.id)
            } and server_receipt->>'phase'='helped_practice' and context->>'episodeId'=${ep.id} and context->>'catalogModuleId'=${ep.catalogModuleId} and context->>'manifestVersion'=${ep.manifestVersion} and context->>'mappingVersion'=${ep.mappingVersion} limit 1`;
            if (!arow) fail("curriculum_completion_requires_applied");
          }
          await tx.archiveEpisode({
            ...ep,
            closed: true,
            closeReason: "curriculum_completed",
            closedAt: now,
          });
          state.episode = null;
          // 1508 follow-up: open the reviewed fresh-check contrast episode(s)
          // immediately (dueAt=now). The binding comes ONLY from the completed
          // module's reviewed manifest followUp entry - never inferred from tags
          // or pair codes. Helped completion is the PREREQUISITE, not evidence.
          const fuTargets = Array.isArray(ep.followUp?.targets)
            ? ep.followUp.targets
            : [];
          // Append, never overwrite: pending targets from an earlier completed
          // module survive this module's completion (queue order is preserved).
          state.pendingFollowUps = (state.pendingFollowUps || []).concat(
            fuTargets.slice(1).map((t) => ({
              contrastId: t.contrastId,
              mappingVersion: t.mappingVersion,
              requiredChecks: t.requiredChecks ?? null,
            })),
          );
          if (fuTargets.length) {
            const t = fuTargets[0];
            state.episode = openFollowUp(t, ep.id);
            if (state.episode.inventoryNotice) {
              state.inventoryNotice = state.episode.inventoryNotice;
            }
          }
          // Post-completion continuation: the SAME boundary gate recomputes the
          // next offer, so completing a lesson lands on its successor (one flow).
          const doneNext = decideNext({ state, policy, now, track });
          const nextOffer = await boundaryOffer(state, doneNext);
          result = {
            next: doneNext,
            ...(nextOffer ? { curriculumOffer: nextOffer } : {}),
          };
        } else {
          if (!state.episode?.reserveReceipt) {
            fail("confirmed_later_response_required");
          }
          // catalog_followup: a close with fewer reserves than the reviewed
          // expectation is recorded as an HONEST partial gap (unserved count
          // carried on the archived episode) - never as a completed fresh check.
          if (state.episode.origin === "catalog_followup") {
            const servedCount = state.episode.reserveReceipts?.length ?? 0;
            const expectedCount = state.episode.expectedReserves ?? 1;
            if (servedCount < expectedCount) {
              await tx.archiveEpisode({
                ...state.episode,
                closed: true,
                closeReason: "fresh_check_partial_unserved",
                unservedReserves: expectedCount - servedCount,
                closedAt: now,
              });
            } else {await tx.archiveEpisode({
                ...state.episode,
                closed: true,
                closeReason: "fresh_check_completed",
                closedAt: now,
              });}
          } else await tx.archiveEpisode(state.episode);
          state.episode = null;
          if (state.pendingFollowUps?.length) {
            const t = state.pendingFollowUps.shift();
            state.episode = openFollowUp(t, null);
            if (state.episode.inventoryNotice) {
              state.inventoryNotice = state.episode.inventoryNotice;
            }
          }
          result = { next: decideNext({ state, policy, now, track }) };
        }
      } else if (action === "finish_session") {
        if (
          state.pendingDelivery &&
          state.pendingDelivery.phase === "return_case" &&
          policy.itemReturn?.enabled === true && tx.sql
        ) {
          // T7 abandoned return: released back to due, never counted. The pending
          // delivery retires honestly; the queue row returns to 'open'.
          await tx.recordDecline({
            id: uuid(),
            kind: "return_released",
            deliveryId: state.pendingDelivery.id,
            phase: "return_case",
            familyId: state.pendingDelivery.selection?.familyId || null,
            outcome: "session_closed_unanswered",
            serverAt: now,
          });
          const relItem = String(state.pendingDelivery.selection?.itemId ?? "");
          if (relItem) {
            await tx
              .sql`update pathways_bcba.return_queue set status='open', served_delivery_id=null, served_at=null where member_id=${identity.id}::uuid and track=${track} and item_id=${relItem} and status='served'`;
            await tx
              .sql`insert into pathways_bcba.return_events(member_id,track,item_id,pair_code,kind,at) values (${identity.id}::uuid,${track},${relItem},${
              state.pendingDelivery.selection?.returnMeta?.pairCode || ""
            },'released',${now})`;
          }
          state.pendingDelivery = null;
        }
        if (state.pendingDelivery) fail("pending_delivery_requires_answer");
        if (!state.sessionStarted) fail("session_not_started");
        state.completedSession = {
          id: uuid(),
          startedAt: state.sessionStarted,
          finishedAt: now,
          answered: state.sessionAnswered,
          receiptIds: (state.sessionReceiptIds || []).slice(),
          dueAt: state.episode?.dueAt || null,
          openEpisode: state.episode
            ? {
              id: state.episode.id,
              contrastId: state.episode.contrastId,
              resumes: "next_session",
            }
            : null,
        };
        state.sessionStarted = null;
        result = {
          next: { kind: "session_complete", summary: state.completedSession },
        };
      }
      result = await withResume(result, state, false);
      await tx.save(state);
      await tx.recordOperation(nonce, { encoded, result });
      return result;
    });
  }
  return { run };
}
