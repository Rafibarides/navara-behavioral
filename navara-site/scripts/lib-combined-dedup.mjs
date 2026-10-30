// Deduplicating serializer for the COMBINED generated bundle (builder-side only).
// Format-agnostic: catalog/binding bytes are split with content-defined chunking
// (gear rolling hash), so cumulative catalogs that repeat earlier modules share chunks
// regardless of JSON layout. Each unique chunk and each unique figure (by pin) is
// emitted ONCE; each bundle lists its ordered chunk ids and its own figure pins.
// The emitted module rebuilds every bundle object at import and verifies every
// catalog/binding/figure sha256 before exporting (fail closed: throw at import).
// Loader (lib-bundles loadBundles) and the export name BCBA_QUALIFIED_BUNDLES are unchanged.
import { createHash } from 'node:crypto';
import { bundleFacts } from './lib-bundles.mjs';

const sha = b => createHash('sha256').update(b).digest('hex');

// Deterministic gear table from a fixed seed (no randomness, no network).
const GEAR = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) t[i] = parseInt(sha(Buffer.from('bcba-cdc-gear-' + i)).slice(0, 8), 16);
  return t;
})();
export const CDC = Object.freeze({ min: 2048, avgMask: 0x1fff /* ~8 KiB */, max: 65536 });

export function chunkBytes(buf) {
  const out = [];
  let start = 0, h = 0;
  for (let i = 0; i < buf.length; i++) {
    h = ((h << 1) + GEAR[buf[i]]) >>> 0;
    const len = i - start + 1;
    if ((len >= CDC.min && (h & CDC.avgMask) === 0) || len >= CDC.max) {
      out.push(buf.subarray(start, i + 1)); start = i + 1; h = 0;
    }
  }
  if (start < buf.length) out.push(buf.subarray(start));
  return out;
}

export function serializeCombinedDedup(objs, headerComment = '') {
  if (!Array.isArray(objs) || !objs.length) throw Error('no bundles to serialize');
  const chunkIdx = new Map(); const chunks = [];
  const figIdx = new Map(); const figs = [];
  const seenPins = new Set();
  const addChunks = buf => chunkBytes(buf).map(c => {
    const k = sha(c);
    if (!chunkIdx.has(k)) { chunkIdx.set(k, chunks.length); chunks.push([k, c]); }
    return chunkIdx.get(k);
  });
  const entries = objs.map(o => {
    const f = bundleFacts(o); // validates every hash before anything is emitted
    const memberPin = f.policyId + '|' + f.manifestVersion;
    if (seenPins.has(memberPin)) throw Error('duplicate member pin in input: ' + memberPin);
    seenPins.add(memberPin);
    for (const p of f.figurePins) if (!figIdx.has(p)) { figIdx.set(p, figs.length); figs.push([p, o.figures.get(p)]); }
    return { track: o.track, policyId: f.policyId, manifestVersion: f.manifestVersion,
      catalogSha: f.catalogSha, catalogChunks: addChunks(o.catalogBytes),
      bindingSha: f.bindingSha, bindingChunks: addChunks(o.bindingBytes), figurePins: f.figurePins };
  });
  const J = JSON.stringify;
  let s = headerComment;
  s += `import {Buffer} from 'node:buffer';\nimport {createHash} from 'node:crypto';\n`;
  s += `const H=b=>createHash('sha256').update(b).digest('hex');\n`;
  s += `const fail=m=>{throw Error('generated bundle integrity failure: '+m)};\n`;
  s += `const CH=[\n${chunks.map(([k, c]) => `[${J(k)},'${c.toString('base64')}']`).join(',\n')}\n].map(([k,b],i)=>{const x=Buffer.from(b,'base64');if(H(x)!==k)fail('chunk '+i);return x;});\n`;
  s += `const FG=new Map([\n${figs.map(([p, b]) => `[${J(p)},'${b.toString('base64')}']`).join(',\n')}\n].map(([p,b])=>{const x=Buffer.from(b,'base64');if(H(x)!==p)fail('figure '+p);return [p,x];}));\n`;
  s += `const cat=(ids,want,what)=>{const x=Buffer.concat(ids.map(i=>{if(!Number.isInteger(i)||!CH[i])fail(what+' chunk ref '+i);return CH[i];}));if(H(x)!==want)fail(what+' '+want);return x;};\n`;
  s += `const E=[\n${entries.map(e => J(e)).join(',\n')}\n];\n`;
  s += `export const BCBA_QUALIFIED_BUNDLES=E.map(e=>({track:e.track,policyId:e.policyId,manifestVersion:e.manifestVersion,catalogBytes:cat(e.catalogChunks,e.catalogSha,'catalog'),catalogSha:e.catalogSha,bindingBytes:cat(e.bindingChunks,e.bindingSha,'binding'),bindingSha:e.bindingSha,figures:new Map(e.figurePins.map(p=>{if(!FG.has(p))fail('missing figure '+p);return [p,FG.get(p)];}))}));\n`;
  return s;
}

