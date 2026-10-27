BEGIN;
CREATE SCHEMA pathways_loop;REVOKE ALL ON SCHEMA pathways_loop FROM PUBLIC,anon,authenticated;
CREATE TABLE pathways_loop.release_audience(member_id uuid PRIMARY KEY REFERENCES auth.users(id),scope text NOT NULL,approved_evidence text NOT NULL,added_at timestamptz NOT NULL DEFAULT clock_timestamp(),withdrawn_at timestamptz);
REVOKE ALL ON pathways_loop.release_audience FROM PUBLIC,anon,authenticated;
CREATE TABLE pathways_loop.pack_version(
 pack_id text NOT NULL,version text NOT NULL,track text NOT NULL,
 status text NOT NULL CHECK(status IN('draft','software_test','reviewed','withdrawn')),
 reviewer_ref text,policy_version text,delay_seconds integer CHECK(delay_seconds>0),
 baseline_min integer CHECK(baseline_min>0),synthetic boolean NOT NULL DEFAULT true,
 PRIMARY KEY(pack_id,version),
 CHECK(status<>'reviewed' OR (reviewer_ref IS NOT NULL AND policy_version IS NOT NULL AND delay_seconds IS NOT NULL AND baseline_min IS NOT NULL)));
CREATE TABLE pathways_loop.version_item(
 pack_id text NOT NULL,version text NOT NULL,item_id bigint NOT NULL REFERENCES public.questions(id),
 role text NOT NULL CHECK(role IN('baseline','lesson','practice','reserve')),lineage text NOT NULL,
 content_hash text NOT NULL,
 PRIMARY KEY(pack_id,version,item_id),FOREIGN KEY(pack_id,version) REFERENCES pathways_loop.pack_version);
CREATE INDEX version_item_lineage ON pathways_loop.version_item(lineage,item_id);
CREATE TABLE pathways_loop.reserve_allocation(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),member_id uuid NOT NULL REFERENCES auth.users(id),
 pack_id text NOT NULL,version text NOT NULL,item_id bigint NOT NULL,lineage text NOT NULL,
 request_id uuid NOT NULL,allocated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(member_id,request_id),UNIQUE(member_id,lineage),
 FOREIGN KEY(pack_id,version,item_id) REFERENCES pathways_loop.version_item);
CREATE TABLE pathways_loop.reserve_readiness(
 member_id uuid NOT NULL REFERENCES auth.users(id),pack_id text NOT NULL,version text NOT NULL,
 practice_completed_at timestamptz NOT NULL,
 PRIMARY KEY(member_id,pack_id,version),FOREIGN KEY(pack_id,version) REFERENCES pathways_loop.pack_version);
REVOKE ALL ON pathways_loop.pack_version,pathways_loop.version_item,pathways_loop.reserve_allocation,pathways_loop.reserve_readiness FROM PUBLIC,anon,authenticated;

CREATE TABLE pathways_loop.lineage_help_exposure(member_id uuid NOT NULL REFERENCES auth.users(id),lineage text NOT NULL,source text NOT NULL,at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(member_id,lineage,source));REVOKE ALL ON pathways_loop.lineage_help_exposure FROM PUBLIC,anon,authenticated;
CREATE TABLE pathways_loop.option_mapping(
 pack_id text NOT NULL,version text NOT NULL,item_id bigint NOT NULL,option_index integer NOT NULL CHECK(option_index>=0),
 candidate text NOT NULL,review_state text NOT NULL CHECK(review_state IN('draft','software_test','reviewed')),
 PRIMARY KEY(pack_id,version,item_id,option_index),FOREIGN KEY(pack_id,version,item_id) REFERENCES pathways_loop.version_item);
CREATE TABLE pathways_loop.baseline_observation(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),member_id uuid NOT NULL REFERENCES auth.users(id),pack_id text NOT NULL,version text NOT NULL,candidate text NOT NULL,
 receipt_ids bigint[] NOT NULL,lineages text[] NOT NULL,policy_version text NOT NULL,at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(member_id,pack_id,version,candidate),FOREIGN KEY(pack_id,version) REFERENCES pathways_loop.pack_version);
REVOKE ALL ON pathways_loop.option_mapping,pathways_loop.baseline_observation FROM PUBLIC,anon,authenticated;

CREATE TABLE pathways_loop.observation_feedback(
 observation uuid NOT NULL REFERENCES pathways_loop.baseline_observation(id),nonce uuid NOT NULL,response text NOT NULL CHECK(response IN('fits','guessed','disagree')),at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(observation,nonce));
REVOKE ALL ON pathways_loop.observation_feedback FROM PUBLIC,anon,authenticated;

CREATE TABLE pathways_loop.thread(
 observation uuid PRIMARY KEY REFERENCES pathways_loop.baseline_observation(id),lesson_at timestamptz,practice_request uuid,practice_delivery uuid,practice_receipt bigint,due_at timestamptz,reserve_request uuid,reserve_delivery uuid,reserve_receipt bigint);
REVOKE ALL ON pathways_loop.thread FROM PUBLIC,anon,authenticated;

CREATE TABLE pathways_loop.recovery_choice(
 observation uuid NOT NULL REFERENCES pathways_loop.baseline_observation(id),nonce uuid NOT NULL,
 choice text NOT NULL CHECK(choice IN('show_another_way','misread','different_focus','coach_pin')),
 at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(observation,nonce));
REVOKE ALL ON pathways_loop.recovery_choice FROM PUBLIC,anon,authenticated;


CREATE FUNCTION pathways_loop.freeze_pack_definition() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'versioned pack records are retained; withdraw instead' USING ERRCODE='PL006';END IF;
 IF TG_TABLE_NAME='version_item' THEN RAISE EXCEPTION 'item mapping is immutable; create new version' USING ERRCODE='PL006';END IF;
 IF (to_jsonb(OLD)-'status'-'reviewer_ref') IS DISTINCT FROM (to_jsonb(NEW)-'status'-'reviewer_ref') THEN RAISE EXCEPTION 'policy/version definition immutable; create new version' USING ERRCODE='PL006';END IF;
 RETURN NEW;
END$$;
REVOKE ALL ON FUNCTION pathways_loop.freeze_pack_definition() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER freeze_version_item BEFORE UPDATE OR DELETE ON pathways_loop.version_item FOR EACH ROW EXECUTE FUNCTION pathways_loop.freeze_pack_definition();
CREATE TRIGGER freeze_pack_version BEFORE UPDATE OR DELETE ON pathways_loop.pack_version FOR EACH ROW EXECUTE FUNCTION pathways_loop.freeze_pack_definition();
CREATE FUNCTION pathways_loop.help_exposure_lock() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('learning-lineage:'||NEW.member_id::text||':'||NEW.lineage,0));RETURN NEW;
END$$;
REVOKE ALL ON FUNCTION pathways_loop.help_exposure_lock() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER serialize_help_exposure BEFORE INSERT ON pathways_loop.lineage_help_exposure FOR EACH ROW EXECUTE FUNCTION pathways_loop.help_exposure_lock();


CREATE TRIGGER freeze_option_mapping BEFORE UPDATE OR DELETE ON pathways_loop.option_mapping FOR EACH ROW EXECUTE FUNCTION pathways_loop.freeze_pack_definition();
CREATE OR REPLACE FUNCTION pathways_loop.guard_reserved_lineage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE l text; a record;
BEGIN
 FOR l IN SELECT DISTINCT vi.lineage FROM pathways_loop.version_item vi WHERE vi.item_id::text=NEW.item_id ORDER BY vi.lineage LOOP
  PERFORM pg_advisory_xact_lock(hashtextextended('learning-lineage:'||NEW.member_id::text||':'||l,0));
  IF EXISTS(SELECT 1 FROM pathways_loop.version_item WHERE lineage=l AND role='reserve') THEN
   SELECT * INTO a FROM pathways_loop.reserve_allocation WHERE member_id=NEW.member_id AND lineage=l AND item_id::text=NEW.item_id AND request_id::text=NEW.serve_request_key;
   IF NOT FOUND THEN RAISE EXCEPTION 'reserved lineage cannot enter ordinary serving' USING ERRCODE='PL001';END IF;
   IF EXISTS(SELECT 1 FROM pathways_evidence.item_presentation_event e JOIN pathways_loop.version_item vi ON vi.item_id::text=e.item_id WHERE e.member_id=NEW.member_id AND vi.lineage=l) THEN RAISE EXCEPTION 'lineage already exposed' USING ERRCODE='PL002';END IF;
  END IF;
 END LOOP;
 RETURN NEW;
END$function$
;
CREATE TRIGGER learning_loop_lineage_guard BEFORE INSERT ON pathways_evidence.item_presentation_event FOR EACH ROW EXECUTE FUNCTION pathways_loop.guard_reserved_lineage();
-- Candidate migration. Deployed to STAGING ONLY for rejection/eligibility tests.
-- No approval rows, live pack rows, learner audience or shipping defaults seeded.

CREATE TABLE pathways_loop.reviewed_policy(
 id text PRIMARY KEY, approved_by text NOT NULL, approval_evidence text NOT NULL,
 minimum_families integer NOT NULL CHECK(minimum_families>=2),
 window_days integer NOT NULL CHECK(window_days>0),delay_hours integer NOT NULL CHECK(delay_hours>=1),
 mixed_correct_learner_choice boolean NOT NULL CHECK(mixed_correct_learner_choice),
 approved_at timestamptz NOT NULL,withdrawn_at timestamptz);
CREATE TABLE pathways_loop.reviewed_pack_approval(
 pack_id text NOT NULL,version text NOT NULL,candidate text NOT NULL,
 content_approval_evidence text NOT NULL,reviewer text NOT NULL,policy_id text NOT NULL REFERENCES pathways_loop.reviewed_policy,
 family_review_evidence text NOT NULL,history_complete_since timestamptz NOT NULL,
 approved_at timestamptz NOT NULL,withdrawn_at timestamptz,
 PRIMARY KEY(pack_id,version,candidate),FOREIGN KEY(pack_id,version) REFERENCES pathways_loop.pack_version);
CREATE TABLE pathways_loop.release_gate(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 enabled boolean NOT NULL DEFAULT false,release_evidence text,
 CHECK(NOT enabled OR release_evidence IS NOT NULL));
