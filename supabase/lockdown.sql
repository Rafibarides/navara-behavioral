begin;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant select on public.profiles, public.session_credits, public.questions, public.attempts, public.pattern_summary to authenticated;
grant insert (id, full_name, track) on public.profiles to authenticated;
grant update (full_name, track) on public.profiles to authenticated;
grant insert on public.attempts to authenticated;
grant insert on public.waitlist to anon, authenticated;
revoke all on public.app_secrets from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.get_booking_url(text), public.admin_members(integer), public.admin_overview(), public.admin_question_stats(integer,integer), public.is_admin(), public.adaptive_set(text,text[],integer) to authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
create or replace function public.guard_profile_privileged() returns trigger language plpgsql security invoker set search_path=public as $f$
begin
  if coalesce(auth.role(),'') in ('anon','authenticated') then
    if tg_op = 'INSERT' then
      new.plan := 'sample'; new.role := 'member'; new.stripe_customer_id := null;
    else
      new.plan := old.plan; new.role := old.role; new.stripe_customer_id := old.stripe_customer_id;
    end if;
  end if;
  return new;
end $f$;
drop trigger if exists guard_profile_privileged on public.profiles;
create trigger guard_profile_privileged before insert or update on public.profiles for each row execute function public.guard_profile_privileged();
commit;
-- plus: grant update (id, full_name, track) on public.profiles to authenticated;
