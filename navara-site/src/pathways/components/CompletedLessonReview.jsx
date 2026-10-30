import React,{useState}from'react';
import ReactMarkdown from'react-markdown';
import remarkGfm from'remark-gfm';
// Render ONLY the server's own historical completed lesson snapshot. The image
// map is supplied from its verified exact historical bundle, not latest content.
export default function CompletedLessonReview({lesson,verifiedFigures,onClose}){
 const[step,setStep]=useState(0);if(!lesson?.readOnly||!lesson.steps?.length)return null;
 const s=lesson.steps[step],src=s.figure&&verifiedFigures[s.figure.sha256];
 return <section className="panel completed-lesson-review" aria-label="Completed lesson review">
 <button type="button" className="btn btn-ghost" onClick={onClose}>Back to saved answers</button>
 <h2>{lesson.title}</h2><p>{lesson.notice}</p><p>Teaching step {step+1} of {lesson.steps.length}</p>
 <div className="guided-lesson-text"><ReactMarkdown remarkPlugins={[remarkGfm]}>{s.evidence||''}</ReactMarkdown></div>
 {s.figure&&(src?<figure style={{margin:'18px 0'}}><img src={src} alt={s.figure.alt} width={s.figure.width} height={s.figure.height} style={{width:'100%',maxWidth:'100%',height:'auto',display:'block'}}/><figcaption>{s.figure.alt}</figcaption></figure>:<p role="alert">The original lesson figure could not be confirmed. This review is unavailable.</p>)}
 <p>{s.learnerTask}</p>
 <h3>Choices and feedback from this lesson</h3><ol>{(s.alternatives||[]).map((x,i)=><li key={i}><strong>{x}{i===s.defensible?' (defensible choice)':''}</strong><p>{s.feedback?.[String(i)]||''}</p></li>)}</ol>
 <nav aria-label="Review steps"><button type="button" className="btn btn-ghost" disabled={step===0} onClick={()=>setStep(step-1)}>Previous step</button><button type="button" className="btn btn-ghost" disabled={step===lesson.steps.length-1} onClick={()=>setStep(step+1)}>Next step</button></nav>
 <p>This is review only. Your saved lesson and answers are unchanged.</p>
 </section>;
}
