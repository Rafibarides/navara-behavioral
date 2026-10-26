import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Nav, Footer, usePathwaysEffects } from '../components/Chrome';
import { startCheckout } from '../lib/billing';
import { joinWaitlist } from '../lib/db';
import { CHECKOUT_TEST_MODE, CFG } from '../config';
import { usePreview } from '../components/Showcase';

const LINKS = (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login?mode=signin">Log in</a>
  <a className="btn btn-primary btn-sm" href="/pathways/login">Create account</a>
</>);

const priceNote = { fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' };
const priceNoteFeatured = { fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.7)' };

function PlanCards({ track, selfPrice, guidedPrice, sampleLine, bankLine, guidedLine, join, joinErr, preview }) {
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
        <ul><li>{bankLine}</li><li>Untimed practice with answer explanations</li><li>Explanations for every answer</li><li>Progress tracking by topic</li></ul>
        <button className="btn btn-navy" style={{ justifyContent: 'center' }} onClick={() => join(track, 'self-study')}>{CHECKOUT_TEST_MODE ? 'Join the early-access list' : 'Join Self-Study'}</button>
      </div>
      {!CFG.limitedLaunch && <div className="plan featured rv rv-d2">
        <span className="most">Most complete</span>
        <h3>Guided</h3>
        <div className="p-price">{guidedPrice}<span style={priceNoteFeatured}> /month</span></div>
        {CFG.previewOnly ? <p>Guided sessions and booking are not available at launch.</p> : <ul><li>Everything in Self-Study</li><li>{guidedLine}</li><li>Session booking inside your account</li><li>Priority support</li></ul>}
        <button className="btn btn-primary" disabled={CFG.previewOnly} style={{ justifyContent: 'center' }} onClick={() => join(track, 'guided')}>{CHECKOUT_TEST_MODE ? 'Join the early-access list' : 'Join Guided'}</button>
      </div>}
    </div>
    <p style={{ textAlign: 'center', marginTop: 30, fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>Sitting for the {track === 'rbt' ? 'BCBA' : 'RBT'} exam? <a href={track === 'rbt' ? '/pathways/plans/bcba' : '/pathways/plans/rbt'} style={{ fontWeight: 700, color: 'var(--teal-3)' }}>See {track === 'rbt' ? 'BCBA' : 'RBT'} plans instead &rarr;</a></p>
    {joinErr && <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#b3452e', fontWeight: 700 }}>{joinErr}</p>}
    <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 600 }}>Cancel anytime from your account - no refund for the current month.</p>
    {preview && <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>Free sample questions on every track &middot; Secure checkout by Stripe &middot; Nothing charged until you subscribe</p>}
  </>);
}

const TRACKS = {
  rbt: {
    eyebrow: 'RBT track', heading: 'RBT exam prep.', selfPrice: '$49', guidedPrice: '$249',
    sampleLine: '10-question RBT sample quiz', bankLine: 'Full RBT question bank',
    guidedLine: 'One 45-minute 1:1 each month with a Navara Certified Behavior Specialist (NCBS) - you set the agenda',
  },
  bcba: {
    eyebrow: 'BCBA track', heading: 'BCBA exam prep.', selfPrice: '$129', guidedPrice: '$450',
    sampleLine: '10-question BCBA sample quiz', bankLine: 'Full BCBA question bank',
    guidedLine: 'Two 45-minute 1:1s each month with a Navara Certified Behavior Specialist (NCBS) - you set the agenda',
  },
};

export default function Plans({ track: trackProp = null }) {
  usePathwaysEffects();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initial = trackProp || (['rbt','bcba'].includes(searchParams.get('track')) ? searchParams.get('track') : null);
  const [track, setTrackState] = useState(initial);
  const setTrack = (t) => { setTrackState(t); navigate(t ? `/pathways/plans/${t}` : '/pathways/plans', { replace: true }); };
  const [modal, setModal] = useState(null); // {track, plan}
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [joinErr, setJoinErr] = useState('');
  const preview = usePreview();
  const join = async (t, plan) => {
    setJoinErr('');
    try {
      const res = await startCheckout(t, plan);
      if (res && res.testMode) { setModal({ track: t, plan }); setSent(false); setEmail(''); setErr(''); }
    } catch {
      setJoinErr('Checkout did not start. Check your connection and try again - if it keeps failing, email info@navarabehavioralgroup.com and we will get you enrolled.');
    }
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
      <header className="track-hero" style={{ padding: '104px 0 90px', textAlign: 'center' }}>
        <div className="orb orb-2"></div><div className="orb orb-3"></div>
        <div className="wrap">
          <span className="eyebrow rv in" style={{ justifyContent: 'center', display: 'inline-flex' }}>Plans</span>
          <h1 data-rise>Simple plans. <span className="grad">Serious prep.</span></h1>
          <p className="lead" style={{ marginLeft: 'auto', marginRight: 'auto' }}>{CFG.limitedLaunch ? 'Self-Study includes untimed practice, option explanations, set results and recorded progress. Timed sets, tag-specific review, Guided sessions and booking are not available.' : CFG.previewOnly ? 'Payments and enrollment are not available at launch. Use your existing test account to practice.' : track ? 'Checkout is online - join in a couple of minutes and start practicing today.' : 'Pick your exam to see its plans. Checkout is online - join in a couple of minutes and start practicing today.'}</p>
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
                <p>For behavior technicians getting certified. Practice questions, explanations and set results. Guided sessions and booking are not available.</p>
                <span className="card-link">See RBT plans <span className="arr">&rarr;</span></span>
              </a>
              <a className="track-card rv rv-d1" href="#bcba" onClick={(e) => { e.preventDefault(); setTrack('bcba'); }}>
                <div className="glow" style={{ background: '#87aa99' }}></div>
                <span className="track-tag tag-navy">BCBA track</span>
                <h3>BCBA exam prep</h3>
                <p>For analysts sitting for the board exam. Scenario practice with answer explanations and set results. Guided sessions and booking are not available.</p>
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
              sampleLine={t.sampleLine} bankLine={t.bankLine} guidedLine={t.guidedLine} join={join} joinErr={joinErr} preview={preview} />
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
