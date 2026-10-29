// PRIVATE STAGING SOFTWARE TEST ONLY. Synthetic Tier-1 engineering verification
// of the bcba-program edge function on the STAGING project. Not reviewed exam
// teaching; no learning benefit claimed. This component only ever runs on the
// isolated staging-test branch preview, never production.
import React,{useEffect,useRef,useState}from'react';
import AppNav from'./AppNav';
import{useRequireUser}from'./useRequireUser';
import{getClient}from'../lib/db';
import GUIDED_FIGURES from '../data/guidedFigures.json';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './guidedLessonText.css';

// Track-scoped serving: each track is served by its OWN edge-function
// instance (one approved policy per function; the engine reads the track from
// that policy). The member's profile track picks the endpoint; an unknown or
// missing track fails closed - never silently served from the wrong lane.
const TRACK_ENDPOINTS={
 bcba:import.meta.env.VITE_GUIDED_PRODUCTION==='true'?null:'https://ndxdgiwjccaakpvxkkqu.supabase.co/functions/v1/bcba-program',
 rbt:import.meta.env.VITE_GUIDED_PRODUCTION==='true'?'https://tvvoauvtrgziwxtzlluq.supabase.co/functions/v1/rbt-program':'https://ndxdgiwjccaakpvxkkqu.supabase.co/functions/v1/rbt-program',
};
const ORIGIN_FALLBACK='https://navarabehavioralgroup.com';

function FigureChart({pin}){
 const src=pin&&GUIDED_FIGURES[pin.sha256];
 if(!pin)return null;
 if(!src)return <p role="alert">This figure could not be confirmed. Please reload before continuing.</p>;
 return <figure className="guided-figure"><img src={src} alt={pin.alt} width={pin.width} height={pin.height} style={{maxWidth:'100%',height:'auto',background:'#fff',border:'1px solid #d5e0e4',borderRadius:8}}/><figcaption style={{fontSize:12,color:'#456',marginTop:4}}>{pin.alt}</figcaption></figure>;
}

