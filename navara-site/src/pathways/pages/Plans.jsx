import React, { useState } from 'react';
import { Nav, Footer, usePathwaysEffects } from '../components/Chrome';
import { startCheckout } from '../lib/billing';
import { joinWaitlist } from '../lib/db';
import { CHECKOUT_TEST_MODE } from '../config';

const LINKS = (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login">Log in</a>
</>);

const priceNote = { fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' };
const priceNoteFeatured = { fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.7)' };

function PlanCards({ track, selfPrice, guidedPrice, sampleLine, bankLine, join, onBack }) {
  return (<>
    <div className="plans">
      <div className="plan rv">
        <h3>Sample</h3><div className="p-price">Free, no account</div>
        <ul><li>{sampleLine}</li><li>Explanations for every answer</li></ul>
        <a className="btn btn-navy" href="/pathways/sample-quiz" style={{ justifyContent: 'center' }}>Take the quiz</a>
      </div>
      <div className="plan rv rv-d1">
        <h3>Self-Study</h3>
        <div className="p-price">{selfPrice}<span style={priceNote}> /month</span></div>
        <ul><li>{bankLine}</li><li>Timed mock exams</li><li>Explanations for every answer</li><li>Progress tracking by topic</li></ul>
        <button className="btn btn-navy" style={{ justifyContent: 'center' }} onClick={() => join(track, 'self-study')}>{CHECKOUT_TEST_MODE ? 'Join the early-access list' : 'Join Self-Study'}</button>
      </div>
      <div className="plan featured rv rv-d2">
        <span className="most">Most complete</span>
        <h3>Guided</h3>
        <div className="p-price">{guidedPrice}<span style={priceNoteFeatured}> /month</span></div>
        <ul><li>Everything in Self-Study</li><li>One 45-minute 1:1 each month with a Navara behavior specialist - you set the agenda</li><li>Add a second monthly session at a discount</li><li>Session booking inside your account</li><li>Priority support</li></ul>
        <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => join(track, 'guided')}>{CHECKOUT_TEST_MODE ? 'Join the early-access list' : 'Join Guided'}</button>
      </div>
    </div>
    <p style={{ textAlign: 'center', marginTop: 30 }}><a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--teal-3)' }}>&larr; Choose a different exam</a></p>
    <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 600 }}>Cancel anytime from your account. The full refund policy appears at checkout.</p>
  </>);
}

const TRACKS = {
  rbt: {
    eyebrow: 'RBT track', heading: 'RBT exam prep.', selfPrice: '$49', guidedPrice: '$249',
    sampleLine: '10-question RBT sample quiz', bankLine: 'Full RBT question bank',
  },
  bcba: {
    eyebrow: 'BCBA track', heading: 'BCBA exam prep.', selfPrice: '$129', guidedPrice: '$450',
    sampleLine: '10-question BCBA sample quiz', bankLine: 'Full BCBA question bank',
  },
};

export default function Plans() {
  usePathwaysEffects();
  const [track, setTrack] = useState(null);
  const [modal, setModal] = useState(null); // {track, plan}
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const join = async (t, plan) => {
    const res = await startCheckout(t, plan);
    if (res && res.testMode) { setModal({ track: t, plan }); setSent(false); setEmail(''); setErr(''); }
  };
  const notify = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Enter a valid email address.'); return; }
    try {
      await joinWaitlist({ email, track: modal.track, plan: modal.plan });
      setSent(true);
    } catch { setErr('Something went wrong - try again.'); }
  };
  const t = track ? TRACKS[track] : null;
  return (<>
    <Nav links={LINKS} />
    <main>
      <header className="track-hero" style={{ padding: '170px 0 90px', textAlign: 'center' }}>
        <div className="orb orb-2"></div><div className="orb orb-3"></div>
        <div className="wrap">
          <span className="eyebrow rv in" style={{ justifyContent: 'center', display: 'inline-flex' }}>Plans</span>
          <h1 data-rise>Simple plans. <span className="grad">Serious prep.</span></h1>
          <p className="lead" style={{ marginLeft: 'auto', marginRight: 'auto' }}>Pick your exam to see its plans. Online checkout opens shortly; leave your email at any plan and we will tell you the moment it does.</p>
        </div>
      </header>
      {!track && (
        <section className="section">
          <div className="wrap">
            <div className="section-head rv"><span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Choose your exam</span>
              <h2>Which exam are you sitting for?</h2>
            </div>
            <div className="tracks">
              <a className="track-card rv" href="#rbt" onClick={(e) => { e.preventDefault(); setTrack('rbt'); }}>
                <div className="glow" style={{ background: '#5F8D9C' }}></div>
                <span className="track-tag tag-teal">RBT track</span>
                <h3>RBT exam prep</h3>
                <p>For behavior technicians getting certified. Full question bank, timed mocks, and optional 1:1 specialist time.</p>
                <span className="card-link">See RBT plans <span className="arr">&rarr;</span></span>
              </a>
              <a className="track-card rv rv-d1" href="#bcba" onClick={(e) => { e.preventDefault(); setTrack('bcba'); }}>
                <div className="glow" style={{ background: '#87aa99' }}></div>
                <span className="track-tag tag-navy">BCBA track</span>
                <h3>BCBA exam prep</h3>
                <p>For analysts sitting for the board exam. Scenario practice, full-length mocks, and optional 1:1 specialist time.</p>
                <span className="card-link">See BCBA plans <span className="arr">&rarr;</span></span>
              </a>
            </div>
          </div>
        </section>
      )}
      {track && (
        <section className="section">
          <div className="wrap">
            <span className="eyebrow rv in">{t.eyebrow}</span>
            <h2 data-rise style={{ marginBottom: 34 }}>{t.heading}</h2>
            <PlanCards track={track} selfPrice={t.selfPrice} guidedPrice={t.guidedPrice}
              sampleLine={t.sampleLine} bankLine={t.bankLine} join={join} onBack={() => setTrack(null)} />
          </div>
        </section>
      )}
      {modal && (
        <div className="modal-veil open" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Enrollment opens shortly</h3>
            {!sent ? (<>
              <p>Online checkout opens as soon as final compliance checks clear. Leave your email and we will tell you the moment {modal.plan === 'guided' ? 'Guided' : 'Self-Study'} enrollment opens for the {modal.track === 'bcba' ? 'BCBA' : 'RBT'} track. Nothing is charged today.</p>
              <div className="field" style={{ marginTop: 16 }}>
                <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {err && <p style={{ color: '#b3452e', fontSize: 13.5, fontWeight: 600, marginTop: 8 }}>{err}</p>}
              <button className="btn btn-navy" style={{ justifyContent: 'center', width: '100%', marginTop: 14 }} onClick={notify}>Notify me</button>
            </>) : (
              <p>You are on the list. We will email you the moment enrollment opens.</p>
            )}
            <button className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%', marginTop: 10 }} onClick={() => setModal(null)}>Close</button>
          </div>
        </div>
      )}
    </main>
    <Footer />
  </>);
}
