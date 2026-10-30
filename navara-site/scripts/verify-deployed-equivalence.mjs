// Finding-6 proof: the newly generated combined file serves the SAME bundle objects as
// the currently deployed CANDIDATE file (pin e8dfec17 becomes history after adoption).
// Usage: node verify-deployed-equivalence.mjs <deployed-CANDIDATE-file> <generated-file>
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { deepStrictEqual } from 'node:assert/strict';
import { loadBundles } from './lib-bundles.mjs';

const [deployed, generated] = process.argv.slice(2);
const a = await loadBundles(pathToFileURL(path.resolve(deployed)).href);
const b = await loadBundles(pathToFileURL(path.resolve(generated)).href);
const key = o => o.policyId + '|' + o.manifestVersion;
const mapA = new Map(a.map(o => [key(o), o]));
const mapB = new Map(b.map(o => [key(o), o]));
for (const [k, oa] of mapA) {
  const ob = mapB.get(k);
  if (!ob) throw Error('generated file missing deployed member pin ' + k);
  deepStrictEqual(ob, oa);
}
console.log(`PASS equivalence: all ${mapA.size} deployed member pin(s) served identically by the generated file`);
