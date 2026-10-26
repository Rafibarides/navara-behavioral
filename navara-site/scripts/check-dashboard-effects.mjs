// Regression check (added after the 2026-10-25 dashboard outage):
// Dashboard progress bars render only after async data arrives, and the
// component has an early `return null` while the session loads. Any React
// hook placed after that early return crashes the page for signed-in users
// (hook-order violation), and usePathwaysEffects with empty deps never
// observes late-rendered bar elements (bars stay gray forever).
// This script fails the build-check if either pattern regresses.
import { readFileSync } from 'fs';

const src = readFileSync(new URL('../src/pathways/pages/app/Dashboard.jsx', import.meta.url), 'utf8');
let fail = 0;

const effectsCall = src.indexOf('usePathwaysEffects(');
if (effectsCall === -1) { console.error('FAIL: usePathwaysEffects is not called'); fail = 1; }
else {
  const earlyReturn = src.indexOf('if (!user) return null;');
  if (earlyReturn !== -1 && effectsCall > earlyReturn) {
    console.error('FAIL: usePathwaysEffects is called AFTER the `if (!user) return null` early return - hook-order crash for signed-out first render');
    fail = 1;
  }
  const m = src.slice(effectsCall).match(/^usePathwaysEffects\(\s*\)/m);
  if (m) {
    console.error('FAIL: usePathwaysEffects() called with empty deps - async progress bars will never get fill widths');
    fail = 1;
  }
}
// Any other hook (useEffect/useState/useMemo...) after the early return is the same crash class.
const earlyRet = src.indexOf('if (!user) return null;');
if (earlyRet !== -1) {
  const lateHook = src.slice(earlyRet).match(/\b(useState|useEffect|useMemo|useCallback|useRef|usePathwaysEffects)\s*\(/);
  if (lateHook) {
    console.error('FAIL: hook "' + lateHook[1] + '" found after the `if (!user) return null` early return');
    fail = 1;
  }
}

if (fail) process.exit(1);
console.log('dashboard effects check: OK');