INSERT INTO pathways_loop.release_gate(singleton,enabled) VALUES(true,false);
REVOKE ALL ON pathways_loop.reviewed_policy,pathways_loop.reviewed_pack_approval,pathways_loop.release_gate FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.learning_reviewed_evidence_candidate(p_member uuid,p_pack text,p_version text,p_candidate text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE approval record;policy record;pack record;matches int;correct int;total int;receipt_ids bigint[];seen text[];cutoff timestamptz;coverage record;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service adapter only' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM pathways_loop.release_audience WHERE member_id=p_member AND withdrawn_at IS NULL FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'outside approved release audience' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM public.profiles WHERE id=p_member AND plan='guided' AND track='rbt' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'guided rbt membership required' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM pathways_loop.release_gate WHERE singleton AND enabled AND release_evidence IS NOT NULL FOR SHARE;
 IF NOT FOUND THEN RETURN jsonb_build_object('state','release_not_approved','enabled',false);END IF;
 SELECT * INTO approval FROM pathways_loop.reviewed_pack_approval WHERE pack_id=p_pack AND version=p_version AND candidate=p_candidate AND withdrawn_at IS NULL FOR SHARE;
 IF NOT FOUND THEN RETURN jsonb_build_object('state','content_review_required','enabled',false);END IF;
 SELECT * INTO policy FROM pathways_loop.reviewed_policy WHERE id=approval.policy_id AND withdrawn_at IS NULL FOR SHARE;
 IF NOT FOUND THEN RETURN jsonb_build_object('state','policy_review_required','enabled',false);END IF;
 SELECT * INTO pack FROM pathways_loop.pack_version WHERE pack_id=p_pack AND version=p_version AND status='reviewed' AND NOT synthetic FOR SHARE;
 IF NOT FOUND THEN RETURN jsonb_build_object('state','reviewed_pack_unavailable','enabled',false);END IF;
 cutoff:=clock_timestamp()-make_interval(days=>policy.window_days);
 -- Do not infer historical completeness merely from no rows. The approval
 -- must explicitly cover the entire proposed qualifying window.
 SELECT * INTO coverage FROM pathways_loop.member_history_coverage h WHERE h.member_id=p_member AND h.pack_id=p_pack AND h.version=p_version AND h.withdrawn_at IS NULL FOR SHARE;
 IF NOT FOUND THEN RETURN jsonb_build_object('state','history_incomplete','enabled',false);END IF;
 IF policy.history_mode='since_enrollment' THEN
  IF coverage.complete_since>clock_timestamp() OR coverage.recorded_at<coverage.complete_since OR approval.history_complete_since>coverage.complete_since THEN RETURN jsonb_build_object('state','history_incomplete','enabled',false);END IF;
  cutoff:=greatest(cutoff,coverage.complete_since);
 ELSIF approval.history_complete_since>cutoff OR coverage.complete_since>cutoff THEN RETURN jsonb_build_object('state','history_incomplete','enabled',false);END IF;
 WITH clean AS(
 SELECT DISTINCT ON(vi.lineage) vi.lineage,f.attempt_id,(f.payload->>'correct')::boolean is_correct,
 EXISTS(SELECT 1 FROM pathways_loop.option_mapping selected WHERE selected.item_id=vi.item_id AND selected.pack_id=p_pack AND selected.version=p_version AND selected.option_index=f.chosen_index AND selected.candidate=p_candidate AND selected.review_state='reviewed') matches
 FROM pathways_loop.version_item vi
 JOIN pathways_evidence.learner_feedback_receipt f ON f.question_id=vi.item_id AND f.member_id=p_member AND f.content_hash=vi.content_hash
 JOIN pathways_evidence.item_presentation_event e ON e.item_delivery_id=f.item_delivery_id AND e.member_id=p_member
 JOIN public.questions q ON q.id=vi.item_id
 WHERE vi.pack_id=p_pack AND vi.version=p_version AND vi.role='baseline'
 AND EXISTS(SELECT 1 FROM pathways_loop.option_mapping direction WHERE direction.item_id=vi.item_id AND direction.pack_id=p_pack AND direction.version=p_version AND direction.candidate=p_candidate AND direction.review_state='reviewed')
 AND f.captured_at>=cutoff AND f.captured_at<=clock_timestamp() AND (e.server_recorded_at>=cutoff OR (policy.history_mode='since_enrollment' AND EXISTS(SELECT 1 FROM pathways_loop.baseline_set_item bi JOIN pathways_loop.baseline_set bs ON bs.id=bi.set_id WHERE bi.delivery=e.item_delivery_id AND bs.member_id=p_member AND bs.created_at>=cutoff))) AND e.logged_by='server' AND e.server_recorded_at IS NOT NULL
 AND q.published AND pathways_evidence.content_hash(q.body,q.options,q.answer,q.explanation,q.citation)=vi.content_hash
 AND NOT EXISTS(SELECT 1 FROM pathways_evidence.item_presentation_event prev JOIN pathways_loop.version_item vp ON vp.item_id::text=prev.item_id WHERE prev.member_id=p_member AND vp.lineage=vi.lineage AND prev.event_id<>e.event_id AND prev.server_recorded_at<=e.server_recorded_at)
 AND NOT EXISTS(SELECT 1 FROM pathways_loop.lineage_help_exposure h WHERE h.member_id=p_member AND h.lineage=vi.lineage AND h.at<=f.captured_at)
 AND NOT EXISTS(SELECT 1 FROM public.attempts legacy JOIN pathways_loop.version_item vl ON vl.item_id=legacy.question_id WHERE legacy.user_id=p_member AND vl.lineage=vi.lineage AND legacy.id<>f.attempt_id AND(legacy.created_at IS NULL OR legacy.created_at<=f.captured_at))
 ORDER BY vi.lineage,f.captured_at,f.attempt_id)
 SELECT count(*) FILTER(WHERE NOT is_correct AND clean.matches),count(*) FILTER(WHERE is_correct),count(*),array_agg(attempt_id),array_agg(lineage) INTO matches,correct,total,receipt_ids,seen FROM clean;
 RETURN jsonb_build_object('state',CASE WHEN matches<policy.minimum_families THEN 'insufficient_clean_evidence' WHEN correct>0 THEN 'mixed_evidence_learner_choice' ELSE 'offer_optional_contrast' END,'enabled',matches>=policy.minimum_families AND correct=0,'matched',matches,'correct',correct,'total',total,'receipt_ids',coalesce(to_jsonb(receipt_ids),'[]'::jsonb),'families',coalesce(to_jsonb(seen),'[]'::jsonb),'candidate',p_candidate,'policy',policy.id,'pack',p_pack,'version',p_version,'claim','selected_answers_only','delay_hours',policy.delay_hours,'evidence_since',cutoff,'history_mode',policy.history_mode);
END$$;
REVOKE ALL ON FUNCTION public.learning_reviewed_evidence_candidate(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.learning_reviewed_evidence_candidate(uuid,text,text,text) TO service_role;


-- Reviewed runtime candidate. STAGING ONLY. No approval/release enablement seeded.

CREATE TABLE pathways_loop.reviewed_teaching(pack_id text,version text,candidate text,lesson text NOT NULL,alternate text NOT NULL,content_approval_evidence text NOT NULL,PRIMARY KEY(pack_id,version,candidate),FOREIGN KEY(pack_id,version,candidate) REFERENCES pathways_loop.reviewed_pack_approval);
REVOKE ALL ON pathways_loop.reviewed_teaching FROM PUBLIC,anon,authenticated;
CREATE FUNCTION pathways_loop.reviewed_gate(p_member uuid,p_pack text,p_version text,p_candidate text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' OR NOT EXISTS(SELECT 1 FROM public.profiles p JOIN pathways_loop.pack_version v ON v.track=p.track WHERE p.id=p_member AND p.plan='guided' AND v.pack_id=p_pack AND v.version=p_version) THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501';END IF;
 IF NOT EXISTS(SELECT 1 FROM pathways_loop.release_gate WHERE singleton AND enabled AND release_evidence IS NOT NULL) OR NOT EXISTS(SELECT 1 FROM pathways_loop.reviewed_pack_approval a JOIN pathways_loop.reviewed_policy p ON p.id=a.policy_id JOIN pathways_loop.pack_version v ON v.pack_id=a.pack_id AND v.version=a.version WHERE a.pack_id=p_pack AND a.version=p_version AND a.candidate=p_candidate AND a.withdrawn_at IS NULL AND p.withdrawn_at IS NULL AND v.status='reviewed' AND NOT v.synthetic) THEN RAISE EXCEPTION 'reviewed release unavailable' USING ERRCODE='PL003';END IF;
END$$;
REVOKE ALL ON FUNCTION pathways_loop.reviewed_gate(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.learning_baseline_reviewed_candidate(p_member uuid,p_pack text,p_version text,p_candidate text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e jsonb;o record;
BEGIN
 e:=public.learning_reviewed_evidence_candidate(p_member,p_pack,p_version,p_candidate);
 IF NOT coalesce((e->>'enabled')::boolean,false) THEN RETURN e||jsonb_build_object('suggestion_enabled',false);END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('baseline:'||p_member::text||':'||p_pack||':'||p_version,0));
 INSERT INTO pathways_loop.baseline_observation(member_id,pack_id,version,candidate,receipt_ids,lineages,policy_version) VALUES(p_member,p_pack,p_version,p_candidate,ARRAY(SELECT value::bigint FROM jsonb_array_elements_text(e->'receipt_ids')),ARRAY(SELECT value FROM jsonb_array_elements_text(e->'families')),e->>'policy') ON CONFLICT DO NOTHING;
 SELECT * INTO o FROM pathways_loop.baseline_observation WHERE member_id=p_member AND pack_id=p_pack AND version=p_version AND candidate=p_candidate;
 RETURN e||jsonb_build_object('state','reviewed_observation','observation',o.id,'qualifying',e->'matched','correct_other_families',0,'notice','Selected answers only, not inferred thoughts or mastery.');
END$$;

CREATE FUNCTION public.learning_suggestion_reviewed_candidate(p_member uuid,p_pack text,p_version text,p_candidate text,p_nonce uuid,p_response text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;oid uuid;response text;correct_other int;
BEGIN
 result:=public.learning_baseline_reviewed_candidate(p_member,p_pack,p_version,p_candidate);
 IF result->>'state'<>'reviewed_observation' THEN RETURN result||jsonb_build_object('suggestion_enabled',false);END IF;
 oid:=(result->>'observation')::uuid;
 PERFORM pathways_loop.reviewed_gate(p_member,p_pack,p_version,p_candidate);
 PERFORM pg_advisory_xact_lock(hashtextextended('thread:'||oid::text,0));
 IF p_response IS NOT NULL THEN
  IF p_nonce IS NULL OR p_response NOT IN('fits','guessed','disagree') THEN RAISE EXCEPTION 'invalid response' USING ERRCODE='22023';END IF;
  IF EXISTS(SELECT 1 FROM pathways_loop.observation_feedback WHERE observation=oid AND nonce=p_nonce AND observation_feedback.response<>p_response) THEN RAISE EXCEPTION 'feedback conflict' USING ERRCODE='22023';END IF;
  INSERT INTO pathways_loop.observation_feedback(observation,nonce,response) VALUES(oid,p_nonce,p_response) ON CONFLICT DO NOTHING;
 END IF;
 SELECT f.response INTO response FROM pathways_loop.observation_feedback f WHERE observation=oid ORDER BY at DESC,nonce DESC LIMIT 1;
 correct_other:=0;
 RETURN result||jsonb_build_object('suggestion_enabled',coalesce(response='fits',true),'learner_feedback',response,'correct_other_families',correct_other,'copy','Your selected alternative appeared on multiple reviewed cases. Is this a useful focus?','disclaimer','A selected-answer observation is not a diagnosis, thought attribution or mastery claim.');
END$$;

CREATE OR REPLACE FUNCTION public.learning_reserve_reviewed_candidate(p_member uuid, p_pack text, p_version text, p_request uuid,p_candidate text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_column
DECLARE pack record; prof record; a record; item record; rows jsonb;
BEGIN
 PERFORM pathways_loop.reviewed_gate(p_member,p_pack,p_version,p_candidate);
 IF p_request IS NULL THEN RAISE EXCEPTION 'request required' USING ERRCODE='22023';END IF;
 SELECT track,plan INTO prof FROM public.profiles WHERE id=p_member FOR SHARE;
 SELECT * INTO pack FROM pathways_loop.pack_version WHERE pack_id=p_pack AND version=p_version FOR SHARE;
 IF NOT FOUND OR prof.track IS DISTINCT FROM pack.track OR prof.plan NOT IN('self-study','guided') THEN RAISE EXCEPTION 'unauthorized pack' USING ERRCODE='42501';END IF;
 IF pack.status<>'reviewed' OR pack.synthetic OR pack.policy_version IS NULL OR pack.delay_seconds IS NULL OR pack.baseline_min IS NULL THEN RAISE EXCEPTION 'unapproved or missing explicit software policy' USING ERRCODE='PL003';END IF;
 IF NOT EXISTS(SELECT 1 FROM pathways_loop.reserve_readiness r WHERE r.member_id=p_member AND r.pack_id=p_pack AND r.version=p_version AND clock_timestamp()>=r.practice_completed_at+make_interval(secs=>pack.delay_seconds)) THEN RAISE EXCEPTION 'not due' USING ERRCODE='PL004';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('reserve-request:'||p_member::text||':'||p_request::text,0));
 SELECT * INTO a FROM pathways_loop.reserve_allocation WHERE member_id=p_member AND request_id=p_request;
 IF FOUND THEN
  IF a.pack_id<>p_pack OR a.version<>p_version OR NOT EXISTS(SELECT 1 FROM pathways_loop.option_mapping om WHERE om.pack_id=p_pack AND om.version=p_version AND om.item_id=a.item_id AND om.candidate=p_candidate AND om.review_state='reviewed') THEN RAISE EXCEPTION 'reserve request conflict' USING ERRCODE='22023';END IF;
 ELSE
  PERFORM pg_advisory_xact_lock(hashtextextended('reserve-pack:'||p_member::text||':'||p_pack||':'||p_version,0));
  FOR item IN SELECT vi.* FROM pathways_loop.version_item vi WHERE vi.pack_id=p_pack AND vi.version=p_version AND vi.role='reserve' AND EXISTS(SELECT 1 FROM pathways_loop.option_mapping om WHERE om.pack_id=vi.pack_id AND om.version=vi.version AND om.item_id=vi.item_id AND om.candidate=p_candidate AND om.review_state='reviewed') ORDER BY vi.lineage,vi.item_id LOOP
   PERFORM pg_advisory_xact_lock(hashtextextended('learning-lineage:'||p_member::text||':'||item.lineage,0));
   IF EXISTS(SELECT 1 FROM pathways_loop.reserve_allocation WHERE member_id=p_member AND lineage=item.lineage) THEN CONTINUE;END IF;
   IF EXISTS(SELECT 1 FROM pathways_loop.lineage_help_exposure WHERE member_id=p_member AND lineage=item.lineage) THEN CONTINUE;END IF;
   IF EXISTS(SELECT 1 FROM pathways_evidence.item_presentation_event e JOIN pathways_loop.version_item vi ON vi.item_id::text=e.item_id WHERE e.member_id=p_member AND vi.lineage=item.lineage) THEN CONTINUE;END IF;
   IF EXISTS(SELECT 1 FROM public.attempts t JOIN pathways_loop.version_item vi ON vi.item_id=t.question_id WHERE t.user_id=p_member AND vi.lineage=item.lineage) THEN CONTINUE;END IF;
   INSERT INTO pathways_loop.reserve_allocation(member_id,pack_id,version,item_id,lineage,request_id) VALUES(p_member,p_pack,p_version,item.item_id,item.lineage,p_request) RETURNING * INTO a;EXIT;
  END LOOP;
  IF a.id IS NULL THEN RETURN jsonb_build_object('state','no_fresh_inventory','deliveries',null);END IF;
 END IF;
 SELECT vi.* INTO item FROM pathways_loop.version_item vi WHERE vi.pack_id=a.pack_id AND vi.version=a.version AND vi.item_id=a.item_id;
 PERFORM 1 FROM public.questions q WHERE q.id=a.item_id FOR SHARE;
 IF NOT EXISTS(SELECT 1 FROM public.questions q WHERE q.id=a.item_id AND q.published AND pathways_evidence.content_hash(q.body,q.options,q.answer,q.explanation,q.citation)=item.content_hash) THEN RAISE EXCEPTION 'pack content changed' USING ERRCODE='PL005';END IF;
 SELECT jsonb_agg(jsonb_build_object('delivery',s.item_delivery_id,'body',s.body,'options',(SELECT jsonb_agg(jsonb_build_object('text',o.value->>'text') ORDER BY o.ordinality) FROM jsonb_array_elements(s.options) WITH ORDINALITY o(value,ordinality)))) INTO rows FROM pathways_evidence.serve_items(p_member,pack.track,ARRAY[a.item_id::text],p_request::text,'practice',p_request::text,'practice',jsonb_build_object('software_pack',p_pack,'version',p_version),'v0.1.1') s;
 RETURN jsonb_build_object('state','fresh_delivery','deliveries',rows,'notice','Reserved reviewed case. One response does not establish mastery.');
END$function$
;

CREATE OR REPLACE FUNCTION public.learning_reserve_answer_reviewed_candidate(p_member uuid, p_delivery uuid, p_nonce uuid, p_chosen integer,p_candidate text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE a record;p record;result jsonb;helped boolean;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service only' USING ERRCODE='42501';END IF;
 SELECT ra.* INTO a FROM pathways_loop.reserve_allocation ra JOIN pathways_evidence.item_presentation_event e ON e.member_id=ra.member_id AND e.serve_request_key=ra.request_id::text AND e.item_id=ra.item_id::text WHERE ra.member_id=p_member AND e.item_delivery_id=p_delivery;
 IF NOT FOUND THEN RAISE EXCEPTION 'foreign reserve delivery' USING ERRCODE='42501';END IF;
 PERFORM pathways_loop.reviewed_gate(p_member,a.pack_id,a.version,p_candidate);
 PERFORM pg_advisory_xact_lock(hashtextextended('learning-lineage:'||p_member::text||':'||a.lineage,0));
 SELECT * INTO p FROM pathways_loop.pack_version WHERE pack_id=a.pack_id AND version=a.version FOR SHARE;
 IF p.status<>'reviewed' OR p.synthetic THEN RAISE EXCEPTION 'withdrawn pack' USING ERRCODE='PL003';END IF;
 result:=public.learner_answer_bridge(p_member,p.track,'practice','v0.1.1',p_delivery,p_nonce,p_chosen);
 SELECT EXISTS(SELECT 1 FROM pathways_loop.lineage_help_exposure h WHERE h.member_id=p_member AND h.lineage=a.lineage AND h.at<= (result->>'answered_at')::timestamptz) INTO helped;
 RETURN result||jsonb_build_object('evidence_class',CASE WHEN helped THEN 'helped_not_fresh' ELSE 'reserved_response' END,'mastery_claim',false);
END$function$
;

CREATE OR REPLACE FUNCTION public.learning_thread_reviewed_candidate(p_member uuid, p_pack text, p_version text, p_candidate text, p_action text, p_nonce uuid, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE suggestion jsonb;obs uuid;pk record;t record;item record;result jsonb;delivery record;
BEGIN
 suggestion:=public.learning_suggestion_reviewed_candidate(p_member,p_pack,p_version,p_candidate,p_nonce,null);
 IF suggestion->>'state'<>'reviewed_observation' THEN RETURN suggestion;END IF;
 obs:=(suggestion->>'observation')::uuid;
 PERFORM pg_advisory_xact_lock(hashtextextended('thread:'||obs::text,0));
 INSERT INTO pathways_loop.thread(observation) VALUES(obs) ON CONFLICT DO NOTHING;
 SELECT * INTO t FROM pathways_loop.thread WHERE observation=obs FOR UPDATE;
 SELECT * INTO pk FROM pathways_loop.pack_version WHERE pack_id=p_pack AND version=p_version FOR SHARE;
 PERFORM pathways_loop.reviewed_gate(p_member,p_pack,p_version,p_candidate);
 IF NOT EXISTS(SELECT 1 FROM pathways_loop.reviewed_teaching WHERE pack_id=p_pack AND version=p_version AND candidate=p_candidate) THEN RAISE EXCEPTION 'reviewed teaching unavailable' USING ERRCODE='PL005';END IF;
 IF NOT (suggestion->>'suggestion_enabled')::boolean THEN RETURN suggestion||jsonb_build_object('thread_state','focus_paused');END IF;
 IF p_action='lesson' THEN
  UPDATE pathways_loop.thread SET lesson_at=coalesce(lesson_at,clock_timestamp()) WHERE observation=obs;
 ELSIF p_action='practice' THEN
  IF t.lesson_at IS NULL THEN RAISE EXCEPTION 'lesson required' USING ERRCODE='PL007';END IF;
  SELECT vi.* INTO item FROM pathways_loop.version_item vi JOIN public.questions q ON q.id=vi.item_id WHERE vi.pack_id=p_pack AND vi.version=p_version AND vi.role='practice' AND EXISTS(SELECT 1 FROM pathways_loop.option_mapping om WHERE om.pack_id=vi.pack_id AND om.version=vi.version AND om.item_id=vi.item_id AND om.candidate=p_candidate AND om.review_state='reviewed') AND q.published AND vi.content_hash=pathways_evidence.content_hash(q.body,q.options,q.answer,q.explanation,q.citation) ORDER BY vi.item_id LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'no approved software practice' USING ERRCODE='PL005';END IF;
  IF t.practice_request IS NULL THEN t.practice_request:=p_nonce;END IF;
  SELECT * INTO delivery FROM pathways_evidence.serve_items(p_member,pk.track,ARRAY[item.item_id::text],t.practice_request::text,'practice',t.practice_request::text,'practice',jsonb_build_object('thread',obs::text,'phase','practice'),'v0.1.1');
  UPDATE pathways_loop.thread SET practice_request=t.practice_request,practice_delivery=delivery.item_delivery_id WHERE observation=obs;
  result:=jsonb_build_object('delivery',delivery.item_delivery_id,'body',delivery.body,'options',(SELECT jsonb_agg(jsonb_build_object('text',o.value->>'text') ORDER BY o.ordinality) FROM jsonb_array_elements(delivery.options) WITH ORDINALITY o(value,ordinality)));
 ELSIF p_action='practice_answer' THEN
  IF t.practice_delivery IS NULL THEN RAISE EXCEPTION 'practice delivery required' USING ERRCODE='PL007';END IF;
  result:=public.learner_answer_bridge(p_member,pk.track,'practice','v0.1.1',t.practice_delivery,p_nonce,(p_payload->>'chosen')::integer);
  UPDATE pathways_loop.thread SET practice_receipt=coalesce(practice_receipt,(result->>'attempt_id')::bigint),due_at=coalesce(due_at,(result->>'answered_at')::timestamptz+make_interval(hours=>(SELECT policy.delay_hours FROM pathways_loop.reviewed_policy policy JOIN pathways_loop.reviewed_pack_approval a ON a.policy_id=policy.id WHERE a.pack_id=p_pack AND a.version=p_version AND a.candidate=p_candidate))) WHERE observation=obs;
  INSERT INTO pathways_loop.reserve_readiness(member_id,pack_id,version,practice_completed_at) VALUES(p_member,p_pack,p_version,(result->>'answered_at')::timestamptz) ON CONFLICT DO NOTHING;
 ELSIF p_action='reserve' THEN
  IF t.practice_receipt IS NULL OR t.due_at IS NULL OR clock_timestamp()<t.due_at THEN RAISE EXCEPTION 'not due after practice receipt' USING ERRCODE='PL004';END IF;
  IF t.reserve_request IS NULL THEN t.reserve_request:=p_nonce;END IF;
  result:=public.learning_reserve_reviewed_candidate(p_member,p_pack,p_version,t.reserve_request,p_candidate);
  IF result->>'state'='fresh_delivery' THEN UPDATE pathways_loop.thread SET reserve_request=t.reserve_request,reserve_delivery=(result->'deliveries'->0->>'delivery')::uuid WHERE observation=obs;END IF;
 ELSIF p_action='reserve_answer' THEN
  IF t.reserve_delivery IS NULL THEN RAISE EXCEPTION 'reserve delivery required' USING ERRCODE='PL007';END IF;
  result:=public.learning_reserve_answer_reviewed_candidate(p_member,t.reserve_delivery,p_nonce,(p_payload->>'chosen')::integer,p_candidate);
  UPDATE pathways_loop.thread SET reserve_receipt=coalesce(reserve_receipt,(result->>'attempt_id')::bigint) WHERE observation=obs;
 ELSIF p_action='status' THEN
  -- Reload a pending delivery through the immutable original request, never
  -- allocate another item or accept client-local progress as the answer.
  IF t.reserve_delivery IS NOT NULL AND t.reserve_receipt IS NULL THEN
   result:=public.learning_reserve_reviewed_candidate(p_member,p_pack,p_version,t.reserve_request,p_candidate);
  ELSIF t.practice_delivery IS NOT NULL AND t.practice_receipt IS NULL THEN
   SELECT a.item_id INTO item FROM pathways_evidence.item_presentation_event a WHERE a.item_delivery_id=t.practice_delivery LIMIT 1;
   SELECT * INTO delivery FROM pathways_evidence.serve_items(p_member,pk.track,ARRAY[item.item_id::text],t.practice_request::text,'practice',t.practice_request::text,'practice',jsonb_build_object('thread',obs::text,'phase','practice'),'v0.1.1');
   result:=jsonb_build_object('delivery',delivery.item_delivery_id,'body',delivery.body,'options',(SELECT jsonb_agg(jsonb_build_object('text',o.value->>'text') ORDER BY o.ordinality) FROM jsonb_array_elements(delivery.options) WITH ORDINALITY o(value,ordinality)));
  END IF;
 ELSIF p_action<>'status' THEN RAISE EXCEPTION 'invalid action' USING ERRCODE='22023';END IF;
 SELECT * INTO t FROM pathways_loop.thread WHERE observation=obs;
 RETURN suggestion||jsonb_build_object('thread_state',CASE WHEN t.reserve_receipt IS NOT NULL THEN 'summary' WHEN t.reserve_delivery IS NOT NULL THEN 'recheck' WHEN t.due_at IS NOT NULL AND clock_timestamp()>=t.due_at THEN 'due' WHEN t.practice_receipt IS NOT NULL THEN 'waiting' WHEN t.lesson_at IS NOT NULL THEN 'practice' ELSE 'lesson' END,'due_at',t.due_at,'result',result,'lesson',CASE WHEN t.lesson_at IS NOT NULL THEN (SELECT lesson FROM pathways_loop.reviewed_teaching WHERE pack_id=p_pack AND version=p_version AND candidate=p_candidate) END,'practice_receipt',t.practice_receipt,'reserve_receipt',t.reserve_receipt,'summary',jsonb_build_object('baseline_matched_families',(suggestion->>'qualifying')::integer,'other_correct_families',(suggestion->>'correct_other_families')::integer,'practice_correct',(SELECT (payload->>'correct')::boolean FROM pathways_evidence.learner_feedback_receipt WHERE attempt_id=t.practice_receipt),'fresh_correct',(SELECT (payload->>'correct')::boolean FROM pathways_evidence.learner_feedback_receipt WHERE attempt_id=t.reserve_receipt),'fresh_evidence_class',CASE WHEN EXISTS(SELECT 1 FROM pathways_loop.reserve_allocation a JOIN pathways_loop.lineage_help_exposure h ON h.member_id=a.member_id AND h.lineage=a.lineage JOIN pathways_evidence.learner_feedback_receipt f ON f.attempt_id=t.reserve_receipt WHERE a.member_id=p_member AND a.request_id=t.reserve_request AND h.at<=f.captured_at) THEN 'helped_not_fresh' WHEN t.reserve_receipt IS NOT NULL THEN 'reserved_response' ELSE null END,'mastery_claim',false));
END$function$
;

REVOKE ALL ON FUNCTION public.learning_baseline_reviewed_candidate(uuid,text,text,text) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.learning_baseline_reviewed_candidate(uuid,text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.learning_suggestion_reviewed_candidate(uuid,text,text,text,uuid,text) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.learning_suggestion_reviewed_candidate(uuid,text,text,text,uuid,text) TO service_role;
REVOKE ALL ON FUNCTION public.learning_reserve_reviewed_candidate(uuid,text,text,uuid,text) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.learning_reserve_reviewed_candidate(uuid,text,text,uuid,text) TO service_role;
REVOKE ALL ON FUNCTION public.learning_reserve_answer_reviewed_candidate(uuid,uuid,uuid,integer,text) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.learning_reserve_answer_reviewed_candidate(uuid,uuid,uuid,integer,text) TO service_role;
REVOKE ALL ON FUNCTION public.learning_thread_reviewed_candidate(uuid,text,text,text,text,uuid,jsonb) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.learning_thread_reviewed_candidate(uuid,text,text,text,text,uuid,jsonb) TO service_role;


CREATE TABLE pathways_loop.baseline_set(id uuid PRIMARY KEY,member_id uuid NOT NULL REFERENCES auth.users(id),pack_id text NOT NULL,version text NOT NULL,candidate text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(member_id,id));
CREATE TABLE pathways_loop.baseline_set_item(set_id uuid REFERENCES pathways_loop.baseline_set,delivery uuid NOT NULL,position integer NOT NULL,PRIMARY KEY(set_id,delivery));
REVOKE ALL ON pathways_loop.baseline_set,pathways_loop.baseline_set_item FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.learning_baseline_serve_candidate(p_member uuid,p_pack text,p_version text,p_candidate text,p_nonce uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s record;ids text[];n int;d record;l text;rows jsonb:='[]';
BEGIN
 PERFORM pathways_loop.reviewed_gate(p_member,p_pack,p_version,p_candidate);
 IF p_nonce IS NULL THEN RAISE EXCEPTION 'request required' USING ERRCODE='22023';END IF;
 -- An explicit starting-cases request enrolls only forward from this server
 -- timestamp, not from signup or a made-up past date. Known old family/help
 -- exposure stays excluded by the allocator below. Status alone never enrolls.
 IF EXISTS(SELECT 1 FROM pathways_loop.reviewed_pack_approval a JOIN pathways_loop.reviewed_policy p ON p.id=a.policy_id WHERE a.pack_id=p_pack AND a.version=p_version AND a.candidate=p_candidate AND p.history_mode='since_enrollment' AND a.history_complete_since<=clock_timestamp()) THEN
  INSERT INTO pathways_loop.member_history_coverage(member_id,pack_id,version,complete_since,coverage_evidence)
  VALUES(p_member,p_pack,p_version,clock_timestamp(),'Explicit starting-cases enrollment '||p_nonce::text||'; forward-only server instrumented version coverage, not certification of earlier history') ON CONFLICT DO NOTHING;
  IF public.learning_reviewed_evidence_candidate(p_member,p_pack,p_version,p_candidate)->>'state'='history_incomplete' THEN RETURN jsonb_build_object('state','history_incomplete','enabled',false);END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('baseline-set:'||p_member::text||':'||p_nonce,0));
 SELECT * INTO s FROM pathways_loop.baseline_set WHERE id=p_nonce;
 IF FOUND THEN
  IF s.member_id<>p_member OR s.pack_id<>p_pack OR s.version<>p_version OR s.candidate<>p_candidate THEN RAISE EXCEPTION 'baseline request conflict' USING ERRCODE='22023';END IF;
  SELECT array_agg(e.item_id ORDER BY b.position) INTO ids FROM pathways_loop.baseline_set_item b JOIN pathways_evidence.item_presentation_event e ON e.item_delivery_id=b.delivery WHERE b.set_id=p_nonce;
 ELSE
  SELECT p.minimum_families INTO n FROM pathways_loop.reviewed_policy p JOIN pathways_loop.reviewed_pack_approval a ON a.policy_id=p.id WHERE a.pack_id=p_pack AND a.version=p_version AND a.candidate=p_candidate;
  -- A complete, unexposed set. No feedback until all responses are submitted.
  SELECT array_agg(x.item_id::text ORDER BY x.lineage) INTO ids FROM(
   SELECT DISTINCT ON(vi.lineage) vi.item_id,vi.lineage FROM pathways_loop.version_item vi JOIN public.questions q ON q.id=vi.item_id
   WHERE vi.pack_id=p_pack AND vi.version=p_version AND vi.role='baseline' AND q.published AND vi.content_hash=pathways_evidence.content_hash(q.body,q.options,q.answer,q.explanation,q.citation)
    AND EXISTS(SELECT 1 FROM pathways_loop.option_mapping o WHERE o.pack_id=p_pack AND o.version=p_version AND o.item_id=vi.item_id AND o.candidate=p_candidate AND o.review_state='reviewed')
    AND NOT EXISTS(SELECT 1 FROM pathways_evidence.item_presentation_event e JOIN pathways_loop.version_item v ON v.item_id::text=e.item_id WHERE e.member_id=p_member AND v.lineage=vi.lineage)
    AND NOT EXISTS(SELECT 1 FROM pathways_loop.lineage_help_exposure h WHERE h.member_id=p_member AND h.lineage=vi.lineage)
    AND NOT EXISTS(SELECT 1 FROM public.attempts legacy JOIN pathways_loop.version_item v ON v.item_id=legacy.question_id WHERE legacy.user_id=p_member AND v.lineage=vi.lineage)
   ORDER BY vi.lineage,vi.item_id LIMIT n)x;
  IF cardinality(ids) IS NULL OR cardinality(ids)<n THEN RETURN jsonb_build_object('state','baseline_inventory_unavailable','deliveries','[]'::jsonb);END IF;
  FOR l IN SELECT DISTINCT lineage FROM pathways_loop.version_item WHERE item_id::text=ANY(ids) ORDER BY lineage LOOP
   PERFORM pg_advisory_xact_lock(hashtextextended('learning-lineage:'||p_member::text||':'||l,0));
   IF EXISTS(SELECT 1 FROM pathways_evidence.item_presentation_event e JOIN pathways_loop.version_item vi ON vi.item_id::text=e.item_id WHERE e.member_id=p_member AND vi.lineage=l) OR EXISTS(SELECT 1 FROM pathways_loop.lineage_help_exposure h WHERE h.member_id=p_member AND h.lineage=l) THEN RAISE EXCEPTION 'baseline family exposed during allocation' USING ERRCODE='PL002';END IF;
  END LOOP;
  INSERT INTO pathways_loop.baseline_set(id,member_id,pack_id,version,candidate) VALUES(p_nonce,p_member,p_pack,p_version,p_candidate);
 END IF;
 FOR d IN SELECT * FROM pathways_evidence.serve_items(p_member,'rbt',ids,p_nonce::text,'practice',p_nonce::text,'practice',jsonb_build_object('learning_baseline',true),'v0.1.1') LOOP
  INSERT INTO pathways_loop.baseline_set_item(set_id,delivery,position) VALUES(p_nonce,d.item_delivery_id,jsonb_array_length(rows)) ON CONFLICT DO NOTHING;
  rows:=rows||jsonb_build_array(jsonb_build_object('delivery',d.item_delivery_id,'body',d.body,'options',(SELECT jsonb_agg(jsonb_build_object('text',v->>'text')) FROM jsonb_array_elements(d.options)v)));
 END LOOP;
 RETURN jsonb_build_object('state','baseline_set','set',p_nonce,'deliveries',rows,'feedback','after_complete_set','notice','Answer each case before feedback. Responses record choices, not inferred thinking.');
END$$;
CREATE OR REPLACE FUNCTION public.learning_baseline_submit_candidate(p_member uuid, p_set uuid, p_nonce uuid, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE s record;b record;a jsonb;feedback jsonb:='[]';result jsonb;count_expected int;
BEGIN
 SELECT * INTO s FROM pathways_loop.baseline_set WHERE id=p_set AND member_id=p_member;
 IF NOT FOUND THEN RAISE EXCEPTION 'foreign baseline set' USING ERRCODE='42501';END IF;
 PERFORM pathways_loop.reviewed_gate(p_member,s.pack_id,s.version,s.candidate);
 PERFORM pg_advisory_xact_lock(hashtextextended('baseline-set:'||p_member::text||':'||p_set,0));
 SELECT count(*) INTO count_expected FROM pathways_loop.baseline_set_item WHERE set_id=p_set;
 IF p_nonce IS NULL OR jsonb_typeof(p_answers) IS DISTINCT FROM 'array' OR jsonb_array_length(p_answers)<>count_expected OR(SELECT count(DISTINCT v->>'delivery') FROM jsonb_array_elements(p_answers)v)<>count_expected THEN RAISE EXCEPTION 'complete unique answer set required' USING ERRCODE='22023';END IF;
 PERFORM set_config('pathways_loop.complete_baseline','on',true);
 FOR b IN SELECT * FROM pathways_loop.baseline_set_item WHERE set_id=p_set ORDER BY position LOOP
  SELECT v INTO a FROM jsonb_array_elements(p_answers)v WHERE v->>'delivery'=b.delivery::text;
  IF a IS NULL OR jsonb_typeof(a->'chosen')<>'number' OR (a->>'chosen')::numeric<>trunc((a->>'chosen')::numeric) THEN RAISE EXCEPTION 'missing or invalid answer' USING ERRCODE='22023';END IF;
  result:=public.learner_answer_bridge(p_member,'rbt','practice','v0.1.1',b.delivery,md5(p_nonce::text||b.delivery::text)::uuid,(a->>'chosen')::integer);
  IF result->>'outcome' IN('content_changed','timed_expired') OR result->>'attempt_id' IS NULL THEN RAISE EXCEPTION 'baseline content unavailable; no partial set accepted' USING ERRCODE='PL005';END IF;
  feedback:=feedback||jsonb_build_array(result);
 END LOOP;
 -- No response, explanation or feedback leaves this transaction before all
 -- immutable receipts exist. A failed second answer rolls the entire set back.
 PERFORM set_config('pathways_loop.complete_baseline','off',true);
 RETURN jsonb_build_object('state','baseline_recorded','feedback',feedback,'next',public.learning_baseline_reviewed_candidate(p_member,s.pack_id,s.version,s.candidate),'mastery_claim',false);
END$function$
;
REVOKE ALL ON FUNCTION public.learning_baseline_serve_candidate(uuid,text,text,text,uuid),public.learning_baseline_submit_candidate(uuid,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.learning_baseline_serve_candidate(uuid,text,text,text,uuid),public.learning_baseline_submit_candidate(uuid,uuid,uuid,jsonb) TO service_role;



ALTER TABLE pathways_loop.reviewed_teaching ADD COLUMN lineages text[] NOT NULL DEFAULT '{}';
CREATE FUNCTION pathways_loop.record_reviewed_teaching(p_member uuid,p_pack text,p_version text,p_candidate text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE l text;
BEGIN
 PERFORM pathways_loop.reviewed_gate(p_member,p_pack,p_version,p_candidate);
 FOR l IN SELECT unnest(lineages) FROM pathways_loop.reviewed_teaching WHERE pack_id=p_pack AND version=p_version AND candidate=p_candidate ORDER BY 1 LOOP
  PERFORM pg_advisory_xact_lock(hashtextextended('learning-lineage:'||p_member::text||':'||l,0));
  INSERT INTO pathways_loop.lineage_help_exposure(member_id,lineage,source) VALUES(p_member,l,'reviewed_teaching') ON CONFLICT DO NOTHING;
 END LOOP;
END$$;
REVOKE ALL ON FUNCTION pathways_loop.record_reviewed_teaching(uuid,text,text,text) FROM PUBLIC,anon,authenticated;


CREATE OR REPLACE FUNCTION public.learning_thread_reviewed_candidate(p_member uuid, p_pack text, p_version text, p_candidate text, p_action text, p_nonce uuid, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE suggestion jsonb;obs uuid;pk record;t record;item record;result jsonb;delivery record;
BEGIN
 suggestion:=public.learning_suggestion_reviewed_candidate(p_member,p_pack,p_version,p_candidate,p_nonce,null);
 IF suggestion->>'state'<>'reviewed_observation' THEN
  IF suggestion->>'state' IN('insufficient_clean_evidence','mixed_evidence_learner_choice') AND p_action='status' THEN
   SELECT * INTO delivery FROM pathways_loop.baseline_set bs WHERE bs.member_id=p_member AND bs.pack_id=p_pack AND bs.version=p_version AND bs.candidate=p_candidate AND EXISTS(SELECT 1 FROM pathways_loop.baseline_set_item bi WHERE bi.set_id=bs.id AND NOT EXISTS(SELECT 1 FROM pathways_evidence.learner_feedback_receipt r WHERE r.item_delivery_id=bi.delivery)) ORDER BY bs.created_at DESC LIMIT 1;
   IF FOUND THEN RETURN public.learning_baseline_serve_candidate(p_member,p_pack,p_version,p_candidate,delivery.id);END IF;
  END IF;
  RETURN suggestion;
 END IF;
 obs:=(suggestion->>'observation')::uuid;
 PERFORM pg_advisory_xact_lock(hashtextextended('thread:'||obs::text,0));
 INSERT INTO pathways_loop.thread(observation) VALUES(obs) ON CONFLICT DO NOTHING;
 SELECT * INTO t FROM pathways_loop.thread WHERE observation=obs FOR UPDATE;
 SELECT * INTO pk FROM pathways_loop.pack_version WHERE pack_id=p_pack AND version=p_version FOR SHARE;
 PERFORM pathways_loop.reviewed_gate(p_member,p_pack,p_version,p_candidate);
 IF NOT EXISTS(SELECT 1 FROM pathways_loop.reviewed_teaching WHERE pack_id=p_pack AND version=p_version AND candidate=p_candidate) THEN RAISE EXCEPTION 'reviewed teaching unavailable' USING ERRCODE='PL005';END IF;
 IF NOT (suggestion->>'suggestion_enabled')::boolean THEN RETURN suggestion||jsonb_build_object('thread_state','focus_paused');END IF;
 IF p_action='lesson' THEN
  PERFORM pathways_loop.record_reviewed_teaching(p_member,p_pack,p_version,p_candidate);
  UPDATE pathways_loop.thread SET lesson_at=coalesce(lesson_at,clock_timestamp()) WHERE observation=obs;
 ELSIF p_action='practice' THEN
  IF t.lesson_at IS NULL THEN RAISE EXCEPTION 'lesson required' USING ERRCODE='PL007';END IF;
  SELECT vi.* INTO item FROM pathways_loop.version_item vi JOIN public.questions q ON q.id=vi.item_id WHERE vi.pack_id=p_pack AND vi.version=p_version AND vi.role='practice' AND EXISTS(SELECT 1 FROM pathways_loop.option_mapping om WHERE om.pack_id=vi.pack_id AND om.version=vi.version AND om.item_id=vi.item_id AND om.candidate=p_candidate AND om.review_state='reviewed') AND q.published AND vi.content_hash=pathways_evidence.content_hash(q.body,q.options,q.answer,q.explanation,q.citation) ORDER BY vi.item_id LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'no approved software practice' USING ERRCODE='PL005';END IF;
  IF t.practice_request IS NULL THEN t.practice_request:=p_nonce;END IF;
  SELECT * INTO delivery FROM pathways_evidence.serve_items(p_member,pk.track,ARRAY[item.item_id::text],t.practice_request::text,'practice',t.practice_request::text,'practice',jsonb_build_object('thread',obs::text,'phase','practice'),'v0.1.1');
  UPDATE pathways_loop.thread SET practice_request=t.practice_request,practice_delivery=delivery.item_delivery_id WHERE observation=obs;
  result:=jsonb_build_object('delivery',delivery.item_delivery_id,'body',delivery.body,'options',(SELECT jsonb_agg(jsonb_build_object('text',o.value->>'text') ORDER BY o.ordinality) FROM jsonb_array_elements(delivery.options) WITH ORDINALITY o(value,ordinality)));
 ELSIF p_action='practice_answer' THEN
  IF t.practice_delivery IS NULL THEN RAISE EXCEPTION 'practice delivery required' USING ERRCODE='PL007';END IF;
  result:=public.learner_answer_bridge(p_member,pk.track,'practice','v0.1.1',t.practice_delivery,p_nonce,(p_payload->>'chosen')::integer);
  IF result->>'outcome' IN('content_changed','timed_expired') THEN RETURN suggestion||jsonb_build_object('thread_state','content_unavailable','result',result);END IF;
  UPDATE pathways_loop.thread SET practice_receipt=coalesce(practice_receipt,(result->>'attempt_id')::bigint),due_at=coalesce(due_at,(result->>'answered_at')::timestamptz+make_interval(hours=>(SELECT policy.delay_hours FROM pathways_loop.reviewed_policy policy JOIN pathways_loop.reviewed_pack_approval a ON a.policy_id=policy.id WHERE a.pack_id=p_pack AND a.version=p_version AND a.candidate=p_candidate))) WHERE observation=obs;
  INSERT INTO pathways_loop.reserve_readiness(member_id,pack_id,version,practice_completed_at) VALUES(p_member,p_pack,p_version,(result->>'answered_at')::timestamptz) ON CONFLICT DO NOTHING;
 ELSIF p_action='reserve' THEN
  IF t.practice_receipt IS NULL OR t.due_at IS NULL OR clock_timestamp()<t.due_at THEN RAISE EXCEPTION 'not due after practice receipt' USING ERRCODE='PL004';END IF;
  IF t.reserve_request IS NULL THEN t.reserve_request:=p_nonce;END IF;
  result:=public.learning_reserve_reviewed_candidate(p_member,p_pack,p_version,t.reserve_request,p_candidate);
  IF result->>'state'='fresh_delivery' THEN UPDATE pathways_loop.thread SET reserve_request=t.reserve_request,reserve_delivery=(result->'deliveries'->0->>'delivery')::uuid WHERE observation=obs;END IF;
 ELSIF p_action='reserve_answer' THEN
  IF t.reserve_delivery IS NULL THEN RAISE EXCEPTION 'reserve delivery required' USING ERRCODE='PL007';END IF;
  result:=public.learning_reserve_answer_reviewed_candidate(p_member,t.reserve_delivery,p_nonce,(p_payload->>'chosen')::integer,p_candidate);
  IF result->>'outcome' IN('content_changed','timed_expired') THEN RETURN suggestion||jsonb_build_object('thread_state','content_unavailable','result',result);END IF;
  UPDATE pathways_loop.thread SET reserve_receipt=coalesce(reserve_receipt,(result->>'attempt_id')::bigint) WHERE observation=obs;
 ELSIF p_action='status' THEN
  -- Reload a pending delivery through the immutable original request, never
  -- allocate another item or accept client-local progress as the answer.
  IF t.reserve_delivery IS NOT NULL AND t.reserve_receipt IS NULL THEN
   result:=public.learning_reserve_reviewed_candidate(p_member,p_pack,p_version,t.reserve_request,p_candidate);
  ELSIF t.practice_delivery IS NOT NULL AND t.practice_receipt IS NULL THEN
   SELECT a.item_id INTO item FROM pathways_evidence.item_presentation_event a WHERE a.item_delivery_id=t.practice_delivery LIMIT 1;
   SELECT * INTO delivery FROM pathways_evidence.serve_items(p_member,pk.track,ARRAY[item.item_id::text],t.practice_request::text,'practice',t.practice_request::text,'practice',jsonb_build_object('thread',obs::text,'phase','practice'),'v0.1.1');
   result:=jsonb_build_object('delivery',delivery.item_delivery_id,'body',delivery.body,'options',(SELECT jsonb_agg(jsonb_build_object('text',o.value->>'text') ORDER BY o.ordinality) FROM jsonb_array_elements(delivery.options) WITH ORDINALITY o(value,ordinality)));
  END IF;
 ELSIF p_action<>'status' THEN RAISE EXCEPTION 'invalid action' USING ERRCODE='22023';END IF;
 SELECT * INTO t FROM pathways_loop.thread WHERE observation=obs;
 RETURN suggestion||jsonb_build_object('thread_state',CASE WHEN t.reserve_receipt IS NOT NULL THEN 'summary' WHEN t.reserve_delivery IS NOT NULL THEN 'recheck' WHEN t.due_at IS NOT NULL AND clock_timestamp()>=t.due_at THEN 'due' WHEN t.practice_receipt IS NOT NULL THEN 'waiting' WHEN t.lesson_at IS NOT NULL THEN 'practice' ELSE 'lesson' END,'due_at',t.due_at,'result',result,'lesson',CASE WHEN t.lesson_at IS NOT NULL THEN (SELECT lesson FROM pathways_loop.reviewed_teaching WHERE pack_id=p_pack AND version=p_version AND candidate=p_candidate) END,'practice_receipt',t.practice_receipt,'reserve_receipt',t.reserve_receipt,'summary',jsonb_build_object('baseline_matched_families',(suggestion->>'qualifying')::integer,'other_correct_families',(suggestion->>'correct_other_families')::integer,'practice_correct',(SELECT (payload->>'correct')::boolean FROM pathways_evidence.learner_feedback_receipt WHERE attempt_id=t.practice_receipt),'fresh_correct',(SELECT (payload->>'correct')::boolean FROM pathways_evidence.learner_feedback_receipt WHERE attempt_id=t.reserve_receipt),'fresh_evidence_class',CASE WHEN EXISTS(SELECT 1 FROM pathways_loop.reserve_allocation a JOIN pathways_loop.lineage_help_exposure h ON h.member_id=a.member_id AND h.lineage=a.lineage JOIN pathways_evidence.learner_feedback_receipt f ON f.attempt_id=t.reserve_receipt WHERE a.member_id=p_member AND a.request_id=t.reserve_request AND h.at<=f.captured_at) THEN 'helped_not_fresh' WHEN t.reserve_receipt IS NOT NULL THEN 'reserved_response' ELSE null END,'mastery_claim',false));
END$function$
;


CREATE OR REPLACE FUNCTION public.learning_recovery_reviewed_candidate(p_member uuid, p_pack text, p_version text, p_candidate text, p_nonce uuid, p_choice text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE s jsonb;obs uuid;t record;choice text;correct boolean;
BEGIN
 s:=public.learning_suggestion_reviewed_candidate(p_member,p_pack,p_version,p_candidate,p_nonce,null);
 IF s->>'state'<>'reviewed_observation' THEN RETURN s;END IF;
 obs:=(s->>'observation')::uuid;
 PERFORM pathways_loop.reviewed_gate(p_member,p_pack,p_version,p_candidate);
 PERFORM pg_advisory_xact_lock(hashtextextended('thread:'||obs::text,0));
 SELECT * INTO t FROM pathways_loop.thread WHERE observation=obs FOR UPDATE;
 SELECT (payload->>'correct')::boolean INTO correct FROM pathways_evidence.learner_feedback_receipt WHERE member_id=p_member AND attempt_id=t.reserve_receipt;
 IF t.reserve_receipt IS NULL OR correct IS DISTINCT FROM false THEN RAISE EXCEPTION 'incorrect confirmed fresh result required' USING ERRCODE='PL008';END IF;
 IF NOT EXISTS(SELECT 1 FROM pathways_evidence.learner_feedback_receipt f JOIN pathways_loop.option_mapping m ON m.item_id=f.question_id AND m.option_index=f.chosen_index WHERE f.attempt_id=t.reserve_receipt AND m.pack_id=p_pack AND m.version=p_version AND m.candidate=p_candidate AND m.review_state='reviewed') THEN RETURN jsonb_build_object('state','different_error','fresh_receipt',t.reserve_receipt,'notice','Incorrect answer did not match this reviewed selected-option mapping. Do not reuse its recovery hypothesis.','evidence_changed',false);END IF;
 IF p_choice='show_another_way' THEN PERFORM pathways_loop.record_reviewed_teaching(p_member,p_pack,p_version,p_candidate);END IF;
 IF p_choice IS NOT NULL THEN
  IF p_nonce IS NULL OR p_choice NOT IN('show_another_way','misread','different_focus','coach_pin') THEN RAISE EXCEPTION 'invalid recovery choice' USING ERRCODE='22023';END IF;
  IF EXISTS(SELECT 1 FROM pathways_loop.recovery_choice r WHERE r.observation=obs AND r.nonce=p_nonce AND r.choice<>p_choice) THEN RAISE EXCEPTION 'recovery replay conflict' USING ERRCODE='22023';END IF;
  INSERT INTO pathways_loop.recovery_choice(observation,nonce,choice) VALUES(obs,p_nonce,p_choice) ON CONFLICT DO NOTHING;
  IF p_choice='different_focus' THEN PERFORM public.learning_suggestion_reviewed_candidate(p_member,p_pack,p_version,p_candidate,p_nonce,'disagree');END IF;
 END IF;
 SELECT r.choice INTO choice FROM pathways_loop.recovery_choice r WHERE r.observation=obs ORDER BY at DESC,nonce DESC LIMIT 1;
 RETURN jsonb_build_object('observation',obs,'state',CASE choice WHEN 'show_another_way' THEN 'alternate_representation' WHEN 'misread' THEN 'question_target' WHEN 'different_focus' THEN 'focus_paused' WHEN 'coach_pin' THEN 'private_coach_pin' ELSE 'recovery_choice' END,'choice',choice,'practice_receipt',t.practice_receipt,'fresh_receipt',t.reserve_receipt,'fresh_correct',false,'evidence_changed',false,'retrospective_report',true,'lesson',CASE choice WHEN 'show_another_way' THEN (SELECT alternate FROM pathways_loop.reviewed_teaching WHERE pack_id=p_pack AND version=p_version AND candidate=p_candidate) WHEN 'misread' THEN 'Identify what the question asks before comparing alternatives. This help follows your report, not inferred thinking.' WHEN 'coach_pin' THEN 'Pinned privately for review. No coach contacted, session booked or packet shared.' END,'next_move',CASE choice WHEN 'different_focus' THEN 'Choose a different reviewed focus. This hypothesis is paused.' WHEN 'coach_pin' THEN 'Preview what you might bring to the existing monthly session.' ELSE 'Try the chosen angle. A further check needs reviewed independent inventory and approved spacing.' END,'mastery_claim',false,'notice','Aided instruction, not fresh evidence or a mastery claim.');
END$function$
;

REVOKE ALL ON FUNCTION public.learning_recovery_reviewed_candidate(uuid,text,text,text,uuid,text) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.learning_recovery_reviewed_candidate(uuid,text,text,text,uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION pathways_loop.freeze_review_approval() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-'withdrawn_at') IS DISTINCT FROM (to_jsonb(OLD)-'withdrawn_at') THEN RAISE EXCEPTION 'approval immutable; withdraw and create a new policy/version' USING ERRCODE='PL006';END IF;
 RETURN NEW;
END$$;
REVOKE ALL ON FUNCTION pathways_loop.freeze_review_approval() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER freeze_reviewed_policy BEFORE UPDATE OR DELETE ON pathways_loop.reviewed_policy FOR EACH ROW EXECUTE FUNCTION pathways_loop.freeze_review_approval();
CREATE TRIGGER freeze_reviewed_approval BEFORE UPDATE OR DELETE ON pathways_loop.reviewed_pack_approval FOR EACH ROW EXECUTE FUNCTION pathways_loop.freeze_review_approval();



CREATE OR REPLACE FUNCTION pathways_loop.reviewed_gate(p_member uuid,p_pack text,p_version text,p_candidate text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM pathways_loop.release_audience WHERE member_id=p_member AND withdrawn_at IS NULL FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'outside approved release audience' USING ERRCODE='42501';END IF;
 -- Hold membership through the action. A downgrade either wins before this
 -- lock and denies access, or waits for the already-authorized action to end.
 PERFORM 1 FROM public.profiles p WHERE p.id=p_member AND p.plan='guided' AND EXISTS(SELECT 1 FROM pathways_loop.pack_version v WHERE v.track=p.track AND v.pack_id=p_pack AND v.version=p_version) FOR SHARE OF p;
 IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM pathways_loop.release_gate WHERE singleton AND enabled AND release_evidence IS NOT NULL FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'release unavailable' USING ERRCODE='PL003';END IF;
 PERFORM 1 FROM pathways_loop.reviewed_pack_approval a JOIN pathways_loop.reviewed_policy p ON p.id=a.policy_id JOIN pathways_loop.pack_version v ON v.pack_id=a.pack_id AND v.version=a.version WHERE a.pack_id=p_pack AND a.version=p_version AND a.candidate=p_candidate AND a.withdrawn_at IS NULL AND p.withdrawn_at IS NULL AND v.status='reviewed' AND NOT v.synthetic AND v.policy_version=p.id AND v.baseline_min=p.minimum_families AND v.delay_seconds=p.delay_hours*3600 FOR SHARE OF a,p,v;
 IF NOT FOUND THEN RAISE EXCEPTION 'reviewed release unavailable or policy mismatch' USING ERRCODE='PL003';END IF;
END$$;
CREATE OR REPLACE FUNCTION pathways_loop.freeze_review_approval() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-'withdrawn_at') IS DISTINCT FROM (to_jsonb(OLD)-'withdrawn_at') OR (OLD.withdrawn_at IS NOT NULL AND NEW.withdrawn_at IS DISTINCT FROM OLD.withdrawn_at) THEN RAISE EXCEPTION 'approval immutable; withdraw and create a new policy/version' USING ERRCODE='PL006';END IF;
 RETURN NEW;
END$$;
CREATE FUNCTION pathways_loop.freeze_teaching() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN RAISE EXCEPTION 'reviewed teaching immutable; create a new version' USING ERRCODE='PL006';END$$;
REVOKE ALL ON FUNCTION pathways_loop.freeze_teaching() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER freeze_reviewed_teaching BEFORE UPDATE OR DELETE ON pathways_loop.reviewed_teaching FOR EACH ROW EXECUTE FUNCTION pathways_loop.freeze_teaching();



ALTER TABLE pathways_loop.reviewed_policy ADD COLUMN history_mode text NOT NULL DEFAULT 'full_window' CHECK(history_mode IN('full_window','since_enrollment'));
CREATE TABLE pathways_loop.member_history_coverage(
 member_id uuid NOT NULL REFERENCES auth.users(id),pack_id text NOT NULL,version text NOT NULL,
 complete_since timestamptz NOT NULL,coverage_evidence text NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),withdrawn_at timestamptz,
 PRIMARY KEY(member_id,pack_id,version),FOREIGN KEY(pack_id,version) REFERENCES pathways_loop.pack_version);
REVOKE ALL ON pathways_loop.member_history_coverage FROM PUBLIC,anon,authenticated;
CREATE TRIGGER freeze_member_history_coverage BEFORE UPDATE OR DELETE ON pathways_loop.member_history_coverage FOR EACH ROW EXECUTE FUNCTION pathways_loop.freeze_review_approval();



ALTER TABLE pathways_loop.baseline_observation ADD COLUMN evidence_snapshot jsonb;
CREATE OR REPLACE FUNCTION public.learning_baseline_reviewed_candidate(p_member uuid,p_pack text,p_version text,p_candidate text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e jsonb;o record;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('baseline:'||p_member::text||':'||p_pack||':'||p_version,0));
 SELECT * INTO o FROM pathways_loop.baseline_observation WHERE member_id=p_member AND pack_id=p_pack AND version=p_version AND candidate=p_candidate;
 IF FOUND THEN
  PERFORM pathways_loop.reviewed_gate(p_member,p_pack,p_version,p_candidate);
  IF o.evidence_snapshot IS NULL THEN RETURN jsonb_build_object('state','snapshot_unavailable','enabled',false);END IF;
  -- A frozen thread is history, not a silently recomputed personal claim.
  -- Content withdrawal/hash change still closes access before replay.
  IF EXISTS(SELECT 1 FROM unnest(o.receipt_ids) id LEFT JOIN pathways_evidence.learner_feedback_receipt f ON f.attempt_id=id AND f.member_id=p_member LEFT JOIN pathways_loop.version_item vi ON vi.item_id=f.question_id AND vi.pack_id=p_pack AND vi.version=p_version LEFT JOIN public.questions q ON q.id=vi.item_id WHERE f.attempt_id IS NULL OR q.id IS NULL OR NOT q.published OR vi.content_hash IS DISTINCT FROM f.content_hash OR vi.content_hash IS DISTINCT FROM pathways_evidence.content_hash(q.body,q.options,q.answer,q.explanation,q.citation)) THEN RETURN jsonb_build_object('state','content_changed','enabled',false);END IF;
  RETURN o.evidence_snapshot||jsonb_build_object('state','reviewed_observation','observation',o.id,'qualifying',cardinality(o.receipt_ids),'historical_thread',true,'observation_at',o.at,'new_inference',false);
 END IF;
 e:=public.learning_reviewed_evidence_candidate(p_member,p_pack,p_version,p_candidate);
 IF NOT coalesce((e->>'enabled')::boolean,false) THEN RETURN e||jsonb_build_object('suggestion_enabled',false);END IF;
 INSERT INTO pathways_loop.baseline_observation(member_id,pack_id,version,candidate,receipt_ids,lineages,policy_version,evidence_snapshot) VALUES(p_member,p_pack,p_version,p_candidate,ARRAY(SELECT value::bigint FROM jsonb_array_elements_text(e->'receipt_ids')),ARRAY(SELECT value FROM jsonb_array_elements_text(e->'families')),e->>'policy',e) RETURNING * INTO o;
 RETURN e||jsonb_build_object('state','reviewed_observation','observation',o.id,'qualifying',e->'matched','correct_other_families',0,'notice','Selected answers only, not inferred thoughts or mastery.','observation_at',o.at,'new_inference',true);
END$$;
CREATE FUNCTION pathways_loop.freeze_observation_snapshot() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN RAISE EXCEPTION 'observation evidence immutable; feedback is separate' USING ERRCODE='PL006';END$$;
REVOKE ALL ON FUNCTION pathways_loop.freeze_observation_snapshot() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER freeze_observation_snapshot BEFORE UPDATE OR DELETE ON pathways_loop.baseline_observation FOR EACH ROW EXECUTE FUNCTION pathways_loop.freeze_observation_snapshot();



CREATE FUNCTION public.learning_choose_help_candidate(p_member uuid,p_pack text,p_version text,p_candidate text,p_nonce uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o record;policy text;
BEGIN
 PERFORM pathways_loop.reviewed_gate(p_member,p_pack,p_version,p_candidate);
 IF p_nonce IS NULL THEN RAISE EXCEPTION 'choice request required' USING ERRCODE='22023';END IF;
 IF NOT EXISTS(SELECT 1 FROM pathways_loop.reviewed_teaching WHERE pack_id=p_pack AND version=p_version AND candidate=p_candidate) THEN RAISE EXCEPTION 'reviewed teaching unavailable' USING ERRCODE='PL005';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('baseline:'||p_member::text||':'||p_pack||':'||p_version,0));
 SELECT policy_id INTO policy FROM pathways_loop.reviewed_pack_approval WHERE pack_id=p_pack AND version=p_version AND candidate=p_candidate;
 INSERT INTO pathways_loop.baseline_observation(member_id,pack_id,version,candidate,receipt_ids,lineages,policy_version,evidence_snapshot) VALUES(p_member,p_pack,p_version,p_candidate,'{}','{}',policy,jsonb_build_object('state','learner_selected_help','claim','learner_choice_not_inference','matched',0,'correct',0,'total',0,'receipt_ids','[]'::jsonb,'families','[]'::jsonb,'source','explicit_learner_choice','choice_nonce',p_nonce)) ON CONFLICT DO NOTHING RETURNING * INTO o;
 IF o.id IS NULL THEN
  SELECT * INTO o FROM pathways_loop.baseline_observation WHERE member_id=p_member AND pack_id=p_pack AND version=p_version AND candidate=p_candidate;
 END IF;
 IF EXISTS(SELECT 1 FROM pathways_loop.observation_feedback WHERE observation=o.id AND nonce=p_nonce AND response<>'fits') THEN RAISE EXCEPTION 'choice nonce conflict' USING ERRCODE='22023';END IF;
 -- Choosing help explicitly resumes this focus, without relabeling its evidence.
 INSERT INTO pathways_loop.observation_feedback(observation,nonce,response) VALUES(o.id,p_nonce,'fits') ON CONFLICT DO NOTHING;
 RETURN public.learning_thread_reviewed_candidate(p_member,p_pack,p_version,p_candidate,'status',p_nonce,'{}');
END$$;
REVOKE ALL ON FUNCTION public.learning_choose_help_candidate(uuid,text,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.learning_choose_help_candidate(uuid,text,text,text,uuid) TO service_role;



CREATE TABLE pathways_loop.request_ledger(member_id uuid NOT NULL REFERENCES auth.users(id),nonce uuid NOT NULL,action text NOT NULL,body_hash text NOT NULL,at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(member_id,nonce));
REVOKE ALL ON pathways_loop.request_ledger FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.learning_request_guard_candidate(p_member uuid,p_nonce uuid,p_action text,p_payload jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE prior record;fingerprint text;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' OR p_member IS NULL OR p_nonce IS NULL OR p_action NOT IN('reviewed_thread','reviewed_suggestion','reviewed_recovery','reviewed_choose_help','reviewed_baseline_serve','reviewed_baseline_submit') OR jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'invalid private request' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('learning-requests:'||p_member::text,0));
 fingerprint:=md5(p_payload::text);
 SELECT * INTO prior FROM pathways_loop.request_ledger WHERE member_id=p_member AND nonce=p_nonce;
 IF FOUND THEN
  IF prior.action<>p_action OR prior.body_hash<>fingerprint THEN RAISE EXCEPTION 'request nonce conflict' USING ERRCODE='22023';END IF;
  RETURN true;
 END IF;
 IF(SELECT count(*) FROM pathways_loop.request_ledger WHERE member_id=p_member AND at>clock_timestamp()-interval '1minute')>=30 THEN RAISE EXCEPTION 'learning request limit' USING ERRCODE='PW012';END IF;
 INSERT INTO pathways_loop.request_ledger(member_id,nonce,action,body_hash) VALUES(p_member,p_nonce,p_action,fingerprint);
 RETURN true;
END$$;
REVOKE ALL ON FUNCTION public.learning_request_guard_candidate(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.learning_request_guard_candidate(uuid,uuid,text,jsonb) TO service_role;


CREATE OR REPLACE FUNCTION public.learner_answer_bridge(p_member uuid, p_track text, p_route text, p_version text, p_delivery uuid, p_answer_key uuid, p_chosen integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE prof record; d record; q record; result record; saved jsonb; feedback jsonb; timed_deadline timestamptz;
BEGIN
 IF EXISTS(SELECT 1 FROM pathways_loop.baseline_set_item b WHERE b.delivery=p_delivery) AND current_setting('pathways_loop.complete_baseline',true) IS DISTINCT FROM 'on' THEN RAISE EXCEPTION 'complete baseline set required before feedback' USING ERRCODE='PL009';END IF;
 IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION 'READ COMMITTED required' USING ERRCODE='PB009'; END IF;
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service only' USING ERRCODE='42501'; END IF;
 IF p_member IS NULL OR p_track IS NULL OR p_route IS DISTINCT FROM 'practice' OR p_version IS DISTINCT FROM 'v0.1.1' THEN RAISE EXCEPTION 'invalid context' USING ERRCODE='22023'; END IF;
 SELECT p.track,p.plan INTO prof FROM public.profiles p WHERE p.id=p_member FOR SHARE;
 IF NOT FOUND OR prof.track IS NULL THEN RAISE EXCEPTION 'track_required' USING ERRCODE='PW001'; END IF;
 IF prof.track IS DISTINCT FROM p_track OR prof.plan IS NULL OR prof.plan NOT IN('self-study','guided') THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
 SELECT e.item_id,e.track INTO d FROM pathways_evidence.item_presentation_event e
 WHERE e.item_delivery_id=p_delivery AND e.member_id=p_member AND e.logged_by='server' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'delivery unauthorized' USING ERRCODE='42501'; END IF;
 -- Same delivery->question order for all bridge submissions. Row SHARE stops content edits during grading/capture.
 SELECT qq.* INTO q FROM public.questions qq WHERE qq.id::text=d.item_id AND qq.track=d.track FOR SHARE;
 SELECT ts.deadline_at INTO timed_deadline FROM pathways_evidence.learner_timed_session ts
 JOIN pathways_evidence.item_presentation_event ev ON ev.member_id=ts.member_id AND ev.serve_request_key=ts.request_key::text
 WHERE ev.item_delivery_id=p_delivery AND ev.member_id=p_member AND ev.logged_by='server';
 IF timed_deadline IS NOT NULL AND clock_timestamp()>=timed_deadline AND NOT EXISTS(
   SELECT 1 FROM pathways_evidence.learner_feedback_receipt fr WHERE fr.item_delivery_id=p_delivery AND fr.member_id=p_member
 ) THEN RETURN jsonb_build_object('outcome','timed_expired','attempt_id',NULL,'correct',NULL,'answered_at',clock_timestamp(),'feedback',NULL);END IF;
 SELECT * INTO result FROM pathways_evidence.submit_answer(p_member,p_track,p_delivery,p_chosen,p_answer_key,p_route,p_version);
 IF result.outcome='content_changed' OR result.correct IS NULL THEN
  RETURN jsonb_build_object('outcome','content_changed','attempt_id',NULL,'correct',NULL,'answered_at',result.answered_at,'feedback',NULL);
 END IF;
 SELECT r.payload INTO saved FROM pathways_evidence.learner_feedback_receipt r WHERE r.item_delivery_id=p_delivery AND r.member_id=p_member;
 IF result.outcome='accepted' THEN
  -- Captured only on this bridge's first accepted answer; never fabricate receipts for old bindings.
  feedback:=jsonb_build_object('correct_index',q.answer,'options',(SELECT jsonb_agg(jsonb_build_object('text',o.value->>'text','explanation',o.value->>'explanation') ORDER BY o.ordinality) FROM jsonb_array_elements(q.options) WITH ORDINALITY o(value,ordinality)));
  saved:=jsonb_build_object('attempt_id',result.attempt_id::text,'correct',result.correct,'answered_at',result.answered_at,'chosen_option',result.chosen_option,'feedback',feedback);
  PERFORM set_config('pathways_evidence.receipt_writer','on',true);
  INSERT INTO pathways_evidence.learner_feedback_receipt(item_delivery_id,member_id,payload,attempt_id,question_id,content_hash,src_body,src_options,src_answer,src_explanation,src_citation,chosen_index)
   VALUES(p_delivery,p_member,saved,result.attempt_id,q.id,pathways_evidence.content_hash(q.body,q.options,q.answer,q.explanation,q.citation),q.body,q.options,q.answer,q.explanation,q.citation,result.chosen_option);
  PERFORM set_config('pathways_evidence.receipt_writer','off',true);
  SELECT r.payload INTO saved FROM pathways_evidence.learner_feedback_receipt r WHERE r.item_delivery_id=p_delivery;
 END IF;
 IF saved IS NULL THEN RAISE EXCEPTION 'feedback_unavailable: no immutable receipt for prior answer' USING ERRCODE='PW014'; END IF;
 RETURN saved||jsonb_build_object('outcome',result.outcome,'replayed',result.replayed);
END $function$
;
CREATE OR REPLACE FUNCTION public.learner_serve_bridge(p_member uuid, p_track text, p_route text, p_version text, p_request uuid, p_selection jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE ids text[]; rows jsonb; prof record; lim integer; timing record;
BEGIN
 IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION 'READ COMMITTED required' USING ERRCODE='PB009'; END IF;
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service only' USING ERRCODE='42501'; END IF;
 IF p_member IS NULL OR p_track IS NULL OR p_request IS NULL OR p_route IS DISTINCT FROM 'practice' OR p_version IS DISTINCT FROM 'v0.1.1' THEN RAISE EXCEPTION 'invalid context' USING ERRCODE='22023'; END IF;
 IF jsonb_typeof(p_selection) IS DISTINCT FROM 'object' OR (p_selection-'limit'-'area'-'tag'-'review'-'timed') <> '{}'::jsonb
    OR jsonb_typeof(p_selection->'limit') IS DISTINCT FROM 'number' OR (p_selection->>'limit') !~ '^[0-9]+$'
    OR (p_selection ? 'area' AND (jsonb_typeof(p_selection->'area') IS DISTINCT FROM 'string' OR length(p_selection->>'area') NOT BETWEEN 1 AND 160))
    OR (p_selection ? 'tag' AND (jsonb_typeof(p_selection->'tag') IS DISTINCT FROM 'string' OR length(p_selection->>'tag') NOT BETWEEN 1 AND 160))
    OR (p_selection ? 'review' AND jsonb_typeof(p_selection->'review') IS DISTINCT FROM 'boolean')
    OR (p_selection ? 'timed' AND (jsonb_typeof(p_selection->'timed') IS DISTINCT FROM 'boolean' OR (p_selection->>'timed')::boolean AND (p_selection->>'limit')::integer<>10))
    OR (p_selection ? 'area' AND p_selection ? 'tag') THEN
  RAISE EXCEPTION 'invalid selection' USING ERRCODE='22023'; END IF;
 lim:=(p_selection->>'limit')::integer;
 IF lim<1 OR lim>25 THEN RAISE EXCEPTION 'invalid limit' USING ERRCODE='22023'; END IF;
 SELECT p.track,p.plan INTO prof FROM public.profiles p WHERE p.id=p_member FOR SHARE;
 IF NOT FOUND OR prof.track IS NULL THEN RAISE EXCEPTION 'track_required' USING ERRCODE='PW001'; END IF;
 IF prof.track IS DISTINCT FROM p_track OR prof.plan IS NULL OR prof.plan NOT IN('self-study','guided') THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
 -- Same exact lock namespace as reviewed EHC core, retained until transaction ends.
 PERFORM pg_advisory_xact_lock(hashtextextended('ehc_serve:'||p_member::text||':'||p_request::text,0));
 SELECT array_agg(e.item_id ORDER BY e.serve_position) INTO ids FROM pathways_evidence.item_presentation_event e
 WHERE e.member_id=p_member AND e.logged_by='server' AND e.serve_request_key=p_request::text;
 IF ids IS NULL THEN
  -- Member-wide serialization makes new-set throttle concurrent-safe. Retry above does not select/count again.
  PERFORM pg_advisory_xact_lock(hashtextextended('learner_new_serve:'||p_member::text,0));
  IF (SELECT count(DISTINCT e.serve_request_key) FROM pathways_evidence.item_presentation_event e WHERE e.member_id=p_member AND e.logged_by='server' AND e.server_recorded_at>clock_timestamp()-interval '1 minute')>=10 THEN
   RAISE EXCEPTION 'rate_limited' USING ERRCODE='PW012'; END IF;
  -- Rotate through the member's track: never-presented items first, then oldest
  -- presentation. No weak-topic inference; same request replays above unchanged.
  SELECT array_agg(x.id::text ORDER BY x.last_seen NULLS FIRST, x.id) INTO ids FROM
   (SELECT q.id, seen.last_seen FROM public.questions q
    LEFT JOIN LATERAL (
      SELECT max(e.server_recorded_at) AS last_seen
      FROM pathways_evidence.item_presentation_event e
      WHERE e.member_id=p_member AND e.item_id=q.id::text AND e.logged_by='server'
    ) seen ON true
    WHERE q.track=p_track AND q.published IS TRUE AND NOT EXISTS(SELECT 1 FROM pathways_loop.version_item vi WHERE vi.item_id=q.id)
    AND (NOT(p_selection?'area') OR q.area=p_selection->>'area')
    AND (NOT(p_selection?'tag') OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(q.options) WITH ORDINALITY opt(value,idx)
      WHERE idx-1<>q.answer AND value->>'misconception_tag'=p_selection->>'tag'
    ))
    AND (coalesce((p_selection->>'review')::boolean,false) IS FALSE OR EXISTS (
      SELECT 1 FROM public.attempts a WHERE a.user_id=p_member AND a.question_id=q.id
      AND a.correct IS FALSE AND a.created_at>clock_timestamp()-interval '30 days'
      AND (NOT(p_selection?'tag') OR a.misconception=p_selection->>'tag')
    ))
    ORDER BY seen.last_seen NULLS FIRST, q.id LIMIT lim) x;
  IF ids IS NULL THEN RAISE EXCEPTION 'empty_pool' USING ERRCODE='PW013'; END IF;
 END IF;
 PERFORM 1 FROM public.questions q WHERE q.id::text=ANY(ids) ORDER BY q.id FOR SHARE;
 -- Core repeats authorization/publication/content checks and fingerprints incoming params before replay.
 SELECT jsonb_agg(jsonb_build_object('item_delivery_id',s.item_delivery_id,'item_id',s.item_id,'body',s.body,
  'options',(SELECT jsonb_agg(jsonb_build_object('text',o.value->>'text') ORDER BY o.ordinality) FROM jsonb_array_elements(s.options) WITH ORDINALITY o(value,ordinality))) ORDER BY s.ordinality) INTO rows
 FROM pathways_evidence.serve_items(p_member,p_track,ids,p_request::text,'practice',p_request::text,p_route,p_selection,p_version) WITH ORDINALITY s;
 IF coalesce((p_selection->>'timed')::boolean,false) THEN
  INSERT INTO pathways_evidence.learner_timed_session(member_id,request_key,started_at,deadline_at)
  SELECT p_member,p_request,t,t+interval '10 minutes' FROM (SELECT clock_timestamp() t) stamp ON CONFLICT DO NOTHING;
  SELECT * INTO timing FROM pathways_evidence.learner_timed_session WHERE member_id=p_member AND request_key=p_request;
  RETURN jsonb_build_object('session_id',p_request,'deliveries',rows,'started_at',timing.started_at,'deadline_at',timing.deadline_at,'server_now',clock_timestamp());
 END IF;
 RETURN jsonb_build_object('session_id',p_request,'deliveries',rows);
END $function$
;
CREATE FUNCTION public.learning_item_not_mapped(p_item bigint) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT NOT EXISTS(SELECT 1 FROM pathways_loop.version_item WHERE item_id=p_item) $$;
REVOKE ALL ON FUNCTION public.learning_item_not_mapped(bigint) FROM PUBLIC;GRANT EXECUTE ON FUNCTION public.learning_item_not_mapped(bigint) TO authenticated;
CREATE POLICY learning_reserved_raw_exclusion ON public.questions AS RESTRICTIVE FOR SELECT TO authenticated USING(public.learning_item_not_mapped(id));
COMMIT;