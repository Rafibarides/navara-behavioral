-- Audit console: expert-review queue support.
-- admin_content_quality(): superset of admin_tag_coverage() with per-tag label-variant counts.
-- admin_area_coverage(): per track+area question/tag/thin rollup for coverage-gap planning.
-- Both are inventory only - no content judgment, no review-status changes.

create or replace function public.admin_content_quality()
returns table(
  track text,
  tag text,
  items bigint,
  areas text[],
  label_variants bigint,
  misses_30d bigint,
  members_missed_30d bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
  with tagged as (
    select q.id, q.track, q.area,
           o.elem ->> 'misconception_tag' as tag,
           o.elem ->> 'confuses_with' as cw
    from public.questions q
    cross join lateral (
      select o2.elem from jsonb_array_elements(q.options) with ordinality as o2(elem, idx)
      where o2.idx - 1 <> q.answer and o2.elem ->> 'misconception_tag' is not null
    ) o
    where q.published = true
  ),
  inv as (
    select t.track, t.tag,
           count(distinct t.id) as items,
           array_agg(distinct t.area) as areas,
           count(distinct t.cw) as label_variants
    from tagged t
    group by 1, 2
  ),
  miss as (
    select q.track, a.misconception as tag, count(*) as n, count(distinct a.user_id) as members
    from public.attempts a
    join public.questions q on q.id = a.question_id
    where a.correct = false
      and a.misconception is not null
      and a.created_at > now() - interval '30 days'
    group by 1, 2
  )
  select inv.track, inv.tag, inv.items, inv.areas, inv.label_variants,
         coalesce(miss.n, 0), coalesce(miss.members, 0)
  from inv
  left join miss on miss.track = inv.track and miss.tag = inv.tag
  order by coalesce(miss.n, 0) desc, inv.items asc, inv.tag;
end;
$$;

create or replace function public.admin_area_coverage()
returns table(
  track text,
  area text,
  questions bigint,
  tags bigint,
  thin_tags bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
  with traps as (
    select q.track, q.area, q.id, o.elem ->> 'misconception_tag' as tag
    from public.questions q
    cross join lateral (
      select o2.elem from jsonb_array_elements(q.options) with ordinality as o2(elem, idx)
      where o2.idx - 1 <> q.answer
    ) o
    where q.published = true
  ),
  items as (
    select t.track, t.area, t.tag, count(distinct t.id) as n
    from traps t
    where t.tag is not null
    group by 1, 2, 3
  ),
  qs as (
    select q.track, q.area, count(*) as questions
    from public.questions q
    where q.published = true
    group by 1, 2
  )
  select qs.track, qs.area, qs.questions,
         count(distinct i.tag) as tags,
         count(distinct i.tag) filter (where i.n < 3) as thin_tags
  from qs
  left join items i on i.track = qs.track and i.area = qs.area
  group by 1, 2, 3
  order by 1, 5 desc, 4 desc;
end;
$$;

grant execute on function public.admin_content_quality() to authenticated;
grant execute on function public.admin_area_coverage() to authenticated;
