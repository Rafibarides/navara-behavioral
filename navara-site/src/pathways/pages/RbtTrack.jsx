import React from 'react';
import { Nav, Footer, usePathwaysEffects, Arcs } from '../components/Chrome';
import Showcase, { usePreview, StickySampleCTA } from '../components/Showcase';
import { Explainer, WhatYouGet, GuidedBlock, OneOnOne, ClosingCTA } from '../components/PreviewSections';

const LINKS = (preview) => (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login">Log in</a>
  <a className="btn btn-primary btn-sm" href="/pathways/login">Create account</a>
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
    {preview ? (<>
      <h1 data-rise>Walk into the RBT exam, <span className="grad">and your first day, ready.</span></h1>
      <p className="lead">500 original scenario questions built from real session situations, timed mocks with pace feedback, and explanations for every answer choice.</p>
      <p className="lead" style={{ fontSize: 15, opacity: .75, marginTop: -18 }}>Understand why an answer fits. See why another one doesn't. Know where to focus next.</p>
    </>) : (<>
      <h1 data-rise>Become the technician <span className="grad">families remember.</span></h1>
      <p className="lead">Preparation for the RBT certification exam, built by clinicians who run sessions every day. Learn the task list the way it is actually used: measured, observed, and reinforced.</p>
    </>)}
    <div className="hero-ctas"><a className="btn btn-primary" href="/pathways/sample-quiz">Try the free RBT quiz</a><a className="btn btn-ghost" href="/pathways/plans">See plans</a></div>
    <div className="stats stats-3" style={{ marginTop: 54 }}>
      <div className="stat rv"><div className="num" data-count="500">500</div><div className="lbl">Practice questions on this track</div></div>
      <div className="stat rv rv-d1"><div className="num" data-count="6">6</div><div className="lbl">Content areas, full outline</div></div>
      <div className="stat rv rv-d2"><div className="num" data-count="1" data-suffix=":1">1:1</div><div className="lbl">1:1 time on Guided</div></div>
    </div>
  </div>
</header>
<Showcase />
{preview && <Explainer
  title="Depth, not decks."
  lines={[
    "The RBT exam isn't about memorizing a glossary.",
    "It's about what you'd do in the moment: when a learner engages in problem behavior, when data looks off, when you're not sure if something is your call.",
    "Navara questions put you in those moments - and explain the right move the way a good supervisor would.",
  ]}
/>}
{preview && <WhatYouGet checks={[
  { text: "500 original RBT scenario questions across every area of the current content outline" },
  { text: "Timed mock exams with pace feedback" },
  { text: "Explanations for every answer choice - including why the wrong ones tempt" },
  { text: "Progress by topic, so weak spots have nowhere to hide" },
  { text: "Guided: one 45-minute 1:1 session each month with a Navara Certified Behavior Specialist (NCBS)", glow: true },
]} />}
<section className="section dark">
  <div className="wrap">
    <div className="section-head rv"><span className="eyebrow">Every area of the content outline</span>
      <h2>The whole exam, mapped.</h2>
      <p>Practice sets are organized by the current BACB RBT Task List (2nd ed., in effect since 2026), so weak spots have nowhere to hide.</p>
    </div>
    <div className="areas">
      <div className="area rv"><span className="area-ic">&#9719;</span><div><b>Measurement</b><span>Frequency, duration, latency, IRT, discontinuous methods</span></div></div>
      <div className="area rv rv-d1"><span className="area-ic">&#9673;</span><div><b>Assessment</b><span>Preference assessments, assisting with functional assessment</span></div></div>
      <div className="area rv rv-d2"><span className="area-ic">&#9650;</span><div><b>Skill Acquisition</b><span>DTT, NET, chaining, shaping, prompt fading</span></div></div>
      <div className="area rv rv-d3"><span className="area-ic">&#9660;</span><div><b>Behavior Reduction</b><span>Functions, antecedent and consequence strategies</span></div></div>
      <div className="area rv"><span className="area-ic">&#9998;</span><div><b>Documentation &amp; Reporting</b><span>Objective session notes, reporting variables</span></div></div>
      <div className="area rv rv-d1"><span className="area-ic">&#167;</span><div><b>Professional Conduct</b><span>Scope of practice, boundaries, confidentiality</span></div></div>
    </div>
  </div>
</section>
{preview ? (<>
  <GuidedBlock
    eyebrow="Guided"
    heading="Think it through with someone who knows the work."
    intro="Some questions aren't difficult because you don't know the material. They're difficult because two answers sound right, or one detail changes everything. Guided gives you one 45-minute one-to-one session every month with an NCBS™. Bring the questions that keep you second-guessing. Work through the reasoning. Leave with a clearer plan for what comes next."
    bullets={[
      { h: "Find the distinction that changes the answer", p: "Talk through confusing questions. Examine two equally convincing options. Understand what makes one answer stronger - and the other so tempting." },
      { h: "Turn weak topics into a plan", p: "Review the concepts that need more work. Identify the gaps behind your missed questions. Know what to practice next instead of guessing." },
      { h: "Make your study time work harder", p: "Dedicated time to work through your thinking, challenge your assumptions, and approach difficult questions with more clarity." },
    ]}
  />
  <OneOnOne
    heading="Your 1:1 with an NCBS™"
    body="A specialist reviews where you stand, answers the questions you were embarrassed to ask anywhere else, and helps you build a simple plan. It feels like a great supervisor who's on your side."
    foot="One session every month on the Guided plan."
  />
  <ClosingCTA
    heading="Your next step starts here."
    body="Create your free account. Take the free RBT sample quiz. Experience the questions, the explanations, and the reasoning behind every answer. Depth, not decks."
    primary={{ label: "Create your free account", href: "/pathways/login" }}
    secondary={{ label: "Take the free RBT quiz", href: "/pathways/sample-quiz" }}
  />
</>) : (<>
<section className="section">
  <div className="wrap">
    <div className="section-head center rv"><span className="eyebrow" style={{color:'var(--teal-3)'}}>What is inside</span><h2>Written the way the exam asks.</h2></div>
    <div className="steps">
      <div className="step rv"><div className="ic">&#9673;</div><h4>Practice by topic</h4><p>Untimed sets with instant explanations. Learn why the right answer is right and why the rest are wrong.</p></div>
      <div className="step rv rv-d1"><div className="ic">&#9656;</div><h4>Timed mock exams</h4><p>Timed sets with pace feedback. Practice keeping a steady pace with the clock running.</p></div>
      <div className="step rv rv-d2"><div className="ic">&#10004;</div><h4>1:1 with a Navara Certified Behavior Specialist (NCBS)</h4><p>On the Guided plan, bring your hardest topics to an NCBS™.</p></div>
    </div>
  </div>
</section>
</>)}
</main>
    {preview && <StickySampleCTA label="Try the free RBT quiz" href="/pathways/sample-quiz" />}
    <Footer />
  </>);
}
