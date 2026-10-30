// Append-only BCBA release-retention guard v2.3.
// Usage: node check-retained-bcba.mjs <root> [--release] [--previous <path|git:REF:path>] [--bootstrap]
//        [--dev] [--generated <path>]
//   DEFAULT (bare) invocation is SAFE: release semantics with an auto-resolved git
//   baseline - if registry.json is at HEAD the history proof runs against
//   git:HEAD:./release-retention/registry.json; if it is positively not at HEAD the
//   verified first-adoption path applies; any other git state fails closed.
//   --release   strict mode: requires --previous (unless --bootstrap for the adoption commit).
//   --dev       explicit structural-only mode (no history proof, no generated-file
//               requirement). Deliberate escape, never the build default. REFUSED when
//               BCBA_RETENTION_BASELINE is configured (release/CI hosts).
//   Baselines are GIT REFS ONLY in release mode - an unauthenticated local file is not
//   a trusted baseline. Default trusted baseline (no flags/env): origin/main, FETCHED
//   before probing (fail closed if the fetch fails); if the ref cannot be resolved the
//   guard FAILS CLOSED. HEAD is used only with the explicit --local-head-ok escape and a
//   stale remote-tracking ref only with the explicit --offline escape (neither is ever
//   used by the deploy build; both are refused on CI hosts).
//   RETENTION FLOOR: the registry - candidate AND baseline - must always contain the
//   adoption entry for the live retained CANDIDATE (file/sha256/policyId/manifestVersion
//   pinned below, status active or withdrawn). A stale or registry-less baseline can
//   therefore never produce a registry that drops the live pin.
//   Env: BCBA_RETENTION_BASELINE=git:REF:path pins the trusted append-only baseline
//   (e.g. git:origin/main:release-retention/registry.json). When set, first-adoption
//   requires the registry to be absent AT THAT REF - a local HEAD that merely lacks
//   the registry is not first adoption. Unresolvable ref = fail closed.
// Exit 0 = PASS. Exit 1 = FAIL (fail-closed).
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sha256, HEX64, loadBundles, bundleFacts } from './lib-bundles.mjs';

const root = path.resolve(process.argv[2] || '.');
const args = process.argv.slice(3);
const dev = args.includes('--dev');
const localHeadOk = args.includes('--local-head-ok');
const offline = args.includes('--offline');
const releaseFlag = args.includes('--release');
const bootstrap = args.includes('--bootstrap');
const allowMissingGenerated = args.includes('--allow-missing-generated'); // builder pre-check only
const prevIdx = args.indexOf('--previous');
const prevArg = prevIdx > -1 ? args[prevIdx + 1] : null;
const genIdx = args.indexOf('--generated');
const generatedOpt = genIdx > -1 ? args[genIdx + 1] : null;
const fail = msg => { console.error('FAIL: ' + msg); process.exit(1); };
const read = p => { try { return fs.readFileSync(p); } catch { fail('missing required file ' + p); } };

const envBaseline = process.env.BCBA_RETENTION_BASELINE || null;
const onCI = !!(process.env.CI || process.env.GITHUB_ACTIONS || process.env.VERCEL);
if (onCI && localHeadOk) fail('--local-head-ok refused on a CI host - the shipped build enforces the fetched trusted baseline only');
if (onCI && offline) fail('--offline refused on a CI host - the shipped build must fetch the trusted baseline');
if (dev && offline) fail('--offline is meaningless with --dev (no baseline is read in structural-only mode)');
if (offline && localHeadOk) fail('--offline and --local-head-ok are mutually exclusive');
if (dev && envBaseline) fail('--dev refused: BCBA_RETENTION_BASELINE is configured (release/CI host) - structural-only mode is not allowed here');
if (dev && (releaseFlag || bootstrap || prevArg || allowMissingGenerated || localHeadOk)) fail('--dev (structural-only) cannot be combined with --release/--bootstrap/--previous/--allow-missing-generated/--local-head-ok');
if (prevArg && envBaseline && prevArg !== envBaseline) fail('conflicting baselines: --previous (' + prevArg + ') vs BCBA_RETENTION_BASELINE (' + envBaseline + ')');

