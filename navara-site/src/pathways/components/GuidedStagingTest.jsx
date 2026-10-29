// PRIVATE STAGING SOFTWARE TEST ONLY. Synthetic Tier-1 engineering verification
// of the bcba-program edge function on the STAGING project. Not reviewed exam
// teaching; no learning benefit claimed. This component only ever runs on the
// isolated staging-test branch preview, never production.
import React,{useEffect,useRef,useState}from'react';
import AppNav from'./AppNav';
import{useRequireUser}from'./useRequireUser';
import{getClient}from'../lib/db';

const ENDPOINT='https://ndxdgiwjccaakpvxkkqu.supabase.co/functions/v1/bcba-program';
const ORIGIN_FALLBACK='https://navarabehavioralgroup.com';

function FigureChart({pin}){
 if(!pin)return null;
 const rec=pin.record||[];
 const W=390,rowH=28,padL=118,padR=44,H=Math.max(60,rec.length*rowH+34);
 const max=Math.max(...rec.map(r=>r.rate_per_minute),0.1);
 return <figure className="guided-figure" aria-label={pin.alt}>
  <svg viewBox={`0 0 ${W} ${H}`} width={W} role="img" aria-label={pin.alt} style={{maxWidth:'100%',height:'auto',background:'#fff',border:'1px solid #d5e0e4',borderRadius:8}}>
   <text x={10} y={18} fontSize={11} fill="#234466">Rate per minute by session</text>
   {rec.map((r,i)=>{const y=30+i*rowH;const bw=(W-padL-padR)*(r.rate_per_minute/max);
    return <g key={r.session}>
     <text x={padL-6} y={y+13} fontSize={10} textAnchor="end" fill="#234466">{`S${r.session}: ${r.count} in ${r.observed_minutes} min`}</text>
     <rect x={padL} y={y+2} width={bw} height={rowH-10} fill="#2f5d8a"/>
     <text x={padL+bw+4} y={y+13} fontSize={10} fill="#234466">{r.rate_per_minute}/min</text>
    </g>})}
  </svg>
  <figcaption style={{fontSize:12,color:'#456',marginTop:4}}>{pin.alt}</figcaption>
 </figure>
}

