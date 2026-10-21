import React from 'react';
import AppNav from '../../components/AppNav';
import { useRequireUser } from '../../components/useRequireUser';
import { DEMO } from '../../config';
import { startPortal } from '../../lib/billing';

export default function Account() {
  const user = useRequireUser();
  if (!user) return null;
  const plan = user.plan === 'guided' ? 'Guided' : user.plan === 'self-study' ? 'Self-Study' : 'Sample';
  return (<>
    <AppNav active="account" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap" style={{ maxWidth: 640 }}>
        <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Account</span>
        <h2>Your plan.</h2>
        <div className="panel" style={{ marginTop: 26 }}>
          <h3>Subscription</h3>
          <div className="score-row"><span>Plan</span><span className="pill pill-teal">{plan}{user.demo || DEMO ? ' (demo)' : ''}</span></div>
          <div className="score-row"><span>Track</span><span className="pill pill-sage">{user.track === 'bcba' ? 'BCBA' : 'RBT'}</span></div>
          <div className="score-row"><span>Status</span><span className="pill pill-teal">Active</span></div>
          {user.plan !== 'sample' && !user.demo && !DEMO
            ? <button className="btn btn-navy" style={{ marginTop: 18, justifyContent: 'center' }} onClick={() => startPortal()}>Manage billing (card, plan, cancellation)</button>
            : <p style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, marginTop: 18 }}>Paid plans manage their card, plan changes and cancellation right here. Any Navara email reaches a human who can also help.</p>}
        </div>
        <div className="panel" style={{ marginTop: 22 }}>
          <h3>Profile</h3>
          <div className="score-row"><span>Name</span><span style={{ fontWeight: 700 }}>{user.name}</span></div>
          <div className="score-row"><span>Email</span><span style={{ fontWeight: 700 }}>{user.email}</span></div>
        </div>
      </div>
    </section>
  </>);
}
