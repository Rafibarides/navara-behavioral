import {completedLessonReview,completedLessonList} from './completed-lesson-review.mjs';
import {reviewHTTP,withReviewReads} from './review-http.mjs';
// OFF preparation only. Registry intentionally empty until exact reviewed pack exists.
import {BCBA_QUALIFIED_BUNDLES} from './generated-bcba-bundle.mjs';
import {randomUUID,createHash} from 'node:crypto';
import {bcbaActivation,assertRuntimeRole} from './bcba-entry.mjs';
import {createProgram,policyHash} from './shared-runtime/lib/program.mjs';
import {programRepository} from './shared-runtime/lib/postgres-repository.mjs';
import {bankContent} from './shared-runtime/lib/bank-content.mjs';
import {protectedTransport} from './shared-runtime/lib/protected-transport.mjs';
import {programHTTP} from './shared-runtime/lib/http-handler.mjs';
import {catalogProvider} from './shared-runtime/lib/private-catalog-provider.mjs';
export const BCBA_RELEASE=Object.freeze({enabled:true,qualified:true,defaultPolicyId: 'bcba-lessons-policy-v43'});
export const BCBA_BUNDLES=Object.freeze(BCBA_QUALIFIED_BUNDLES);
export function bcbaComposition({sql,authenticate,registry=BCBA_BUNDLES,release=BCBA_RELEASE}){
 const loadServing=async(tx,id)=>{
  const rows=await tx`select p.id,p.policy,p.content_manifest_version,m.version,m.manifest from pathways_bcba.policy_version p join pathways_bcba.content_manifest m on m.version=p.content_manifest_version where p.id=${id} and p.status='approved' and p.withdrawn_at is null and p.authority_ref is not null and not p.synthetic and m.status='approved' and m.withdrawn_at is null and m.review_evidence is not null and not m.synthetic and p.policy->>'track'='bcba'`;
  if(rows.length!==1)throw Error('bcba_serving_unavailable');const r=rows[0];
  if(r.policy.id!==id||r.manifest.track!=='bcba'||r.version!==r.content_manifest_version)throw Error('bcba_pin_mismatch');
  if(r.policy.itemReturn?.enabled===true||!Array.isArray(r.manifest.contrasts)||r.manifest.contrasts.length||!r.manifest.bankMixUp||typeof r.manifest.bankMixUp.items!=='object'||r.manifest.bankMixUp.items===null||Array.isArray(r.manifest.bankMixUp.items)||Object.keys(r.manifest.bankMixUp.items).length)throw Error('bcba_lessons_only_required');
  const entries=registry.filter(b=>b.policyId===id&&b.manifestVersion===r.version&&b.track==='bcba');
  if(entries.length!==1)throw Error('bcba_bundle_not_unique');const b=entries[0];
  for(const n of ['catalog','binding'])if(createHash('sha256').update(b[n+'Bytes']).digest('hex')!==b[n+'Sha'])throw Error('bcba_bundle_bytes_mismatch');
  const catalog=JSON.parse(b.catalogBytes.toString('utf8')),bindings=JSON.parse(b.bindingBytes.toString('utf8'));
  const provider=catalogProvider({catalog,bindings,figures:b.figures,track:'bcba'});
  return {policy:r.policy,manifest:r.manifest,manifestVersion:r.version,provider};
 };
 const program=bcbaActivation({sql,loadServing,defaultPolicyId:release.defaultPolicyId,policyHash,makeProgram:(s,bound,requestNow)=>createProgram({repository:programRepository(bound),content:bankContent({catalogProvider:s.provider,track:'bcba'}),transport:protectedTransport({track:'bcba'}),policy:s.policy,manifest:{payload:s.manifest,version:s.manifestVersion},track:'bcba',clock:()=>requestNow,uuid:randomUUID})});
 const guard=async(member,c)=>sql.begin(async tx=>{await assertRuntimeRole(tx);const r=await tx`select pathways_bcba.request_guard(${member}::uuid,${c.nonce}::uuid,${c.action},${tx.json(c.payload)}) ok`;return r[0]?.ok===true;});
 const qualificationAuthenticate=async auth=>{const i=await authenticate(auth);return i?.track==='bcba'&&i.plan==='guided'?i:null};
 const figureMap=new Map();for(const bundle of registry)for(const [sha,bytes]of bundle.figures)figureMap.set(sha,bytes);
 const reviewOptions={sql,assertRuntimeRole,loadServing,figures:figureMap};
 const readReview=completedLessonReview(reviewOptions),listReviews=completedLessonList(reviewOptions);
 const readHandler=reviewHTTP({authenticate:qualificationAuthenticate,readReview,listReviews,available:async()=>sql.begin(async tx=>{await tx`set transaction read only`;await assertRuntimeRole(tx);const r=await tx`select enabled,approved_evidence from pathways_bcba.release_config where id=true`;return r.length===1&&r[0].enabled===true&&!!r[0].approved_evidence}),enabled:release.enabled===true&&release.qualified===true});
 const handler=programHTTP({program,authenticate:qualificationAuthenticate,guard,origin:'https://navarabehavioralgroup.com',extraOrigins:[],enabled:release.enabled===true&&release.qualified===true});
 const off=programHTTP({program,authenticate:qualificationAuthenticate,guard,origin:'https://navarabehavioralgroup.com',extraOrigins:[],enabled:false});
 const normalHandler=async req=>{
  const o=req.headers.get('origin');
  if((o&&o!=='https://navarabehavioralgroup.com')||req.method!=='POST')return off(req);
  if(release.enabled!==true||release.qualified!==true)return off(req);
  // Shared global kill switch is read before auth or nonce guard, never mutated.
  // Transaction lock_release_enabled remains the final same-transaction assertion.
  try{const r=await sql.begin(async tx=>{await assertRuntimeRole(tx);return tx`select enabled,approved_evidence from pathways_bcba.release_config where id=true`;});
   if(r.length!==1||r[0].enabled!==true||!r[0].approved_evidence)return off(req);
  }catch{return off(req);}
  return handler(req);
 };
 return withReviewReads({readHandler,programHandler:normalHandler});

}