export default function GuidedStagingTest(){
 const user=useRequireUser();
 const[state,setState]=useState(null),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const[view,setView]=useState({kind:'loading'});
 const lastAction=useRef(null);
 async function token(){const sb=await getClient();const{data}=await sb.auth.getSession();return data.session?.access_token;}
 async function call(action,payload,reuseNonce){
  const nonce=reuseNonce&&lastAction.current?.nonce?lastAction.current.nonce:crypto.randomUUID();
  lastAction.current={nonce,action,payload};
  const bearer=await token();if(!bearer)throw Error('Sign in to continue.');
  const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+bearer},body:JSON.stringify({nonce,action,payload})});
  const body=await res.json().catch(()=>({}));
  if(!res.ok){const e=Error(body.error||'This action could not be confirmed. Your saved answers are unchanged.');e.retryable=res.status===409;throw e;}
  return body;
 }
 async function run(action,payload={}){if(busy)return;setBusy(true);setErr('');
  try{const r=await call(action,payload);interpret(action,r);}
  catch(e){setErr(e.message+(e.retryable?' Retry the same action.':''));}
  finally{setBusy(false);}}
 async function retryLast(){if(!lastAction.current||busy)return;setBusy(true);setErr('');
  try{const{nonce,action,payload}=lastAction.current;const r=await call(action,payload,true);interpret(action,r);}
  catch(e){setErr(e.message+(e.retryable?' Retry the same action.':''));}
  finally{setBusy(false);}}
 function interpret(action,r){
  if(r.teachingStep)setView({kind:'teaching',...r.teachingStep});
  else if(r.teachingFeedback)setView({kind:'feedback',...r.teachingFeedback});
  else if(r.delivery)setView({kind:'practice',...r.delivery});
  else if(r.receipt)setView({kind:'receipt',...r.receipt});
  else if(r.next?.kind==='teaching'){run('open_next');return;}
  else setView({kind:'status',data:r});
 }
 useEffect(()=>{if(!user)return;(async()=>{try{const r=await call('status',{});setState(r);
  if(r.delivery)setView({kind:'practice',...r.delivery});
  else if(r.next?.kind)setView({kind:'status',data:r});
  else setView({kind:'status',data:r});
 }catch(e){setErr(e.message)}})();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[user]);
 if(!user)return <section className="section"><div className="wrap" style={{maxWidth:780}}><p role="status">Checking your sign-in...</p></div></section>;
 const offer=state?.curriculumOffer;
 const hist=state?.history?.length??0;
 return <><AppNav/><section className="section" style={{paddingTop:24}}><div className="wrap" style={{maxWidth:780}}>
  <aside className="thread-test-note">Private staging software test. Synthetic engineering content (Tier-1 C-rate verification), not reviewed exam teaching. No learning benefit is claimed.</aside>
  <span className="eyebrow">Guided pathway - staging verification</span>
  <h1>Rate per minute</h1>
  {err&&<div role="alert" className="panel"><p>{err}</p>{lastAction.current&&<button className="btn btn-navy" disabled={busy} onClick={retryLast}>Retry the same action</button>}</div>}
  {view.kind==='loading'&&<p role="status">Loading your saved session...</p>}
  {view.kind==='status'&&<div className="panel">
   {offer?<>
    <p>Your chosen lesson is ready: <strong>{offer.title||'Rate per minute'}</strong>.</p>
    <p>Two short teaching steps with a graph, then one practice question with feedback. Your checked answers stay saved.</p>
    <button className="btn btn-navy" disabled={busy} onClick={()=>run('continue_curriculum',{catalogModuleId:offer.catalogModuleId,catalogContentVersion:offer.catalogContentVersion,sequenceVersion:offer.sequenceVersion,manifestVersion:offer.manifestVersion})}>Start the lesson</button>
   </>:<>
    <p>{view.data?.next?.kind?'A step is in progress.':'No lesson offer is available right now.'} {hist>0?`Saved checked answers: ${hist}.`:''}</p>
    {view.data?.next?.kind&&<button className="btn btn-navy" disabled={busy} onClick={()=>run('open_next')}>Continue</button>}
   </>}
  </div>}
  {view.kind==='teaching'&&<div className="panel">
   <h2>Teaching step {view.step+1} of {view.totalSteps}</h2>
   <p>{view.evidence}</p>
   <FigureChart pin={view.figure}/>
   <p>{view.learnerTask}</p>
   <div className="thread-options">{(view.alternatives||[]).map((t,i)=><button key={i} type="button" className="btn btn-ghost" disabled={busy} onClick={()=>run('teaching_commit',{choice:i})}>{t}</button>)}</div>
  </div>}
  {view.kind==='feedback'&&<div className="panel">
   <h2>{view.defensible?'That choice is defensible.':'Not the strongest choice.'}</h2>
   <FigureChart pin={view.figure}/>
   <p>{view.feedback}</p>
   <button className="btn btn-navy" disabled={busy} onClick={()=>run('open_next')}>{view.lastStep?'Open the practice question':'Next teaching step'}</button>
  </div>}
  {view.kind==='practice'&&<fieldset className="panel">
   <legend>Practice with feedback</legend>
   <p>{view.body}</p>
   <FigureChart pin={view.figure}/>
   <div className="thread-options">{(view.options||[]).map((o,i)=><button key={i} type="button" className="btn btn-ghost" disabled={busy} onClick={()=>run('answer',{deliveryId:view.id,chosen:i})}>{o.text}</button>)}</div>
   <p>This practice is recorded as helped practice, not an independent check.</p>
  </fieldset>}
  {view.kind==='receipt'&&<div className="panel">
   <h2>{view.correct?'Recorded correct.':'Recorded incorrect.'}</h2>
   <p>Server-confirmed at {view.serverAnsweredAt?new Date(view.serverAnsweredAt).toLocaleString():'the server'}.</p>
   {(view.feedback?.options||[]).map((o,i)=><p key={i}>{i===view.feedback.correct_index?'Correct answer: ':''}{o.text}{o.explanation?' - '+o.explanation:''}</p>)}
   <button className="btn btn-navy" disabled={busy} onClick={()=>run('finish_episode')}>Finish</button>
  </div>}
  <p className="thread-footnote">TIER-1 SYNTHETIC STAGING VERIFICATION - NOT SME OR OWNER CONTENT APPROVAL. Saved answers, taught examples and checks stay separate.</p>
 </div></section></>;
}
