// RECOVERED from old transcript 8:21:55 PM Oct 27 (cat output)
// PRIVATE DRAFT. Same-transaction server SQL transport, not another Edge call.
// Prevents a confirmed answer outside an aborted program transaction from
// leaving the program's context ledger out of sync. Actual target tests pending.
export function protectedTransport({ track = "bcba" } = {}) {
  async function serve(identity, selection, { nonce, phase }, tx) {
    if (!tx?.sql) throw Error("same_transaction_transport_required");
    const sql = tx.sql;
    const verified =
      await sql`select pathways_bcba.lock_question_content(${selection.itemId}::bigint,${selection.contentHash},${track}) ok`;
    if (!verified[0].ok) {
      throw Object.assign(Error("content_changed"), {
        code: "content_changed",
        terminal: "content_changed",
      });
    }
    const rows =
      await sql`select * from pathways_evidence.serve_items(${identity.id}::uuid,${track},${[
        String(selection.itemId),
      ]}::text[],${nonce},'practice',${nonce},'practice',${
        sql.json({ program: track, phase })
      },'v0.1.1')`;
    if (rows.length !== 1) throw Error("single_owned_delivery_required");
    const d = rows[0];
    return {
      id: d.item_delivery_id,
      memberId: identity.id,
      contentHash: selection.contentHash,
      body: d.body,
      options: d.options.map((o) => ({ text: o.text })),
      optionCount: d.options.length,
    };
  }
  return {
    serve,
    async replay(identity, delivery, tx) {
      if (!tx?.sql) throw Error("same_transaction_transport_required");
      const sql = tx.sql;
      const rows =
        await sql`select e.member_id,e.item_id,e.serve_request_key from pathways_evidence.item_presentation_event e where e.item_delivery_id=${delivery.id}::uuid and e.member_id=${identity.id}::uuid`;
      if (
        rows.length !== 1 ||
        String(rows[0].item_id) !== String(delivery.selection.itemId)
      ) throw Error("foreign_pending_delivery");
      return serve(identity, delivery.selection, {
        nonce: rows[0].serve_request_key,
        phase: delivery.phase,
      }, tx);
    },
    async answer(identity, delivery, { nonce, chosen }, tx) {
      if (!tx?.sql) throw Error("same_transaction_transport_required");
      const sql = tx.sql;
      const rows =
        await sql`select public.learner_answer_bridge(${identity.id}::uuid,${track},'practice','v0.1.1',${delivery.id}::uuid,${nonce}::uuid,${chosen}::integer) result`;
      const r = rows[0]?.result;
      // content_changed/timed_expired are PERMANENT delivery outcomes (the bridge
      // already records the content_changed submission inside this transaction).
      // They are coded terminal so the program can retire the delivery instead of
      // leaving the learner retrying an irrecoverable one.
      if (
        !r?.attempt_id &&
        (r?.outcome === "content_changed" || r?.outcome === "timed_expired")
      ) {
        throw Object.assign(Error("answer_not_confirmed"), {
          code: "answer_not_confirmed",
          terminal: r.outcome,
        });
      }
      if (!r?.attempt_id) throw Error("answer_not_confirmed");
      const captured =
        await sql`select content_hash,chosen_index from pathways_evidence.learner_feedback_receipt where member_id=${identity.id}::uuid and item_delivery_id=${delivery.id}::uuid`;
      if (
        captured.length !== 1 ||
        captured[0].content_hash !== delivery.contentHash ||
        captured[0].chosen_index !== chosen
      ) throw Error("receipt_content_mismatch");
      // No contentVersion here: the version string is a manifest-layer binding made
      // at serve time on the recorded delivery selection (hash-verified above); the
      // bridge has no version concept and a copied string proves nothing.
      return {
        id: String(r.attempt_id),
        deliveryId: delivery.id,
        memberId: identity.id,
        contentHash: delivery.contentHash,
        serverConfirmed: true,
        chosenIndex: captured[0].chosen_index,
        serverAnsweredAt: r.answered_at,
        correct: r.correct,
        feedback: r,
      };
    },
  };
}
