import React, { useState } from 'react';
import { Nav, Footer, usePathwaysEffects, SampleFlag } from '../components/Chrome';
import Quiz from '../components/Quiz';
import { RBT_QUESTIONS, BCBA_QUESTIONS } from '../data/questions';

const LINKS = (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login?mode=signin">Log in</a>
  <a className="btn btn-primary btn-sm" href="/pathways/login">Create account</a>
</>);

export default function SampleQuiz() {
  usePathwaysEffects();
  const [track, setTrack] = useState('rbt');
  return (<>
    <Nav links={LINKS} />
    <main>
      <header className="track-hero" style={{ padding: '170px 0 90px', textAlign: 'center' }}>
        <div className="orb orb-1"></div><div className="orb orb-2"></div>
        <div className="wrap">
          <span className="eyebrow rv in" style={{ justifyContent: 'center', display: 'inline-flex' }}>Free, no account</span>
          <h1 data-rise>Ten questions. <span className="grad">Zero excuses.</span></h1>
          <p className="lead" style={{ marginLeft: 'auto', marginRight: 'auto' }}>Pick your track. Every answer comes with the explanation, free.</p>
          <p style={{ marginTop: 10, fontSize: 14.5, fontWeight: 700 }}><a href="/pathways/study-plan" style={{ color: 'var(--teal-2)' }}>New: build a free study plan around your exam date &rarr;</a></p>
        </div>
      </header>
      <section className="section" style={{ paddingTop: 70 }}>
        <div className="wrap quiz-shell">
          <div style={{ textAlign: 'center' }}><SampleFlag /></div>
          <div className="track-tabs">
            <button className={'ttab' + (track === 'rbt' ? ' active' : '')} onClick={() => setTrack('rbt')}>RBT sample quiz</button>
            <button className={'ttab' + (track === 'bcba' ? ' active' : '')} onClick={() => setTrack('bcba')}>BCBA sample quiz</button>
          </div>
          <Quiz key={track} questions={(track === 'rbt' ? RBT_QUESTIONS : BCBA_QUESTIONS).slice(0, 10)}
                title={track === 'rbt' ? 'RBT sample' : 'BCBA sample'} emailCta kind="sample" />
        </div>
      </section>
    </main>
    <Footer />
  </>);
}
