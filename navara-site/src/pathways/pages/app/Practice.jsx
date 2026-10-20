import React, { useEffect, useState } from 'react';
import AppNav from '../../components/AppNav';
import { SampleFlag } from '../../components/Chrome';
import Quiz from '../../components/Quiz';
import { useRequireUser } from '../../components/useRequireUser';
import { fetchQuestions, fetchSample } from '../../lib/db';
import { DEMO } from '../../config';

export default function Practice() {
  const user = useRequireUser();
  const [qs, setQs] = useState(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!user) return;
    let on = true;
    fetchQuestions({ track: user.track || 'rbt', limit: 12 }).then((rows) => {
      if (!on) return;
      if (!DEMO && rows && rows.length > 0) { setQs(rows); setLive(true); }
      else return fetchSample({ track: user.track || 'rbt', limit: 10 }).then((s) => { if (on) setQs(s); });
    }).catch(() => fetchSample({ track: 'rbt', limit: 10 }).then((s) => { if (on) setQs(s); }));
    return () => { on = false; };
  }, [user]);
  if (!user) return null;
  return (<>
    <AppNav active="practice" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap quiz-shell">
        <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>{live ? 'Practice - live bank' : 'Practice (sample bank)'}</span>
        <h2>Practice by topic.</h2>
        <p style={{ color: 'var(--ink-2)', fontWeight: 600, marginBottom: 26 }}>
          {live
            ? 'Untimed sets with instant, option-specific feedback from the full bank.'
            : 'Untimed sets with instant explanations. The full bank opens here as soon as clinical review clears it; these are the labeled sample questions.'}
        </p>
        {!live && <div style={{ textAlign: 'left', marginBottom: 20 }}><SampleFlag /></div>}
        {qs
          ? <Quiz key={user.track + live} questions={qs} title={live ? 'Practice set' : 'Sample practice set'} kind="practice" cta="Back to dashboard" ctaHref="/pathways/app/dashboard" />
          : <p style={{ fontWeight: 600, color: 'var(--ink-2)' }}>Loading your set...</p>}
      </div>
    </section>
  </>);
}
