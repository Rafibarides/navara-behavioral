import React,{useEffect,useState}from'react';
import CompletedLessonReview from'./CompletedLessonReview';
import{getClient}from'../lib/db';
import GUIDED_FIGURES from'../data/guidedFigures.json';
export default function CompletedLessonsArea({endpoint,memberId}){
 const[lessons,setLessons]=useState([]),[review,setReview]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function read(action,payload={}){const sb=await getClient();const{data}=await sb.auth.getSession();const r=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action,payload})});const b=await r.json();if(!r.ok)throw Error(b.error||'This completed lesson cannot be reviewed right now.');return b}
 useEffect(()=>{let active=true;if(endpoint)read('list_completed_lessons').then(x=>{if(active)setLessons(x.completedLessons||[])}).catch(()=>{if(active)setError('Completed lessons could not be confirmed. Your saved answers are unchanged.')});return()=>{active=false}},[endpoint,memberId]);
 async function open(episodeId){setBusy(true);setError('');try{setReview((await read('review_completed_lesson',{episodeId})).completedLessonReview)}catch(e){setError(e.message)}finally{setBusy(false)}}
 if(!lessons.length&&!error)return null;
 return <aside className={review?'completed-lessons-area':'panel'}><h2>Completed lessons</h2>{error&&<p role="alert">{error}</p>}{review?<CompletedLessonReview key={review.episodeId} lesson={review} verifiedFigures={GUIDED_FIGURES} onClose={()=>setReview(null)}/>:<ul>{lessons.map(l=><li key={l.episodeId}>{l.unavailable?<span>This completed lesson cannot be reviewed right now.</span>:<button type="button" className="btn btn-ghost" disabled={busy} onClick={()=>open(l.episodeId)}>Review: {l.title}</button>}</li>)}</ul>}</aside>;
}
