-- Review queue read surface for the Admin audit console.
-- Reads pathways_evidence.item_audit_flag: UNREVIEWED model/script candidates.
-- Read-only. No adjudication, no mutation; holds stay proposal-only here.
create or replace function public.admin_review_queue(p_status text default 'open')
returns table(
  flag_id bigint,
  track text,
  item_id text,
  option_id text,
  flag text,
  severity text,
  scope text,
  rationale text,
  detector text,
  source text,
  route text,
  verification_status text,
  adjudication_status text,
  hold_inference boolean,
  anchors jsonb,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
  select f.flag_id, f.track, f.item_id, f.option_id, f.flag, f.severity, f.scope,
         f.rationale, f.detector, f.source, f.route, f.verification_status,
         f.adjudication_status, f.hold_inference, f.anchors, f.created_at
  from pathways_evidence.item_audit_flag f
  where f.status = p_status
  order by case f.severity when 'blocker' then 0 when 'high' then 1 when 'medium' then 2 else 3 end,
           f.detector desc, f.item_id::int, f.flag_id;
end;
$$;
