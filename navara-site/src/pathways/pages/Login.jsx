import React, { useState } from 'react';
import { Nav, Footer } from '../components/Chrome';
import { signIn, signInDemo } from '../lib/auth';
import { DEMO } from '../config';

const LINKS = (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login">Log in</a>
</>);

export default function Login() {
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
      else setSent(true); // magic link sent (live mode)
    } catch (ex) {
      setErr('Something went wrong sending your sign-in link. Try again in a moment.');
    } finally { setBusy(false); }
  };
  const demo = (e) => {
    e && e.preventDefault();
    signInDemo();
    window.location.href = '/pathways/app/dashboard';
  };
  return (<>
    <Nav links={LINKS} />
    <main>
      <section className="section" style={{ paddingTop: 180, minHeight: '100vh' }}>
        <div className="wrap">
          <div className="auth-card rv in">
            <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Members</span>
            <h2 style={{ fontSize: 30, marginBottom: 10 }}>Welcome back.</h2>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 28 }}>
              {DEMO
                ? 'Sign in to your practice dashboard. This preview uses a demo account.'
                : 'Enter your email and we will send you a sign-in link. No password needed.'}
            </p>
            {sent ? (
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--teal-3)' }}>Check your inbox for the sign-in link.</p>
            ) : (<form onSubmit={go}>
              <div className="field"><label>Email</label><input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              {err && <p style={{ color: '#a33b41', fontSize: 13, fontWeight: 600 }}>{err}</p>}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy || !email} type="submit">{busy ? 'Sending...' : 'Email me a sign-in link'}</button>
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
