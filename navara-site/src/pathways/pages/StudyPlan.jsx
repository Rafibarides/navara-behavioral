import React, { useState } from 'react';
import { Nav, Footer, usePathwaysEffects } from '../components/Chrome';
import { joinWaitlist } from '../lib/db';

const LINKS = (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login">Log in</a>
  <a className="btn btn-primary btn-sm" href="/pathways/login">Create account</a>
</>);

const AREAS = {
  rbt: ['Data Collection and Graphing', 'Behavior Assessment', 'Behavior Acquisition', 'Behavior Reduction', 'Documentation and Reporting', 'Ethics'],
  bcba: ['Behaviorism and Philosophical Foundations', 'Concepts and Principles', 'Measurement, Data Display, and Interpretation', 'Experimental Design', 'Ethical and Professional Issues', 'Behavior Assessment', 'Behavior-Change Procedures', 'Selecting and Implementing Interventions', 'Personnel Supervision and Management'],
};

export default function StudyPlan() {
  usePathwaysEffects();
  const [track, setTrack] = useState('rbt');
  const [date, setDate] = useState('');
  const [hours, setHours] = useState(5);
  const [plan, setPlan] = useState(null);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const build = () => {
    const areas = AREAS[track];
    let weeks = 4;
    let days = null;
    if (date) {
      days = Math.max(7, Math.ceil((new Date(date + 'T12:00:00') - Date.now()) / 86400000));
      weeks = Math.min(26, Math.max(2, Math.floor(days / 7)));
    }
    const rows = [];
    // Spread areas across the first 60% of weeks, then mixed practice and mocks.
    const learnWeeks = Math.max(1, Math.round(weeks * 0.6));
    const perWeek = Math.ceil(areas.length / learnWeeks);
    for (let w = 1; w <= weeks; w++) {
      if (w <= learnWeeks) {
        const chunk = areas.slice((w - 1) * perWeek, w * perWeek);
        rows.push({ w, focus: chunk.length ? chunk.join(' + ') : 'Catch-up and review', note: 'Learn the concepts, then practice questions on ' + (chunk.length ? (chunk.length === 1 ? 'this area' : 'these areas') : 'your weakest areas') + '.' });
      } else if (w === weeks) {
        rows.push({ w, focus: 'Light review only', note: 'Re-read your flagged questions. Rest well the two days before the exam.' });
      } else if (w === weeks - 1) {
        rows.push({ w, focus: 'Timed set + weak-area review', note: 'One timed 10-question set. Spend the rest of the week on the areas that cost you points.' });
      } else {
        rows.push({ w, focus: 'Mixed practice across all areas', note: 'Timed sets. Keep a list of every question that fools you and re-read why.' });
      }
    }
    setPlan({ weeks, days, rows, hours });
  };

  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    try { await joinWaitlist({ email, track, plan: 'study-plan' }); } catch { /* confirmation still shows */ }
    setSent(true);
  };

  return (<>
    <Nav links={LINKS} />
    <main>
      <header className="track-hero" style={{ padding: '170px 0 80px' }}>
        <div className="orb orb-2"></div><div className="orb orb-3"></div>
        <div className="wrap">
          <span className="eyebrow rv in">Free study-plan builder</span>
          <h1 data-rise>Your exam date. <span className="grad">Your plan.</span></h1>
          <p className="lead" style={{ marginLeft: 'auto', marginRight: 'auto' }}>Pick your track and your target date. Get a week-by-week checklist you can print or get by email. A plan is a starting point, not a promise - adjust it as you learn.</p>
        </div>
      </header>
      <section className="section" style={{ paddingTop: 20 }}>
        <div className="wrap" style={{ maxWidth: 780 }}>
          <div className="panel rv in" style={{ padding: 30 }}>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="field" style={{ minWidth: 150 }}>
                <label htmlFor="sp-track" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Track</label>
                <select id="sp-track" value={track} onChange={(e) => setTrack(e.target.value)} style={{ padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(27,59,98,.2)', font: 'inherit', width: '100%' }}>
                  <option value="rbt">RBT</option>
                  <option value="bcba">BCBA</option>
                </select>
              </div>
              <div className="field" style={{ minWidth: 180 }}>
                <label htmlFor="sp-date" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Target exam date (optional)</label>
                <input id="sp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid rgba(27,59,98,.2)', font: 'inherit', width: '100%' }} />
              </div>
              <div className="field" style={{ minWidth: 130 }}>
                <label htmlFor="sp-hours" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Hours per week</label>
                <input id="sp-hours" type="number" min="1" max="30" value={hours} onChange={(e) => setHours(Math.max(1, Math.min(30, +e.target.value || 1)))} style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid rgba(27,59,98,.2)', font: 'inherit', width: '100%' }} />
              </div>
              <button className="btn btn-primary" onClick={build}>Build my plan</button>
            </div>
          </div>
          {plan && (
            <div className="panel rv in" style={{ padding: 30, marginTop: 24 }} id="plan-output">
              <h3 style={{ marginBottom: 4 }}>{plan.weeks}-week {track === 'bcba' ? 'BCBA' : 'RBT'} study plan</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 600, marginBottom: 20 }}>
                {plan.days ? plan.days + ' days to your target date. ' : ''}About {plan.hours} focused hours a week: roughly {Math.max(1, Math.round(plan.hours * 0.6))} learning, {Math.max(1, Math.round(plan.hours * 0.4))} practicing.
              </p>
              {plan.rows.map((r) => (
                <div key={r.w} style={{ display: 'flex', gap: 16, padding: '12px 0', borderTop: '1px solid rgba(27,59,98,.1)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--teal-3)', minWidth: 74 }}>Week {r.w}</div>
                  <div><div style={{ fontWeight: 700 }}>{r.focus}</div><div style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 600 }}>{r.note}</div></div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
                <button className="btn btn-navy btn-sm" onClick={() => window.print()}>Print this plan</button>
                <a className="btn btn-ghost btn-sm" href="/pathways/sample-quiz">Warm up with the free sample quiz</a>
              </div>
              <div style={{ marginTop: 22, borderTop: '1px solid rgba(27,59,98,.1)', paddingTop: 18 }}>
                {!sent ? (<>
                  <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Get launch news for the full {track === 'bcba' ? 'BCBA' : 'RBT'} bank - and we will send this plan with it.</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                      style={{ padding: '12px 16px', borderRadius: 12, border: '1.5px solid rgba(27,59,98,.2)', minWidth: 240, font: 'inherit' }} />
                    <button className="btn btn-navy" onClick={send}>Email me the plan</button>
                  </div>
                </>) : (
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal-3)' }}>Done - you are on the list. We will tell you the moment the full bank opens.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
    <Footer />
  </>);
}
