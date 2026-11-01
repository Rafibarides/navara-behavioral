// PRIVATE prototype catalog adapter: serves NORMALIZED REVIEWED teaching
// modules (nine-domain-native-content-adapter-input-v1) for EXPLICITLY SEEDED
// test episodes only. NOT a contrast provider: no approval, no qualification,
// no suggestion, no reserve inventory, no public entry mode. Practice assets
// are served ONLY through rollback-bound exact rows (real itemId + live
// content_hash supplied by the test as bindings). Production loader unchanged:
// this adapter can never satisfy its approved/non-synthetic gate.
import { createHash } from "node:crypto";
import {
  figurePinDigest,
  validateFigurePin,
  verifyFigureBytes,
} from "./figure-pin.mjs";
// Content identity = deterministic digest of the EXACT interaction bytes.
// version is DIGEST-BEARING (moduleId@digest): the teaching ledger records
// selection.version, and a bare module id would let changed bytes keep an
// unchanged identity - sourceTeachingVersion transfer pins must distinguish
// changed instruction.
// sha256 over canonical JSON (object keys sorted recursively, arrays in
// order). A catalog-id pseudo-hash would let teaching bytes change under an
// unchanged identity; this recipe makes byte changes identity changes.
// FIGURE IDENTITY (format v0.1): a step's figure pin (sha256/mime/dims/alt/
// labeled record) lives INSIDE the interaction, so the same canonical digest
// covers it - an image, axis, alt or record edit IS a byte change. The digest
// pins identity; the content-addressed byte check at serve time (below)
// verifies the actual asset. Practice-asset figures are not in the
// interaction digest; they are folded into the served version string.
const canon = (v) =>
  Array.isArray(v)
    ? v.map(canon)
    : (v && typeof v === "object"
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]))
      : v);
export const catalogDigest = (interaction) =>
  createHash("sha256").update(JSON.stringify(canon(interaction))).digest("hex");