// First-adoption probe: returns 'present' | 'absent', failing closed on any other git
// state. cwd-relative ref: without ./, HEAD:path is repo-ROOT-relative and a project in
// a subdirectory falsely reads as "not committed" (reviewer-reproduced bypass).
function probeHeadRegistry() {
  try { execSync('git rev-parse --is-inside-work-tree', { cwd: root, stdio: 'pipe' }); }
  catch { fail('safe mode requires running inside the git work tree (git missing or not a repository here) - failing closed; use --dev for a deliberate structural-only check'); }
  try {
    execSync('git show HEAD:./release-retention/registry.json', { cwd: root, stdio: 'pipe' });
    return 'present';
  } catch (e) {
    if (e.killed === false && e.status === undefined && e.code === undefined) throw e; // not a git failure
    const err = String(e.stderr || '') + String(e.stdout || '');
    const absent =
      /exists on disk, but not in 'HEAD'/.test(err) ||   // file present in worktree, not committed
      /does not exist in 'HEAD'/.test(err) ||            // path unknown to HEAD
      /ambiguous argument 'HEAD'/.test(err) ||           // repo with no commits yet (older git)
      /invalid object name 'HEAD'/.test(err) ||          // repo with no commits yet (newer git)
      /does not have any commits yet/.test(err) ||       // branch-level variant
      /unknown revision or path not in the working tree/.test(err) && /HEAD/.test(err);
    if (!absent) fail('could not verify registry baseline state: ' + (err.trim().split('\n')[0] || 'git error') + ' - failing closed');
    return 'absent';
  }
}

