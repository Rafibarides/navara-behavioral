import React, { useEffect, useState } from 'react';
import AppNav from '../../components/AppNav';
import { usePathwaysEffects } from '../../components/Chrome';
import { useRequireUser } from '../../components/useRequireUser';
import { sessionCredits, fetchAreaProgress } from '../../lib/db';
import { DEMO } from '../../config';

const DEMO_PROGRESS = [['Measurement', 82], ['Assessment', 64], ['Skill Acquisition', 71], ['Behavior Reduction', 48], ['Documentation & Reporting', 77], ['Professional Conduct', 90]];

export default function Dashboard() {
  usePathwaysEffects();
  const user = useRequireUser();
  const [credits, setCredits] = useState(null);
  const [progress, setProgress] = useState(null);
  useEffect(() => {
    if (!user) return;
    sessionCredits().then(setCredits);
    fetchAreaProgress().then((rows) => setProgress(rows && rows.length ? rows : null));
  }, [user]);
  if (!user) return null;
  const planLabel = (user.plan === 'guided' ? 'Guided' : user.plan === 'self-study' ? 'Self-Study' : 'Sample') + ' plan, ' + (user.track === 'bcba' ? 'BCBA' : 'RBT') + ' track' + (user.demo || DEMO ? ' (demo)' : '');
  const showDemo = DEMO || user.demo;
  const bars = progress ? progress.map((r) => [r.area, r.pct]) : (showDemo ? DEMO_PROGRESS : null);
  return (<>
    <AppNav active="dashboard" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 34 }}>
          <div><span className="eyebrow" style={{ color: 'var(--teal-3)' }}>{planLabel}</span>
            <h2 style={{ marginBottom: 0 }}>Welcome back, {user.name}.</h2></div>
          <a className="btn btn-primary" href="/pathways/app/practice">Start practicing</a>
        </div>
        <div className="dash-grid">
          <div className="panel span-8 rv in">
            <h3>Progress by topic</h3>
            {bars ? bars.map(([label, w]) => (
              <div className="prog" key={label}><div className="row"><span>{label}</span><span>{w}%</span></div><div className="bar"><i data-w={w}></i></div></div>
            )) : (
              <p style={{ fontSize: 15, color: 'var(--ink-2)', fontWeight: 600, margin: '10px 0 4px' }}>No practice data yet. Your scores by topic will appear here after your first practice set.</p>
            )}
            {bars && !progress && <p style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, marginTop: 14 }}>Demo progress shown. Real tracking starts with your first practice set.</p>}
          </div>
          <div className="panel span-4 rv in">
            <h3>1:1 sessions</h3>
            <div className="credit-bubble"><div><div className="n">{credits === null ? '-' : credits}</div><div className="t">left</div></div></div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, marginBottom: 18 }}>Guided sessions remaining this month.</p>
            <a className="btn btn-navy btn-sm" href="/pathways/app/book" style={{ width: '100%', justifyContent: 'center' }}>Book a session</a>
          </div>
          <div className="panel span-12 rv in">
            <h3>Test-taking tips</h3>
            <div className="score-row"><span>Read the last line of the question first - it tells you what is actually being asked.</span><span className="pill pill-teal">Strategy</span></div>
            <div className="score-row"><span>Flag and move: never give one question more than about a minute on a first pass.</span><span className="pill pill-sage">Pacing</span></div>
            <div className="score-row"><span>When two options both look right, ask which one the BACB would call the <i>first</i> or <i>most direct</i> action.</span><span className="pill pill-teal">Elimination</span></div>
          </div>
        </div>
      </div>
    </section>
  </>);
}
