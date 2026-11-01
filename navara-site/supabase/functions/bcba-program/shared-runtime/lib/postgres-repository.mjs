// Private target adapter. Requires additive program-schema.sql, not applied.
// Pass a postgres.js connection; never expose this adapter or key to the browser.
export function programRepository(sql, { allowSynthetic = false } = {}) {
  return {
    async transaction(memberId, fn) {
      return sql.begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(hashtextextended('bcba-program:'||${memberId},0))`;
        // The shared writer RPCs (serve_items/learner_answer_bridge) require the live service-role claim.
        // Set it transaction-locally, exactly as the harness does; EXECUTE on those functions stays
        // restricted to owner + service_role + this runtime role (patch C), never browser roles.
        await tx`select set_config('request.jwt.claims','{"role":"service_role"}',true)`;
        const get = async () => {
          const rows =
            await tx`select state from pathways_bcba.program_state where member_id=${memberId}::uuid for update`;
          if (rows.length !== 1) throw Error("program_enrollment_required");
          return rows[0].state;
        };
        return fn({
          sql: tx,
          assertCurrentAccess: async (identity) => {
            const p =
              await tx`select pathways_bcba.lock_member_access(${memberId}::uuid,${
                identity.track || ""
              }) ok`;
            if (identity.id !== memberId || !p[0].ok) {
              throw Error("guided_bcba_required");
            }
            const r = await tx`select pathways_bcba.lock_release_enabled() ok`;
            const a =
              await tx`select pathways_bcba.lock_enrollment(${memberId}::uuid,${allowSynthetic}) ok`;
            if (!r[0].ok || !a[0].ok) {
              throw Error("program_release_unavailable");
            }
          },
          assertPolicy: async (policy, hash) => {
            const rows =
              await tx`select pathways_bcba.lock_policy_assert(${policy.id},${hash},${
                tx.json(policy)
              }) ok`;
            if (!rows[0].ok) throw Error("policy_content_mismatch");
          },
          // Same-transaction binding of the provider-LOADED manifest: the payload the
          // contrast provider serves from must be the exact approved stored jsonb the
          // enrolled policy points at - verified INSIDE the serving transaction, not
          // asserted by the loader. manifest_hash is GENERATED from the stored payload,
          // so jsonb payload equality binds version+payload+hash together.
          assertManifest: async (manifest, version, policyId) => {
            const rows =
              await tx`select pathways_bcba.lock_manifest_assert(${version},${
                tx.json(manifest)
              },${policyId},${allowSynthetic}) ok`;
            if (!rows[0].ok) throw Error("manifest_content_mismatch");
          },
          load: get,
          operation: async (nonce) => {
            const r =
              await tx`select encoded,result from pathways_bcba.operation where member_id=${memberId}::uuid and nonce=${nonce}::uuid`;
            if (!r.length) return null;
            const delivery = r[0].result?.delivery?.id ||
              r[0].result?.receipt?.deliveryId;
            // answered: the replayed operation already produced an ACCEPTED receipt -
            // the historical answer stands (receipts are immutable); only the replay
            // is unavailable. The edge copy must never claim it was 'retired without
            // a scored answer'.
            if (delivery) {
              const v =
                await tx`select pathways_bcba.lock_delivery_question(${memberId}::uuid,${delivery}::uuid) ok`;
              if (!v[0].ok) {
                throw Object.assign(
                  Error("operation_content_withdrawn_or_changed"),
                  {
                    code: "operation_content_withdrawn_or_changed",
                    terminal: "content_changed",
                    answered: !!r[0].result?.receipt,
                  },
                );
              }
            }
            return r[0];
          },
          save: async (state) => {
            if (state.memberId !== memberId) throw Error("foreign_state");
            await tx`update pathways_bcba.program_state set state=${
              tx.json(state)
            },updated_at=clock_timestamp() where member_id=${memberId}::uuid`;
          },
          recordOperation: async (nonce, v) => {
            await tx`insert into pathways_bcba.operation(member_id,nonce,encoded,result) values(${memberId}::uuid,${nonce}::uuid,${v.encoded},${
              tx.json(v.result)
            })`;
          },
          recordAnswer: async (v) => {
            await tx`insert into pathways_bcba.answer_context(member_id,receipt_id,delivery_id,context,server_receipt) values(${memberId}::uuid,${
              String(v.id)
            },${v.deliveryId}::uuid,${tx.json(v.context)},${tx.json(v)})`;
          },
          // Member-safe history projection over the member's OWN receipts. The
          // identity filter is the transaction-bound pinned memberId (never a
          // client/payload value). Internal quality fields (independenceVerified,
          // lineageResolved, evidenceClass, family lineage, hashes) are NOT
          // projected. This SELECT is the serving-path equivalent of the UNAPPLIED
          // member_history_facts(p_member_id) draft; both are server-only.
          history: async (limit = 5) => {
            const rows =
              await tx`select receipt_id,recorded_at,context,server_receipt from pathways_bcba.answer_context where member_id=${memberId}::uuid order by recorded_at desc, receipt_id desc limit ${limit}`;
            return rows.map((r) => ({
              receiptId: r.receipt_id,
              answeredAt: r.recorded_at,
              phase: r.server_receipt?.phase ?? null,
              domain: r.context?.domain ?? null,
              outlineTag: r.context?.outlineTag ?? null,
              correct: typeof r.server_receipt?.correct === "boolean"
                ? r.server_receipt.correct
                : null,
              serveExposure: r.context?.serveExposure ?? null,
              servePurpose: r.context?.servePurpose ?? null,
              serveScope: r.context?.serveScope ?? null,
            }));
          },
          recordTeaching: async (v) => {
            await tx`insert into pathways_bcba.teaching_exposure(id,member_id,episode_id,content_version,related_families,payload) values(${v.id}::uuid,${memberId}::uuid,${v.episodeId}::uuid,${v.selection.version},${
              v.selection.relatedFamilies || []
            },${tx.json(v)})`;
            return v;
          },
          recordDecline: async (v) => {
            await tx`insert into pathways_bcba.learner_feedback(id,member_id,payload) values(${v.id}::uuid,${memberId}::uuid,${
              tx.json(v)
            })`;
          },
          archiveEpisode: async (v) => {
            await tx`insert into pathways_bcba.episode_archive(id,member_id,payload) values(${v.id}::uuid,${memberId}::uuid,${
              tx.json(v)
            }) on conflict(id) do nothing`;
          },
        });
      });
    },
  };
}
