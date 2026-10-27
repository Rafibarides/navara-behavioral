import StandaloneSessions from '../components/StandaloneSessions';
import { CFG } from '../config';
import { GUIDED_PRODUCTION } from '../lib/guidedBooking';
import React from 'react';
import { Nav, Footer, usePathwaysEffects, Arcs } from '../components/Chrome';
import Showcase, { usePreview, StickySampleCTA } from '../components/Showcase';
import { Explainer, WhatYouGet, GuidedBlock, OneOnOne, ClosingCTA } from '../components/PreviewSections';

const LINKS = (preview) => (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login?mode=signin">Log in</a>
  <a className="btn btn-primary btn-sm" href="/pathways/login">Create account</a>
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
    {preview ? (<>
      <h1 data-rise>Depth, not decks. <span className="grad">Preparation that makes you think.</span></h1>
      <p className="lead">The BCBA exam rewards clinical judgment. So do we.</p>
      <p className="lead" style={{ fontSize: 15, opacity: .75, marginTop: -18 }}>Scenario practice questions. Explanations for every option. Untimed practice with answer explanations.</p>
    </>) : (<>
      <h1 data-rise>Think like an analyst, <span className="grad">answer like one.</span></h1>
      <p className="lead">Preparation for the BCBA certification exam for candidates who want more than flashcards. Scenario-driven practice that trains clinical judgment, not just recall.</p>
    </>)}
    <div className="hero-ctas"><a className="btn btn-primary" href="/pathways/sample-quiz">Try the free BCBA quiz</a><a className="btn btn-ghost" href="/pathways/plans/bcba">See plans</a></div>
    <div className="stats stats-3" style={{ marginTop: 54 }}>
      <div className="stat rv"><div className="num" data-count="500">500</div><div className="lbl">Practice questions on this track</div></div>
      <div className="stat rv rv-d1"><div className="num" data-count="9">9</div><div className="lbl">Test Content Outline domains, full outline</div></div>
      <div className="stat rv rv-d2"><div className="num">Review</div><div className="lbl">Read explanations for every answer</div></div>
    </div>
  </div>
</header>
<Showcase track="bcba" />
{preview && <Explainer
  title="Depth, not decks."
  lines={[
    "Most prep teaches you to recognize terms.",
    "The exam asks you to make decisions.",
    "Every Navara question puts you inside a case: a learner, a dataset, a supervisee, an ethical gray area. You choose what a competent BCBA would do next.",
    "Then you see why, in plain language, with every wrong option explained too - because that's where the learning is.",
  ]}
/>}
{preview && <WhatYouGet checks={[
  { text: "BCBA scenario practice with explanations for every answer choice" },
  { text: "Untimed practice with answer explanations" },
  { text: "Explanations for every answer choice - including why the wrong ones tempt" },
  { text: "Progress by topic, so your next study hour has a target" },
  { text: GUIDED_PRODUCTION ? "Guided: one included 45-minute session per paid monthly renewal period, no rollover" : "Guided sessions and booking are not available at launch", glow: true },
]} />}
<section className="section dark">
  <div className="wrap">
    <div className="section-head rv"><span className="eyebrow">Every area of the content outline</span>
      <h2>From philosophy to supervision.</h2>
      <p>Practice sets are organized by the current BACB BCBA Test Content Outline (6th ed., in effect since 2025).</p>
    </div>
    <div className="areas">
      <div className="area rv"><span className="area-ic">&#9670;</span><div><b>Foundations &amp; Principles</b><span>Behaviorism, reinforcement, punishment, stimulus control</span></div></div>
      <div className="area rv rv-d1"><span className="area-ic">&#9719;</span><div><b>Measurement &amp; Design</b><span>IOA, single-subject designs, experimental control</span></div></div>
      <div className="area rv rv-d2"><span className="area-ic">&#9673;</span><div><b>Behavior Assessment</b><span>FBA, functional analysis, preference and skill assessments</span></div></div>
      <div className="area rv rv-d3"><span className="area-ic">&#9650;</span><div><b>Intervention</b><span>Selecting, implementing, and evaluating behavior change</span></div></div>
      <div className="area rv"><span className="area-ic">&#167;</span><div><b>Ethics</b><span>The Ethics Code applied to scenarios</span></div></div>
      <div className="area rv rv-d1"><span className="area-ic">&#9998;</span><div><b>Supervision</b><span>BST, performance management, supervision practices</span></div></div>
    </div>
  </div>
</section>
{preview ? (<>
  <GuidedBlock
    eyebrow="Guided"
    heading="Some questions deserve more than another attempt."
    intro="You can reread an explanation. You can reconsider an answer. But sometimes what you want is to talk through your reasoning with someone who understands behavior analysis. Guided adds two 45-minute one-to-one sessions every month with an NCBS™ - dedicated time for the material you find hardest."
    bullets={[
      { h: "Ninety minutes a month, on your questions", p: "Talk through concepts you haven't fully understood, examine questions where two options seem equally convincing, and review the topics you want to strengthen." },
      { h: "Practice between sessions", p: "Your sessions complement the independent work inside the platform. Bring the questions you want to discuss, then keep moving with the practice bank." },
      { h: "An option, not an obligation", p: "Prefer to work independently? Self-Study gives you the full practice toolkit. Guided adds the dedicated one-to-one time." },
    ]}
  />
  <OneOnOne
    heading="Your 1:1 with an NCBS™"
    body="This is the part no question bank can give you. You talk through the questions that tripped you up and the patterns behind them, and you leave with a clear plan. Warm, direct, and focused on getting you ready."
    foot="Two sessions every month on the Guided plan."
  />
  <ClosingCTA
    heading="Make every question count for more."
    body="Start with scenario practice questions, detailed explanations, untimed practice, and progress tracking. Add two monthly one-to-one sessions if you want dedicated time with an NCBS™. Depth, not decks. Start with a question."
    primary={{ label: "Try the free BCBA quiz", href: "/pathways/sample-quiz" }}
    secondary={{ label: "Compare plans", href: "/pathways/plans/bcba" }}
    micro="Explore the approach before you choose your plan."
  />
</>) : (<>
<section className="section">
  <div className="wrap">
    <div className="section-head center rv"><span className="eyebrow" style={{color:'var(--teal-3)'}}>What is inside</span><h2>Depth, not decks.</h2></div>
    <div className="steps">
      <div className="step rv"><div className="ic">&#9673;</div><h4>Scenario practice</h4><p>Questions written as clinical vignettes, with explanations that unpack the reasoning.</p></div>
      <div className="step rv rv-d1"><div className="ic">&#9656;</div><h4>Untimed practice</h4><p>Untimed practice with answer explanations. Timed sets are not available at launch. Use untimed practice instead.</p></div>
      <div className="step rv rv-d2"><div className="ic">&#10004;</div><h4>{GUIDED_PRODUCTION ? "Guided coaching" : "Session booking unavailable"}</h4><p>{GUIDED_PRODUCTION ? "One included 45-minute session per paid monthly renewal period. Bring a study question and your reasoning; leave with a next-practice focus. No rollover." : "Guided sessions are not available at launch."}</p></div>
    </div>
  </div>
</section>
</>)}
</main>
    {preview && <StickySampleCTA label="Try the free BCBA quiz" href="/pathways/sample-quiz" />}
    <StandaloneSessions track="bcba" />
<Footer />
  </>);
}
