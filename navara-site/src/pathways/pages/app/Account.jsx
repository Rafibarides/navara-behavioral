import React, { useState } from 'react';
import AppNav from '../../components/AppNav';
import { Modal } from '../../components/Chrome';
import { useRequireUser } from '../../components/useRequireUser';

export default function Account() {
  const user = useRequireUser();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  return (<>
    <AppNav active="account" />
    <section className="section" style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div className="wrap" style={{ maxWidth: 640 }}>
        <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Account</span>
        <h2>Your plan.</h2>
        <div className="panel" style={{ marginTop: 26 }}>
          <h3>Subscription</h3>
          <div className="score-row"><span>Plan</span><span className="pill pill-teal">Guided (demo)</span></div>
          <div className="score-row"><span>Track</span><span className="pill pill-sage">RBT</span></div>
          <div className="score-row"><span>Status</span><span className="pill pill-teal">Active</span></div>
          <div style={{ marginTop: 22, display: 'grid', gap: 12 }}>
            <button className="btn btn-navy" style={{ justifyContent: 'center' }} onClick={() => setOpen(true)}>Manage billing</button>
            <button className="btn btn-ghost" style={{ justifyContent: 'center', color: 'var(--navy)', borderColor: 'rgba(27,59,98,.3)', background: '#fff' }} onClick={() => setOpen(true)}>Change plan or track</button>
          </div>
        </div>
        <div className="panel" style={{ marginTop: 22 }}>
          <h3>Profile</h3>
          <div className="field"><label>Name</label><input defaultValue={user.name} /></div>
          <div className="field"><label>Email</label><input defaultValue={user.email} /></div>
          <button className="btn btn-primary btn-sm">Save changes</button>
        </div>
      </div>
    </section>
    <Modal open={open} onClose={() => setOpen(false)} title="Stripe customer portal goes here">
      In the live product this opens your Stripe billing portal, where you can update your card, change plans, or cancel. Checkout stays in test mode until final compliance checks clear.
    </Modal>
  </>);
}
