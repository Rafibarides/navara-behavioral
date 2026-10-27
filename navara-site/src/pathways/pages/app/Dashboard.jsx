import React, { useEffect, useState } from 'react';
import AppNav from '../../components/AppNav';
import { usePathwaysEffects } from '../../components/Chrome';
import { useRequireUser } from '../../components/useRequireUser';
import { sessionCredits, fetchAreaProgressState, fetchMemberEvidenceState, DEMO_EVIDENCE } from '../../lib/db';

import { DEMO, CFG } from '../../config';

const pretty = (s) => { const t = String(s || '').replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };

const DEMO_PROGRESS = [['Data Collection and Graphing', 82], ['Behavior Assessment', 64], ['Behavior Acquisition', 71], ['Behavior Reduction', 48], ['Documentation & Reporting', 77], ['Professional Conduct', 90]];

export default function Dashboard() {
  const user = useRequireUser();
  const [credits, setCredits] = useState(null);
  const [progress, setProgress] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [progressState, setProgressState] = useState('loading');
  const [evidenceStatus, setEvidenceStatus] = useState('loading');
  useEffect(() => {
    if (!user) return;
    let active = true;
    setProgress(null); setEvidence(null); setProgressState('loading'); setEvidenceStatus('loading');
    sessionCredits().then((v) => { if (active) setCredits(v); }).catch(() => { if (active) setCredits(null); });
    if (DEMO || user.demo) { setProgressState('demo'); setEvidenceStatus('demo'); }
    else {
      fetchAreaProgressState(user).then((r) => { if (active) { setProgress(r.rows.length ? r.rows : null); setProgressState(r.status); } });
      fetchMemberEvidenceState(user).then((r) => { if (active) { setEvidence(r.rows.length ? r.rows : null); setEvidenceStatus(r.status); } });
    }
    return () => { active = false; };
  }, [user?.id, user?.track, user?.trackSet, user?.demo]);
  usePathwaysEffects([progress]);
  if (!user) return null;
  const displayTrack = user.trackSet !== false && ['rbt','bcba'].includes(user.track) ? user.track : null;
  const planLabel = (user.plan === 'guided' ? 'Guided' : user.plan === 'self-study' ? 'Self-Study' : 'Sample') + ' plan, ' + (displayTrack ? (displayTrack === 'bcba' ? 'BCBA' : 'RBT') + ' track' : 'choose your exam track') + (user.demo || DEMO ? ' (demo)' : '');
  const showDemo = DEMO || user.demo;
  const bars = progress ? progress.map((r) => [r.area, r.pct, r.n, r.c]) : (showDemo ? DEMO_PROGRESS : null);
  const cards = evidence || (showDemo ? DEMO_EVIDENCE : null);
  return (<>
    <AppNav active="dashboard" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 34 }}>
          <div><span className="eyebrow" style={{ color: 'var(--teal-3)' }}>{planLabel}</span>
            <h2 style={{ marginBottom: 4 }}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}{user.name && String(user.name).toLowerCase() !== String(user.email || '').split('@')[0].toLowerCase() ? ', ' + String(user.name).split(' ')[0].replace(/^./, c=>c.toUpperCase()) : ''}.</h2>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>{displayTrack ? `Future ${displayTrack === 'bcba' ? 'BCBA' : 'RBT'} - you've got this.` : 'Choose your exam track to get started.'}</p></div>
          <a className="btn btn-primary" href="/pathways/app/practice">Start practicing</a>
        </div>
        {!user.demo && user.trackSet === false && (
          <div className="panel rv in" style={{ marginBottom: 22, borderLeft: '4px solid var(--sage)' }}>
            <b style={{ fontSize: 15 }}>Which exam are you preparing for?</b>
            <p style={{ margin: '4px 0 12px', fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 600 }}>Choose the exam track for your practice questions and recorded progress.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['rbt', 'bcba'].map((t) => (
                <button key={t} className="btn btn-navy btn-sm" onClick={async () => {
                  try {
                    const { getClient } = await import('../../lib/db');
                    const sb = await getClient();
                    const { error } = await sb.rpc('learner_set_track', { p_track: t });
                    if (error) throw error;
                  } catch { window.alert('Could not select your track. Please try again or contact support.'); return; }
                  window.location.reload();
                }}>{t === 'rbt' ? 'RBT exam' : 'BCBA exam'}</button>
              ))}
            </div>
          </div>
        )}
        {import.meta.env.VITE_LEARNING_THREAD_CANDIDATE === 'true' && !user.demo && user.plan==='guided' && user.track==='rbt' && <div className="panel" style={{marginBottom:24}}><h3>Learning that learns with you</h3><p>Pick up a learning thread, check its evidence, or change the focus.</p><a className="btn btn-primary" href="/pathways/app/learning-thread">Open your Learning Thread</a></div>}
        <div className="dash-grid">
          <div className="panel span-8 rv in">
            <h3>Progress by topic</h3><p className="progress-count-note">Counts different questions in your exam track, using only the first recorded response when it was graded. Repeated attempts do not change these counts.</p>
            {progressState === 'loading' ? <p role="status">Loading your progress...</p> : progressState === 'unavailable' ? <p role="alert">Progress is unavailable. Please try again later. No partial scores are shown.</p> : progressState === 'track_required' ? <p>Select your exam track to see progress.</p> : bars ? bars.map(([label, w, n, c]) => (
              <div className="prog" key={label}><div className="row"><span>{label}</span><span>{w}%{Number.isFinite(n) ? ` · ${Number.isFinite(c) ? c : Math.round(w*n/100)} of ${n} ${n === 1 ? 'question' : 'questions'} correct` : ''}</span></div><div className="bar"><i data-w={w}></i></div></div>
            )) : (
              <p style={{ fontSize: 15, color: 'var(--ink-2)', fontWeight: 600, margin: '10px 0 4px' }}>No practice data yet. Your scores by topic will appear here after your first practice set.</p>
            )}
            {bars && !progress && <p style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, marginTop: 14 }}>Demo progress shown. Real tracking starts with your first practice set.</p>}
          </div>
          <div className="panel span-4 rv in"><h3>Keep practicing</h3><p>Review the explanations in your results, then open another set from your exam track.</p><a className="btn btn-navy btn-sm" href="/pathways/app/practice">Go to practice</a><p style={{fontSize:13,color:'var(--ink-2)',marginTop:16}}>Choose a topic or review recorded misses in Practice, or start a timed practice set.</p></div>
          <div className="panel span-12 rv in">
            <h3>Repeated misses by tag</h3>
            {evidenceStatus === 'loading' ? <p role="status">Loading recorded answers...</p> : evidenceStatus === 'unavailable' ? <p role="alert">Your recorded-answer summary could not be loaded. Your saved practice answers are unchanged.</p> : evidenceStatus === 'track_required' ? <p>Select your exam track to see recorded answers.</p> : cards ? (<>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, margin: '-4px 0 14px' }}>Your recorded incorrect answers, grouped by their assigned tags. Use these groups to revisit questions and explanations. A tag appears here only after your selected answers carried it on at least 2 different questions in the last 30 days.</p>
              {cards.slice(0, 4).map((c) => (
                <div className="score-row" key={c.tag}>
                  <span><span style={{ fontSize: 10.5, letterSpacing: '.12em', fontWeight: 800, color: 'var(--ink-2)' }}>ASSIGNED ANSWER TAG</span><br />
                    <b>&ldquo;{pretty(c.tag)}&rdquo;</b><br />
                    <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>
                      Your selected answers carried this tag on {c.misses} recorded {c.misses === 1 ? 'miss' : 'misses'} across {c.items} different questions over {c.days} {c.days === 1 ? 'day' : 'days'}{c.areas && c.areas.length ? ' - ' + c.areas.join(', ') : ''}.</span><br />
                    <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Practice more questions with this assigned tag or review your recorded misses from Practice.</span></span>
                </div>
              ))}
              {showDemo && !evidence && <p style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, marginTop: 14 }}>Demo entries shown. Real entries build from your first practice sets.</p>}
            </>) : (
              <p style={{ fontSize: 15, color: 'var(--ink-2)', fontWeight: 600, margin: '10px 0 4px' }}>Nothing to review yet. After a few practice sets, tags carried by your selected answers on more than one question will appear here - never from a single wrong answer.</p>
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
