import React, { useState } from 'react';
import { Nav, Footer, usePathwaysEffects, Modal } from '../components/Chrome';
import { startCheckout } from '../lib/billing';

const LINKS = (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login">Log in</a>
</>);

export default function Plans() {
  usePathwaysEffects();
  const [track, setTrack] = useState('rbt');
  const [modal, setModal] = useState(null);
  const join = async (plan) => {
    if (!modal) {
      const res = await startCheckout(track, plan);
      if (res && res.testMode) setModal(res.message);
    }
  };
  const tabStyle = { background: 'rgba(255,255,255,.08)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' };
  return (<>
    <Nav links={LINKS} />
    <main>
      <header className="track-hero" style={{ padding: '170px 0 90px', textAlign: 'center' }}>
        <div className="orb orb-2"></div><div className="orb orb-3"></div>
        <div className="wrap">
          <span className="eyebrow rv in" style={{ justifyContent: 'center', display: 'inline-flex' }}>Plans</span>
          <h1 data-rise>Simple plans. <span className="grad">Serious prep.</span></h1>
          <p className="lead" style={{ marginLeft: 'auto', marginRight: 'auto' }}>Each track is its own plan. Pricing is set at launch; checkout runs in test mode during this preview.</p>
          <div className="track-tabs" style={{ justifyContent: 'center', marginBottom: 0 }}>
            <button className={'ttab' + (track === 'rbt' ? ' active' : '')} style={tabStyle} onClick={() => setTrack('rbt')}>RBT track</button>
            <button className={'ttab' + (track === 'bcba' ? ' active' : '')} style={tabStyle} onClick={() => setTrack('bcba')}>BCBA track</button>
          </div>
        </div>
      </header>
      <section className="section">
        <div className="wrap">
          <div className="plans">
            <div className="plan rv">
              <div className="p-tag">Free</div><h3>Sample</h3><div className="p-price">Free, no account</div>
              <ul><li>10-question sample quiz</li><li>Explanations for every answer</li><li>For both tracks</li></ul>
              <a className="btn btn-navy" href="/pathways/sample-quiz" style={{ justifyContent: 'center' }}>Take the quiz</a>
            </div>
            <div className="plan rv rv-d1">
              <div className="p-tag">Self-Study</div><h3>Self-Study</h3><div className="p-price">Price set at launch, per track</div>
              <ul><li>Full question bank for your track</li><li>Timed mock exams</li><li>Explanations for every answer</li><li>Progress tracking by topic</li></ul>
              <button className="btn btn-navy" style={{ justifyContent: 'center' }} onClick={() => join('self-study')}>Join Self-Study</button>
            </div>
            <div className="plan featured rv rv-d2">
              <span className="most">Most complete</span>
              <div className="p-tag">Guided</div><h3>Guided</h3><div className="p-price">Price set at launch, per track</div>
              <ul><li>Everything in Self-Study</li><li>Monthly 1:1 sessions with a Navara behavior specialist</li><li>Session booking inside your account</li><li>Priority support</li></ul>
              <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => join('guided')}>Join Guided</button>
            </div>
          </div>
          <p style={{ textAlign: 'center', marginTop: 34, fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 600 }}>Cancel anytime from your account. The full refund policy appears at checkout.</p>
        </div>
      </section>
      <Modal open={!!modal} onClose={() => setModal(null)} title="Checkout is in test mode">
        {modal || 'Stripe goes live after the NJ prepaid-services review is complete and prices are set. In this preview no payment method is collected and nothing is charged.'}
      </Modal>
    </main>
    <Footer />
  </>);
}
