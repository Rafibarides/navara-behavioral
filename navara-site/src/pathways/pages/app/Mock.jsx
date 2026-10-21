import React, { useEffect, useRef, useState } from 'react';
import AppNav from '../../components/AppNav';
import Quiz from '../../components/Quiz';
import { useRequireUser } from '../../components/useRequireUser';
import { fetchQuestions, fetchSample } from '../../lib/db';
import { DEMO } from '../../config';

const PACE = { rbt: 63, bcba: 82 }; // seconds/question: RBT 85q/90min, BCBA 175q/4h

export default function Mock() {
  const user = useRequireUser();
  const [secs, setSecs] = useState(300);
  const [answered, setAnswered] = useState(0);
  const [qs, setQs] = useState(null);
  const [live, setLive] = useState(false);
  const start = useRef(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    if (!user) return;
    let on = true;
    const track = user.track === 'bcba' ? 'bcba' : 'rbt';
    fetchQuestions({ track, limit: 10 }).then((rows) => {
      if (!on) return;
      if (!DEMO && rows && rows.length >= 10) { setQs(rows); setLive(true); setSecs(10 * PACE[track]); }
      else return fetchSample({ track, limit: 6, skip: 4 }).then((s) => { if (on) { setQs(s); setSecs(300); } });
    }).catch(() => fetchSample({ track, limit: 6, skip: 4 }).then((s) => { if (on) setQs(s); }));
    return () => { on = false; };
  }, [user]);
  if (!user) return null;
  const track = user.track === 'bcba' ? 'bcba' : 'rbt';
  const target = PACE[track];
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
        <h2>Exam conditions, on demand.</h2>
        <p style={{ color: 'var(--ink-2)', fontWeight: 600, marginBottom: 26 }}>
          {live
            ? 'Timed set from the live bank with pacing feedback against real exam timing.'
            : 'This demo runs a short set with a countdown and live pacing feedback, so you can feel the pressure dial.'}
        </p>
        <div className="panel" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div><b style={{ fontSize: 15 }}>{live ? 'Timed mock' : 'Demo mock'}, {track === 'bcba' ? 'BCBA' : 'RBT'} track</b><br /><span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>{qs ? qs.length : '-'} questions, {label} on the clock</span></div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', maxWidth: '34ch' }}>{paceNote}</div>
          <div className="timer" style={secs < 60 ? { color: '#a33b41' } : undefined}>{label}</div>
        </div>
        <div onClickCapture={() => setTimeout(() => setAnswered((n) => n + 1), 0)}>
          {qs
            ? <Quiz questions={qs} title={live ? 'Timed mock' : 'Demo mock'} kind="mock" cta="Review on dashboard" ctaHref="/pathways/app/dashboard" />
            : <p style={{ fontWeight: 600, color: 'var(--ink-2)' }}>Loading your mock...</p>}
        </div>
      </div>
    </section>
  </>);
}
