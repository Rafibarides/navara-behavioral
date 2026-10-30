// Build-only, fail closed. Run AFTER ordinary Vite+prerender and BEFORE publish.
// The frozen public sample document and its exact asset graph remain byte-for-byte
// public. New normal member pages may load a new bundle; no policy/pin migration.
import fs from'node:fs';import path from'node:path';import{createHash}from'node:crypto';
export function preservePublicSample({pinRoot,dist}){
 const m=JSON.parse(fs.readFileSync(path.join(pinRoot,'manifest.json')));const records=[m.page,...m.assets];
 for(const r of records){if(!r.path||r.path.startsWith('/')||r.path.split('/').includes('..'))throw Error('invalid pin path');const bytes=fs.readFileSync(path.join(pinRoot,r.path));if(createHash('sha256').update(bytes).digest('hex')!==r.sha256)throw Error('pinned bytes changed');const out=path.join(dist,r.path);if(r!==m.page&&fs.existsSync(out)&&!fs.readFileSync(out).equals(bytes))throw Error('new build collides with old pinned asset');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,bytes)}
 const html=fs.readFileSync(path.join(dist,m.page.path),'utf8');const refs=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)].map(x=>x[1]);if(refs.length!==1||refs[0]!=='/assets/index-B3ylf9VR.js')throw Error('sample entry changed');console.log('Pinned public sample page+asset graph retained',records.map(x=>x.path));
}
if(process.argv[1]?.endsWith('preserve-public-sample.mjs'))preservePublicSample({pinRoot:process.argv[2],dist:process.argv[3]});
