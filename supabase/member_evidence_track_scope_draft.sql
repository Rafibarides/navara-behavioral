-- TRACK-SCOPED MEMBER EVIDENCE - DRAFT (nothing applied; adoption is an owner decision)
-- Builder, 2026-10-26. Fixes a verified live defect found during the external
-- answer-diagnostics critique evaluation:
--   member_evidence() and member_missed_questions(p_tag) have NO track scope. 10
--   misconception_tag strings exist in BOTH tracks (live-verified 2026-10-26), so a
--   member with attempts in both tracks gets cross-track mixed evidence on those tags.
--   Bounded today (one track per profile; sample-bank attempts carry no question id),
--   but the functions are wrong by construction.
-- Approach: NEW functions (originals untouched), filtered to the caller's profile
-- track; no profile row -> no evidence (fail closed). Same thresholds and rules.
CREATE OR REPLACE FUNCTION public.member_evidence_track_scoped()
returns table(
  tag text, label text, misses bigint, items bigint, days bigint, opportunities bigint,
  miss_rate numeric, areas text[], last_seen timestamptz, status text
)
language sql stable security invoker set search_path = public as $$
  with me as (
    select p.track from public.profiles p where p.id = auth.uid()
  ),
  first_attempts as (
    select a.* from public.attempts a, me
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
    join me on q.track = me.track                       -- DELTA: caller's track only
    where fa.correct = false and fa.misconception is not null
  ),
  opps as (
    select t.tag, fa.question_id
    from first_attempts fa
    join public.questions q on q.id = fa.question_id
    join me on q.track = me.track                       -- DELTA
    cross join lateral (
      select distinct o.elem ->> 'misconception_tag' as tag
      from jsonb_array_elements(q.options) with ordinality as o(elem, idx)
      where o.idx - 1 <> q.answer
        and o.elem ->> 'misconception_tag' is not null
    ) t
  ),
  oppagg as (select tag, count(distinct question_id) as n from opps group by tag),
  agg as (
    select m.tag,
           (array_agg(m.confuses_with order by m.created_at desc)
              filter (where m.confuses_with is not null and m.confuses_with <> ''))[1] as label,
           count(*) as misses, count(distinct m.question_id) as items,
           count(distinct m.created_at::date) as days, max(m.created_at) as last_seen,
           array_agg(distinct m.area) as areas
    from misses m group by m.tag
  )
  select a.tag, coalesce(a.label, replace(a.tag, '_', ' ')), a.misses, a.items, a.days,
         coalesce(o.n, 0), round(100.0 * a.misses / nullif(coalesce(o.n, 0), 0), 0),
         a.areas, a.last_seen,
         case when a.misses >= 3 and a.days >= 2 and coalesce(o.n, 0) >= 6
                   and 100.0 * a.misses / nullif(coalesce(o.n, 0), 0) >= 40
              then 'recurring' else 'emerging' end
  from agg a left join oppagg o on o.tag = a.tag
  where a.misses >= 2 and a.items >= 2
  order by a.misses desc, a.last_seen desc;
$$;

CREATE OR REPLACE FUNCTION public.member_missed_questions_track_scoped(p_tag text)
returns table(question_id bigint, missed_at timestamptz)
language sql stable security invoker set search_path = public as $$
  select a.question_id, a.created_at
  from public.attempts a
  join public.questions q on q.id = a.question_id
  join public.profiles p on p.id = a.user_id and q.track = p.track   -- DELTA
  where a.user_id = auth.uid()
    and a.correct = false
    and a.misconception = p_tag
    and a.created_at > now() - interval '30 days'
    and not exists (
      select 1 from public.attempts earlier
      where earlier.user_id = a.user_id
        and earlier.question_id = a.question_id
        and earlier.created_at < a.created_at
    )
  order by a.created_at desc;
$$;
-- No grants: draft only. Adoption (replace originals vs migrate callers) is an owner decision.
