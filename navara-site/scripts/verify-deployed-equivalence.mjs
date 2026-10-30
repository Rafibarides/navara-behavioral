// Finding-6 proof: the newly generated combined file serves the SAME bundle objects as
// the currently deployed CANDIDATE file (pin e8dfec17 becomes history after adoption).
// v2.4: with --registry <root>, ALSO proves the generated file serves exactly the registry's
// ACTIVE set: every retained original (active and withdrawn) is sha-pinned and pin-consistent;
// every active one deep-equals the generated element with its member pin; withdrawn pins are
// absent; no duplicate or unregistered pin is served. The 2-file usage is unchanged.
// Usage: node verify-deployed-equivalence.mjs <deployed-CANDIDATE-file> <generated-file> [--registry <root>]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { deepStrictEqual } from 'node:assert/strict';
import { loadBundles, sha256 } from './lib-bundles.mjs';

const argv = process.argv.slice(2);
const regIdx = argv.indexOf('--registry');
const regRoot = regIdx > -1 ? path.resolve(argv[regIdx + 1]) : null;
const [deployed, generated] = argv.filter((a, i) => a !== '--registry' && argv[i - 1] !== '--registry');
const a = await loadBundles(pathToFileURL(path.resolve(deployed)).href);
const b = await loadBundles(pathToFileURL(path.resolve(generated)).href);
const key = o => o.policyId + '|' + o.manifestVersion;
const mapA = new Map(a.map(o => [key(o), o]));
const mapB = new Map(b.map(o => [key(o), o]));
if (mapB.size !== b.length) throw Error('generated file serves a duplicate member pin');
for (const [k, oa] of mapA) {
  const ob = mapB.get(k);
  if (!ob) throw Error('generated file missing deployed member pin ' + k);
  deepStrictEqual(ob, oa);
}
console.log(`PASS equivalence: all ${mapA.size} deployed member pin(s) served identically by the generated file`);

if (regRoot) {
  const rr = path.join(regRoot, 'release-retention');
  const reg = JSON.parse(fs.readFileSync(path.join(rr, 'registry.json')));
  const byPin = new Map((reg.bundles || []).map(e => [e.policyId + '|' + e.manifestVersion, e]));
  for (const k of mapB.keys()) {
    const e = byPin.get(k);
    if (!e) throw Error('generated file serves unregistered member pin ' + k);
    if (e.status !== 'active') throw Error('generated file serves ' + e.status + ' member pin ' + k);
  }
  let n = 0;
  for (const e of reg.bundles) {
    const p = path.join(rr, e.file);
    if (sha256(fs.readFileSync(p)) !== e.sha256) throw Error('retained original ' + e.file + ' bytes diverge from registry pin');
    const orig = await loadBundles(pathToFileURL(p).href);
    if (orig.length !== 1) throw Error('retained original ' + e.file + ' must export exactly one bundle');
    if (key(orig[0]) !== e.policyId + '|' + e.manifestVersion) throw Error('retained original ' + e.file + ' pin diverges from registry listing');
    if (e.status !== 'active') { if (mapB.has(key(orig[0]))) throw Error('generated file serves withdrawn member pin ' + key(orig[0])); continue; }
    const g = mapB.get(key(orig[0]));
    if (!g) throw Error('generated file missing ACTIVE member pin ' + key(orig[0]) + ' (' + e.file + ')');
    deepStrictEqual(g, orig[0]);
    n++;
  }
  if (n !== mapB.size) throw Error(`generated serves ${mapB.size} pin(s) but registry has ${n} active`);
  console.log(`PASS registry equivalence: all ${n} ACTIVE retained original(s) served identically, no extra/withdrawn/unregistered pins`);
}

