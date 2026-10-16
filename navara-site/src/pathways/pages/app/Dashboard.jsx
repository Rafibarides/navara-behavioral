import React from 'react';
import AppNav from '../../components/AppNav';
import { usePathwaysEffects } from '../../components/Chrome';
import { useRequireUser } from '../../components/useRequireUser';

export default function Dashboard() {
  usePathwaysEffects();
  const user = useRequireUser();
  if (!user) return null;
  return (<>
    <AppNav active="dashboard" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 34 }}>
          <div><span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Guided plan, RBT track (demo)</span>
            <h2 style={{ marginBottom: 0 }}>Welcome back, {user.name}.</h2></div>
          <a className="btn btn-primary" href="/pathways/app/practice">Start practicing</a>
        </div>
        <div className="dash-grid">
          <div className="panel span-8 rv in">
            <h3>Progress by topic</h3>
            {[['Measurement', 82], ['Assessment', 64], ['Skill Acquisition', 71], ['Behavior Reduction', 48], ['Documentation & Reporting', 77]].map(([label, w]) => (
              <div className="prog" key={label}><div className="row"><span>{label}</span><span>{w}%</span></div><div className="bar"><i data-w={w}></i></div></div>
            ))}
            <div className="prog" style={{ marginBottom: 0 }}><div className="row"><span>Professional Conduct</span><span>90%</span></div><div className="bar"><i data-w="90"></i></div></div>
          </div>
          <div className="panel span-4 rv in">
            <h3>1:1 sessions</h3>
            <div className="credit-bubble"><div><div className="n">2</div><div className="t">left</div></div></div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, marginBottom: 18 }}>Guided sessions remaining this month.</p>
            <a className="btn btn-navy btn-sm" href="/pathways/app/book" style={{ width: '100%', justifyContent: 'center' }}>Book a session</a>
          </div>
          <div className="panel span-6 rv in">
            <h3>Recent mock exams</h3>
            <div className="score-row"><span>Mock exam 3, RBT full-length</span><span className="pill pill-teal">78%</span></div>
            <div className="score-row"><span>Mock exam 2, RBT full-length</span><span className="pill pill-teal">74%</span></div>
            <div className="score-row"><span>Mock exam 1, RBT full-length</span><span className="pill pill-sage">66%</span></div>
          </div>
          <div className="panel span-12 rv in">
            <h3>Test-taking tips</h3>
            <div className="score-row"><span>Read the stem for the operative word: FIRST, BEST, MOST. The wrong options usually ignore it.</span><span className="pill pill-teal">Stems</span></div>
            <div className="score-row"><span>First pass answers everything quick; flag the slow ones and return. On the real RBT exam you have about 63 seconds per question.</span><span className="pill pill-teal">Pacing</span></div>
            <div className="score-row"><span>Eliminate by definition: most distractors are the right concept for a different question in the same area.</span><span className="pill pill-teal">Elimination</span></div>
            <p style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>Your 1:1 specialist reviews your error patterns with you in session and sets what to drill next.</p>
          </div>
          <div className="panel span-6 rv in">
            <h3>Suggested next</h3>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 600, marginBottom: 20 }}>Behavior Reduction is your lowest area. Two focused sets there will move your mock average the most.</p>
            <a className="btn btn-primary btn-sm" href="/pathways/app/practice">Practice Behavior Reduction</a>
          </div>
        </div>
        <p style={{ marginTop: 26, fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>Demo data - real progress syncs from the question bank at launch</p>
      </div>
    </section>
  </>);
}
