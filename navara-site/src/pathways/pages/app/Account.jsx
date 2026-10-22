import React, { useState } from 'react';
import AppNav from '../../components/AppNav';
import { useRequireUser } from '../../components/useRequireUser';
import { DEMO } from '../../config';
import { startPortal } from '../../lib/billing';

export default function Account() {
  const user = useRequireUser();
  const [name, setName] = useState(null);
  const [track, setTrack] = useState(null);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  if (!user) return null;
  const curName = name === null ? (user.name || '') : name;
  const curTrack = track === null ? (user.track || 'rbt') : track;
  const dirty = (name !== null && name !== (user.name || '')) || (track !== null && track !== (user.track || 'rbt'));
  const save = async () => {
    setErr(''); setSaved(false);
    try {
      if (!user.demo) {
        const { getClient } = await import('../../lib/db');
        const sb = await getClient();
        const { error } = await sb.from('profiles').upsert({ id: user.id, full_name: curName.trim() || null, track: curTrack }, { onConflict: 'id' });
        if (error) throw error;
      }
      setSaved(true);
      setTimeout(() => window.location.reload(), 700);
    } catch { setErr('Could not save. Try again.'); }
  };
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
          <div className="field" style={{ marginBottom: 14 }}>
            <label htmlFor="acct-name">First name</label>
            <input id="acct-name" type="text" placeholder="Your first name" value={curName} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 6 }}>
            <label htmlFor="acct-track">Exam track</label>
            <select id="acct-track" value={curTrack} onChange={(e) => setTrack(e.target.value)}>
              <option value="rbt">RBT exam</option>
              <option value="bcba">BCBA exam</option>
            </select>
          </div>
          <div className="score-row" style={{ marginTop: 10 }}><span>Email</span><span style={{ fontWeight: 700 }}>{user.email}</span></div>
          {dirty && <button className="btn btn-primary" style={{ marginTop: 16, justifyContent: 'center' }} onClick={save}>Save changes</button>}
          {saved && <p style={{ fontSize: 13, color: 'var(--teal-3)', fontWeight: 700, marginTop: 10 }}>Saved.</p>}
          {err && <p style={{ fontSize: 13, color: '#a33b41', fontWeight: 600, marginTop: 10 }}>{err}</p>}
        </div>
        <div className="panel" style={{ marginTop: 22 }}>
          <h3>Support</h3>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 600, margin: 0 }}>Questions about your account, billing, or practice? Email <a href="mailto:info@navarabehavioralgroup.com" style={{ color: 'var(--teal-3)', fontWeight: 700 }}>info@navarabehavioralgroup.com</a> - a human on the team replies.</p>
        </div>
      </div>
    </section>
  </>);
}
