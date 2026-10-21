import React from 'react';
import { Nav, Footer, usePathwaysEffects, Arcs } from '../components/Chrome';
import Showcase, { usePreview, StickySampleCTA } from '../components/Showcase';

const LINKS = (preview) => (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login">Log in</a>
  {preview && <a className="btn btn-primary btn-sm" href="/pathways/login">Create account</a>}
</>);

export default function RbtTrack() {
  usePathwaysEffects();
  const preview = usePreview();
  return (<>
    <Nav links={LINKS(preview)} />
    <main>
<header className="track-hero">
  <div className="orb orb-2"></div><div className="orb orb-3"></div>
  <div className="wrap">
    <span className="eyebrow rv in">RBT track</span>
    <h1 data-rise>Become the technician <span className="grad">families remember.</span></h1>
    <p className="lead">Preparation for the RBT certification exam, built by clinicians who run sessions every day. Learn the task list the way it is actually used: measured, observed, and reinforced.</p>
    <div className="hero-ctas"><a className="btn btn-primary" href="/pathways/sample-quiz">Try the free RBT quiz</a><a className="btn btn-ghost" href="/pathways/plans">See plans</a></div>
  </div>
</header>
<section className="section dark">
  <div className="wrap">
    <div className="section-head rv"><span className="eyebrow">Every area of the task list</span>
      <h2>The whole exam, mapped.</h2>
      <p>Practice sets are organized by the current BACB RBT content outline, so weak spots have nowhere to hide.</p>
    </div>
    <div className="areas">
      <div className="area rv"><b>Measurement</b><span>Frequency, duration, latency, IRT, discontinuous methods</span></div>
      <div className="area rv rv-d1"><b>Assessment</b><span>Preference assessments, assisting with functional assessment</span></div>
      <div className="area rv rv-d2"><b>Skill Acquisition</b><span>DTT, NET, chaining, shaping, prompt fading</span></div>
      <div className="area rv rv-d3"><b>Behavior Reduction</b><span>Functions, antecedent and consequence strategies</span></div>
      <div className="area rv"><b>Documentation &amp; Reporting</b><span>Objective session notes, reporting variables</span></div>
      <div className="area rv rv-d1"><b>Professional Conduct</b><span>Scope of practice, boundaries, confidentiality</span></div>
    </div>
  </div>
</section>
<section className="section">
  <div className="wrap">
    <div className="section-head center rv"><span className="eyebrow" style={{color:'var(--teal-3)'}}>What is inside</span><h2>Built like the real exam.</h2></div>
    <div className="steps">
      <div className="step rv"><div className="ic">&#9673;</div><h4>Practice by topic</h4><p>Untimed sets with instant explanations. Learn why the right answer is right and why the rest are wrong.</p></div>
      <div className="step rv rv-d1"><div className="ic">&#9656;</div><h4>Timed mock exams</h4><p>Full-length simulations under exam timing, so the real day feels like a rerun.</p></div>
      <div className="step rv rv-d2"><div className="ic">&#10004;</div><h4>1:1 specialist time</h4><p>On the Guided plan, bring your hardest topics to a Navara behavior specialist.</p></div>
    </div>
  </div>
</section>
{preview && <Showcase track="rbt" />}
</main>
    {preview && <StickySampleCTA label="Try the free RBT quiz" href="/pathways/sample-quiz" />}
    <Footer />
  </>);
}
