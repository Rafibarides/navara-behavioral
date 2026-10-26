-- Track-scope migration evidence: drop-in replacement semantics, regression identity
-- for single-track members, simulated-role access posture. Rolled back; nothing persists.
-- NOTE (boundary): SET ROLE + request.jwt.claims SIMULATES the PostgREST member role;
-- real-JWT acceptance remains post-implementation cutover work.
BEGIN;
SET LOCAL TimeZone = 'UTC';
\ir /home/sandbox/pathways-repo/supabase/member_evidence_track_scope_draft.sql
CREATE TEMP TABLE _r(n serial, test text, actual text, expected text, pass boolean);
GRANT INSERT, SELECT ON _r TO authenticated, anon;
GRANT USAGE ON SEQUENCE _r_n_seq TO authenticated, anon;
-- Migration-path evidence: the scoped bodies must be expressible as CREATE OR REPLACE
-- on the ORIGINAL names with identical signatures (zero caller changes).
CREATE OR REPLACE FUNCTION public.member_evidence() returns table(
  tag text, label text, misses bigint, items bigint, days bigint, opportunities bigint,
  miss_rate numeric, areas text[], last_seen timestamptz, status text)
language sql stable security invoker set search_path = public as $$ select * from public.member_evidence_track_scoped() $$;
CREATE OR REPLACE FUNCTION public.member_missed_questions(p_tag text)
returns table(question_id bigint, missed_at timestamptz)
language sql stable security invoker set search_path = public as $$ select * from public.member_missed_questions_track_scoped(p_tag) $$;
-- grants unchanged: re-grant exactly what the originals carry (tx-local, rolled back)
grant execute on function public.member_evidence() to authenticated;
grant execute on function public.member_missed_questions(text) to authenticated;

-- fixtures: M1 = cross-track member (rbt profile), M2 = single-track member (bcba),
-- M3 = member with NULL-track profile (signup trigger default, never chose a track)
INSERT INTO auth.users (id,aud,role,email,created_at) VALUES
 ('ffffffff-0000-4000-8000-0000000000a1','authenticated','authenticated','tscope1@synthetic.invalid',now()),
 ('ffffffff-0000-4000-8000-0000000000a2','authenticated','authenticated','tscope2@synthetic.invalid',now()),
 ('ffffffff-0000-4000-8000-0000000000a3','authenticated','authenticated','tscope3@synthetic.invalid',now());
INSERT INTO public.profiles (id, track, plan) VALUES
 ('ffffffff-0000-4000-8000-0000000000a1','rbt','self-study'),
 ('ffffffff-0000-4000-8000-0000000000a2','bcba','self-study')
