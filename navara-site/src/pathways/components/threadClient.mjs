const STAGING='https://ndxdgiwjccaakpvxkkqu.supabase.co/functions/v1/learning-loop-fixture';
const PRODUCTION='https://tvvoauvtrgziwxtzlluq.supabase.co/functions/v1/learning-thread';
const PACK={pack:'baseline-synthetic',version:'v1',candidate:'shape-not-size'};
/** Explicit private harness only. No shipping default or production endpoint. */
export function threadClient({endpoint,token,fetcher=fetch,uuid=()=>crypto.randomUUID(),pack=PACK,reviewed=false}){
 if(endpoint!==STAGING&&(endpoint!==PRODUCTION||!reviewed))throw Error('Explicit reviewed endpoint required');
 if(reviewed&&(!pack||pack===PACK||!pack.pack||!pack.version||!pack.candidate))throw Error('Explicit reviewed pack required');
 const pending=new Map();
 async function action(kind,payload={},operation){
  if(!['thread','suggestion','recovery','coach_focus','baseline_serve','baseline_submit','choose_help'].includes(kind))throw Error('Unsupported private action');
  const key=operation||uuid();const action=reviewed?({thread:'reviewed_thread',suggestion:'reviewed_suggestion',recovery:'reviewed_recovery',baseline_serve:'reviewed_baseline_serve',baseline_submit:'reviewed_baseline_submit',choose_help:'reviewed_choose_help'}[kind]):kind;if(!action)throw Error('Reviewed action unavailable');const body={action,nonce:key,payload:kind==='coach_focus'?payload:{...pack,...payload}};
  const encoded=JSON.stringify(body);
  if(pending.has(key)&&pending.get(key).encoded!==encoded)throw Error('Operation changed while retry pending');
  pending.set(key,{encoded,body});
  let bearer;try{bearer=await token();}catch{throw Error('Sign in again before continuing');}
  if(!bearer)throw Error('Sign in before continuing');
  const response=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+bearer},body:encoded});
  const result=await response.json();
  if(!response.ok){const e=Error(result.error||'Could not save. Retry the same action.');e.operation=key;throw e;}
  if(!result||typeof result!=='object'||typeof result.state!=='string')throw Error('Saved thread response could not be verified');
  pending.delete(key);return {result,operation:key};
 }
 function command(kind,payload){payload=structuredClone(payload);const operation=uuid();let saved;return{operation,run:async()=>{if(saved)return saved;const r=await action(kind,payload,operation);saved=r;return r;}};}
 return {command,status:()=>action('thread',{step:'status'}),endpoint};
}
