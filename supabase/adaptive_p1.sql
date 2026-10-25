-- Navara Pathways adaptive P1 (approved first stage): member pattern evidence +
-- admin misconception coverage for the content audit.
-- Fail-closed: a misconception tag is surfaced to a member only when their own
-- first-response answer history meets the minimum evidence (2 misses on 2 distinct
-- questions in the last 30 days). Statuses describe observed answer history only.
-- "improving"/"resolved" are intentionally NOT computed: there is no fresh-item
-- reassessment yet, so no closure claims exist at this stage.

-- 1) Telemetry: allow targeted sets as an attempt kind.
alter table public.attempts drop constraint if exists attempts_kind_valid;
alter table public.attempts add constraint attempts_kind_valid
  check (kind in ('practice','timed','mock','sample','targeted'));

-- 2) Member evidence: aggregates the caller's own attempts only.
create or replace function public.member_evidence()
returns table(
  tag text,
  label text,
  misses bigint,
  items bigint,
  days bigint,
  opportunities bigint,
  miss_rate numeric,
  areas text[],
  last_seen timestamptz,
  status text
)
language sql stable security invoker set search_path = public as $$
  with first_attempts as (
    -- first response per question only; retakes are not evidence
    select a.* from public.attempts a
    where a.user_id = auth.uid()
      and a.created_at > now() - interval '30 days'
      and not exists (
        select 1 from public.attempts earlier
        where earlier.user_id = a.user_id
          and earlier.question_id = a.question_id
          and earlier.created_at < a.created_at
      )
  ),
  misses as (
    select fa.misconception as tag, fa.question_id, fa.created_at, fa.confuses_with, q.area
    from first_attempts fa
    join public.questions q on q.id = fa.question_id
    where fa.correct = false and fa.misconception is not null
  ),
  opps as (
    -- questions the member faced (any outcome) where a wrong option carries the tag
    select t.tag, fa.question_id
    from first_attempts fa
    join public.questions q on q.id = fa.question_id
    cross join lateral (
      select distinct o.elem ->> 'misconception_tag' as tag
      from jsonb_array_elements(q.options) with ordinality as o(elem, idx)
      where o.idx - 1 <> q.answer
        and o.elem ->> 'misconception_tag' is not null
    ) t
  ),
  oppagg as (
    select tag, count(distinct question_id) as n from opps group by tag
  ),
  agg as (
    select m.tag,
           (array_agg(m.confuses_with order by m.created_at desc)
              filter (where m.confuses_with is not null and m.confuses_with <> ''))[1] as label,
           count(*) as misses,
           count(distinct m.question_id) as items,
           count(distinct m.created_at::date) as days,
           max(m.created_at) as last_seen,
           array_agg(distinct m.area) as areas
    from misses m
    group by m.tag
  )
  select a.tag,
         coalesce(a.label, replace(a.tag, '_', ' ')),
         a.misses,
         a.items,
         a.days,
         coalesce(o.n, 0),
         round(100.0 * a.misses / nullif(coalesce(o.n, 0), 0), 0),
         a.areas,
         a.last_seen,
         case
           when a.misses >= 3 and a.days >= 2
                and coalesce(o.n, 0) >= 6
                and 100.0 * a.misses / nullif(coalesce(o.n, 0), 0) >= 40
           then 'recurring'
           else 'emerging'
         end
  from agg a left join oppagg o on o.tag = a.tag
  where a.misses >= 2 and a.items >= 2   -- fail closed: one mistake never creates a pattern
  order by a.misses desc, a.last_seen desc;
$$;
grant execute on function public.member_evidence() to authenticated;

-- 3) Content audit (owner console): per-track misconception coverage and demand.
-- Orders the future expert review: most-missed tags first, thinnest coverage flagged.
create or replace function public.admin_tag_coverage()
returns table(
  track text,
  tag text,
  items bigint,
  areas text[],
  misses_30d bigint,
  members_missed_30d bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
  with tagged as (
    select q.id, q.track, q.area, o.elem ->> 'misconception_tag' as tag
    from public.questions q
    cross join lateral (
      select o2.elem from jsonb_array_elements(q.options) with ordinality as o2(elem, idx)
      where o2.idx - 1 <> q.answer and o2.elem ->> 'misconception_tag' is not null
    ) o
    where q.published = true
  ),
  miss as (
    select q.track, a.misconception as tag, count(*) as n, count(distinct a.user_id) as members
    from public.attempts a
    join public.questions q on q.id = a.question_id
    where a.created_at > now() - interval '30 days'
      and a.correct = false and a.misconception is not null
    group by q.track, a.misconception
  )
  select tg.track, tg.tag,
         count(distinct tg.id) as items,
         array_agg(distinct tg.area order by tg.area) as areas,
         coalesce(max(m.n), 0) as misses_30d,
         coalesce(max(m.members), 0) as members_missed_30d
  from tagged tg
  left join miss m on m.track = tg.track and m.tag = tg.tag
  group by tg.track, tg.tag
  order by coalesce(max(m.n), 0) desc, count(distinct tg.id) asc, tg.tag;
end $$;
grant execute on function public.admin_tag_coverage() to authenticated;
