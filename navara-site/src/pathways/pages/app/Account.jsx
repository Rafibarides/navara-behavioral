import React, { useState } from 'react';
import AppNav from '../../components/AppNav';
import { useRequireUser } from '../../components/useRequireUser';
import { DEMO, CFG } from '../../config';
import { setPassword } from '../../lib/auth';
import { startPortal } from '../../lib/billing';

export default function Account() {
  const user = useRequireUser();
  const [pw, setPw] = useState(''), [pwMsg, setPwMsg] = useState(''), [pwBusy, setPwBusy] = useState(false);
  const [name, setName] = useState(null);
  const [track, setTrack] = useState(null);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const [billErr, setBillErr] = useState('');
  const [billBusy, setBillBusy] = useState(false);
  if (!user) return null;
  const profileName = user.name && user.name.toLowerCase() !== (user.email || '').split('@')[0].toLowerCase() ? user.name : '';
  const curName = name === null ? profileName : name;
  const curTrack = track === null ? (user.track || 'rbt') : track;
  const dirty = (name !== null && name !== profileName) || (track !== null && track !== (user.track || 'rbt'));
  const save = async () => {
    setErr(''); setSaved(false);
    try {
      if (!user.demo) {
        const { getClient } = await import('../../lib/db');
        const sb = await getClient();
        const { error } = await sb.from('profiles').update({ full_name: curName.trim() || null }).eq('id', user.id);
        if (error) throw error;
        const { error: trackError } = await sb.rpc('learner_set_track', { p_track: curTrack });
        if (trackError) throw trackError;
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
          <h3>Plan access</h3>
          <div className="score-row"><span>Plan</span><span className="pill pill-teal">{plan}{user.demo || DEMO ? ' (demo)' : ''}</span></div>
          <div className="score-row"><span>Track</span><span className="pill pill-sage">{user.track === 'bcba' ? 'BCBA' : 'RBT'}</span></div>
          <div className="score-row"><span>Status</span><span className="pill pill-teal">Active</span></div>
          {!CFG.previewOnly && user.plan !== 'sample' && !user.demo && !DEMO
            ? <button className="btn btn-navy" style={{ marginTop: 18, justifyContent: 'center' }} disabled={billBusy} onClick={async () => { setBillErr(''); setBillBusy(true); try { await startPortal(); } catch (error) { setBillErr(error?.code === 'billing_not_linked' ? 'No billing account is linked to this login. Your study access can be active without a paid subscription. If you paid using another login or need help, contact support.' : 'We could not open billing just now. Please try again in a moment, or email support through the Contact page.'); setBillBusy(false); } }}>{billBusy ? 'Opening billing...' : 'Manage billing (card, plan, cancellation)'}</button>
            : <p style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, marginTop: 18 }}>Choose a Self-Study plan to start practicing.</p>}
          {billErr && <p role="alert" style={{ fontSize: 13.5, color: '#9b2c2c', fontWeight: 700, marginTop: 12 }}>{billErr}</p>}
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
          <h3>Manage your password</h3><p>Set or update the password you use to sign in.</p>
          <form onSubmit={async e => { e.preventDefault(); if(pw.length<6 || pwBusy) return; setPwBusy(true); setPwMsg(''); try { await setPassword(pw); setPw(''); setPwMsg('Password updated.'); } catch { setPwMsg('Could not update your password. Please try again.'); } finally { setPwBusy(false); } }}>
            <p className="password-hint" id="password-hint">Use at least 6 characters.</p><div className="field" style={{marginTop:16}}><label htmlFor="account-password">New password</label><input id="account-password" aria-describedby="password-hint" type="password" autoComplete="new-password" minLength={6} required value={pw} onChange={e=>setPw(e.target.value)} /></div>
            <button className="btn btn-navy" type="submit" disabled={pw.length<6 || pwBusy} style={{ marginTop: 16 }}>{pwBusy ? 'Updating...' : 'Update password'}</button><p role="status">{pwMsg}</p>
          </form>
        </div>
        <div className="panel" style={{ marginTop: 22 }}>
          <h3>Support</h3>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 600, margin: 0 }}>Questions about your account, billing, or practice? Email <a href="mailto:info@navarabehavioralgroup.com" style={{ color: 'var(--teal-3)', fontWeight: 700 }}>info@navarabehavioralgroup.com</a> - a human on the team replies.</p>
        </div>
      </div>
    </section>
  </>);
}
