import React, { useEffect, useRef, useState } from 'react';
import AppNav from '../../components/AppNav';
import Quiz from '../../components/Quiz';
import { useRequireUser } from '../../components/useRequireUser';
import { RBT_QUESTIONS } from '../../data/questions';

const TOTAL = 300;          // demo mock: 5 minutes
const PACE_TARGET = 63;     // seconds/question on the real RBT exam (85 questions in 90 minutes)

export default function Mock() {
  const user = useRequireUser();
  const [secs, setSecs] = useState(TOTAL);
  const [answered, setAnswered] = useState(0);
  const start = useRef(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, []);
  if (!user) return null;
  const label = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
  const elapsed = (Date.now() - start.current) / 1000;
  const pace = answered > 0 ? Math.max(1, Math.round(elapsed / answered)) : null;
  const paceNote = pace === null ? 'Answer one question to see your pace.'
    : pace <= PACE_TARGET
      ? `Your pace: ${pace}s per question - at or under exam pace (${PACE_TARGET}s). Good position.`
      : `Your pace: ${pace}s per question - over exam pace (${PACE_TARGET}s). Flag the hard ones and keep moving; come back after a first pass.`;
  return (<>
    <AppNav active="mock" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap quiz-shell">
        <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Mock exams</span>
        <h2>Exam conditions, on demand.</h2>
        <p style={{ color: 'var(--ink-2)', fontWeight: 600, marginBottom: 26 }}>The live mocks run full exam length with the real timing. This demo runs a short set with a countdown and live pacing feedback, so you can feel the pressure dial.</p>
        <div className="panel" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div><b style={{ fontSize: 15 }}>Demo mock, RBT track</b><br /><span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>6 questions, 5 minutes</span></div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', maxWidth: '34ch' }}>{paceNote}</div>
          <div className="timer" style={secs < 60 ? { color: '#a33b41' } : undefined}>{label}</div>
        </div>
        <div onClickCapture={() => setTimeout(() => setAnswered((n) => n + 1), 0)}>
          <Quiz questions={RBT_QUESTIONS.slice(4, 10)} title="Demo mock" cta="Review on dashboard" ctaHref="/pathways/app/dashboard" />
        </div>
      </div>
    </section>
  </>);
}
