-- Advisory delta to EHC v2.1 member_item_freshness (DRAFT, not applied):
-- positive dependence-key membership must guard BOTH freshness branches, not only the
-- fresh-keyset branch. Today the history-covered branch relies on the invariant that
-- source-inventory membership always supplies an ITEM: key; if that invariant ever
-- changes independently, a covered member could get 'fresh' for a keyless item.
-- One added WHEN before the 'fresh' branch; the redundant inner k0 EXISTS can then go.
CREATE OR REPLACE FUNCTION pathways_evidence.member_item_freshness(p_member uuid, p_track text, p_item text)
RETURNS text LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $f$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM pathways_evidence.member_item_exposure x
                 JOIN pathways_evidence.item_dependence_key kx ON kx.track = x.track AND kx.item_id = x.item_id
                 JOIN pathways_evidence.item_dependence_key ki ON ki.track = kx.track AND ki.k = kx.k
                 WHERE x.member_id = p_member AND x.track = p_track AND ki.item_id = p_item) THEN 'exposed'
    WHEN NOT EXISTS (SELECT 1 FROM pathways_evidence.pathways_source_items i
                     JOIN public.questions q ON q.id::text = i.item_id AND q.track = i.track
                     WHERE i.track = p_track AND i.item_id = p_item) THEN 'unknown'
    WHEN NOT EXISTS (SELECT 1 FROM pathways_evidence.item_dependence_key k0          -- DELTA: positive key guard, both branches
                     WHERE k0.track = p_track AND k0.item_id = p_item) THEN 'unknown'
    WHEN NOT EXISTS (SELECT 1 FROM pathways_evidence.member_history_coverage c
                     WHERE c.member_id = p_member AND c.track = p_track AND c.effective_epoch IS NOT NULL) THEN 'unknown'
    WHEN EXISTS (SELECT 1 FROM pathways_evidence.member_history_coverage c
                 WHERE c.member_id = p_member AND c.track = p_track AND coalesce(c.member_history_start > c.effective_epoch, false))
      OR (EXISTS (SELECT 1 FROM pathways_evidence.item_dependence_key k0 WHERE k0.track = p_track AND k0.item_id = p_item)
          AND NOT EXISTS (SELECT 1 FROM pathways_evidence.item_dependence_key k1
                     JOIN pathways_evidence.item_dependence_key k2 ON k2.track = k1.track AND k2.k = k1.k
                     JOIN pathways_evidence.exposure_logging_policy pol ON pol.track = k1.track
                     LEFT JOIN public.questions q ON q.id::text = k2.item_id AND q.track = k2.track
                     WHERE k1.track = p_track AND k1.item_id = p_item
                       AND NOT coalesce(q.created_at > GREATEST(pol.logging_started_at, pol.inventory_attested_at), false)))
      THEN 'fresh'
    ELSE 'unknown' END
$f$;
