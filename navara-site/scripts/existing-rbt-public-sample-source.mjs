// Public-source fail-closed coupling. Never sends learner/account data.
import{createHash}from'node:crypto';
const ORIGIN='https://navarabehavioralgroup.com';
export async function verifyPublicSampleSource(manifest,{fetcher=fetch}={}){
 const p=manifest.publicSampleSource;
 if(!p||p.url!==ORIGIN+'/pathways/sample-quiz/'||!/^https:\/\/navarabehavioralgroup\.com\/assets\/index-[A-Za-z0-9_-]+\.js$/.test(p.assetUrl)||!/^[a-f0-9]{64}$/.test(p.assetSha256||'')||!Array.isArray(manifest.publicSampleBodyIdentities)||manifest.publicSampleBodyIdentities.length!==10||manifest.publicSampleBodyIdentities.some(v=>!/^[a-f0-9]{64}$/.test(v)))throw Error('public_sample_source_unpinned');
 async function get(url,limit){const res=await fetcher(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10000)});if(!res.ok)throw Error('public_sample_source_unavailable');const b=new Uint8Array(await res.arrayBuffer());if(b.length>limit)throw Error('public_sample_source_oversize');return b;}
 const html=new TextDecoder().decode(await get(p.url,500000));const assets=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)].map(m=>new URL(m[1],p.url).href);
 if(assets.length!==1||assets[0]!==p.assetUrl)throw Error('public_sample_source_changed');
 const bytes=await get(p.assetUrl,5000000);if(createHash('sha256').update(bytes).digest('hex')!==p.assetSha256)throw Error('public_sample_source_changed');return true;
}