export default function GuidedPathway(){
 const user=useRequireUser();
 const SYNTHETIC=import.meta.env.VITE_GUIDED_PRODUCTION!=='true'; // content qualification flag: stays true until reviewed content is bound; never strip without qualified content
 const[state,setState]=useState(null),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const[endpoint,setEndpoint]=useState(null);const endpointRef=useRef(null);endpointRef.current=endpoint;
 const[view,setView]=useState({kind:'loading'});
 const lastAction=useRef(null);
 async function token(){const sb=await getClient();const{data}=await sb.auth.getSession();return data.session?.access_token;}
 async function call(action,payload,reuseNonce){
  const nonce=reuseNonce&&lastAction.current?.nonce?lastAction.current.nonce:crypto.randomUUID();
  if(action!=='status')lastAction.current={nonce,action,payload};
  const bearer=await token();if(!bearer)throw Error('Sign in to continue.');
  const ep=endpointRef.current;if(!ep)throw Error('Your practice track is still loading. Reload to try again.');
  const res=await fetch(ep,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+bearer},body:JSON.stringify({nonce,action,payload})});
  const body=await res.json().catch(()=>({}));
  if(!res.ok){const e=Error(body.error||'This action could not be confirmed. Your saved answers are unchanged.');e.retryable=res.status===409;throw e;}
  return body;
 }
 async function run(action,payload={}){if(busy)return;setBusy(true);setErr('');
  try{const r=await call(action,payload);await interpret(action,r);}
  catch(e){setErr(e.message+(e.retryable&&!/retry the same action\.?\s*$/i.test(e.message)?' Retry the same action.':''));}
  finally{setBusy(false);}}
 async function retryLast(){if(!lastAction.current||busy)return;setBusy(true);setErr('');
  try{const{nonce,action,payload}=lastAction.current;const r=await call(action,payload,true);await interpret(action,r);}
  catch(e){setErr(e.message+(e.retryable&&!/retry the same action\.?\s*$/i.test(e.message)?' Retry the same action.':''));}
  finally{setBusy(false);}}
 async function interpret(action,r,depth=0){
  if(r.teachingStep)setView({kind:'teaching',...r.teachingStep});
  else if(r.teachingFeedback)setView({kind:'feedback',...r.teachingFeedback});
  else if(r.delivery)setView({kind:'practice',...r.delivery});
  else if(r.receipt)setView({kind:'receipt',...r.receipt,feedback:r.receipt.feedback?.feedback||r.receipt.feedback,returnInfo:r.returnInfo||null,nextKind:r.next?.kind||null});
  else if((r.next?.kind==='teaching'||r.next?.kind==='helped_practice')&&depth<1){const r2=await call('open_next',{});await interpret('open_next',r2,depth+1);}
  else if(r.next?.kind==='teaching'||r.next?.kind==='helped_practice'){setErr('The next step could not be confirmed. Your saved answers are unchanged. Reload to try again.');}
  else{try{const s=await call('status',{});setState(s);setView({kind:'status',data:s});}catch(e){setErr(e.message)}}
 }
 useEffect(()=>{if(!user)return;(async()=>{try{
  const sb=await getClient();const{data:u}=await sb.auth.getUser();
  const{data:p}=await sb.from('profiles').select('track').eq('id',u.user.id).single();
  const ep=TRACK_ENDPOINTS[p?.track];if(!ep)throw Error('This account does not have a practice track assigned yet.');
  endpointRef.current=ep;setEndpoint(ep); // ref first: call() below reads it in this same tick
  const r=await call('status',{});setState(r);
  if(r.delivery)setView({kind:'practice',...r.delivery});
  else if(r.next?.kind==='teaching'||r.next?.kind==='helped_practice'){const r2=await call('open_next',{});await interpret('open_next',r2);}
  else setView({kind:'status',data:r});
 }catch(e){setErr(e.message)}})();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[user?.id]);
 useEffect(()=>{window.scrollTo(0,0);},[view.kind]);
 if(!user)return <section className="section"><div className="wrap" style={{maxWidth:780}}><p role="status">Checking your sign-in...</p></div></section>;
 if(user.plan!=='guided')return <><AppNav/><section className="section"><div className="wrap" style={{maxWidth:780}}><h1>Guided pathway</h1><p>This experience is part of the Guided plan. Your current plan and practice are unchanged.</p><a className="btn btn-navy" href="/pathways/app/dashboard">Back to dashboard</a></div></section></>;
 const offer=state?.curriculumOffer;
 const hist=state?.history?.length??0;
 // Header truth: only an actual catalog lesson context (offer, resume, teaching,
 // feedback, or helped practice) may show the lesson title. Ordinary blueprint
 // bank practice is generic Guided practice and is labeled as such.
 const lessonTitle=offer?.title||state?.catalogResume?.title||null;
 const inLesson=!!lessonTitle||view.kind==='teaching'||view.kind==='feedback'||(view.kind==='practice'&&view.phase==='helped_practice');
 return <><AppNav/><section className="section learning-thread" style={{paddingTop:24}}><div className="wrap" style={{maxWidth:780}}>
  {SYNTHETIC&&<aside className="thread-test-note">Preview content: this lesson is engineering verification content, not reviewed exam teaching. No learning benefit is claimed.</aside>}
  <span className="eyebrow">Your Guided pathway</span>
  {!SYNTHETIC&&<p>Guided lessons and helped practice. Personalized follow-up checks are not available yet. Lesson completion is not mastery or exam readiness.</p>}
  <h1>{inLesson?(lessonTitle||'Your lesson'):'Guided practice'}</h1>
  {err&&<div role="alert" className="panel"><p>{err}</p>{lastAction.current&&<button className="btn btn-navy" disabled={busy} onClick={retryLast}>Retry the same action</button>}</div>}
  {view.kind==='loading'&&!err&&<p role="status">Loading your saved session...</p>}
  {view.kind==='status'&&<div className="panel">
   {view.data?.enrollmentRequired?<>
    <p>Start your Guided lessons and helped practice. This is included in your current Guided plan. Your other practice and saved answers stay unchanged.</p>
    <button className="btn btn-navy" disabled={busy} onClick={()=>run('enroll_lessons')}>Start Guided lessons</button>
   </>:view.data?.next?.kind==='curriculum_result'?<>
    <p>Your checked answer is saved. One step left: finish the lesson to record it.</p>
    <button className="btn btn-navy" disabled={busy} onClick={()=>run('finish_episode')}>Finish the lesson</button>
   </>:offer?<>
    <p>Your chosen lesson is ready{offer.title?<>: <strong>{offer.title}</strong></>:null}.</p>
    <p>Short teaching steps with a figure, followed by two helped practice questions with feedback. Your checked answers stay saved.</p>
    <p className="thread-evidence" style={{background:'#f4f7f5',padding:12,borderRadius:8,textAlign:'left'}}><strong>Scope: </strong>Simulated instructional records, not a real person or treatment recommendation. Read each lesson's stated conditions and definitions before answering.</p>
    <button className="btn btn-navy" disabled={busy} onClick={()=>run('continue_curriculum',{catalogModuleId:offer.catalogModuleId,catalogContentVersion:offer.catalogContentVersion,sequenceVersion:offer.sequenceVersion,manifestVersion:offer.manifestVersion})}>Start the lesson</button>
   </>:<>
    {hist>0?<p>Your saved answers are shown below. Finishing a lesson records teaching and helped practice, not mastery.</p>:<p>No next lesson is available right now.</p>}
    <p>Saved checked answers: {hist}.</p>
    {hist>0&&<ul style={{textAlign:'left',fontSize:14,lineHeight:1.6}}>{(state?.history||[]).map(h=><li key={h.receiptId}>{h.phase==='helped_practice'?'Helped practice (guided, not an independent check)':'Blueprint check'}{': recorded '}{h.correct?'correct':'incorrect'}{h.answeredAt?`, server-confirmed ${new Date(h.answeredAt).toLocaleString()}`:''}.</li>)}</ul>}

   </>}
  </div>}
  {view.kind==='teaching'&&<div className="panel">
   <h2>Teaching step {view.step+1} of {view.totalSteps}</h2>
   <div className="guided-lesson-text"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{h1:({children})=><h3>{children}</h3>,h2:({children})=><h3>{children}</h3>,h3:({children})=><h4>{children}</h4>,a:({href,children})=><a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,table:({children})=><div className="guided-table-scroll"><table>{children}</table></div>}}>{view.evidence||''}</ReactMarkdown></div>
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
   {view.postAnswerTransfer&&<p style={{textAlign:'left'}}>{view.postAnswerTransfer}</p>}
   <button className="btn btn-navy" disabled={busy} onClick={()=>run('open_next')}>{view.lastStep?'Open the practice question':'Next teaching step'}</button>
  </div>}
  {view.kind==='practice'&&<fieldset className="panel" style={{padding:'20px 24px'}}>
   <legend>Practice with feedback</legend>
   {view.returnMeta?.flag&&<p className="thread-return-flag" style={{background:'#eef4ff',border:'1px solid #b9ccf0',borderRadius:8,padding:'8px 12px',fontSize:14,textAlign:'left'}}>Back again: you missed this one before{view.returnMeta.enqueuedAt?` (first missed ${new Date(view.returnMeta.enqueuedAt).toLocaleDateString()})`:''}. Missed questions come back as practice.</p>}
   <p>{view.body}</p>
   <FigureChart pin={view.figure}/>
   <div className="thread-options">{(view.options||[]).map((o,i)=><button key={i} type="button" className="btn btn-ghost" disabled={busy} onClick={()=>run('answer',{deliveryId:view.id,chosen:i})}>{o.text}</button>)}</div>
   {view.returnMeta?.flag
    ?<p>This is repeat practice of a question you missed before. It never counts as a fresh independent check.</p>
    :view.phase==='helped_practice'
    ?<p>This practice is recorded as helped practice, not an independent check.</p>
    :<p>Your first answer is saved when you commit; feedback appears after.</p>}
  </fieldset>}
  {view.kind==='receipt'&&<div className="panel">
   <h2>{view.correct?'Recorded correct.':'Recorded incorrect.'}</h2>
   <p>Server-confirmed at {view.serverAnsweredAt?new Date(view.serverAnsweredAt).toLocaleString():'the server'}.</p>
   {(view.feedback?.options||[]).map((o,i)=><p key={i}>{i===view.feedback.correct_index?'Correct answer: ':''}{o.text}{o.explanation?' - '+o.explanation:''}</p>)}
   {view.returnInfo?.pattern&&view.returnInfo?.tellLine&&<div className="thread-return-pattern" style={{background:'#fff7e6',border:'1px solid #ecd9a8',borderRadius:8,padding:'10px 14px',marginTop:8,textAlign:'left'}}>
    <p style={{margin:0}}><strong>Pattern spotted: </strong>you've missed this mix-up more than once.</p>
    <p style={{margin:'6px 0 0'}}><strong>Tell them apart: </strong>{view.returnInfo.tellLine}</p>
   </div>}
   {view.returnInfo?.enqueued&&!view.returnInfo?.pattern&&<p style={{fontSize:14,color:'#456',textAlign:'left'}}>This question will come back in a later session as practice.</p>}
   {view.returnInfo?.resolved&&<p style={{fontSize:14,color:'#2f7d5d',textAlign:'left'}}>This mix-up stops coming back. Answering it right here is return practice, not mastery.</p>}
   {(view.nextKind==='helped_practice'||view.nextKind==='teaching')
    ?<button className="btn btn-navy" disabled={busy} onClick={()=>run('open_next')}>{view.nextKind==='teaching'?'Next teaching step':'Next practice question'}</button>
    :<button className="btn btn-navy" disabled={busy} onClick={()=>run('finish_episode')}>Finish</button>}
  </div>}
  <p className="thread-footnote">{SYNTHETIC?'PREVIEW CONTENT - not yet owner-approved exam teaching. Saved answers, taught examples and checks stay separate.':'Saved answers, teaching examples and helped practice stay separate. Helped practice is not an independent check.'}</p>
 </div></section></>;
}
