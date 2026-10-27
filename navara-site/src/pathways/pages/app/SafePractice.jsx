import React,{useEffect,useState,useRef}from'react';
import AppNav from'../../components/AppNav';import ServerQuiz from'../../components/ServerQuiz';import{useRequireUser}from'../../components/useRequireUser';import{getClient,fetchMemberEvidenceState}from'../../lib/db';import{deliveryClient}from'../../lib/learnerDelivery.mjs';import{selectionFromUrl}from'../../lib/learnerSelection.mjs';import{resumeStore}from'../../lib/learnerResume.mjs';import{CFG}from'../../config';
export default function SafePractice({timed=false}){
 const user=useRequireUser(),[state,setState]=useState({status:'setup'}),[areas,setAreas]=useState([]),[topicsError,setTopicsError]=useState(false),[evidence,setEvidence]=useState([]),[area,setArea]=useState(''),[existing,setExisting]=useState(null);const current=useRef(null),busy=useRef(false);
 const mode=timed?'timed':'practice';
 useEffect(()=>{if(!user)return;const store=resumeStore(user.id,user.track,mode);setExisting(store.read());setState({status:'setup'});current.current=null;let active=true;(async()=>{try{const sb=await getClient();const {data,error}=await sb.rpc('learner_topics');if(active){if(error)setTopicsError(true);else setAreas(data||[]);}}catch{}try{const e=await fetchMemberEvidenceState(user);if(active)setEvidence(e.rows||[]);}catch{}})();return()=>{active=false;};},[user?.id,user?.track,mode]);
 async function open(resume=false){
 if(busy.current)return;busy.current=true;setState({status:'loading'});
 try{
 const store=resumeStore(user.id,user.track,mode);let saved=resume?store.read():null;
 if(resume&&!saved)throw Error('No saved set is available on this browser.');
 if(!saved){const selected=selectionFromUrl(location.search,timed?10:12);if(area){if(selected.tag)throw Error('Choose a topic or tag, not both.');selected.area=area;}if(timed)selected.timed=true;saved={request_key:crypto.randomUUID(),selection:selected,answers:[],position:0,deadline:null};store.write(saved);}
 current.current=saved;setExisting(saved);
 const client=deliveryClient({endpoint:CFG.safeLearnerEndpoint,token:async()=>{const sb=await getClient();const{data,error}=await sb.auth.getSession();if(error)throw error;return data.session?.access_token;}});
 const began=performance.now();const set=client.newSet({track:user.track,...saved.selection,request_key:saved.request_key});const data=await set.load();
 if(timed){if(!Number.isFinite(Date.parse(data.deadline_at))||!Number.isFinite(Date.parse(data.server_now)))throw Error('Server timer unavailable');saved.deadline=began+Math.max(0,Date.parse(data.deadline_at)-Date.parse(data.server_now));saved.serverDeadline=data.deadline_at;}
 if(!data.deliveries?.length)throw Error('No questions match this selection. No other set was substituted.');
 try{const sb=await getClient();const meta=await sb.from('questions').select('id,area,track').in('id',data.deliveries.map(d=>d.item_id)).eq('track',user.track);if(!meta.error){const by=new Map(meta.data.map(x=>[String(x.id),x.area]));data.deliveries=data.deliveries.map(d=>({...d,area:by.get(d.item_id)}));}}catch{}
 store.write(saved);setState({status:'ready',data,client,saved,store});setExisting(saved);
 }catch(e){setState({status:'error',message:e.message==='empty_pool'?'No questions match this selection. No other set was substituted.':e.message});}finally{busy.current=false;}
 }
 if(!user)return null;
 const tag=new URLSearchParams(location.search).get('tag'),review=new URLSearchParams(location.search).get('review')==='1';
 return <><AppNav active={timed?'timed-sets':'practice'}/><section className="section pw-clean-practice" style={{minHeight:'100vh'}}><div className="wrap quiz-shell"><h2>{timed?'Timed practice':review?'Review recorded misses':tag?'Practice an assigned tag':'Practice by topic'}</h2>{state.status==='ready'?<><p className="practice-notice">{state.data.deliveries.length} questions in this set. {timed?'10-minute practice countdown. ':''}The set can be resumed on this browser; checked answers are verified from saved server receipts.</p><ServerQuiz key={state.data.session_id} deliveries={state.data.deliveries} client={state.client} track={user.track} timed={timed} session={state.saved} store={state.store} onNewSet={()=>{state.store.clear();setExisting(null);setState({status:'setup'});}}/></>:<>
 {state.status==='loading'?<p role="status">Preparing your set and checking saved answers...</p>:<>
 {state.status==='error'&&<p role="alert">{state.message}</p>}
 <div className="panel" style={{maxWidth:650,margin:'24px auto'}}>
 <p className="clean-practice-intro">{timed?'Up to 10 questions, 10 minutes. Smaller topic pools use fewer questions. The timer starts only when you press Start. This is a short practice set, not a full-length exam. Answer explanations appear after each checked answer.':'Choose a topic, practice your full track, or return to questions from your recorded misses.'}</p>
 {tag&&<p>Assigned tag: {tag.replace(/_/g,' ')}. {review?'Questions you answered incorrectly in the last 30 days.':'Questions whose answer options carry this tag.'}</p>}
 {topicsError&&!tag&&!review&&<p role="alert">Topic choices could not be loaded. You can still start an all-topics set or retry this page.</p>}
 {!tag&&!review&&<label style={{display:'block',margin:'18px 0'}}>Topic <select aria-label="Topic" value={area} onChange={e=>setArea(e.target.value)} style={{width:'100%',padding:12,marginTop:8}}><option value="">All topics in your track</option>{areas.map(a=><option key={a.area} value={a.area}>{a.area}</option>)}</select></label>}
 <details className="clean-details clean-practice-notes"><summary>How this set works</summary><p style={{fontSize:14}}>Checked answers count toward your progress. You can leave and resume this set on this browser. {timed?'The clock keeps running while you are away.':''} If a save fails, retry the same answer.</p></details>
 {existing&&<div style={{margin:'16px 0'}}><p>A saved {timed?'timed ':''}set is available on this browser.</p><button className="btn btn-navy" onClick={()=>open(true)}>Resume saved set</button></div>}
 <button className={existing?"btn btn-outline":"btn btn-primary"} onClick={()=>{if(existing&&!window.confirm('Replace the saved set? Checked answers stay in your progress.'))return;open(false);}}> {existing?'Start a new set':timed?'Start the timer':'Start practice'}</button>
 {!timed&&<p style={{marginTop:18}}><a href="/pathways/app/practice?review=1">Review questions you missed in the last 30 days</a></p>}
 </div>
 {!timed&&evidence.length>0&&<div className="panel"><h3>Practice from recorded misses</h3><p>These are assigned tags on your selected answers, not a diagnosis or mastery score.</p>{evidence.map(e=><div key={e.tag} style={{margin:'14px 0'}}><b>{e.tag.replace(/_/g,' ')}</b><div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:8}}><a className="btn btn-outline btn-sm" href={'/pathways/app/practice?tag='+encodeURIComponent(e.tag)}>More questions with this tag</a><a className="btn btn-outline btn-sm" href={'/pathways/app/practice?tag='+encodeURIComponent(e.tag)+'&review=1'}>Review recorded misses</a></div></div>)}</div>}
 </>}
 </>}</div></section></>;
}
