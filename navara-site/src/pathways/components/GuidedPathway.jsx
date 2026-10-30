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
 bcba:import.meta.env.VITE_GUIDED_PRODUCTION==='true'?(import.meta.env.VITE_BCBA_GUIDED_QUALIFIED==='true'?'https://tvvoauvtrgziwxtzlluq.supabase.co/functions/v1/bcba-program':null):'https://ndxdgiwjccaakpvxkkqu.supabase.co/functions/v1/bcba-program',
 rbt:import.meta.env.VITE_GUIDED_PRODUCTION==='true'?'https://tvvoauvtrgziwxtzlluq.supabase.co/functions/v1/rbt-program':'https://ndxdgiwjccaakpvxkkqu.supabase.co/functions/v1/rbt-program',
};
const ORIGIN_FALLBACK='https://navarabehavioralgroup.com';

function FigureChart({pin}){
 const src=pin&&GUIDED_FIGURES[pin.sha256];
 if(!pin)return null;
 if(!src)return <p role="alert">This figure could not be confirmed. Please reload before continuing.</p>;
 return import.meta.env.VITE_BCBA_GUIDED_QUALIFIED==='true'&&pin.sha256==='62223087d719569e8496d151ffd698b544dd9ba33e7537ffe9626fa99ae3efa2'?<figure className="guided-figure" style={{margin:'18px 0'}}><img src={src} alt={pin.alt} width={pin.width} height={pin.height} style={{display:'block',width:'100%',maxWidth:'100%',height:'auto',background:'#fff',border:'1px solid #d5e0e4',borderRadius:8}}/><figcaption style={{fontSize:12,color:'#456',marginTop:4}}>{pin.alt}</figcaption></figure>:<figure className="guided-figure"><img src={src} alt={pin.alt} width={pin.width} height={pin.height} style={{maxWidth:'100%',height:'auto',background:'#fff',border:'1px solid #d5e0e4',borderRadius:8}}/><figcaption style={{fontSize:12,color:'#456',marginTop:4}}>{pin.alt}</figcaption></figure>;
}

