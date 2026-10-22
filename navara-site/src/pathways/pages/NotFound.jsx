import React from 'react';
import { Nav, Footer } from '../components/Chrome';

const LINKS = (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login">Log in</a>
  <a className="btn btn-primary btn-sm" href="/pathways/login">Create account</a>
</>);

export default function PathwaysNotFound() {
  return (<>
    <Nav links={LINKS} />
    <main>
      <section className="section" style={{ paddingTop: 200, minHeight: '70vh', textAlign: 'center' }}>
        <div className="wrap" style={{ maxWidth: 640 }}>
          <span className="eyebrow rv in" style={{ justifyContent: 'center', display: 'inline-flex' }}>Navara Pathways</span>
          <h1 data-rise>That page moved or never existed.</h1>
          <p className="lead" style={{ margin: '14px auto 30px' }}>Everything for RBT and BCBA exam prep lives here: practice, timed sets, plans, and your member dashboard.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="btn btn-primary" href="/pathways">Pathways home</a>
            <a className="btn btn-navy" href="/pathways/plans">See plans</a>
            <a className="btn btn-ghost" href="/pathways/login">Member login</a>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </>);
}
