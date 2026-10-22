import React, { useEffect, useRef, useState } from 'react';
import AppNav from '../../components/AppNav';
import Quiz from '../../components/Quiz';
import { useRequireUser } from '../../components/useRequireUser';
import { fetchQuestions, fetchSample } from '../../lib/db';
import { DEMO } from '../../config';

const PACE = { rbt: 63, bcba: 82 }; // seconds/question: RBT 85q/90min, BCBA 175q/4h

export default function Mock() {
  const user = useRequireUser();
  const v2 = true;
  const [total, setTotal] = useState(300);
  const [secs, setSecs] = useState(300);
  const [answered, setAnswered] = useState(0);
  const [qs, setQs] = useState(null);
  const [live, setLive] = useState(false);
  const [started, setStarted] = useState(false);
  const start = useRef(Date.now());
  useEffect(() => {
    if (!started) return;
    start.current = Date.now();
    const iv = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, [started]);
  useEffect(() => {
    if (!user) return;
    let on = true;
    const track = user.track === 'bcba' ? 'bcba' : 'rbt';
    fetchQuestions({ track, limit: 10 }).then((rows) => {
      if (!on) return;
      if (!DEMO && rows && rows.length >= 10) { setQs(rows); setLive(true); setSecs(10 * PACE[track]); setTotal(10 * PACE[track]); }
      else return fetchSample({ track, limit: 6, skip: 4 }).then((s) => { if (on) { setQs(s); setSecs(300); } });
    }).catch(() => fetchSample({ track, limit: 6, skip: 4 }).then((s) => { if (on) setQs(s); }));
    return () => { on = false; };
  }, [user]);
  if (!user) return null;
  const track = user.track === 'bcba' ? 'bcba' : 'rbt';
  const target = PACE[track];
  if (!started) {
    const n = qs ? qs.length : null;
    const mins = n ? Math.round((n * target) / 60) : null;
    return (<>
      <AppNav active="mock" />
      <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
        <div className="wrap quiz-shell">
          <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Mock exams</span>
          <h2>Timed sets, on demand.</h2>
          <div className="panel" style={{ maxWidth: 560, margin: '26px auto 0', textAlign: 'center', padding: 34 }}>
            <h3 style={{ marginBottom: 10 }}>{track === 'bcba' ? 'BCBA' : 'RBT'} timed set</h3>
            <p style={{ fontSize: 15, color: 'var(--ink-2)', fontWeight: 600, lineHeight: 1.7, marginBottom: 8 }}>
              {n ? n + ' questions' : '...'} · {mins ? 'about ' + mins + (mins === 1 ? ' minute' : ' minutes') : '...'} on the clock · pace feedback as you go.
            </p>
            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 600, marginBottom: 22 }}>
              The timer starts when you tap Start. Answer every question - you can flag the hard ones mentally and keep moving.
            </p>
            {!live && qs && (
              <p style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, marginBottom: 18, background: 'var(--light)', borderRadius: 10, padding: '10px 14px' }}>
                You're on the free Sample plan, so this set uses sample questions. Members get timed sets from the full bank.
              </p>
            )}
            <button className="btn btn-primary" style={{ justifyContent: 'center', minWidth: 200 }} disabled={!qs} onClick={() => setStarted(true)}>
              {qs ? 'Start the timer' : 'Preparing your set...'}
            </button>
          </div>
        </div>
      </section>
    </>);
  }
  const label = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
  const elapsed = (Date.now() - start.current) / 1000;
  const pace = answered > 0 ? Math.max(1, Math.round(elapsed / answered)) : null;
  const paceNote = pace === null ? 'Answer one question to see your pace.'
    : pace <= target
      ? `Your pace: ${pace}s per question - at or under exam pace (${target}s). Good position.`
      : `Your pace: ${pace}s per question - over exam pace (${target}s). Flag the hard ones and keep moving; come back after a first pass.`;
  return (<>
    <AppNav active="mock" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap quiz-shell">
        <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Mock exams</span>
        <h2>Timed sets, on demand.</h2>
        <p style={{ color: 'var(--ink-2)', fontWeight: 600, marginBottom: 26 }}>
          {live
            ? 'Timed set from the live bank with pacing feedback against real exam timing.'
            : 'This demo runs a short set with a countdown and live pacing feedback, so you can feel the pressure dial.'}
        </p>
        {v2 && (
          <div className="mock-timer-card">
            <svg className="ring" width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
              <circle cx="42" cy="42" r="34" stroke="rgba(255,255,255,.16)" strokeWidth="8" fill="none" />
              <circle cx="42" cy="42" r="34" stroke="#63c1ae" strokeWidth="8" fill="none" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * (1 - (total ? secs / total : 1))}
                transform="rotate(-90 42 42)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
              <text x="42" y="46" textAnchor="middle" fill="rgba(255,255,255,.75)" fontSize="11" fontWeight="700" letterSpacing="2">TIME</text>
            </svg>
            <div className="mtc-time">
              <div className="mtc-clock" style={secs < 60 ? { color: '#f0a8ad' } : undefined}>{label}</div>
              <div className="mtc-sub">Time remaining</div>
            </div>
            <div className="mtc-right">
              {pace === null
                ? <span className="pace-note-mini">Answer one question to see your pace.</span>
                : <span className={'pace-chip ' + (pace <= target ? 'pace-ok' : 'pace-over')}>{pace <= target ? 'On pace' : 'Over pace'}</span>}
              <div className="palette" aria-label={'Answered ' + answered + ' of ' + (qs ? qs.length : 0)}>
                {(qs || []).map((_, idx) => <i key={idx} className={idx < answered ? 'done' : ''}></i>)}
              </div>
              <span className="pace-note-mini">Answered {Math.min(answered, qs ? qs.length : answered)}/{qs ? qs.length : '-'}</span>
            </div>
          </div>
        )}
        {!v2 && (
        <div className="panel" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div><b style={{ fontSize: 15 }}>{live ? 'Timed mock' : 'Demo mock'}, {track === 'bcba' ? 'BCBA' : 'RBT'} track</b><br /><span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>{qs ? qs.length : '-'} questions, {label} on the clock</span></div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', maxWidth: '34ch' }}>{paceNote}</div>
          <div className="timer" style={secs < 60 ? { color: '#a33b41' } : undefined}>{label}</div>
        </div>
        )}
        <div {...(v2 ? {} : { onClickCapture: () => setTimeout(() => setAnswered((n) => n + 1), 0) })}>
          {qs
            ? <Quiz questions={qs} title={live ? 'Timed mock' : 'Demo mock'} kind="mock" cta="Review on dashboard" ctaHref="/pathways/app/dashboard" onAnswer={v2 ? () => setAnswered((n) => n + 1) : null} />
            : <p style={{ fontWeight: 600, color: 'var(--ink-2)' }}>Loading your mock...</p>}
        </div>
      </div>
    </section>
  </>);
}