// CANDIDATE display-only dedup of identical trailing paragraphs shared by
// selected and correct feedback. Text bytes and recorded answers unchanged.
export function displayFeedback(view){
 const selected=view.feedback?.[String(view.chosen)]||'';
 const correct=view.chosen!==view.defensible?(view.feedback?.[String(view.defensible)]||''):'';
 const a=selected.split(/\r?\n[ \t]*\r?\n/),b=correct.split(/\r?\n[ \t]*\r?\n/);const shared=[];
 while(a.length>1&&b.length>1&&a.at(-1)===b.at(-1)&&a.at(-1).trim()){shared.unshift(a.pop());b.pop();}
 return{selected:a.join('\n\n'),correct:b.join('\n\n'),shared:shared.join('\n\n')};
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
  if(action==='check_personalized_followups'){setState(r);setView({kind:'status',data:r});return;}
  if(r.practiceOfferDeferred){lastAction.current=null;const current=await call('status',{});setState(current);setView({kind:'status',data:current});setErr(r.notice||'Your practice choice is still optional. Return to an available session to choose it.');return;}
  if(r.inventoryNotice?.freshCheckUnservedGap){const saved=r.inventoryNotice;const current=await call('status',{});const merged={...current,inventoryNotice:saved};setState(merged);setView({kind:'status',data:merged});return;}
  if(r.teachingStep)setView({kind:'teaching',...r.teachingStep});
  else if(r.teachingFeedback)setView({kind:'feedback',...r.teachingFeedback});
  else if(r.delivery)setView({kind:'practice',...r.delivery});
  else if(r.receipt)setView({kind:'receipt',...r.receipt,feedback:r.receipt.feedback?.feedback||r.receipt.feedback,returnInfo:r.returnInfo||null,nextKind:r.next?.kind||null,distinctionPracticeOffer:r.distinctionPracticeOffer||null});
  else if((r.next?.kind==='teaching'||r.next?.kind==='helped_practice')&&depth<1){const r2=await call('open_next',{});await interpret('open_next',r2,depth+1);}
  else if(r.next?.kind==='teaching'||r.next?.kind==='helped_practice'){setErr('The next step could not be confirmed. Your saved answers are unchanged. Reload to try again.');}
  else{try{const s=await call('status',{});setState(s);setView({kind:'status',data:s});}catch(e){setErr(e.message)}}
 }
 useEffect(()=>{if(!user)return;(async()=>{try{
  const sb=await getClient();const{data:u}=await sb.auth.getUser();
  const{data:p}=await sb.from('profiles').select('track').eq('id',u.user.id).single();
  const ep=import.meta.env.VITE_BCBA_GUIDED_QUALIFIED==='true'&&p?.track==='bcba'&&import.meta.env.VITE_BCBA_GUIDED_TEST_MEMBER&&u.user.id!==import.meta.env.VITE_BCBA_GUIDED_TEST_MEMBER?null:TRACK_ENDPOINTS[p?.track];if(!ep)throw Error((import.meta.env.VITE_BCBA_GUIDED_QUALIFIED==='true'&&p?.track==='bcba')?'BCBA Guided lessons are not available for this account yet. Your practice and saved answers are unchanged.':'This account does not have a practice track assigned yet.');
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
 const practiceOfferCard=o=><aside key={o.id} className="thread-repeat-offer" style={{border:'1px solid #b9cdd1',borderRadius:8,padding:16,margin:'16px 0',textAlign:'left'}}><h3>Practice this distinction</h3><p>You can revisit this distinction after your recent answer. This is extra practice with help, not a new independent check. Your saved answers and earlier practice stay recorded. Not now skips the current offers for this distinction. A new later answer may offer practice again.</p><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button className="btn btn-navy" disabled={busy} onClick={()=>run('accept_distinction_practice',{offerId:o.id})}>Practice this distinction</button><button className="btn btn-ghost" disabled={busy} onClick={()=>run('dismiss_distinction_practice',{offerId:o.id,offerIds:(view.data?.distinctionPracticeOffers||[o]).filter(x=>x.contrastId===o.contrastId).map(x=>x.id)})}>Not now</button></div></aside>;
 const hist=state?.history?.length??0;
 // Header truth: only an actual catalog lesson context (offer, resume, teaching,
 // feedback, or helped practice) may show the lesson title. Ordinary blueprint
 // bank practice is generic Guided practice and is labeled as such.
 const lessonTitle=offer?.title||state?.catalogResume?.title||null;
 const inLesson=!!lessonTitle||view.kind==='teaching'||view.kind==='feedback'||(view.kind==='practice'&&view.phase==='helped_practice');
 return <><AppNav/><section className="section learning-thread" style={{paddingTop:24}}><div className="wrap" style={{maxWidth:780}}>
  {SYNTHETIC&&<aside className="thread-test-note">Preview content: this lesson is engineering verification content, not reviewed exam teaching. No learning benefit is claimed.</aside>}
  <span className="eyebrow">Your Guided pathway</span>
  {!SYNTHETIC&&<p>{state?.personalizedFollowupsEnabled?'Guided lessons, helped practice and personalized follow-up checks when qualified questions are available.':'Guided lessons and helped practice.'} Lesson completion is not mastery or exam readiness.</p>}
  <h1>{inLesson?(lessonTitle||'Your lesson'):'Guided practice'}</h1>
  {err&&<div role="alert" className="panel"><p>{err}</p>{lastAction.current&&<button className="btn btn-navy" disabled={busy} onClick={retryLast}>Retry the same action</button>}</div>}
  {view.kind==='loading'&&!err&&<p role="status">Loading your saved session...</p>}
  {view.kind==='status'&&<div className="panel">
   {view.data?.personalizedFollowupsCanCheck&&<button className="btn btn-ghost" disabled={busy} onClick={()=>run('check_personalized_followups')}>Check personalized follow-up availability</button>}
   {view.data?.personalizedFollowupsUpgradeAvailable&&<aside style={{border:'1px solid #b9cdd1',borderRadius:8,padding:16,marginBottom:16,textAlign:'left'}}><h2>Add personalized follow-ups</h2><p>Finish your current lesson or question first. Your saved lessons, answers and practice history stay recorded. Future checks use that history, so a question you have seen before will not count as fresh. Your plan and billing do not change.</p><button className="btn btn-navy" disabled={busy} onClick={()=>run('enable_personalized_followups')}>Enable personalized follow-ups</button></aside>}
   {!!view.data?.distinctionChoices?.length&&<div style={{textAlign:'left',marginBottom:20}}><h2>Choose a distinction</h2><p>Choose what to practice. Correct helped answers do not prove that you can use the distinction without help.</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{view.data.distinctionChoices.map(c=><button key={c.id} className="btn btn-ghost" disabled={busy} onClick={()=>run('select_distinction',{contrastId:c.id})}>{c.label}</button>)}</div></div>}
   {(view.data?.distinctionPracticeOffers||[]).filter((o,i,all)=>all.findIndex(x=>x.contrastId===o.contrastId)===i).map(practiceOfferCard)}
   {view.data?.inventoryNotice?.freshCheckUnservedGap&&<p role="status">No new independent check is available for the practice you just finished. Your practice is saved. We will not count a repeated question as a fresh check.</p>}
   {view.data?.next?.kind==='episode_result'?<><p>Your saved answers stay recorded. Finishing practice does not mean mastery or exam readiness.</p><button className="btn btn-navy" disabled={busy} onClick={()=>run('finish_episode')}>{view.data?.inventoryNotice?.freshCheckUnservedGap?'Finish practice':'Finish the check'}</button></>:view.data?.next?.kind==='session_complete'?<>
    <p>This session is finished. Your saved answers and practice stay recorded. Starting another session is optional.</p>
    <button className="btn btn-navy" disabled={busy} onClick={()=>run('start_session')}>Start another session</button>
   </>:view.data?.next?.kind==='finish_session'?<>
    <p>Your planned session is complete. Finish to save its summary.</p>
    <button className="btn btn-navy" disabled={busy} onClick={()=>run('finish_session')}>Finish session</button>
   </>:view.data?.next?.kind==='later_check'?<><p>Your helped practice is saved. Check whether a new independent question is available.</p><button className="btn btn-navy" disabled={busy} onClick={()=>run('open_next')}>Continue to the check</button></>:view.data?.enrollmentRequired?<>
    <p>Start your Guided lessons and helped practice. This is included in your current Guided plan. Your other practice and saved answers stay unchanged.</p>
    <button className="btn btn-navy" disabled={busy} onClick={()=>run('enroll_lessons')}>Start Guided lessons</button>
   </>:view.data?.next?.kind==='curriculum_result'?<>
    <p>Your checked answer is saved. One step left: finish the lesson to record it.</p>
    <button className="btn btn-navy" disabled={busy} onClick={()=>run('finish_episode')}>Finish the lesson</button>
   </>:offer?<>
    {offer.repeatPractice&&<p>This is extra practice with help, not a new independent check. Your saved answers and earlier practice stay recorded. If no new independent check is available, we will say so rather than treat a repeat as fresh.</p>}
    <p>Your chosen lesson is ready{offer.title?<>: <strong>{offer.title}</strong></>:null}.</p>
    <p>{import.meta.env.VITE_BCBA_GUIDED_QUALIFIED==='true'&&user.track==='bcba'?'Short teaching steps with a figure, followed by three helped practice questions with feedback. Your checked answers stay saved.':'Short teaching steps with a figure, followed by two helped practice questions with feedback. Your checked answers stay saved.'}</p>
    <p className="thread-evidence" style={{background:'#f4f7f5',padding:12,borderRadius:8,textAlign:'left'}}><strong>Scope: </strong>Simulated instructional records, not a real person or treatment recommendation. Read each lesson's stated conditions and definitions before answering.</p>
    <button className="btn btn-navy" disabled={busy} onClick={()=>run('continue_curriculum',{catalogModuleId:offer.catalogModuleId,catalogContentVersion:offer.catalogContentVersion,sequenceVersion:offer.sequenceVersion,manifestVersion:offer.manifestVersion})}>Start the lesson</button>
   </>:<>
    {hist>0?<p>Your saved answers are shown below. Finishing a lesson records teaching and helped practice, not mastery.</p>:!(view.data?.distinctionPracticeOffers?.length)?<p>No next lesson is available right now.</p>:null}
    <p>Saved checked answers: {hist}.</p>
    {hist>0&&<ul style={{textAlign:'left',fontSize:14,lineHeight:1.6}}>{(state?.history||[]).map(h=><li key={h.receiptId}>{h.phase==='helped_practice'?'Helped practice (not an independent check)':h.phase==='later_check'?'Follow-up check':h.phase==='return_case'?'Repeat practice (not a fresh check)':'Blueprint practice'}{': recorded '}{h.correct?'correct':'incorrect'}{h.answeredAt?`, server-confirmed ${new Date(h.answeredAt).toLocaleString()}`:''}.</li>)}</ul>}

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
   <p style={{textAlign:'left'}}>{displayFeedback(view).selected}</p>
   {view.chosen!==view.defensible&&<p style={{textAlign:'left'}}><strong>The defensible choice: </strong>{view.alternatives?.[view.defensible]||''}</p>}
   {view.chosen!==view.defensible&&<p style={{textAlign:'left'}}>{displayFeedback(view).correct}</p>}
   {displayFeedback(view).shared&&<p style={{textAlign:'left'}}>{displayFeedback(view).shared}</p>}
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
   {view.distinctionPracticeOffer&&practiceOfferCard(view.distinctionPracticeOffer)}
   <p>Server-confirmed at {view.serverAnsweredAt?new Date(view.serverAnsweredAt).toLocaleString():'the server'}.</p>
   {(view.feedback?.options||[]).map((o,i)=><p key={i}>{i===view.feedback.correct_index?'Correct answer: ':''}{o.text}{o.explanation?' - '+o.explanation:''}</p>)}
   {view.returnInfo?.pattern&&view.returnInfo?.tellLine&&<div className="thread-return-pattern" style={{background:'#fff7e6',border:'1px solid #ecd9a8',borderRadius:8,padding:'10px 14px',marginTop:8,textAlign:'left'}}>
    <p style={{margin:0}}><strong>Pattern spotted: </strong>you've missed this mix-up more than once.</p>
    <p style={{margin:'6px 0 0'}}><strong>Tell them apart: </strong>{view.returnInfo.tellLine}</p>
   </div>}
   {view.returnInfo?.enqueued&&!view.returnInfo?.pattern&&<p style={{fontSize:14,color:'#456',textAlign:'left'}}>This question will come back in a later session as practice.</p>}
   {view.returnInfo?.resolved&&<p style={{fontSize:14,color:'#2f7d5d',textAlign:'left'}}>This mix-up stops coming back. Answering it right here is return practice, not mastery.</p>}
   {(view.nextKind==='helped_practice'||view.nextKind==='teaching'||view.nextKind==='later_check')
    ?<button className="btn btn-navy" disabled={busy} onClick={()=>run('open_next')}>{view.nextKind==='teaching'?'Next teaching step':view.nextKind==='later_check'?'Continue to the check':'Next practice question'}</button>
    :<button className="btn btn-navy" disabled={busy} onClick={()=>run('finish_episode')}>Finish</button>}
  </div>}
  <p className="thread-footnote">{SYNTHETIC?'PREVIEW CONTENT - not yet owner-approved exam teaching. Saved answers, taught examples and checks stay separate.':'Saved answers, teaching examples and helped practice stay separate. Helped practice is not an independent check.'}</p>
 </div></section></>;
}
