-- Navara Pathways schema. Run in the Supabase SQL editor after project creation.
-- Row Level Security on: members read their own rows; only service role writes banks.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  track text check (track in ('rbt','bcba')),
  plan text check (plan in ('sample','self-study','guided')) default 'sample',
  stripe_customer_id text,
  created_at timestamptz default now()
);

create table if not exists public.questions (
  id bigint generated always as identity primary key,
  track text not null check (track in ('rbt','bcba')),
  area text not null,           -- task-list area, e.g. 'Measurement'
  body text not null,
  options jsonb not null,       -- ["A","B","C","D"]
  answer int not null,          -- index into options
  explanation text not null,
  citation text,                -- source reference for clinical review
  published boolean default false,  -- stays false until Nisan's review clears the batch
  created_at timestamptz default now()
);

create table if not exists public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  question_id bigint references public.questions,
  correct boolean,
  kind text default 'practice',  -- practice | mock | sample
  created_at timestamptz default now()
);

create table if not exists public.session_credits (
  user_id uuid primary key references auth.users on delete cascade,
  credits_remaining int default 0,
  renews_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.session_credits enable row level security;

create policy "own profile read" on public.profiles
  for select using (auth.uid() = id);
create policy "own profile write" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "own profile insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "published questions readable" on public.questions
  for select using (published = true);
create policy "own attempts" on public.attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own credits" on public.session_credits
  for select using (auth.uid() = user_id);

-- Atomic credit spend used by the booking endpoint. Returns true when a credit was spent.
create or replace function public.spend_session_credit(uid uuid)
returns boolean language plpgsql security definer as $$
begin
  update public.session_credits
     set credits_remaining = credits_remaining - 1
   where user_id = uid and credits_remaining > 0;
  return found;
end $$;

-- Error-pattern diagnostics (added with the diagnostics feature)
alter table public.profiles add column if not exists role text default 'member'; -- 'member' | 'staff'
alter table public.questions add column if not exists question_type text;        -- recall | scenario | judgment
alter table public.questions add column if not exists difficulty text;           -- easy | medium | hard
alter table public.questions add column if not exists outline_tag text;          -- TCO section, e.g. 'A-2'
-- questions.options jsonb shape per option:
--   {text, explanation, misconception_tag, why_tempting, confuses_with, remediation_pointer}
alter table public.attempts add column if not exists chosen_option int;
alter table public.attempts add column if not exists misconception text;
alter table public.attempts add column if not exists confuses_with text;
alter table public.attempts add column if not exists ms int;                     -- time on question (pacing diagnostics)

-- Internal pattern overview for the specialist (member never sees this; staff only).
create or replace view public.pattern_summary with (security_invoker = true) as
  select user_id, misconception, confuses_with,
         count(*) as misses,
         max(created_at) as last_seen,
         count(*) filter (where created_at > now() - interval '14 days') as recent_misses,
         avg(ms) as avg_ms
    from public.attempts
   where correct = false and misconception is not null
   group by user_id, misconception, confuses_with;

-- Staff can read attempts for pattern review; members read only their own (existing policy).
create policy "staff read attempts" on public.attempts
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'staff')
  );

-- Adaptive sets: questions (published, in track) that carry any of the member's active misconception tags.
create or replace function public.adaptive_set(p_track text, p_tags text[], p_limit int default 10)
returns setof public.questions language sql stable as $$
  select * from public.questions
   where track = p_track and published = true
     and exists (
       select 1 from jsonb_array_elements(options) o
       where o->>'misconception_tag' = any(p_tags))
   order by random()
   limit p_limit;
$$;

-- Booking URL handout (deployed): secrets table + RPC; no edge function needed.
create table if not exists public.app_secrets (
  key text primary key,
  value text not null
);
alter table public.app_secrets enable row level security;  -- no policies: unreadable via API
create or replace function public.get_booking_url(p_track text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_plan text; v_track text; v_url text; v_spent boolean;
begin
  if v_uid is null or p_track not in ('rbt','bcba') then return null; end if;
  select plan, track into v_plan, v_track from public.profiles where id = v_uid;
  if v_plan is distinct from 'guided' or v_track is distinct from p_track then return null; end if;
  select public.spend_session_credit(v_uid) into v_spent;
  if not v_spent then return null; end if;
  select value into v_url from public.app_secrets where key = 'calendly_' || p_track;
  return v_url;
end $$;
revoke all on public.app_secrets from anon, authenticated;
grant execute on function public.get_booking_url(text) to authenticated;
