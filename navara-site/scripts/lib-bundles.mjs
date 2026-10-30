// Shared helpers: load bundle modules, derive pins, deterministic serialization.
import { createHash } from 'node:crypto';
export const sha256 = b => createHash('sha256').update(b).digest('hex');
export const HEX64 = /^[0-9a-f]{64}$/;

// Import a bundle module (combined or single). Returns array of bundle objects.
export async function loadBundles(file) {
  const mod = await import(file + '?v=' + Date.now() + Math.random());
  if (Array.isArray(mod.BCBA_QUALIFIED_BUNDLES)) return mod.BCBA_QUALIFIED_BUNDLES;
  if (mod.BUNDLE) return [mod.BUNDLE];
  throw Error('no BCBA_QUALIFIED_BUNDLES or BUNDLE export in ' + file);
}

// Derive the registry-visible facts from a loaded bundle object.
export function bundleFacts(b) {
  if (!b || typeof b !== 'object') throw Error('bundle not an object');
  for (const k of ['policyId', 'manifestVersion', 'catalogSha', 'bindingSha'])
    if (typeof b[k] !== 'string' || !b[k]) throw Error('bundle missing ' + k);
  if (!/^[^@]+@sha256:[0-9a-f]{64}$/.test(b.manifestVersion)) throw Error('manifestVersion not digest-bearing');
  if (!HEX64.test(b.catalogSha) || !HEX64.test(b.bindingSha)) throw Error('catalogSha/bindingSha not 64-hex');
  if (!Buffer.isBuffer(b.catalogBytes) || !Buffer.isBuffer(b.bindingBytes)) throw Error('catalog/binding bytes not Buffers');
  if (sha256(b.catalogBytes) !== b.catalogSha) throw Error('catalogBytes do not hash to catalogSha');
  if (sha256(b.bindingBytes) !== b.bindingSha) throw Error('bindingBytes do not hash to bindingSha');
  if (!(b.figures instanceof Map)) throw Error('figures not a Map');
  const figurePins = [...b.figures.keys()];
  for (const p of figurePins) {
    if (!HEX64.test(p)) throw Error('figure pin not 64-hex: ' + p);
    const bytes = b.figures.get(p);
    if (!Buffer.isBuffer(bytes) || sha256(bytes) !== p) throw Error('figure bytes do not hash to pin ' + p);
  }
  return { policyId: b.policyId, manifestVersion: b.manifestVersion, catalogSha: b.catalogSha, bindingSha: b.bindingSha, figurePins };
}

// Deterministic module source for ONE bundle object. Buffer text as base64 - exact, no escaping risk.
export function serializeBundleModule(b) {
  const facts = bundleFacts(b);
  const figs = facts.figurePins.map(p => `["${p}",Buffer.from('${b.figures.get(p).toString('base64')}','base64')]`).join(',');
  return `// Immutable qualified BCBA bundle module. Never edit; append new versions as new files.\nimport {Buffer} from 'node:buffer';\nexport const BUNDLE={track:${JSON.stringify(b.track)},policyId:${JSON.stringify(facts.policyId)},manifestVersion:${JSON.stringify(facts.manifestVersion)},catalogBytes:Buffer.from('${b.catalogBytes.toString('base64')}','base64'),catalogSha:"${facts.catalogSha}",bindingBytes:Buffer.from('${b.bindingBytes.toString('base64')}','base64'),bindingSha:"${facts.bindingSha}",figures:new Map([${figs}])};\n`;
}
