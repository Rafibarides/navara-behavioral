import React, { useEffect, useState } from 'react';
import AppNav from '../../components/AppNav';
import { usePathwaysEffects } from '../../components/Chrome';
import { useRequireUser } from '../../components/useRequireUser';
import { sessionCredits, fetchAreaProgress, fetchMemberEvidence, DEMO_EVIDENCE } from '../../lib/db';
import { hasPassword, setPassword } from '../../lib/auth';
import { DEMO } from '../../config';

const pretty = (s) => { const t = String(s || '').replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };

const DEMO_PROGRESS = [['Data Collection and Graphing', 82], ['Behavior Assessment', 64], ['Behavior Acquisition', 71], ['Behavior Reduction', 48], ['Documentation & Reporting', 77], ['Professional Conduct', 90]];

export default function Dashboard() {
  usePathwaysEffects();
  const user = useRequireUser();
  const [credits, setCredits] = useState(null);
  const [progress, setProgress] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [needsPw, setNeedsPw] = useState(false);
  const [pw, setPw] = useState('');
  const [pwMsg, setPwMsg] = useState(null);
  useEffect(() => {
    if (!user) return;
    sessionCredits().then(setCredits);
    fetchAreaProgress().then((rows) => setProgress(rows && rows.length ? rows : null));
    if (DEMO || user.demo) setEvidence(null);
    else fetchMemberEvidence().then((rows) => setEvidence(rows && rows.length ? rows : null));
    if (!DEMO && !user.demo && !localStorage.getItem('pw_skip_setpw')) {
      hasPassword().then((h) => setNeedsPw(!h)).catch(() => {});
    }
  }, [user]);
  if (!user) return null;
  const planLabel = (user.plan === 'guided' ? 'Guided' : user.plan === 'self-study' ? 'Self-Study' : 'Sample') + ' plan, ' + (user.track === 'bcba' ? 'BCBA' : 'RBT') + ' track' + (user.demo || DEMO ? ' (demo)' : '');
  const showDemo = DEMO || user.demo;
  const bars = progress ? progress.map((r) => [r.area, r.pct]) : (showDemo ? DEMO_PROGRESS : null);
  const cards = evidence || (showDemo ? DEMO_EVIDENCE : null);
  return (<>
    <AppNav active="dashboard" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 34 }}>
          <div><span className="eyebrow" style={{ color: 'var(--teal-3)' }}>{planLabel}</span>
            <h2 style={{ marginBottom: 4 }}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name && String(user.name).toLowerCase() !== String(user.email || '').split('@')[0].toLowerCase() ? String(user.name).split(' ')[0].replace(/^./, (c) => c.toUpperCase()) : 'there'}.</h2>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>Future {user.track === 'bcba' ? 'BCBA' : 'RBT'} - you've got this.</p></div>
          <a className="btn btn-primary" href="/pathways/app/practice">Start practicing</a>
        </div>
        {!user.demo && user.trackSet === false && (
          <div className="panel rv in" style={{ marginBottom: 22, borderLeft: '4px solid var(--sage)' }}>
            <b style={{ fontSize: 15 }}>Which exam are you preparing for?</b>
            <p style={{ margin: '4px 0 12px', fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 600 }}>One question so your practice, timed sets, and study plan match your exam.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['rbt', 'bcba'].map((t) => (
                <button key={t} className="btn btn-navy btn-sm" onClick={async () => {
                  try {
                    const { getClient } = await import('../../lib/db');
                    const sb = await getClient();
                    await sb.from('profiles').upsert({ id: user.id, track: t }, { onConflict: 'id' });
                  } catch { /* account page can set it too */ }
                  window.location.reload();
                }}>{t === 'rbt' ? 'RBT exam' : 'BCBA exam'}</button>
              ))}
            </div>
          </div>
        )}
        {needsPw && (
          <div className="panel rv in" style={{ marginBottom: 22, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', borderLeft: '4px solid var(--teal-3)' }}>
            <div style={{ flex: '1 1 260px' }}>
              <b style={{ fontSize: 15 }}>Set a password for faster sign-ins</b>
              <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 600 }}>You signed in with an email link. Add a password so you can get back in from any device without waiting for email.</p>
            </div>
            <input type="password" placeholder="New password (6+ characters)" value={pw} onChange={(e) => setPw(e.target.value)}
              style={{ flex: '0 1 240px', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(15,31,51,.18)', fontFamily: 'inherit', fontSize: 14 }} />
            <button className="btn btn-primary btn-sm" onClick={async () => {
              if (pw.length < 6) { setPwMsg('At least 6 characters.'); return; }
              try { await setPassword(pw); setNeedsPw(false); } catch { setPwMsg('Could not save it. Try again.'); }
            }}>Save password</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { localStorage.setItem('pw_skip_setpw', '1'); setNeedsPw(false); }}>Not now</button>
            {pwMsg && <p style={{ width: '100%', margin: 0, fontSize: 13, color: '#a33b41', fontWeight: 600 }}>{pwMsg}</p>}
          </div>
        )}
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
            <div className="credit-bubble"><div><div className="n">{user.plan !== 'guided' ? 0 : credits === null ? '-' : credits}</div><div className="t">left</div></div></div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, marginBottom: 18 }}>{user.plan === 'guided' ? 'Guided sessions remaining this month.' : 'Optional Guided upgrade: adds monthly 1:1 sessions.'}</p>
            {user.plan === 'guided'
              ? <a className="btn btn-navy btn-sm" href="/pathways/app/book" style={{ width: '100%', justifyContent: 'center' }}>Book a session</a>
              : <a className="btn btn-primary btn-sm" href={`/pathways/plans/${user.track === 'bcba' ? 'bcba' : 'rbt'}`} style={{ width: '100%', justifyContent: 'center' }}>See Guided plans</a>}
          </div>
          <div className="panel span-12 rv in">
            <h3>Repeated misses by tag</h3>
            {cards ? (<>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, margin: '-4px 0 14px' }}>From your own answers over the last 30 days: a tag appears here only after you miss it on at least 2 different questions. "Recurring" means 3 or more misses across multiple days. Tags are author-assigned and not yet expert-reviewed - they point at what to review, not a diagnosis of why you missed.</p>
              {cards.slice(0, 4).map((c) => (
                <div className="score-row" key={c.tag}>
                  <span><b>{pretty(c.tag)}</b><br />
                    <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>
                      Tagged on {c.misses} of your recorded misses across {c.items} different questions over {c.days} {c.days === 1 ? 'day' : 'days'}{c.areas && c.areas.length ? ' - ' + c.areas.join(', ') : ''}.</span><br />
                    <a href={'/pathways/app/practice?tag=' + encodeURIComponent(c.tag)} style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal-3)' }}>Practice more questions with this tag &rarr;</a></span>
                  <span className={'pill ' + (c.status === 'recurring' ? 'pill-teal' : 'pill-sage')}>{c.status === 'recurring' ? 'Recurring' : 'Worth reviewing'}</span>
                </div>
              ))}
              {showDemo && !evidence && <p style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, marginTop: 14 }}>Demo entries shown. Real entries build from your first practice sets.</p>}
            </>) : (
              <p style={{ fontSize: 15, color: 'var(--ink-2)', fontWeight: 600, margin: '10px 0 4px' }}>Nothing to review yet. After a few practice sets, tags you miss on more than one question will appear here - never from a single wrong answer.</p>
            )}
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
