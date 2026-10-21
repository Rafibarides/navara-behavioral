import React from 'react';
import { Nav, Footer, usePathwaysEffects, Arcs } from '../components/Chrome';
import Showcase, { usePreview, StickySampleCTA } from '../components/Showcase';

const LINKS = (preview) => (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login">Log in</a>
  {preview && <a className="btn btn-primary btn-sm" href="/pathways/login">Create account</a>}
</>);

export default function BcbaTrack() {
  usePathwaysEffects();
  const preview = usePreview();
  return (<>
    <Nav links={LINKS(preview)} />
    <main>
<header className="track-hero bcba">
  <div className="orb orb-1"></div><div className="orb orb-3"></div>
  <div className="wrap">
    <span className="eyebrow rv in">BCBA track</span>
    <h1 data-rise>Think like an analyst, <span className="grad">answer like one.</span></h1>
    <p className="lead">Preparation for the BCBA certification exam for candidates who want more than flashcards. Scenario-driven practice that trains clinical judgment, not just recall.</p>
    <div className="hero-ctas"><a className="btn btn-primary" href="/pathways/sample-quiz">Try the free BCBA quiz</a><a className="btn btn-ghost" href="/pathways/plans">See plans</a></div>
  </div>
</header>
<section className="section dark">
  <div className="wrap">
    <div className="section-head rv"><span className="eyebrow">Every area of the content outline</span>
      <h2>From philosophy to supervision.</h2>
      <p>Practice sets follow the current BACB BCBA test content outline, weighted the way the exam weights them.</p>
    </div>
    <div className="areas">
      <div className="area rv"><b>Foundations &amp; Principles</b><span>Behaviorism, reinforcement, punishment, stimulus control</span></div>
      <div className="area rv rv-d1"><b>Measurement &amp; Design</b><span>IOA, single-subject designs, experimental control</span></div>
      <div className="area rv rv-d2"><b>Behavior Assessment</b><span>FBA, functional analysis, preference and skill assessments</span></div>
      <div className="area rv rv-d3"><b>Intervention</b><span>Selecting, implementing, and evaluating behavior change</span></div>
      <div className="area rv"><b>Ethics</b><span>The Ethics Code applied to scenarios</span></div>
      <div className="area rv rv-d1"><b>Supervision</b><span>BST, performance management, supervision practices</span></div>
    </div>
  </div>
</section>
<section className="section">
  <div className="wrap">
    <div className="section-head center rv"><span className="eyebrow" style={{color:'var(--teal-3)'}}>What is inside</span><h2>Depth, not decks.</h2></div>
    <div className="steps">
      <div className="step rv"><div className="ic">&#9673;</div><h4>Scenario practice</h4><p>Questions written as clinical vignettes, with explanations that unpack the reasoning.</p></div>
      <div className="step rv rv-d1"><div className="ic">&#9656;</div><h4>Full-length mocks</h4><p>Timed simulations that mirror the pace and pressure of the real exam.</p></div>
      <div className="step rv rv-d2"><div className="ic">&#10004;</div><h4>1:1 NCBS™ time</h4><p>Guided-plan sessions for test strategy, weak areas, and the judgment calls between two right-sounding answers.</p></div>
    </div>
  </div>
</section>
{preview && <Showcase track="bcba" />}
</main>
    {preview && <StickySampleCTA label="Try the free BCBA quiz" href="/pathways/sample-quiz" />}
    <Footer />
  </>);
}
