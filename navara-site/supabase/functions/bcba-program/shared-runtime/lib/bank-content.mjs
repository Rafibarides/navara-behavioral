// PRIVATE: server-owned bank allocation adapter, no client topic/score routing.
// ContrastProvider defaults to null. Raw option tags never become approvals.
//
// BANK RETURN CHANNEL PREP (M7 round 3, reviewer finding 1 / Main 23:37): ordinary
// bank misses can enqueue ONLY when the served option carries content-authored,
// version-pinned mixUp metadata. bankMixUp is an explicit manifest object
// {version, reviewEvidence, items:{itemId:{contentHash, options:[{code,tell}|null]}}}:
// an entry binds ONLY when its pinned contentHash equals the live served-row hash
// (a changed item never inherits stale metadata), codes come only from the #1550 v3
// reviewed dictionary, and anything missing/mismatched/unclassified yields NO mixUp
// key - the engine then never enqueues and never tells (fail closed). Authoring and
// qualification of actual entries is content-side scope (coordinator owns the
// 1550/1528/1622 mapping); this channel ships EMPTY until then, so bank behavior is
// unchanged until authored metadata lands.
export function bankContent(
  {
    contrastProvider = null,
    catalogProvider = null,
    track = "bcba",
    bankMixUp = null,
  } = {},
) {
  const mixFor = (itemId, hash, idx) => {
    const m = bankMixUp?.items?.[String(itemId)];
    if (!m || !m.contentHash || m.contentHash !== hash) return null;
    const o = m.options?.[idx];
    return o && typeof o.code === "string" && o.code &&
        o.code !== "unclassified"
      ? {
        code: o.code,
        tell: o.tell || null,
        pair: o.queue_eligible_pair === true,
      }
      : null;
  };
  return {
    // Forward the provider's family resolver: the program answer path re-evaluates
    // reserve/shared lineage by family and must see REGISTERED families, not the
    // ITEM:id singleton fallback.
    ...(contrastProvider?.itemFamilyFor
      ? { itemFamilyFor: (id) => contrastProvider.itemFamilyFor(id) }
      : {}),
    // Forward the provider's registry-version read (call-time) for receipt pinning.
    ...(contrastProvider?.registryVersion
      ? { registryVersion: () => contrastProvider.registryVersion() }
      : {}),
    // PRIVATE curriculum-entry prototype (spec v0.3): forward the catalog
    // adapter's single-offer selection and pinned-version checks when present.
    ...(catalogProvider
      ? {
        curriculumOffer: (args) => catalogProvider.curriculumOffer(args),
        catalogEpisodeCurrent: (args) =>
          catalogProvider.catalogEpisodeCurrent(args),
        catalogModuleInfo: (args) => catalogProvider.catalogModuleInfo(args),
        verifyFigureAsset: (args) => catalogProvider.verifyFigureAsset(args),
        ...(catalogProvider.returnContrast
          ? { returnContrast: (args) => catalogProvider.returnContrast(args) }
          : {}),
      }
      : {}),
    // returnItem: catalog-bound items first (helped-practice assets); otherwise the
    // BANK row itself is re-served by id with in-transaction hash re-verification
    // (finding 1: an ordinary missed bank item must be returnable once it carries
    // authored metadata). A missing/unpublished/changed row returns null -> the
    // engine's gap path runs (never a stale serve).
    async returnItem(
      { identity, itemId, expectedHash = null, state, policy, now, tx },
    ) {
      if (catalogProvider?.returnItem) {
        const r = await catalogProvider.returnItem({
          identity,
          itemId,
          expectedHash,
          state,
          policy,
          now,
          tx,
        });
        if (r) return r;
        // A catalog-BOUND id whose catalog return was refused (stale pin, changed
        // binding, edited live row) must NOT fall through to the bank path: the row
        // would re-serve under the wrong role/classification. Gap instead.
        if (catalogProvider?.catalogBound?.(String(itemId))) return null;
      }
      if (!tx?.sql) throw Error("same_transaction_content_required");
      const sql = tx.sql;
      if (!/^\d+$/.test(String(itemId))) return null; // bank items are numeric question ids
      const rows =
        await sql`select q.*,pathways_evidence.content_hash(q.body,q.options,q.answer,q.explanation,q.citation) hash from public.questions q where q.id=${
          String(itemId)
        }::bigint and q.track=${track} and q.published`;
      const q = rows[0];
      if (!q) return null;
      // Enqueue-pin (v4, reviewer HASHCHANGED): the bank row must still be the exact
      // content the learner missed. An edited row (live hash != enqueue-time hash) or a
      // queue row with NO pin (null) is NOT served as a bank return - null runs the gap
      // path. Fail closed: no unversioned return escape.
      if (!expectedHash || q.hash !== expectedHash) return null; // v4 fail closed: no pin = no bank return (never an unversioned escape); changed content never re-served
      return {
        track,
        role: "ordinary",
        itemId: String(q.id),
        version: "source-" + q.hash,
        contentHash: q.hash,
        familyId: "ITEM:" + q.id,
        domain: (q.outline_tag || "").split(".")[0] || null,
        outlineTag: q.outline_tag,
        mappingApproved: false,
        optionContext: q.options.map((o, i) => {
          const mix = mixFor(q.id, q.hash, i);
          return {
            whyTempting: o.why_tempting || null,
            remediationPointer: o.remediation_pointer || null,
            ...(mix ? { mixUp: mix } : {}),
          };
        }),
        body: q.body,
      };
    },
    async allocate(
      {
        identity,
        state,
        phase,
        domain,
        episode,
        policy,
        now,
        tx,
        excludeItemIds = [],
      },
    ) {
      if (!tx?.sql) throw Error("same_transaction_content_required");
      const sql = tx.sql;
      // Ordinary-pick exclusions: the engine's fresh-only re-pick list (was silently
      // dropped) plus, below, the pinned baseline candidate. Bank items are numeric.
      const exclusions = excludeItemIds.filter((x) => /^\d+$/.test(String(x)))
        .map(String);
      if (phase === "blueprint_case" && contrastProvider?.baselineEligibility) {
        const b = await contrastProvider.baselineEligibility({ identity, tx });
        const r = b?.record;
        // The pinned baseline candidate is NEVER ordinary inventory: its only serve
        // path is the eligibility-verified candidate branch below. Without this the
        // deficit fallback re-offers a WITHHELD candidate as an ordinary bank item
        // in its outline domain (reviewer regression, 2026-10-29).
        if (r && /^\d+$/.test(String(r.itemId))) {
          exclusions.push(String(r.itemId));
        }
        if (r && r.domain === domain) {
          if (b.eligible) {
            return {
              track,
              role: "ordinary",
              itemId: r.itemId,
              version: r.version,
              contentHash: r.contentHash,
              familyId: r.familyId,
              domain,
              outlineTag: r.outlineTag || null,
              mappingApproved: false,
              optionMappings: null,
              mappingVersion: null,
              optionContext: null,
              body: r.body,
              baselineCandidate: true,
              baselineEligibilityVerified: true,
              disqualifyingOnFeedback: r.disqualifyingOnFeedback || [],
              sharedDispositions: r.sharedConstructFamilies || [],
              edgeRecord: b.edges,
            };
          }
          state.baselineNotice = {
            withheldCandidate: r.itemId,
            reasons: b.reasons,
            edges: b.edges,
            serverAt: now,
          };
        }
      }
      if (phase !== "blueprint_case") {
        // Catalog episodes serve from the catalog adapter; contrast episodes from
        // the contrast provider. The kind is decided by the server-pinned episode,
        // never by anything the browser sent.
        if (episode?.catalogModuleId) {
          return catalogProvider
            ? catalogProvider.allocate({
              identity,
              state,
              phase,
              episode,
              policy,
              now,
              tx,
            })
            : null;
        }
        if (!contrastProvider) return null;
        return contrastProvider.allocate({
          identity,
          state,
          phase,
          episode,
          policy,
          now,
          tx,
        });
      }
      // Pin the selected bank row through the owner-defined lock helper (same predicates, FOR SHARE inside),
      // then re-read the locked row: the transaction holds the pin, so the re-read cannot see changed content.
      const picked =
        await sql`select pathways_bcba.lock_next_bank_item(${identity.id}::uuid,${track},${domain},${
          exclusions.length ? exclusions : null
        }::bigint[]) id`;
      if (!picked[0].id) return { unavailableDomain: domain }; // dry domain must read as unavailableDomain so the engine's deficit fallback tries the next domain
      const rows =
        await sql`select q.*,pathways_evidence.content_hash(q.body,q.options,q.answer,q.explanation,q.citation) hash from public.questions q where q.id=${
          picked[0].id
        }`;
      const q = rows[0];
      return {
        track,
        role: "ordinary",
        itemId: q.id,
        version: "source-" + q.hash,
        contentHash: q.hash,
        familyId: "ITEM:" + q.id,
        domain,
        outlineTag: q.outline_tag,
        mappingApproved: false,
        optionContext: q.options.map((o, i) => {
          const mix = mixFor(q.id, q.hash, i);
          return {
            whyTempting: o.why_tempting || null,
            remediationPointer: o.remediation_pointer || null,
            ...(mix ? { mixUp: mix } : {}),
          };
        }),
        body: q.body,
      };
    },
    async suggest({ identity, state, policy, now, tx }) {
      if (!contrastProvider) return null;
      const s = await contrastProvider.suggest({
        identity,
        state,
        policy,
        now,
        tx,
      });
      if (!s) return null;
      if (state.declinedContrasts.includes(s.contrastId)) return null;
      if (
        !s.qualified || !s.reviewEvidence || !s.manifestVersion ||
        !s.mappingVersion || !s.evidence?.receiptIds?.length
      ) throw Error("unreviewed_contrast_suggestion");
      return s;
    },
  };
}
