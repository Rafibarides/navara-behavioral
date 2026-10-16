import React from 'react';
import AppNav from '../../components/AppNav';
import { SampleFlag } from '../../components/Chrome';
import Quiz from '../../components/Quiz';
import { useRequireUser } from '../../components/useRequireUser';
import { RBT_QUESTIONS } from '../../data/questions';

export default function Practice() {
  const user = useRequireUser();
  if (!user) return null;
  return (<>
    <AppNav active="practice" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap quiz-shell">
        <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Practice (demo bank)</span>
        <h2>Practice by topic.</h2>
        <p style={{ color: 'var(--ink-2)', fontWeight: 600, marginBottom: 26 }}>Untimed sets with instant explanations. These are the same placeholder samples as the free quiz; the live bank holds the full set.</p>
        <div style={{ textAlign: 'left', marginBottom: 20 }}><SampleFlag /></div>
        <Quiz questions={RBT_QUESTIONS.slice(0, 6)} title="Practice set" cta="Back to dashboard" ctaHref="/pathways/app/dashboard" />
      </div>
    </section>
  </>);
}
