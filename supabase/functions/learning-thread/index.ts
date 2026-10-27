// NOT DEPLOYED. Review and test against approved production schema first.
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x);
const text=x=>typeof x==='string'&&x.length>0&&x.length<=160;
function validateRequest(b){
 if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['action','nonce','payload'].includes(k))||!uuid(b.nonce)||!b.payload||typeof b.payload!=='object'||Array.isArray(b.payload))throw Error('invalid');
 const p=b.payload;const common=['pack','version','candidate'];let allowed;
 switch(b.action){
 case'reviewed_thread':allowed=[...common,'step','answer'];if(!['status','lesson','practice','practice_answer','reserve','reserve_answer'].includes(p.step))throw Error('invalid');if(p.answer!==undefined&&(!p.answer||typeof p.answer!=='object'||Array.isArray(p.answer)||Object.keys(p.answer).some(k=>k!=='chosen')))throw Error('invalid');if(p.step.endsWith('_answer')&&(!Number.isSafeInteger(p.answer?.chosen)||p.answer.chosen<0||p.answer.chosen>19))throw Error('invalid');break;
 case'reviewed_suggestion':allowed=[...common,'response'];if(!['fits','guessed','disagree'].includes(p.response))throw Error('invalid');break;
 case'reviewed_recovery':allowed=[...common,'choice'];if(p.choice!==undefined&&!['show_another_way','misread','different_focus','coach_pin'].includes(p.choice))throw Error('invalid');break;
 case'reviewed_choose_help':case'reviewed_baseline_serve':allowed=common;break;
 case'reviewed_baseline_submit':allowed=[...common,'set','answers'];if(!uuid(p.set)||!Array.isArray(p.answers)||!p.answers.length||p.answers.length>20||p.answers.some(a=>!a||Object.keys(a).some(k=>!['delivery','chosen'].includes(k))||!uuid(a.delivery)||!Number.isSafeInteger(a.chosen)||a.chosen<0||a.chosen>19)||new Set(p.answers.map(a=>a.delivery)).size!==p.answers.length)throw Error('invalid');break;
 default:throw Error('invalid');
 }
 if(Object.keys(p).some(k=>!allowed.includes(k))||common.some(k=>!text(p[k])))throw Error('invalid');
 return b;
}

import{createClient}from'https://esm.sh/@supabase/supabase-js@2';
const expected=Deno.env.get('LEARNING_EXPECTED_PROJECT_URL'),url=Deno.env.get('SUPABASE_URL'),origin=Deno.env.get('LEARNING_ALLOWED_ORIGIN');
if(!expected||url!==expected||!origin)throw Error('Explicit project/origin configuration required');
const svc=createClient(url!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(async req=>{
 const o=req.headers.get('origin');const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(o===origin?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'}:{})};
 if(o&&o!==origin)return new Response('{}',{status:403,headers});if(req.method==='OPTIONS')return new Response(null,{status:o===origin?204:403,headers});if(req.method!=='POST')return new Response('{}',{status:405,headers});
 try{
  const jwt=(req.headers.get('authorization')||'').replace(/^Bearer /,'');const{data:u,error:a}=await svc.auth.getUser(jwt);if(a||!u.user)return new Response('{"error":"Sign in to continue"}',{status:401,headers});
  if(Number(req.headers.get('content-length')||0)>16384)throw Error('invalid');
  const raw=await req.text();if(raw.length>16384)throw Error('invalid');const b=validateRequest(JSON.parse(raw));
  const{error:limited}=await svc.rpc('learning_request_guard_candidate',{p_member:u.user.id,p_nonce:b.nonce,p_action:b.action,p_payload:b.payload});if(limited)return new Response(JSON.stringify({error:limited.code==='PW012'?'Too many new actions. Wait a minute and retry the same action.':'This action could not be confirmed.',code:limited.code}),{status:limited.code==='PW012'?429:409,headers});
  const p=b.payload;let rpc:string,args:Record<string,unknown>;const common={p_member:u.user.id,p_pack:p.pack,p_version:p.version,p_candidate:p.candidate};
  switch(b.action){
   case'reviewed_choose_help':rpc='learning_choose_help_candidate';args={...common,p_nonce:b.nonce};break;
   case'reviewed_thread':if(!['status','lesson','practice','practice_answer','reserve','reserve_answer'].includes(p.step))throw Error('invalid');rpc='learning_thread_reviewed_candidate';args={...common,p_action:p.step,p_nonce:b.nonce,p_payload:p.answer||{}};break;
   case'reviewed_suggestion':if(!['fits','guessed','disagree'].includes(p.response))throw Error('invalid');rpc='learning_suggestion_reviewed_candidate';args={...common,p_nonce:b.nonce,p_response:p.response};break;
   case'reviewed_recovery':if(p.choice&&!['show_another_way','misread','different_focus','coach_pin'].includes(p.choice))throw Error('invalid');rpc='learning_recovery_reviewed_candidate';args={...common,p_nonce:b.nonce,p_choice:p.choice||null};break;
   case'reviewed_baseline_serve':rpc='learning_baseline_serve_candidate';args={...common,p_nonce:b.nonce};break;
   case'reviewed_baseline_submit':if(!Array.isArray(p.answers)||p.answers.length>20)throw Error('invalid');rpc='learning_baseline_submit_candidate';args={p_member:u.user.id,p_set:p.set,p_nonce:b.nonce,p_answers:p.answers};break;
   default:throw Error('invalid');
  }
  const{data,error}=await svc.rpc(rpc,args);if(error){const denied=error.code==='42501';return new Response(JSON.stringify({error:denied?'This learning focus is not available for this account.':'This action could not be confirmed. Reload your saved thread or retry the same action.',code:error.code}),{status:denied?403:409,headers})}return new Response(JSON.stringify(data),{headers});
 }catch{return new Response('{"error":"Invalid learning request"}',{status:400,headers})}
});
