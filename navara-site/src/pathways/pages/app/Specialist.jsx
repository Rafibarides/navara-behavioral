import React from 'react';
import AppNav from '../../components/AppNav';
import { usePathwaysEffects } from '../../components/Chrome';
import { useRequireUser } from '../../components/useRequireUser';

// INTERNAL staff view. Live mode gates this on profiles.role = 'staff'.
// The member never sees this page: error patterns are reviewed together in the 1:1.
const DEMO_PATTERNS = [
  { tag: 'intervention_before_assessment', plain: 'Picks the intervention before the assessment', n: 6, trend: 'improving', areas: 'Behavior Reduction, Skill Acquisition', pressure: false },
  { tag: 'confuses_latency_with_duration', plain: 'Confuses latency with duration', n: 4, trend: 'steady', areas: 'Measurement', pressure: true },
  { tag: 'rapport_over_ethics', plain: 'Lets rapport override an ethics boundary', n: 2, trend: 'new', areas: 'Professional Conduct', pressure: false },
];
const DEMO_MEMBER = { name: 'Demo Member', track: 'RBT', plan: 'Guided' };

export default function Specialist() {
  usePathwaysEffects();
  const user = useRequireUser();
  if (!user) return null;
  if (user.role !== 'staff' && user.role !== 'admin') { window.location.replace('/pathways/app/dashboard'); return null; }
  return (<>
    <AppNav active="" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap" style={{ maxWidth: 860 }}>
        <span className="eyebrow" style={{ color: '#a33b41' }}>Internal - specialist view</span>
        <h2>Error-pattern overview: {DEMO_MEMBER.name}</h2>
        <p style={{ color: 'var(--ink-2)', fontWeight: 600, marginBottom: 8 }}>{DEMO_MEMBER.track} track, {DEMO_MEMBER.plan} plan. Review this before the 1:1 and walk the member through it in session - members never see this page.</p>
        <p style={{ marginBottom: 28, fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>Demo data - live patterns aggregate from recorded attempts at launch</p>
        <div className="panel" style={{ marginBottom: 22 }}>
          <h3>Patterns to cover in the next 1:1</h3>
          {DEMO_PATTERNS.map((p) => (
            <div className="score-row" key={p.tag}>
              <span><b>{p.plain}</b><br />
                <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>
                  {p.n} misses - {p.areas}{p.pressure ? ' - shows up under time pressure' : ''}
                </span></span>
              <span className={'pill ' + (p.trend === 'improving' ? 'pill-teal' : 'pill-sage')}>{p.trend}</span>
            </div>
          ))}
        </div>
        <div className="panel">
          <h3>Suggested session moves</h3>
          <div className="score-row"><span>Drill stem reading for FIRST/BEST before any content review - two of the three patterns are stem-discipline, not knowledge gaps.</span><span className="pill pill-teal">strategy</span></div>
          <div className="score-row"><span>Run a short timed Measurement set together and narrate the latency/duration split out loud.</span><span className="pill pill-teal">drill</span></div>
          <div className="score-row"><span>Revisit the gift-policy scenario: reframe rapport vs boundary with one of your own supervision cases.</span><span className="pill pill-teal">ethics</span></div>
        </div>
      </div>
    </section>
  </>);
}
