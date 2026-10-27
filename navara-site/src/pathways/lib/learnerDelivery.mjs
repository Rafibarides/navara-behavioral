import {selection} from './learnerSelection.mjs';
const validUuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
function served(value,input){
 if(value?.contract_version!==input.contract_version||value?.route!==input.route||value?.session_id!==input.request_key||value?.feedback_policy!=='practice_immediate_v1'||!Array.isArray(value.deliveries)||!value.deliveries.length||value.deliveries.length>input.selection_params.limit)throw Error('Invalid server delivery');
 const seen=new Set();
 return {...value,deliveries:value.deliveries.map((d,i)=>{
  if(!validUuid(d.item_delivery_id)||seen.has(d.item_delivery_id)||d.position!==i||typeof d.item_id!=='string'||typeof d.stem!=='string'||!Array.isArray(d.options)||d.options.length<2)throw Error('Invalid server delivery');
  seen.add(d.item_delivery_id);
  // No client-side storage of unexpected metadata even if an endpoint regresses.
  return{item_delivery_id:d.item_delivery_id,position:i,item_id:d.item_id,stem:d.stem,options:d.options.map((o,index)=>{if(o.index!==index||typeof o.text!=='string')throw Error('Invalid server options');return{index,text:o.text};})};
 })};
}
function answered(value){
 if(!['accepted','replayed','already_answered','content_changed','timed_expired'].includes(value?.outcome))throw Error('Invalid answer response');
 if(['content_changed','timed_expired'].includes(value.outcome))return{outcome:value.outcome,correct:null,feedback:null,attempt_id:null};
 if(typeof value.correct!=='boolean'||!/^\d+$/.test(String(value.attempt_id))||!Number.isFinite(Date.parse(value.answered_at))||!Number.isSafeInteger(value.chosen_index)||value.chosen_index<0||!Number.isSafeInteger(value.feedback?.correct_index)||!Array.isArray(value.feedback?.options)||value.feedback.correct_index<0||value.feedback.correct_index>=value.feedback.options.length)throw Error('Invalid answer receipt');
 return value;
}
// NEW client boundary. No raw bank queries or client grading. Config absent => fail closed.
export function deliveryClient({endpoint,token,fetcher=fetch,uuid=()=>crypto.randomUUID()}){
 if(typeof endpoint!=='string'||!endpoint.startsWith('https://'))throw new Error('Safe practice endpoint unavailable');
 async function call(body){
  const jwt=await token();if(!jwt)throw new Error('Sign-in required');
  const r=await fetcher(endpoint,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+jwt},body:JSON.stringify(body)});
  const value=await r.json();if(!r.ok)throw new Error(value.error||'Practice request unavailable');return value;
 }
 return {
  newSet({track,limit=12,area,tag,review,timed,request_key=uuid()}){const input={action:'serve',contract_version:'v0.1.1',route:'practice',track,request_key,selection_params:selection({limit,...(timed===undefined?{}:{timed}),...(area===undefined?{}:{area}),...(tag===undefined?{}:{tag}),...(review===undefined?{}:{review})})};return{request_key,load:async()=>served(await call(input),input)};},
  answer({track,item_delivery_id,chosen_index,answer_key=uuid()}){const input={action:'answer',contract_version:'v0.1.1',route:'practice',track,item_delivery_id,chosen_index,answer_key};return{answer_key,send:async()=>answered(await call(input))};},
 };
}
