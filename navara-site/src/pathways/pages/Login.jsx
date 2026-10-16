import React, { useState } from 'react';
import { Nav, Footer } from '../components/Chrome';
import { signIn } from '../lib/auth';
import { DEMO } from '../config';

const LINKS = (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login">Log in</a>
</>);

export default function Login() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const go = async (e) => {
    e && e.preventDefault();
    setBusy(true);
    try {
      const user = await signIn(email);
      if (DEMO && user) window.location.href = '/pathways/app/dashboard';
      else setSent(true); // magic link sent (Supabase live mode)
    } finally { setBusy(false); }
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
                ? 'Sign in to your practice dashboard. This preview uses a demo account; real accounts arrive with the Supabase integration.'
                : 'Enter your email and we will send you a sign-in link.'}
            </p>
            {sent ? (
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--teal-3)' }}>Check your inbox for the sign-in link.</p>
            ) : (<form onSubmit={go}>
              <div className="field"><label>Email</label><input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="field"><label>Password</label><input type="password" placeholder="Your password" /></div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy} type="submit">Sign in</button>
              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <a href="#" onClick={(e) => { e.preventDefault(); go(); }} style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal-3)' }}>Use the demo account instead</a>
              </div>
            </form>)}
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </>);
}
