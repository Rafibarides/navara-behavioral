-- Track-scope draft tests. Rolled back; nothing persists.
BEGIN;
SET LOCAL TimeZone = 'UTC';
\ir /home/sandbox/pathways-repo/supabase/member_evidence_track_scope_draft.sql
CREATE TEMP TABLE _r(n serial, test text, actual text, expected text, pass boolean);
-- synthetic member + profile (track rbt) + synthetic questions in BOTH tracks sharing one tag
INSERT INTO auth.users (id,aud,role,email,created_at) VALUES ('ffffffff-0000-4000-8000-0000000000a1','authenticated','authenticated','tscope@synthetic.invalid',now());
INSERT INTO public.profiles (id, track, plan) VALUES ('ffffffff-0000-4000-8000-0000000000a1','rbt','self-study') ON CONFLICT (id) DO UPDATE SET track=EXCLUDED.track, plan=EXCLUDED.plan;
INSERT INTO public.questions (id,track,area,body,options,answer,explanation,published,created_at) OVERRIDING SYSTEM VALUE VALUES
 (900101,'rbt','TEST','s rbt1','[{"t":"a"},{"t":"b","misconception_tag":"shared_tag_x","confuses_with":"x/y"}]'::jsonb,0,'s',true,now()),
 (900102,'rbt','TEST','s rbt2','[{"t":"a"},{"t":"b","misconception_tag":"shared_tag_x","confuses_with":"x/y"}]'::jsonb,0,'s',true,now()),
 (900201,'bcba','TEST','s bcba1','[{"t":"a"},{"t":"b","misconception_tag":"shared_tag_x","confuses_with":"x/y"}]'::jsonb,0,'s',true,now()),
 (900202,'bcba','TEST','s bcba2','[{"t":"a"},{"t":"b","misconception_tag":"shared_tag_x","confuses_with":"x/y"}]'::jsonb,0,'s',true,now())
ON CONFLICT (id) DO NOTHING;
-- 1 rbt miss + 2 bcba misses on the same tag, all first responses, all recent
INSERT INTO public.attempts (user_id,question_id,correct,kind,created_at,chosen_option,misconception,confuses_with,ms) VALUES
 ('ffffffff-0000-4000-8000-0000000000a1',900101,false,'practice',now()-interval '1 day',1,'shared_tag_x','x/y',5000),
 ('ffffffff-0000-4000-8000-0000000000a1',900201,false,'practice',now()-interval '1 day',1,'shared_tag_x','x/y',5000),
 ('ffffffff-0000-4000-8000-0000000000a1',900202,false,'practice',now()-interval '2 days',1,'shared_tag_x','x/y',5000);
-- evidence functions run as the member: set the JWT claim for auth.uid()
SELECT set_config('request.jwt.claims', '{"sub":"ffffffff-0000-4000-8000-0000000000a1"}', true) \g /dev/null
-- T1: CURRENT function mixes tracks -> pattern appears from 3 misses / 3 items (documentary)
INSERT INTO _r(test,actual,expected,pass)
SELECT 'T1 current mixes tracks (documentary)',
  coalesce((SELECT misses || '/' || items FROM public.member_evidence() WHERE tag='shared_tag_x'), 'no row'),
  '3/3',
  (SELECT misses=3 AND items=3 FROM public.member_evidence() WHERE tag='shared_tag_x');
-- T2: SCOPED function sees only the 1 rbt miss -> below threshold -> no row
INSERT INTO _r(test,actual,expected,pass)
SELECT 'T2 scoped excludes other track',
  coalesce((SELECT count(*)::text FROM public.member_evidence_track_scoped() WHERE tag='shared_tag_x'), 'ERR'),
  '0',
  (SELECT count(*) FROM public.member_evidence_track_scoped() WHERE tag='shared_tag_x')=0;
-- T3: scoped missed-questions returns only the rbt question
INSERT INTO _r(test,actual,expected,pass)
SELECT 'T3 scoped missed list is rbt only',
  coalesce((SELECT string_agg(question_id::text,'+') FROM public.member_missed_questions_track_scoped('shared_tag_x')), 'ERR'),
  '900101',
  (SELECT count(*)=1 AND bool_and(question_id=900101) FROM public.member_missed_questions_track_scoped('shared_tag_x'));
-- T4: control - current missed list returns all 3 (documentary)
INSERT INTO _r(test,actual,expected,pass)
SELECT 'T4 current missed list mixes (documentary)',
  coalesce((SELECT count(*)::text FROM public.member_missed_questions('shared_tag_x')), 'ERR'),
  '3',
  (SELECT count(*) FROM public.member_missed_questions('shared_tag_x'))=3;
-- T5: second rbt miss -> scoped function now reports the tag (same-track evidence intact)
INSERT INTO public.attempts (user_id,question_id,correct,kind,created_at,chosen_option,misconception,confuses_with,ms) VALUES
 ('ffffffff-0000-4000-8000-0000000000a1',900102,false,'practice',now()-interval '1 day',1,'shared_tag_x','x/y',5000);
INSERT INTO _r(test,actual,expected,pass)
SELECT 'T5 scoped reports same-track pattern',
  coalesce((SELECT misses || '/' || items || '/' || status FROM public.member_evidence_track_scoped() WHERE tag='shared_tag_x'), 'no row'),
  '2/2/emerging',
  (SELECT misses=2 AND items=2 AND status='emerging' FROM public.member_evidence_track_scoped() WHERE tag='shared_tag_x');
TABLE _r;
SELECT count(*) FILTER (WHERE pass) || '/' || count(*) || ' passed' AS summary FROM _r;
DO $$ DECLARE f int; BEGIN SELECT count(*) INTO f FROM _r WHERE NOT pass; IF f>0 THEN RAISE EXCEPTION 'track-scope suite: % FAILED', f; END IF; END $$;
ROLLBACK;
