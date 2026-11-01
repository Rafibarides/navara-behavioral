import {initialLessonState} from './shared-runtime/lib/opt-in-activation.mjs';
// CANDIDATE ONLY. No deployment, no RBT registry, no approval inferred.
// Separate BCBA lane; same transaction and existing shared ledgers preserved.
export async function assertRuntimeRole(tx){
 const r=await tx`select current_user as role,rolsuper,rolbypassrls,rolcreaterole from pg_roles where rolname=current_user`;
 if(r.length!==1||r[0].role!=='bcba_program_runtime'||r[0].rolsuper!==false||r[0].rolbypassrls!==false||r[0].rolcreaterole!==false)throw Error('runtime_identity_unavailable');
}
export function bcbaActivation({sql,loadServing,makeProgram,policyHash,defaultPolicyId}){
 if(!defaultPolicyId)throw Error('explicit_bcba_default_required');
 return {async run(identity,command){
  if(identity?.track!=='bcba'||identity?.plan!=='guided'||!identity?.id)throw Error('guided_bcba_required');
  return sql.begin(async tx=>{
   await assertRuntimeRole(tx);
   await tx`select pg_advisory_xact_lock(hashtextextended('bcba-program:'||${identity.id},0))`;
   const access=await tx`select pathways_bcba.lock_member_access(${identity.id}::uuid,'bcba') ok`;
   if(access[0]?.ok!==true)throw Error('guided_bcba_required');
   const release=await tx`select pathways_bcba.lock_release_enabled() ok`;
   if(release[0]?.ok!==true)throw Error('release_unavailable');
   const rows=await tx`select s.policy_version,s.withdrawn_at,p.policy->>'track' as track from pathways_bcba.program_state s left join pathways_bcba.policy_version p on p.id=s.policy_version where s.member_id=${identity.id}::uuid for update of s`;
   if(rows.length>1)throw Error('enrollment_not_unique');
   const old=rows[0];
   // member-only PK: never rewrite or reset a foreign-lane pin.
   if(old&&old.track!=='bcba')throw Error('existing_other_track_history_retained');
   if(old?.withdrawn_at)throw Error('enrollment_withdrawn');
   if(!old&&command.action==='status')return {enrollmentRequired:true,track:'bcba'};
   if(!old&&command.action!=='enroll_lessons')throw Error('program_enrollment_required');
   if(!['status','enroll_lessons','start_session','open_next','answer','accept_focus','decline_focus','finish_episode','finish_session','continue_curriculum','teaching_commit'].includes(command.action))throw Error('bcba_action_unavailable');
   const serving=await loadServing(tx,old?.policy_version||defaultPolicyId);
   if(serving.policy?.track!=='bcba'||serving.manifest?.track!=='bcba')throw Error('bcba_serving_track_mismatch');
   const p=await tx`select pathways_bcba.lock_policy_assert(${serving.policy.id},${policyHash(serving.policy)},${tx.json(serving.policy)}) ok`;
   if(p[0]?.ok!==true)throw Error('policy_changed');
   const m=await tx`select pathways_bcba.lock_manifest_assert(${serving.manifestVersion},${tx.json(serving.manifest)},${serving.policy.id},false) ok`;
   if(m[0]?.ok!==true)throw Error('manifest_changed');
   if(!old){
    const now=await tx`select clock_timestamp()::text now`;
    const state=initialLessonState(identity.id,serving.policy,now[0].now);
    await tx`insert into pathways_bcba.program_state(member_id,policy_version,state,enrollment_evidence) values(${identity.id}::uuid,${serving.policy.id},${tx.json(state)},${'Authenticated explicit BCBA lessons enrollment; request '+command.nonce})`;
   }
   const bound=(p,...v)=>tx(p,...v);bound.json=v=>tx.json(v);bound.begin=fn=>fn(tx);
   const requestNow=await tx`select clock_timestamp()::text now`;
   return makeProgram(serving,bound,requestNow[0].now).run(identity,command.action==='enroll_lessons'?{...command,action:'status',payload:{}}:command);
  });
 }};
}
export function offByDefaultHandler({enabled=false,qualified=false,handler}){
 // Both are immutable server inputs. Request body cannot turn the lane on.
 return req=>enabled===true&&qualified===true?handler(req):Promise.resolve(new Response(JSON.stringify({error:'bcba_program_unavailable'}),{status:503,headers:{'Content-Type':'application/json'}}));
}
