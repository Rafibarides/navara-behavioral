-- Owner-only admin console for Navara Pathways.
-- All functions are security definer and refuse non-admin callers (profiles.role = 'admin').
-- Admin implies staff for the existing staff-only reads.
drop policy if exists "staff read attempts" on public.attempts;
create policy "staff read attempts" on public.attempts
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('staff','admin'))
  );

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.admin_overview() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return (select json_build_object(
    'members_total', (select count(*) from profiles),
    'by_plan', (select coalesce(json_object_agg(plan, n), '{}') from (select coalesce(plan,'unset') plan, count(*) n from profiles group by plan) t),
    'by_track', (select coalesce(json_object_agg(track, n), '{}') from (select coalesce(track,'unset') track, count(*) n from profiles group by track) t),
    'signups_7d', (select count(*) from profiles where created_at > now() - interval '7 days'),
    'signups_30d', (select count(*) from profiles where created_at > now() - interval '30 days'),
    'attempts_7d', (select count(*) from attempts where created_at > now() - interval '7 days'),
    'attempts_30d', (select count(*) from attempts where created_at > now() - interval '30 days'),
    'attempts_by_kind_30d', (select coalesce(json_object_agg(kind, n), '{}') from (select kind, count(*) n from attempts where created_at > now() - interval '30 days' group by kind) t),
    'active_members_7d', (select count(distinct user_id) from attempts where created_at > now() - interval '7 days'),
    'correct_rate_30d', (select coalesce(round(avg(case when correct then 1.0 else 0.0 end)*100,1),0) from attempts where created_at > now() - interval '30 days')
  ));
end $$;

create or replace function public.admin_members(p_limit int default 25)
returns table(full_name text, email text, plan text, track text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query select p.full_name, u.email::text, p.plan, p.track, p.created_at
    from public.profiles p join auth.users u on u.id = p.id
    order by p.created_at desc limit p_limit;
end $$;

create or replace function public.admin_question_stats(p_min_attempts int default 3, p_limit int default 30)
returns table(question_id bigint, track text, area text, body text, attempts bigint, correct_rate numeric, avg_ms numeric, top_misconception text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
    select q.id, q.track, q.area, left(q.body, 90),
           count(a.id),
           round(avg(case when a.correct then 1.0 else 0.0 end)*100, 1),
           round(avg(a.ms)),
           mode() within group (order by a.misconception) filter (where a.misconception is not null)
      from public.questions q join public.attempts a on a.question_id = q.id
     group by q.id, q.track, q.area, q.body
    having count(a.id) >= p_min_attempts
     order by round(avg(case when a.correct then 1.0 else 0.0 end)*100, 1) asc, count(a.id) desc
     limit p_limit;
end $$;