// Freshness: when the trusted ref names a configured git remote (origin/main, ...),
// FETCH it before probing - a stale remote-tracking ref must never weaken the baseline
// (fake first adoption, missing withdrawals). Fetch failure fails closed; --offline is
// the explicit local-only escape. Local refs (shas, tags, refs/...) are not fetched.
function fetchForRef(ref) {
  if (offline) return;
  const m = /^([A-Za-z0-9][A-Za-z0-9._-]*)\//.exec(ref);
  if (!m) return;
  let remotes = [];
  try { remotes = execSync('git remote', { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).split(/\s+/).filter(Boolean); }
  catch { return; }
  if (!remotes.includes(m[1])) return; // not a configured remote; rev-parse decides below
  try { execSync('git fetch ' + m[1], { cwd: root, stdio: 'pipe' }); }
  catch { fail('trusted baseline fetch failed (git fetch ' + m[1] + ') - failing closed; --offline is an explicit local-only escape the deploy build never uses'); }
}

// Resolve a trusted git baseline ref: fetch it fresh when it is a remote-tracking ref,
// verify the REF exists (fail closed otherwise), then distinguish registry-present
// from registry-absent at that ref.
function probeTrustedRef(spec) {
  const m = /^git:([^:]+):(.+)$/.exec(spec);
  if (!m) fail('malformed BCBA_RETENTION_BASELINE (want git:REF:path): ' + spec);
  const ref = m[1];
  fetchForRef(ref);
  const p = m[2].startsWith('/') || m[2].startsWith('./') ? m[2] : './' + m[2];
  try { execSync(`git rev-parse --verify ${ref}^{commit}`, { cwd: root, stdio: 'pipe' }); }
  catch { fail('trusted baseline ref cannot be resolved: ' + ref + ' (fetch it before building) - failing closed'); }
  try { execSync(`git show ${ref}:${p}`, { cwd: root, stdio: 'pipe' }); return 'present'; }
  catch (e) {
    if (e.killed === false && e.status === undefined && e.code === undefined) throw e;
    const err = String(e.stderr || '') + String(e.stdout || '');
    if (/exists on disk, but not in '|does not exist in '|does not have any commits yet/.test(err)) return 'absent';
    fail('could not verify registry state at trusted ref ' + ref + ': ' + (err.trim().split('\n')[0] || 'git error') + ' - failing closed');
  }
}

// Mode resolution: bare invocation = release semantics with auto baseline. A configured
// trusted baseline (env) takes precedence over HEAD: first adoption is only first
// adoption when the TRUSTED ref lacks the registry, not merely when local HEAD does.
const releaseMode = !dev;
let firstAdoption = false;
let baseline = null;
const requireWorkTree = () => {
  try { execSync('git rev-parse --is-inside-work-tree', { cwd: root, stdio: 'pipe' }); }
  catch { fail('safe mode requires running inside the git work tree (git missing or not a repository here) - failing closed; use --dev for a deliberate structural-only check'); }
};
if (releaseMode) {
  if (bootstrap && prevArg) fail('--bootstrap and --previous are mutually exclusive');
  if (releaseFlag && !bootstrap && !prevArg && !envBaseline) fail('--release requires --previous (append-only proof); --bootstrap is allowed once for the initial adoption commit');
  if (prevArg) {
    if (!prevArg.startsWith('git:')) fail('--previous in release mode must be a git: ref (an unauthenticated local file is not a trusted baseline)');
    baseline = prevArg;
  } else if (envBaseline) {
    if (!envBaseline.startsWith('git:')) fail('BCBA_RETENTION_BASELINE must be a git: ref (an unauthenticated local file is not a trusted baseline)');
    if (probeTrustedRef(envBaseline) === 'present') baseline = envBaseline;
    else firstAdoption = true; // trusted ref verifiably lacks the registry
  } else if (localHeadOk) {
    const state = probeHeadRegistry();
    if (state === 'present') baseline = 'git:HEAD:./release-retention/registry.json';
    else firstAdoption = true; // explicit local escape; never used by the deploy build
  } else {
    // DEFAULT: trusted baseline origin/main. No flag or host config can soften this on
    // the real build path; an unresolvable ref fails closed (CI must fetch).
    requireWorkTree();
    if (probeTrustedRef('git:origin/main:release-retention/registry.json') === 'present')
      baseline = 'git:origin/main:./release-retention/registry.json';
    else firstAdoption = true; // origin/main verifiably lacks the registry (adoption branch)
  }
  if (bootstrap && baseline) fail('--bootstrap is valid only for the adoption commit; the registry already exists at the baseline (' + baseline + ') - use --previous');
}

// ---- retention floor: the live adoption pin is hardcoded and must ALWAYS be listed,
// active or withdrawn, in both the candidate and any baseline registry. This is the
// git-independent backstop: no stale ref, missing fetch, or fake first-adoption path
// can yield a registry that drops the currently-live retained bytes.
const FLOOR = Object.freeze({
  file: 'generated-bcba-bundle-CANDIDATE.mjs',
  sha256: 'e8dfec17986215489ff13bc0fbace08496357290d81be6abe126fbdf3f56f7b0',
  policyId: 'bcba-sdmo-lessons-policy-v1',
  manifestVersion: 'bcba-sdmo-manifest@sha256:dc19f86052b71a5904c0e4e82ac005b1b3700d6097cf8da3efb17cf05129b675',
});
function floorCheck(r, label) {
  const e = (r.bundles || []).find(b => b.file === FLOOR.file);
  if (!e) fail(label + ' lacks the retention-floor entry ' + FLOOR.file + ' - the live adoption pin can never be dropped (stale baseline or fake first adoption cannot bypass this)');
  for (const k of ['sha256', 'policyId', 'manifestVersion'])
    if (e[k] !== FLOOR[k]) fail(label + ' retention-floor entry ' + FLOOR.file + ' field ' + k + ' diverges from the pinned adoption value - failing closed');
}

const GENERATED = generatedOpt ? path.resolve(generatedOpt) : path.join(root, 'supabase', 'functions', 'bcba-program', 'generated-bcba-bundle.mjs');

// ---- registry load + schema
const regPath = path.join(root, 'release-retention', 'registry.json');
let reg;
try { reg = JSON.parse(read(regPath)); } catch (e) { fail('registry.json unparseable: ' + e.message); }
if (reg.schema !== 'bcba-retention-registry-v2') fail('unknown registry schema ' + reg.schema);
floorCheck(reg, 'registry.json');
if (!Array.isArray(reg.bundles) || !reg.bundles.length) fail('registry.bundles must be a non-empty array');
if (!Array.isArray(reg.figures)) fail('registry.figures must be an array');
const seenFiles = new Set(), seenShas = new Set();
for (const [i, b] of reg.bundles.entries()) {
  for (const k of ['file','sha256','policyId','manifestVersion','catalogSha','bindingSha','status','addedAt','reviewEvidence'])
    if (typeof b[k] !== 'string' || !b[k]) fail(`bundles[${i}].${k} missing/not string`);
  for (const k of ['sha256','catalogSha','bindingSha']) if (!HEX64.test(b[k])) fail(`bundles[${i}].${k} not 64-hex`);
  if (!/^[^@]+@sha256:[0-9a-f]{64}$/.test(b.manifestVersion)) fail(`bundles[${i}].manifestVersion not digest-bearing`);
  if (!Array.isArray(b.figurePins) || !b.figurePins.every(p => HEX64.test(p))) fail(`bundles[${i}].figurePins must be 64-hex array`);
  if (!['active','withdrawn'].includes(b.status)) fail(`bundles[${i}].status invalid`);
  if (b.withdrawnAt !== null && typeof b.withdrawnAt !== 'string') fail(`bundles[${i}].withdrawnAt must be null or string`);
  if (b.status === 'withdrawn' && !b.withdrawnAt) fail(`bundles[${i}] withdrawn without withdrawnAt`);
  if (seenFiles.has(b.file)) fail('duplicate bundle file ' + b.file);
  if (seenShas.has(b.sha256)) fail('duplicate bundle sha256 (re-adding identical bytes is not reinstatement)');
  seenFiles.add(b.file); seenShas.add(b.sha256);
}
const figReg = new Map();
for (const [i, f] of reg.figures.entries()) {
  if (!HEX64.test(f.sha256 || '')) fail(`figures[${i}].sha256 not 64-hex`);
  if (!['active','withdrawn'].includes(f.status)) fail(`figures[${i}].status invalid (superseded is a note, not a status)`);
  if (f.status === 'withdrawn' && !f.withdrawnAt) fail(`figures[${i}] withdrawn without withdrawnAt`);
  if (figReg.has(f.sha256)) fail('duplicate figure ' + f.sha256);
  figReg.set(f.sha256, f);
}

// ---- per-bundle: file bytes exact AND module-import facts match the listed pins
// A member pin (policyId + manifestVersion) may appear at most once across ALL entries,
// whatever the status: reusing a pin under different bytes rewrites history, and
// reusing it under identical bytes is silent reinstatement (also caught by the sha rule).
const memberPins = new Map(); // pin -> file
const bundleObjs = new Map(); // file -> {obj, facts}
for (const b of reg.bundles) {
  const memberPin = `${b.policyId}|${b.manifestVersion}`;
  if (memberPins.has(memberPin)) fail(`duplicate member pin ${memberPin} across entries ${memberPins.get(memberPin)} and ${b.file} - pins are never reused; a new bundle gets a new pin`);
  memberPins.set(memberPin, b.file);
  const p = path.join(root, 'release-retention', b.file);
  const bytes = read(p);
  if (sha256(bytes) !== b.sha256) fail(`bundle ${b.file} bytes changed`);
  let objs;
  try { objs = await loadBundles(pathToFileURL(p).href); } catch (e) { fail(`bundle ${b.file} not importable: ` + e.message); }
  if (objs.length !== 1) fail(`bundle ${b.file} must export exactly one bundle`);
  let facts;
  try { facts = bundleFacts(objs[0]); } catch (e) { fail(`bundle ${b.file} invalid: ` + e.message); }
  if (facts.policyId !== b.policyId || facts.manifestVersion !== b.manifestVersion ||
      facts.catalogSha !== b.catalogSha || facts.bindingSha !== b.bindingSha ||
      JSON.stringify(facts.figurePins) !== JSON.stringify(b.figurePins))
    fail(`bundle ${b.file} imported pins diverge from registry listing`);
  bundleObjs.set(b.file, { obj: objs[0], facts, status: b.status });
}

// ---- figures: every referenced pin registered; every registered pin byte-exact in guidedFigures.json
const figMap = JSON.parse(read(path.join(root, 'src', 'pathways', 'data', 'guidedFigures.json')));
const referenced = new Set();
for (const { facts } of bundleObjs.values()) for (const p of facts.figurePins) referenced.add(p);
for (const p of referenced) if (!figReg.has(p)) fail(`figure ${p} referenced by a bundle but missing from registry.figures`);
for (const [p, f] of figReg) {
  const uri = figMap[p];
  if (typeof uri !== 'string' || !uri.startsWith('data:image/')) fail(`archived figure ${p} missing from guidedFigures.json (never drop)`);
  if (sha256(Buffer.from(uri.split(',')[1], 'base64')) !== p) fail(`figure ${p} bytes changed`);
}
// no figure withdrawal while any non-withdrawn bundle references it
for (const [file, { facts, status }] of bundleObjs) {
  if (status === 'withdrawn') continue;
  for (const p of facts.figurePins) {
    const f = figReg.get(p);
    if (f.status === 'withdrawn') fail(`figure ${p} withdrawn while still referenced by non-withdrawn bundle ${file}`);
  }
}

// ---- append-only history (auto baseline in safe mode; explicit --previous; skipped only for verified first adoption)
if (baseline) {
  let prevRaw;
  if (baseline.startsWith('git:')) {
    // cwd-relative path: git show REF:path is repo-root-relative, so a project in a
    // subdirectory would fail to find a committed registry; REF:./path is cwd-relative.
    const m = /^git:([^:]+):(.+)$/.exec(baseline);
    if (!m) fail('malformed --previous git: reference (want git:REF:path): ' + baseline);
    const refPath = m[1] + ':' + (m[2].startsWith('/') || m[2].startsWith('./') ? m[2] : './' + m[2]);
    try { prevRaw = execSync(`git show ${refPath}`, { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }); }
    catch { fail('cannot read previous registry from ' + baseline); }
  } else prevRaw = read(baseline).toString();
  let prev; try { prev = JSON.parse(prevRaw); } catch { fail('previous registry unparseable'); }
  floorCheck(prev, 'baseline registry (' + baseline + ')');
  const curByFile = new Map(reg.bundles.map(b => [b.file, b]));
  for (const pb of prev.bundles || []) {
    const cur = curByFile.get(pb.file);
    if (!cur) fail(`registry entry deleted: ${pb.file} (entries are never removed; withdraw instead)`);
    for (const k of ['sha256','policyId','manifestVersion','catalogSha','bindingSha','figurePins','addedAt','reviewEvidence'])
      if (JSON.stringify(cur[k]) !== JSON.stringify(pb[k])) fail(`registry entry ${pb.file} field ${k} changed (append-only)`);
    if (pb.status !== cur.status && !(pb.status === 'active' && cur.status === 'withdrawn'))
      fail(`registry entry ${pb.file} status ${pb.status} -> ${cur.status} not allowed`);
    if (pb.withdrawnAt !== cur.withdrawnAt && !(pb.withdrawnAt === null && cur.status === 'withdrawn' && typeof cur.withdrawnAt === 'string'))
      fail(`registry entry ${pb.file} withdrawnAt changed outside the withdrawal transition`);
  }
  const prevFig = new Map((prev.figures || []).map(f => [f.sha256, f]));
  for (const [p, pf] of prevFig) {
    const cur = figReg.get(p);
    if (!cur) fail(`figure registry entry deleted: ${p}`);
    if (pf.status !== cur.status && !(pf.status === 'active' && cur.status === 'withdrawn'))
      fail(`figure ${p} status ${pf.status} -> ${cur.status} not allowed`);
  }
} else if (releaseMode && !firstAdoption) fail('release mode without a baseline (internal error)');

// ---- generated combined bundle: substitution + coverage, keyed by member pins (policyId+manifestVersion)
if (fs.existsSync(GENERATED)) {
  let genObjs;
  try { genObjs = await loadBundles(pathToFileURL(GENERATED).href); } catch (e) { fail('generated bundle not importable: ' + e.message); }
  const genPins = genObjs.map(o => { let f; try { f = bundleFacts(o); } catch (e) { fail('generated bundle element invalid: ' + e.message); } return f; });
  for (const b of reg.bundles) {
    const present = genPins.some(f => f.policyId === b.policyId && f.manifestVersion === b.manifestVersion);
    if (b.status === 'withdrawn' && present)
      fail(`generated bundle serves withdrawn member pin ${b.policyId} / ${b.manifestVersion} (must be explicit unavailable, never substituted)`);
    if (b.status === 'active' && !present)
      fail(`generated bundle missing active member pin ${b.policyId} / ${b.manifestVersion}`);
  }
} else if (releaseMode && !allowMissingGenerated) fail('generated combined bundle missing: ' + GENERATED);

console.log(`PASS retention registry v2: ${reg.bundles.length} bundle(s) [${reg.bundles.filter(b=>b.status==='active').length} active], ${reg.figures.length} figure(s) [${referenced.size} referenced]${releaseMode?(firstAdoption?' (first-adoption mode)':' (release mode)'):' (structural-only --dev)'}${baseline?' append-only verified':''}`);
