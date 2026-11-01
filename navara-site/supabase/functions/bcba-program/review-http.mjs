// Candidate read-only HTTP adapter. Existing mutation handler remains separate.
const ORIGIN='https://navarabehavioralgroup.com';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function reviewHTTP({authenticate,readReview,listReviews,available=async()=>false,enabled=false}){
 return async req=>{
  const o=req.headers.get('origin'),matched=o===ORIGIN;
  const h={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(matched?{'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'}:{})};
  const send=(status,b)=>{const body=JSON.stringify(b);return body.length<=262144?new Response(body,{status,headers:h}):new Response(JSON.stringify({error:'This completed lesson cannot be reviewed right now.'}),{status:503,headers:h})};
  if(o&& !matched)return send(403,{error:'Unavailable.'});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:h});
  if(req.method!=='POST')return send(405,{error:'Unavailable.'});
  try{if(!enabled||!await available())return send(503,{error:'This Pathway is unavailable.'})}catch{return send(503,{error:'This Pathway is unavailable.'})}
  const auth=req.headers.get('authorization');if(!auth?.startsWith('Bearer '))return send(401,{error:'Sign in again.'});
  let identity;try{identity=await authenticate(auth)}catch{return send(401,{error:'Sign in again.'})}
  if(!identity||identity.track!=='bcba'||identity.plan!=='guided')return send(401,{error:'Sign in again.'});
  let b;try{const text=await req.text();if(text.length>1024)throw Error();b=JSON.parse(text)}catch{return send(400,{error:'Invalid review request.'})}
  if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['action','payload'].includes(k))||!b.payload||typeof b.payload!=='object'||Array.isArray(b.payload))return send(400,{error:'Invalid review request.'});
  try{
   if(b.action==='list_completed_lessons'&&Object.keys(b.payload).length===0)return send(200,{completedLessons:await listReviews(identity)});
   if(b.action==='review_completed_lesson'&&Object.keys(b.payload).length===1&&UUID.test(b.payload.episodeId||''))return send(200,{completedLessonReview:await readReview(identity,b.payload.episodeId)});
   return send(400,{error:'Invalid review request.'});
  }catch{return send(404,{error:'This completed lesson cannot be reviewed right now.'})}
 };
}
// Router must identify read action before legacy command handler. It passes a
// clone to inspect action, never consumes the original request. Unknown actions
// remain with existing strict validator. Never call request_guard for reads.
export function withReviewReads({readHandler,programHandler}){
 return async req=>{
  if(req.method==='POST')try{const reader=req.clone().body?.getReader();let length=0,text='';if(reader){const decoder=new TextDecoder();while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>1024){void reader.cancel().catch(()=>{});return programHandler(req)}text+=decoder.decode(value,{stream:true})}text+=decoder.decode()}const body=JSON.parse(text);if(['list_completed_lessons','review_completed_lesson'].includes(body?.action))return readHandler(req)}catch{}
  return programHandler(req);
 };
}
