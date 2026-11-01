// BCBA-only registration candidate. OFF until exact reviewed immutable pack.
import postgres from 'npm:postgres@3.4.5';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.118.0';
import {bcbaComposition} from './bcba-composition.mjs';
const expected=Deno.env.get('BCBA_PROGRAM_EXPECTED_PROJECT_URL');
const url=Deno.env.get('SUPABASE_URL'),origin=Deno.env.get('BCBA_PROGRAM_ALLOWED_ORIGIN');
const dbUrl=Deno.env.get('BCBA_PROGRAM_DB_URL'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if(expected!=='https://tvvoauvtrgziwxtzlluq.supabase.co'||url!==expected||origin!=='https://navarabehavioralgroup.com'||!dbUrl||!serviceKey)throw Error('explicit_bcba_production_configuration_required');
if(Deno.env.get('BCBA_PROGRAM_ALLOW_SYNTHETIC')==='true'||(Deno.env.get('BCBA_PROGRAM_EXTRA_ORIGINS')||'').trim())throw Error('unsafe_bcba_production_configuration');
const svc=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const sql=postgres(dbUrl,{ssl:'require',prepare:false,max:1});
const authenticate=async(auth:string)=>{
 const {data:u,error}=await svc.auth.getUser(auth.replace(/^Bearer /,''));if(error||!u.user)return null;
 const {data:p,error:pe}=await svc.from('profiles').select('plan,track').eq('id',u.user.id);
 if(pe||p?.length!==1)return null;return{id:u.user.id,track:p[0].track,plan:p[0].plan};
};
// Composition defaults to enabled:false,qualified:false and EMPTY registry.
// No environment/request-controlled activation, RBT function untouched.
Deno.serve(bcbaComposition({sql,authenticate}));
