import React, { useState } from 'react';
import { Nav, Footer } from '../components/Chrome';
import { signIn, signInDemo } from '../lib/auth';
import { DEMO } from '../config';

const LINKS = (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login">Log in</a>
</>);

export default function Login() {
  const [mode, setMode] = useState('create'); // 'create' | 'signin'
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);
  const go = async (e) => {
    e && e.preventDefault();
    if (!email) return;
    setBusy(true);
    setErr(null);
    try {
      const user = await signIn(email);
      if (DEMO && user) window.location.href = '/pathways/app/dashboard';
      else setSent(true); // magic link sent (live mode); first-time emails create the account
    } catch (ex) {
      setErr('Something went wrong sending your sign-in link. Try again in a moment.');
    } finally { setBusy(false); }
  };
  const demo = (e) => {
    e && e.preventDefault();
    signInDemo();
    window.location.href = '/pathways/app/dashboard';
  };
  const creating = mode === 'create';
  const tabBtn = (m, label) => (
    <button type="button" onClick={() => { setMode(m); setErr(null); }} style={{
      flex: 1, padding: '10px 0', border: 'none', borderRadius: 10, cursor: 'pointer',
      fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
      background: mode === m ? 'var(--navy)' : 'transparent',
      color: mode === m ? '#fff' : 'var(--ink-2)',
    }}>{label}</button>
  );
  return (<>
    <Nav links={LINKS} />
    <main>
      <section className="section" style={{ paddingTop: 180, minHeight: '100vh' }}>
        <div className="wrap">
          <div className="auth-card rv in">
            <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Members</span>
            <div style={{ display: 'flex', gap: 6, background: 'var(--light)', borderRadius: 12, padding: 5, margin: '14px 0 22px' }}>
              {tabBtn('create', 'Create account')}
              {tabBtn('signin', 'Sign in')}
            </div>
            <h2 style={{ fontSize: 30, marginBottom: 10 }}>{creating ? 'Create your account.' : 'Welcome back.'}</h2>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 28 }}>
              {DEMO
                ? 'Sign in to your practice dashboard. This preview uses a demo account.'
                : creating
                  ? 'Enter your email and we will send you a secure sign-in link. Clicking it creates your account - no password needed. You pick your plan inside.'
                  : 'Enter your email and we will send you a sign-in link. No password needed.'}
            </p>
            {sent ? (
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--teal-3)' }}>Check your inbox for the sign-in link.{creating ? ' It creates your account when you click it.' : ''}</p>
            ) : (<form onSubmit={go}>
              <div className="field"><label>Email</label><input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              {err && <p style={{ color: '#a33b41', fontSize: 13, fontWeight: 600 }}>{err}</p>}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy || !email} type="submit">
                {busy ? 'Sending...' : creating ? 'Create my account' : 'Email me a sign-in link'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <a href="#" onClick={demo} style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal-3)' }}>Preview the demo account instead</a>
              </div>
            </form>)}
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </>);
}
