// Candidate only. Read historical teaching already shown to this member.
// No command ledger, exposure insert, response receipt, credit or state change.
import {createHash} from 'node:crypto';
import {validateFigurePin,verifyFigureBytes} from './shared-runtime/lib/figure-pin.mjs';
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(canon(v))).digest('hex');
const fail=()=>{throw Error('completed_lesson_review_unavailable')};
export function completedLessonSnapshot({memberId,episodeId,archive,exposures,policy,manifest,figures}){
 if(!archive||archive.member_id!==memberId||archive.id!==episodeId)fail();
 const e=archive.payload;
 if(!e||e.id!==episodeId||e.closed!==true||e.closeReason!=='curriculum_completed'||e.origin!=='explicit_choice'||!e.catalogModuleId||e.contrastId!=='catalog-'+e.catalogModuleId)fail();
 if(policy?.track!=='bcba'||manifest?.track!=='bcba'||policy.contentManifestVersion!==manifest.version||e.manifestVersion!==manifest.version)fail();
 const section=manifest.catalog,entry=section?.modules?.find(x=>x.moduleId===e.catalogModuleId);
 if(!entry||section.sequenceVersion!==e.sequenceVersion||entry.order!==e.catalogOrder||entry.catalogContentVersion!==e.catalogContentVersion)fail();
 if(!Array.isArray(exposures)||!exposures.length)fail();
 const matching=exposures.filter(x=>x.member_id===memberId&&x.episode_id===episodeId&&x.content_version===e.catalogContentVersion);
 if(matching.length!==exposures.length)fail();
 const first=matching[0]?.payload?.selection,interaction=first?.interaction;
 if(!interaction||!Array.isArray(interaction.steps)||!interaction.steps.length||interaction.steps.length>20)fail();
 const hash=digest(interaction);
 if(e.catalogContentVersion!==e.catalogModuleId+'@'+hash)fail();
 for(const x of matching){const p=x.payload,s=p?.selection;if(p.episodeId!==episodeId||(p.step!==undefined&&(!Number.isSafeInteger(p.step)||p.step<0||p.step>=interaction.steps.length))||s?.role!=='teaching'||s.track!=='bcba'||s.version!==e.catalogContentVersion||s.contentHash!==hash||s.contrastId!==e.contrastId||s.manifestVersion!==e.manifestVersion||digest(s.interaction)!==hash)fail()}
 // A completed archive alone is insufficient. Every step must have an actual
 // recorded teaching exposure; historical payload is used, not today's lesson.
 if(new Set(matching.filter(x=>x.payload.step!==undefined).map(x=>x.payload.step)).size!==interaction.steps.length)fail();
 for(const s of interaction.steps){if(s.figure&&(!validateFigurePin(s.figure)||!verifyFigureBytes(s.figure,figures.get(s.figure.sha256))))fail()}
 return {readOnly:true,episodeId,title:entry.title,completedAt:e.closedAt,catalogContentVersion:e.catalogContentVersion,manifestVersion:e.manifestVersion,notice:'Review of your completed lesson. This does not record new answers, practice, completion or mastery.',steps:interaction.steps};
}
async function reviewContext(tx,identity,assertRuntimeRole,loadServing){
 await tx`set transaction isolation level repeatable read read only`;
 await assertRuntimeRole(tx);
 const access=await tx`select pathways_bcba.completed_lesson_review_access(${identity.id}::uuid) ok`;if(access[0]?.ok!==true)fail();
 const release=await tx`select true ok from pathways_bcba.release_config where id=true and enabled=true and approved_evidence is not null`;if(release[0]?.ok!==true)fail();
 const states=await tx`select s.policy_version,p.policy->>'track' track from pathways_bcba.program_state s join pathways_bcba.policy_version p on p.id=s.policy_version where s.member_id=${identity.id}::uuid and s.withdrawn_at is null and p.status='approved' and p.withdrawn_at is null and not p.synthetic`;
 if(states.length!==1||states[0].track!=='bcba')fail();
 const serving=await loadServing(tx,states[0].policy_version);
 if(serving.policy.track!=='bcba'||serving.manifest.track!=='bcba')fail();
 return serving;
}
const validIdentity=identity=>{if(identity?.track!=='bcba'||identity.plan!=='guided'||!identity.id)fail()};
export function completedLessonReview({sql,assertRuntimeRole,loadServing,figures}){
 return async(identity,episodeId)=>{
  validIdentity(identity);
  if(typeof episodeId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(episodeId))fail();
  return sql.begin(async tx=>{
   const serving=await reviewContext(tx,identity,assertRuntimeRole,loadServing);
   const archive=await tx`select id::text,member_id::text,payload from pathways_bcba.episode_archive where id=${episodeId}::uuid and member_id=${identity.id}::uuid`;
   if(archive.length!==1)fail();
   const exposures=await tx`select member_id::text,episode_id::text,content_version,payload from pathways_bcba.teaching_exposure where member_id=${identity.id}::uuid and episode_id=${episodeId}::uuid order by at,id`;
   return completedLessonSnapshot({memberId:identity.id,episodeId,archive:archive[0],exposures,policy:serving.policy,manifest:serving.manifest,figures});
  });
 };
}
// Whole list uses ONE readonly repeatable snapshot and batch reads. No per-row
// transaction or arbitrary curriculum policy threshold. HTTP caps output bytes.
export function completedLessonList({sql,assertRuntimeRole,loadServing,figures}){
 return async identity=>{
  validIdentity(identity);
  return sql.begin(async tx=>{
   const serving=await reviewContext(tx,identity,assertRuntimeRole,loadServing);
   const archives=await tx`select id::text,member_id::text,payload from pathways_bcba.episode_archive where member_id=${identity.id}::uuid and payload->>'closeReason'='curriculum_completed' order by at desc,id`;
   const exposures=await tx`select member_id::text,episode_id::text,content_version,payload from pathways_bcba.teaching_exposure where member_id=${identity.id}::uuid order by at,id`;
   const out=[];for(const archive of archives){try{const x=completedLessonSnapshot({memberId:identity.id,episodeId:archive.id,archive,exposures:exposures.filter(e=>e.episode_id===archive.id),policy:serving.policy,manifest:serving.manifest,figures});out.push({episodeId:x.episodeId,title:x.title,catalogContentVersion:x.catalogContentVersion})}catch{out.push({episodeId:archive.id,unavailable:true,notice:'This completed lesson cannot be reviewed right now.'})}}
   return out;
  });
 };
}
