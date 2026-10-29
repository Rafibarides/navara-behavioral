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
 if(!pin||!pin.record||!pin.record.length)return null;
 const rec=pin.record;
 const W=390,H=620;
 const Panel=({title,yLabel,yMax,yStep,values,fmt,labels,color,y0})=>{
  const padL=52,padR=16,padT=34,padB=44,pw=W-padL-padR,ph=220;
  const n=rec.length;
  const x=i=>padL+(n===1?pw/2:(pw*(rec[i].session-1)/(rec[n-1].session-1)));
  const y=v=>y0+padT+ph-(v/yMax)*ph;
  const ticks=[];for(let v=0;v<=yMax+1e-9;v+=yStep)ticks.push(v);
  const pts=rec.map((r,i)=>x(i)+','+y(values(r))).join(' ');
  return <g>
   <text x={W/2} y={y0+18} fontSize={15} textAnchor="middle" fill="#222">{title}</text>
   {ticks.map(v=><g key={v}><line x1={padL} y1={y(v)} x2={W-padR} y2={y(v)} stroke="#e3e3e3" strokeWidth={1}/><text x={padL-8} y={y(v)+4} fontSize={11} textAnchor="end" fill="#333">{fmt(v)}</text></g>)}
   <line x1={padL} y1={y0+padT} x2={padL} y2={y0+padT+ph} stroke="#888"/><line x1={padL} y1={y0+padT+ph} x2={W-padR} y2={y0+padT+ph} stroke="#888"/>
   <text x={20} y={y0+padT+ph/2} fontSize={12} fill="#333" transform={`rotate(-90 20 ${y0+padT+ph/2})`} textAnchor="middle">{yLabel}</text>
   {rec.map((r,i)=><text key={r.session} x={x(i)} y={y0+padT+ph+18} fontSize={12} textAnchor="middle" fill="#333">{r.session}</text>)}
   <text x={padL+pw/2} y={y0+padT+ph+38} fontSize={13} textAnchor="middle" fill="#333">Observation session</text>
   <polyline points={pts} fill="none" stroke={color} strokeWidth={2}/>
   {rec.map((r,i)=><circle key={r.session} cx={x(i)} cy={y(values(r))} r={5} fill={color}/>)}
   {labels&&rec.map((r,i)=><text key={'l'+r.session} x={x(i)} y={y(values(r))-12} fontSize={12} textAnchor="middle" fill={color}>{values(r)}</text>)}
  </g>;
 };
 const maxC=Math.max(...rec.map(r=>r.count),0.1),maxR=Math.max(...rec.map(r=>r.rate_per_minute),0.1);
 const cMax=Math.ceil(maxC/3)*3,rMax=Math.ceil(maxR/0.4)*0.4;
 return <figure className="guided-figure" aria-label={pin.alt}>
  <svg viewBox={`0 0 ${W} ${H}`} width={W} role="img" aria-label={pin.alt} style={{maxWidth:'100%',height:'auto',background:'#fff',border:'1px solid #d5e0e4',borderRadius:8}}>
   <Panel title="Total events in each window" yLabel="Call-outs (count)" yMax={cMax} yStep={cMax/6} values={r=>r.count} fmt={v=>v} labels={false} color="#4a4a4a" y0={0}/>
   <Panel title="Events per observed minute" yLabel="Call-outs per minute" yMax={rMax} yStep={rMax/4} values={r=>r.rate_per_minute} fmt={v=>v.toFixed(1)} labels={true} color="#2f7d5d" y0={310}/>
  </svg>
  <figcaption style={{fontSize:12,color:'#456',marginTop:4}}>{pin.alt}</figcaption>
 </figure>;
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
  else{(async()=>{try{const s=await call('status',{});setState(s);setView({kind:'status',data:s});}catch(e){setErr(e.message)}})();}
 }
 useEffect(()=>{if(!user)return;(async()=>{try{const r=await call('status',{});setState(r);
  if(r.delivery)setView({kind:'practice',...r.delivery});
  else if(r.next?.kind==='teaching'){const r2=await call('open_next',{});interpret('open_next',r2);}
  else setView({kind:'status',data:r});
 }catch(e){setErr(e.message)}})();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[user]);
 if(!user)return <section className="section"><div className="wrap" style={{maxWidth:780}}><p role="status">Checking your sign-in...</p></div></section>;
 const offer=state?.curriculumOffer;
 const hist=state?.history?.length??0;
 return <><AppNav/><section className="section learning-thread" style={{paddingTop:24}}><div className="wrap" style={{maxWidth:780}}>
  <aside className="thread-test-note">Private staging software test. Synthetic engineering content (Tier-1 C-rate verification), not reviewed exam teaching. No learning benefit is claimed.</aside>
  <span className="eyebrow">Guided pathway - staging verification</span>
  <h1>Rate per minute</h1>
  {err&&<div role="alert" className="panel"><p>{err}</p>{lastAction.current&&<button className="btn btn-navy" disabled={busy} onClick={retryLast}>Retry the same action</button>}</div>}
  {view.kind==='loading'&&<p role="status">Loading your saved session...</p>}
  {view.kind==='status'&&<div className="panel">
   {offer?<>
    <p>Your chosen lesson is ready: <strong>{offer.title||'Rate per minute'}</strong>.</p>
    <p>Two short teaching steps with a graph, then one practice question with feedback. Your checked answers stay saved.</p>
    <p className="thread-evidence" style={{background:'#f4f7f5',padding:12,borderRadius:8,textAlign:'left'}}><strong>Scope: </strong>Simulated instructional records, not a real person or treatment recommendation. All listed observation windows are fully and continuously observed. A call-out is an audible utterance without being called on, separated from another utterance by at least 2 seconds of silence. Same observer rule, classroom activity and recording procedure across sessions; representativeness outside these windows is not established.</p>
    <button className="btn btn-navy" disabled={busy} onClick={()=>run('continue_curriculum',{catalogModuleId:offer.catalogModuleId,catalogContentVersion:offer.catalogContentVersion,sequenceVersion:offer.sequenceVersion,manifestVersion:offer.manifestVersion})}>Start the lesson</button>
   </>:<>
    <p>No lesson offer is available for this test account right now.</p>
    <p>Saved checked answers: {hist}.</p>
    {hist>0&&<ul style={{textAlign:'left',fontSize:14,lineHeight:1.6}}>{(state?.history||[]).map(h=><li key={h.receiptId}>{h.phase==='helped_practice'?'Helped practice (guided, not an independent check)':'Blueprint check'}{': recorded '}{h.correct?'correct':'incorrect'}{h.answeredAt?`, server-confirmed ${new Date(h.answeredAt).toLocaleString()}`:''}.</li>)}</ul>}
    {user.id==='1580a47a-5798-449f-b448-35a65da360e4'&&<p style={{fontSize:13,color:'#7a4d00'}}>Note: this account's saved session count was manually reset during verification, so it may read 0 of 12 even though saved history exists. The history list on this page is the authoritative record. Further steps for this account are paused; no Continue action is offered.</p>}
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
   <h2>{view.chosen===view.defensible?'That choice is defensible.':'Not the strongest choice.'}</h2>
   <FigureChart pin={view.figure}/>
   <p style={{textAlign:'left'}}><strong>Your pick: </strong>{view.alternatives?.[view.chosen]||''}</p>
   <p style={{textAlign:'left'}}>{view.feedback?.[String(view.chosen)]||''}</p>
   {view.chosen!==view.defensible&&<p style={{textAlign:'left'}}><strong>The defensible choice: </strong>{view.alternatives?.[view.defensible]||''}</p>}
   {view.chosen!==view.defensible&&<p style={{textAlign:'left'}}>{view.feedback?.[String(view.defensible)]||''}</p>}
   <button className="btn btn-navy" disabled={busy} onClick={()=>run('open_next')}>{view.lastStep?'Open the practice question':'Next teaching step'}</button>
  </div>}
  {view.kind==='practice'&&<fieldset className="panel" style={{padding:'20px 24px'}}>
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
