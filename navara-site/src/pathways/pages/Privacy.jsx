import React from 'react';
import { Nav, Footer, usePathwaysEffects } from '../components/Chrome';

const LINKS = (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login?mode=signin">Log in</a>
  <a className="btn btn-primary btn-sm" href="/pathways/login">Create account</a>
</>);

export default function Privacy() {
  usePathwaysEffects();
  return (<>
    <Nav links={LINKS} />
    <main>
      <header className="track-hero" style={{ padding: '170px 0 70px' }}>
        <div className="wrap">
          <span className="eyebrow rv in">Navara Pathways</span>
          <h1 data-rise>Privacy policy.</h1>
          <p className="lead">Last updated October 2026.</p>
        </div>
      </header>
      <section className="section" style={{ paddingTop: 30 }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <h3>What we collect</h3>
          <p>When you create an account we store your email address and the plan you choose. As you practice, we store your answers, timing, and progress so the program can show you what to work on next. If you book a 1:1 session, we store the booking details needed to run it.</p>
          <h3 style={{ marginTop: 28 }}>How we use it</h3>
          <p>We use your information to run your account, send sign-in links, track your progress, and deliver the sessions you book. We do not sell your information, and we do not share it with advertisers.</p>
          <h3 style={{ marginTop: 28 }}>Payments</h3>
          <p>Payments are processed by Stripe. Navara Pathways never sees or stores your full card number.</p>
          <h3 style={{ marginTop: 28 }}>Your choices</h3>
          <p>You can cancel your plan at any time from your account page. To correct or delete your information, email us and a human will take care of it.</p>
          <h3 style={{ marginTop: 28 }}>Contact</h3>
          <p>Navara Behavioral Group, 877-7NAVARA (877-762-8272), or through the contact options at navarabehavioralgroup.com.</p>
        </div>
      </section>
    </main>
    <Footer />
  </>);
}
