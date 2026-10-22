import React from 'react';
import { Nav, Footer, usePathwaysEffects } from '../components/Chrome';

const LINKS = (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login?mode=signin">Log in</a>
  <a className="btn btn-primary btn-sm" href="/pathways/login">Create account</a>
</>);

export default function Terms() {
  usePathwaysEffects();
  return (<>
    <Nav links={LINKS} />
    <main>
      <header className="track-hero" style={{ padding: '104px 0 70px' }}>
        <div className="wrap">
          <span className="eyebrow rv in">Navara Pathways</span>
          <h1 data-rise>Terms of service.</h1>
          <p className="lead">Last updated October 2026.</p>
        </div>
      </header>
      <section className="section" style={{ paddingTop: 30 }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <h3>The service</h3>
          <p>Navara Pathways, from Navara Behavioral Group, provides exam preparation for the RBT and BCBA certification exams: practice questions, timed sets, progress tracking, and optional one-on-one sessions with a Navara Certified Behavior Specialist (NCBS).</p>
          <h3 style={{ marginTop: 28 }}>No affiliation or guarantee</h3>
          <p>Navara Pathways is not affiliated with, endorsed by, or sponsored by the Behavior Analyst Certification Board (BACB). We prepare you for the exam; we cannot guarantee a score or a pass, and we do not provide BACB supervision or fieldwork hours.</p>
          <h3 style={{ marginTop: 28 }}>Your account</h3>
          <p>Accounts are personal. Sign-in links are sent to the email address you provide. Keep them to yourself.</p>
          <h3 style={{ marginTop: 28 }}>Billing and cancellation</h3>
          <p>Paid plans renew monthly. You can cancel at any time from your account page, and cancellation stops future billing at the end of the current month. Refund policy: cancel anytime - no refund for the current month.</p>
          <h3 style={{ marginTop: 28 }}>Our content</h3>
          <p>All practice questions and explanations are original works of Navara Behavioral Group. Please do not copy, redistribute, or resell them.</p>
          <h3 style={{ marginTop: 28 }}>Contact</h3>
          <p>Navara Behavioral Group, 877-7NAVARA (877-762-8272), or through the contact options at navarabehavioralgroup.com.</p>
        </div>
      </section>
    </main>
    <Footer />
  </>);
}
