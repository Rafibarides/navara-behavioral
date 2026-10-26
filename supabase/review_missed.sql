-- Review mode: the exact first-response questions a member missed on a tag (rolling 30d).
-- Same evidence class as member_evidence: observed history only, no inference.
create or replace function public.member_missed_questions(p_tag text)
returns table(question_id bigint, missed_at timestamptz)
language sql stable security invoker set search_path = public as $$
  select a.question_id, a.created_at
  from public.attempts a
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
grant execute on function public.member_missed_questions(text) to authenticated;