ON CONFLICT (id) DO UPDATE SET track=EXCLUDED.track, plan=EXCLUDED.plan;
INSERT INTO public.questions (id,track,area,body,options,answer,explanation,published,created_at) OVERRIDING SYSTEM VALUE VALUES
 (900101,'rbt','TEST','s rbt1','[{"t":"a"},{"t":"b","misconception_tag":"shared_tag_x","confuses_with":"x/y"}]'::jsonb,0,'s',true,now()),
 (900102,'rbt','TEST','s rbt2','[{"t":"a"},{"t":"b","misconception_tag":"shared_tag_x","confuses_with":"x/y"}]'::jsonb,0,'s',true,now()),
 (900201,'bcba','TEST','s bcba1','[{"t":"a"},{"t":"b","misconception_tag":"shared_tag_x","confuses_with":"x/y"}]'::jsonb,0,'s',true,now()),
 (900202,'bcba','TEST','s bcba2','[{"t":"a"},{"t":"b","misconception_tag":"shared_tag_x","confuses_with":"x/y"}]'::jsonb,0,'s',true,now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.attempts (user_id,question_id,correct,kind,created_at,chosen_option,misconception,confuses_with,ms) VALUES
 ('ffffffff-0000-4000-8000-0000000000a1',900101,false,'practice',now()-interval '1 day',1,'shared_tag_x','x/y',5000),
 ('ffffffff-0000-4000-8000-0000000000a1',900201,false,'practice',now()-interval '1 day',1,'shared_tag_x','x/y',5000),
 ('ffffffff-0000-4000-8000-0000000000a1',900202,false,'practice',now()-interval '2 days',1,'shared_tag_x','x/y',5000),
 ('ffffffff-0000-4000-8000-0000000000a2',900201,false,'practice',now()-interval '1 day',1,'shared_tag_x','x/y',4000),
 ('ffffffff-0000-4000-8000-0000000000a2',900202,false,'practice',now()-interval '2 days',1,'shared_tag_x','x/y',4000),
 ('ffffffff-0000-4000-8000-0000000000a3',900101,false,'practice',now()-interval '1 day',1,'shared_tag_x','x/y',3000),
 ('ffffffff-0000-4000-8000-0000000000a3',900102,false,'practice',now()-interval '2 days',1,'shared_tag_x','x/y',3000);

-- M1 (cross-track defect case): REPLACED member_evidence excludes bcba misses
SELECT set_config('request.jwt.claims', '{"sub":"ffffffff-0000-4000-8000-0000000000a1","role":"authenticated"}', true) \g /dev/null
INSERT INTO _r(test,actual,expected,pass)
SELECT 'M1 replaced evidence excludes other track',
  coalesce((SELECT count(*)::text FROM public.member_evidence() WHERE tag='shared_tag_x'),'ERR'), '0',
  (SELECT count(*) FROM public.member_evidence() WHERE tag='shared_tag_x')=0;
INSERT INTO _r(test,actual,expected,pass)
SELECT 'M1 replaced missed list is own-track only',
  coalesce((SELECT count(*)::text FROM public.member_missed_questions('shared_tag_x')),'ERR'), '1',
  (SELECT count(*)=1 AND bool_and(question_id=900101) FROM public.member_missed_questions('shared_tag_x'));

-- M2 (single-track regression): replaced functions must return the SAME rows the
-- unscoped logic would (2 bcba misses, both same track -> pattern intact)
SELECT set_config('request.jwt.claims', '{"sub":"ffffffff-0000-4000-8000-0000000000a2","role":"authenticated"}', true) \g /dev/null
INSERT INTO _r(test,actual,expected,pass)
SELECT 'M2 single-track regression: pattern intact',
  coalesce((SELECT misses || '/' || items || '/' || status FROM public.member_evidence() WHERE tag='shared_tag_x'),'no row'), '2/2/emerging',
  (SELECT misses=2 AND items=2 AND status='emerging' FROM public.member_evidence() WHERE tag='shared_tag_x');
INSERT INTO _r(test,actual,expected,pass)
SELECT 'M2 single-track regression: missed list intact',
  coalesce((SELECT count(*)::text FROM public.member_missed_questions('shared_tag_x')),'ERR'), '2',
  (SELECT count(*)=2 FROM public.member_missed_questions('shared_tag_x'));

-- M3 (NULL-track profile): fail closed - no evidence, no error
SELECT set_config('request.jwt.claims', '{"sub":"ffffffff-0000-4000-8000-0000000000a3","role":"authenticated"}', true) \g /dev/null
INSERT INTO _r(test,actual,expected,pass)
SELECT 'M3 null-track profile fails closed',
  coalesce((SELECT count(*)::text FROM public.member_evidence()),'ERR'), '0',
  (SELECT count(*) FROM public.member_evidence())=0;

-- Simulated-role access posture (boundary: simulated, not real PostgREST JWT)
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"ffffffff-0000-4000-8000-0000000000a2","role":"authenticated"}', true) \g /dev/null
INSERT INTO _r(test,actual,expected,pass)
SELECT 'M4 authenticated role can execute replaced functions',
  coalesce((SELECT misses::text FROM public.member_evidence() WHERE tag='shared_tag_x'),'no row'), '2',
  (SELECT misses=2 FROM public.member_evidence() WHERE tag='shared_tag_x');
INSERT INTO _r(test,actual,expected,pass)
SELECT 'M5 RLS: member role sees only own attempts via function',
  coalesce((SELECT count(*)::text FROM public.member_missed_questions('shared_tag_x')),'ERR'), '2',
  (SELECT count(*)=2 AND bool_and(question_id IN (900201,900202)) FROM public.member_missed_questions('shared_tag_x'));
RESET ROLE;
-- anon posture: no grant on the function -> permission denied
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM public.member_evidence();
    INSERT INTO _r VALUES (DEFAULT,'M6 anon denied','ACCEPTED (BAD)','refused',false);
  EXCEPTION WHEN OTHERS THEN INSERT INTO _r VALUES (DEFAULT,'M6 anon denied','refused '||SQLSTATE,'refused',true); END;
END $$;
RESET ROLE;

TABLE _r;
SELECT count(*) FILTER (WHERE pass) || '/' || count(*) || ' passed' AS summary FROM _r;
DO $$ DECLARE f int; BEGIN SELECT count(*) INTO f FROM _r WHERE NOT pass; IF f>0 THEN RAISE EXCEPTION 'migration suite: % FAILED', f; END IF; END $$;
ROLLBACK;