export function catalogProvider(
  { catalog, bindings, figures, track = "bcba" },
) {
  // dot 68393: helped practice is an ordered SEQUENCE of helped applications
  // (HP1 then HP2) in the SAME episode; bindings may name one asset (legacy
  // object) or an ordered list. Serve by the episode's recorded receipt count.
  const boundList = (mod) => {
    const b = bindings?.[mod.id];
    if (!b) return [];
    return (Array.isArray(b) ? b : [b]).filter((x) =>
      x && x.itemId && x.contentHash
    );
  };
  // Per-module track binding (RBT gate): every catalog module must DECLARE its
  // track and match the provider's track; a missing or foreign track fails
  // closed at load, before any episode can address the module.
  // Content-addressed figure store: Map sha256 -> bytes. Every serve
  // re-verifies pin structure AND bytes; missing/mismatched assets fail closed
  // (curriculum_figure_unavailable), never silently degrade to text.
  const figureFail = () => {
    const e = new Error("curriculum_figure_unavailable");
    e.code = "curriculum_figure_unavailable";
    throw e;
  };
  const verifiedFigure = (pin) => {
    if (!validateFigurePin(pin)) figureFail();
    if (!figures || !verifyFigureBytes(pin, figures.get(pin.sha256))) {
      figureFail();
    }
    return pin;
  };
  for (const m of catalog.modules) {
    if (m.track !== track) throw Error("catalog_module_track_mismatch");
  }
  const digests = new Map(
    catalog.modules.map((m) => [m.id, catalogDigest(m.interaction)]),
  );
  // PRIVATE TEST-EPISODE GATE (enforced here, not just harness convention):
  // only an explicitly seeded test episode - origin 'explicit_choice' AND the
  // private-catalog contrastId marker AND a known catalogModuleId - may address
  // the catalog. Any other origin (suggestion/approval/missing) gets null, so
  // the adapter can never become a public entry mode.
  const moduleFor = (episode) => {
    if (episode?.origin !== "explicit_choice" || !episode?.catalogModuleId) {
      return null;
    }
    return catalog.modules.find((m) =>
      m.id === episode.catalogModuleId &&
      episode.contrastId === "catalog-" + m.id
    ) || null;
  };
  return {
    async allocate({ phase, episode }) {
      const mod = moduleFor(episode);
      if (!mod) return null;
      if (phase === "teaching") {
        // Helped lineages: the module lineage AND the exact bank source lineage
        // (exposure edge: source answer-bearing feedback -> module is helped, and
        // practice/source future responses are never clean after this teaching).
        for (const st of mod.interaction.steps) {
          if (st.figure) verifiedFigure(st.figure);
        }
        // Reviewed exposure edges (neighbor adjudication id recorded on the
        // module): direct answer-bearing help runs BOTH directions between this
        // unit and the named bank items - teaching helps their later responses
        // and their feedback burns this unit's cleanliness. Recorded, never
        // adjudicated here.
        return {
          track,
          role: "teaching",
          contentHash: digests.get(mod.id),
          version: mod.id + "@" + digests.get(mod.id),
          interaction: mod.interaction,
          familyId: mod.familyId,
          relatedFamilies: [
            mod.familyId,
            ...(mod.sourceId
              ? ["ITEM:" + mod.sourceId]
              : mod.sourceUnitId
              ? ["UNIT:" + mod.sourceUnitId]
              : []),
            mod.familyId + "/practice",
            ...(mod.directHelpItemIds || []).map((id) => "ITEM:" + id),
          ],
          contrastId: episode.contrastId,
          manifestVersion: episode.manifestVersion,
          mappingVersion: episode.mappingVersion,
          practiceAssetCount: boundList(mod).length,
        };
      }
      if (phase === "helped_practice") {
        const bl = boundList(mod);
        if (!bl.length) return null; // unbound practice is honestly unservable
        const idx = episode.practiceReceipts?.length ??
          (episode.practiceReceipt ? 1 : 0);
        const b = bl[idx];
        if (!b) return null; // sequence exhausted - program moves to later_check
        const asset = b.assetId
          ? mod.practiceAssets.find((a) => a.id === b.assetId)
          : mod.practiceAssets[0];
        if (!asset) return null;
        // A graph-dependent application carries its figure pin into the SERVED
        // VERSION (practice assets are outside the interaction digest). The FULL
        // pin is folded - image bytes AND alt AND record AND dims: an alt or
        // record edit is content-bearing and changes the ledger identity even
        // when the image bytes are unchanged.
        const fig = asset.figure ? verifiedFigure(asset.figure) : null;
        const figDigest = fig ? figurePinDigest(fig) : null;
        return {
          track,
          role: "practice",
          itemId: b.itemId,
          contentHash: b.contentHash,
          version: "source-" + b.contentHash +
            (fig ? "+figure-" + figDigest : ""),
          figure: fig,
          familyId: mod.familyId + "/practice",
          contrastId: episode.contrastId,
          manifestVersion: episode.manifestVersion,
          mappingVersion: episode.mappingVersion,
          domain: mod.domain,
          optionContext: (asset.options || []).map((o) => ({
            mixUp: o?.mixUp
              ? {
                code: o.mixUp.code,
                tell: o.mixUp.tell || null,
                pair: o.mixUp.queue_eligible_pair === true,
              }
              : null,
          })),
        };
      }
      return null; // later_check: NO reserve inventory authored - ordinary continuation
    },
    // dot 68393 (confirmed product decision): a module's helped practice is a
    // SEQUENCE of helped applications served in authored order within the SAME
    // episode (HP1 then HP2), each answered and recorded as a helped exposure,
    // neither fresh nor independent. Bindings may name one asset (legacy single
    // object) or an ordered list; normalize to a list and serve by the count of
    // practice receipts already recorded in this episode.
    async suggest() {
      return null;
    },
    // 1712 return re-serve: the EXACT previously-bound practice item by id, with
    // the same content pins re-verified like any serve. Never a substitute item:
    // an unbound or changed item returns null and the caller falls back honestly.
    async returnItem({ itemId, expectedHash = null, tx }) {
      for (const mod of catalog.modules) {
        const b = boundList(mod).find((x) => x.itemId === String(itemId));
        if (!b) continue;
        // v4 catalog pin enforcement (reviewer catalog-asymmetry finding): the pin
        // stored AT ENQUEUE must still equal the current binding, the binding must
        // still equal the LIVE row hash, and a pinless queue row never returns.
        // Any doubt -> null (gap path); the caller must NOT fall back to the bank
        // path for a catalog-bound id (wrong classification).
        if (!expectedHash || b.contentHash !== expectedHash) return null;
        if (!tx?.sql) return null; // live re-verification required; no tx, no return
        if (/^\d+$/.test(String(itemId))) {
          const [h] = await tx
            .sql`select pathways_evidence.content_hash(body,options,answer,explanation,citation) hash from public.questions where id=${
            String(itemId)
          }::bigint and published`;
          if (!h || h.hash !== b.contentHash) return null;
        }
        const asset = b.assetId
          ? mod.practiceAssets.find((a) => a.id === b.assetId)
          : mod.practiceAssets[0];
        if (!asset) return null;
        const fig = asset.figure ? verifiedFigure(asset.figure) : null;
        const figDigest = fig ? figurePinDigest(fig) : null;
        return {
          track,
          role: "practice",
          itemId: b.itemId,
          contentHash: b.contentHash,
          version: "source-" + b.contentHash +
            (fig ? "+figure-" + figDigest : ""),
          figure: fig,
          familyId: mod.familyId + "/practice",
          domain: mod.domain,
          optionContext: (asset.options || []).map((o) => ({
            mixUp: o?.mixUp
              ? {
                code: o.mixUp.code,
                tell: o.mixUp.tell || null,
                pair: o.mixUp.queue_eligible_pair === true,
              }
              : null,
          })),
        };
      }
      return null;
    },
    catalogBound(itemId) {
      for (const mod of catalog.modules) {
        if (boundList(mod).some((b) => b.itemId === String(itemId))) {
          return true;
        }
      }
      return false;
    },
    // returnContrast intentionally ABSENT: no qualified contrast inventory exists
    // (#1676 unapproved), so the T5 preference always falls to the gap-log path
    // until a reviewed contrast mapping ships.
    // EVERY-SERVE revalidation hook for program-orchestrated replays/resumes/
    // answers (stored selections bypass allocate): re-verifies pin structure
    // AND current asset bytes; throws curriculum_figure_unavailable on any
    // mismatch. Fail-closed, never degrade.
    verifyFigureAsset(pin) {
      verifiedFigure(pin);
      return true;
    },
    // SINGLE-OFFER curriculum selection (spec v0.3): the next sequenced module
    // this member has NOT instructionally completed at its CURRENT
    // digest-bearing version. Progress derives from the open-episode pins plus
    // immutable episode_archive closeReason rows - NEVER from teaching
    // exposure rows (exposure is help, not completion). Versionless permanent
    // declines skip a module. The catalog section of the bound manifest is
    // validated at bind time; any structural failure fails closed to null.
    async curriculumOffer({ identity, state, tx, manifest }) {
      // Whole-section validation: EVERY entry must pin the exact digest-bearing
      // version of the private adapter bytes (the catalog itself lives outside
      // the manifest in this prototype - the section binds it by digest, never
      // by trusting a bare id; production manifest binding is release work).
      const section = validatedSection(manifest, digests, catalog);
      if (!section) return null;
      const rows = section.modules.map((e) => ({
        e,
        version: e.catalogContentVersion,
      }));
      rows.sort((a, b) => a.e.order - b.e.order);
      const archived = await tx
        .sql`select payload from pathways_bcba.episode_archive where member_id=${identity.id}::uuid and payload->>'catalogModuleId' is not null`;
      const completedAt = new Map();
      for (const r of archived) {
        const p = r.payload;
        if (p?.closeReason !== "curriculum_completed") continue;
        if (!completedAt.has(p.catalogModuleId)) {
          completedAt.set(p.catalogModuleId, new Set());
        }
        completedAt.get(p.catalogModuleId).add(p.catalogContentVersion || null);
      }
      for (const { e, version } of rows) {
        if (state.declinedContrasts.includes("catalog-" + e.moduleId)) continue; // versionless, permanent
        const done = completedAt.get(e.moduleId);
        if (done?.has(version)) continue;
        const basis = done && done.size
          ? "curriculum_sequence_updated"
          : "curriculum_sequence";
        return {
          contrastId: "catalog-" + e.moduleId,
          catalogModuleId: e.moduleId,
          title: e.title,
          why: e.why,
          catalogContentVersion: version,
          catalogOrder: e.order,
          sequenceVersion: section.sequenceVersion,
          manifestVersion: manifest?.version || null,
          basis,
          followUp: e.followUp || null,
        };
      }
      return null;
    },
    // Display info for the OPEN catalog episode (resume surface): title/why
    // from the SAME validated section, null when the section is ineligible
    // (the episode is being/has been retired in that case anyway).
    async catalogModuleInfo({ episode, manifest }) {
      const section = validatedSection(manifest, digests, catalog);
      if (!section) return null;
      const e = section.modules.find((x) =>
        x.moduleId === episode?.catalogModuleId
      );
      if (!e) return null;
      return { title: e.title, why: e.why };
    },
    // Pinned-version survival (spec v0.3): an open catalog episode survives a
    // manifest revision ONLY when the module's approved digest AND its sequence
    // order are both unchanged. Withdrawal, byte change, order change, or an
    // invalid catalog section is not current - the program retires honestly.
    async catalogEpisodeCurrent({ episode, manifest }) {
      const section = validatedSection(manifest, digests, catalog);
      if (!section) return false;
      const mod = catalog.modules.find((m) => m.id === episode.catalogModuleId);
      if (!mod) return false;
      if (
        episode.catalogContentVersion !== mod.id + "@" + digests.get(mod.id)
      ) return false;
      const e = section.modules.find((x) =>
        x.moduleId === episode.catalogModuleId
      );
      if (!e) return false;
      if (e.order !== episode.catalogOrder) return false;
      return true;
    },
  };
}
// Catalog section validation: structural failures make the WHOLE section
// ineligible (fail closed), never a partial best-effort offer.
function sectionOf(manifest) {
  const s = manifest?.payload?.catalog;
  if (
    !s || typeof s.sequenceVersion !== "string" || !Array.isArray(s.modules) ||
    !s.modules.length
  ) return null;
  if (
    s.modules.some((m) =>
      !m || typeof m.moduleId !== "string" || typeof m.title !== "string" ||
      typeof m.why !== "string" || !Number.isSafeInteger(m.order)
    )
  ) return null;
  if (new Set(s.modules.map((m) => m.order)).size !== s.modules.length) {
    return null;
  }
  if (new Set(s.modules.map((m) => m.moduleId)).size !== s.modules.length) {
    return null;
  }
  // 1508 followUp binding (optional): explicit reviewed targets only - the
  // engine never infers a pair or contrast. Malformed shape invalidates the
  // WHOLE section (fail closed, no offer, no episode survival).
  if (
    s.modules.some((m) =>
      m.followUp != null &&
      (typeof m.followUp !== "object" || !Array.isArray(m.followUp.targets) ||
        m.followUp.targets.some((t) =>
          !t || typeof t.contrastId !== "string" ||
          typeof t.mappingVersion !== "string" ||
          (t.requiredChecks != null && !Number.isSafeInteger(t.requiredChecks))
        ))
    )
  ) return null;
  return s;
}
// Centralized whole-section validation for BOTH offer selection and pinned
// episode survival: structure plus an EXACT digest-bearing version on every
// entry. Any failure makes the whole section ineligible (fail closed) - an
// invalid section can neither produce an offer nor keep an episode alive.
function validatedSection(manifest, digests, catalog) {
  const s = sectionOf(manifest);
  if (!s) return null;
  for (const e of s.modules) {
    const mod = catalog.modules.find((m) => m.id === e.moduleId);
    if (!mod) return null;
    if (e.catalogContentVersion !== mod.id + "@" + digests.get(mod.id)) {
      return null;
    }
  }
  return s;
}
