// One-time migration v2: split the deployed combined bundle (pin e8dfec17...) into one
// immutable module per bundle + initial registry, with IMPORT-LEVEL equality proof
// (no string parsing of the source): import the combined module, serialize each loaded
// bundle object deterministically, re-import each split module, deepStrictEqual.
// Usage: node migrate-monolith-to-registry.mjs <combined-file> <root> <addedAt ISO> <reviewEvidence>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { deepStrictEqual } from 'node:assert/strict';
import { sha256, loadBundles, bundleFacts, serializeBundleModule } from './lib-bundles.mjs';

const [combined, rootArg, addedAt, evidence] = process.argv.slice(2);
if (!combined || !rootArg || !addedAt || !evidence) { console.error('usage: migrate-monolith-to-registry.mjs <combined-file> <root> <addedAt> <reviewEvidence>'); process.exit(2); }
const root = path.resolve(rootArg);
const srcSha = sha256(fs.readFileSync(combined));
const originals = await loadBundles(pathToFileURL(path.resolve(combined)).href);
if (!originals.length) throw Error('combined file has no bundles');

// If the combined file already lives under <root>/release-retention/, register it
// IN PLACE: old retained bytes are never re-serialized or moved (the actual repo
// keeps the deployed CANDIDATE there, byte-identical to deployment). Otherwise split
// into one serialized module per bundle under release-retention/bundles/.
const combinedAbs = path.resolve(combined);
const retentionAbs = path.join(root, 'release-retention');
const inPlaceRel = path.relative(retentionAbs, combinedAbs);
const inPlace = !inPlaceRel.startsWith('..') && !path.isAbsolute(inPlaceRel);
const entries = [];
const allFigurePins = new Map();
if (inPlace) {
  if (originals.length !== 1) throw Error('in-place registration expects the retained file to hold exactly the current bundle set; split instead');
  const o = originals[0];
  const facts = bundleFacts(o);
  const file = inPlaceRel.split(path.sep).join('/');
  for (const pin of facts.figurePins) allFigurePins.set(pin, o.figures.get(pin));
  entries.push({ file, sha256: srcSha, ...facts, status: 'active', addedAt,
    withdrawnAt: null, reviewEvidence: evidence + ' | registered in place, bytes unchanged' });
  console.log('IN-PLACE registration: ' + file + ' (sha256 ' + srcSha + ', bytes untouched)');
} else {
  const bundlesDir = path.join(retentionAbs, 'bundles');
  fs.mkdirSync(bundlesDir, { recursive: true });
  for (const o of originals) {
    const facts = bundleFacts(o); // validates pin self-consistency incl figure bytes
    const file = `bundles/${facts.policyId.replace(/[^A-Za-z0-9_-]/g, '-')}.mjs`;
    const body = serializeBundleModule(o);
    const p = path.join(root, 'release-retention', file);
    fs.writeFileSync(p, body);
    const [reloaded] = await loadBundles(pathToFileURL(p).href);
    deepStrictEqual(reloaded, o); // IMPORT-LEVEL proof: objects, Buffer bytes, figure Map bytes
    for (const pin of facts.figurePins) allFigurePins.set(pin, o.figures.get(pin));
    entries.push({ file, sha256: sha256(Buffer.from(body)), ...facts, status: 'active', addedAt,
      withdrawnAt: null, reviewEvidence: evidence + ` | split from monolith ${srcSha}` });
  }
}
const figures = [...allFigurePins.keys()].map(pin => ({ sha256: pin, status: 'active', addedAt, withdrawnAt: null, note: 'derived from bundle figures Map at migration' }));
fs.writeFileSync(path.join(root, 'release-retention', 'registry.json'), JSON.stringify({ artifact: 'bcba-release-retention-registry', schema: 'bcba-retention-registry-v2', bundles: entries, figures }, null, 2) + '\n');
// Merge the derived figure pins into the repo's real src/pathways/data/guidedFigures.json:
// existing entries (e.g. RBT figures) are NEVER dropped; a pin already present must be
// byte-identical or migration fails instead of silently rewriting archived bytes.
const figDir = path.join(root, 'src', 'pathways', 'data');
fs.mkdirSync(figDir, { recursive: true });
const figPath = path.join(figDir, 'guidedFigures.json');
let figMap = {};
if (fs.existsSync(figPath)) {
  try { figMap = JSON.parse(fs.readFileSync(figPath, 'utf8')); }
  catch (e) { throw Error('existing guidedFigures.json unparseable: ' + e.message); }
}
for (const [pin, bytes] of allFigurePins) {
  const uri = 'data:image/png;base64,' + bytes.toString('base64');
  if (figMap[pin] !== undefined && figMap[pin] !== uri)
    throw Error('guidedFigures.json already has figure ' + pin + ' with DIFFERENT bytes - refusing to rewrite archived bytes');
  figMap[pin] = uri;
}
fs.writeFileSync(figPath, JSON.stringify(figMap));
console.log('figure map merged: ' + Object.keys(figMap).length + ' total entries (' + allFigurePins.size + ' derived)');
console.log(`MIGRATED ${entries.length} bundle(s) from monolith ${srcSha}; ${figures.length} figure pin(s) derived; import-level deep-equal proven per bundle.`);
