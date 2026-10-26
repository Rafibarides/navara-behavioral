import React, { useEffect, useState } from 'react';
import { Nav, Footer } from '../components/Chrome';
import { signIn, signInWithPassword, setPassword, sendPasswordReset } from '../lib/auth';
import { DEMO } from '../config';

const LINKS = (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login?mode=signin">Log in</a>
</>);

export default function Login() {
  const resetting = new URLSearchParams(window.location.search).get('reset') === '1';
  const expired = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('expired') === '1' || /otp_expired|access_denied/.test(window.location.hash));
  const [mode, setMode] = useState(resetting ? 'reset' : (expired || new URLSearchParams(window.location.search).get('mode') === 'signin') ? 'signin' : 'create'); // 'create' | 'signin' | 'reset'
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [track, setTrack] = useState('rbt');
  const [pw, setPw] = useState('');
  const [useLink, setUseLink] = useState(expired);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => {
    // Already signed in: go straight to the dashboard (not while setting a new password or showing an expired link).
    if (DEMO || resetting || expired || /type=recovery/.test(window.location.hash)) return;
    let on = true;
    import('../lib/auth').then((m) => m.getSessionUser()).then((u) => { if (on && u && !u.demo) window.location.replace('/pathways/app/dashboard'); }).catch(() => {});
    return () => { on = false; };
  }, []);
  const go = async (e) => {
    e && e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === 'reset') {
        if (pw.length < 6) { setErr('Password needs at least 6 characters.'); return; }
        await setPassword(pw);
        window.location.href = '/pathways/app/dashboard';
        return;
      }
      if (!email) { setErr('Enter your email to continue.'); return; }
      if (creating) {
        try { localStorage.setItem('pw_pending_profile', JSON.stringify({ full_name: firstName.trim() || null, track })); } catch {}
      }
      if (mode === 'signin' && !useLink && !DEMO) {
        if (!pw) { setErr('Enter your password to sign in.'); return; }
        try {
          await signInWithPassword(email, pw);
          window.location.href = '/pathways/app/dashboard';
          return;
        } catch {
          setErr('Email or password did not match. Try again, or use a sign-in link below.');
          return;
        }
      }
      const user = await signIn(email, creating ? { full_name: firstName.trim() || undefined, track } : null);
      if (DEMO && user) window.location.href = '/pathways/app/dashboard';
      else setSent(true); // magic link sent (live mode); first-time emails create the account
    } catch (ex) {
      setErr('Something went wrong. Try again in a moment.');
    } finally { setBusy(false); }
  };
  const forgot = async () => {
    if (!email) { setErr('Enter your email above first, then tap reset.'); return; }
    setBusy(true);
    setErr(null);
    try { await sendPasswordReset(email); setDone(true); }
    catch { setErr('Could not send the reset email. Try again in a moment.'); }
    finally { setBusy(false); }
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
      <section className="section" style={{ paddingTop: 56, minHeight: '100vh' }}>
        <div className="wrap">
          <div className="auth-card rv in">
            <span className="eyebrow" style={{ color: 'var(--teal-3)' }}>Members</span>
            <div style={{ display: 'flex', gap: 6, background: 'var(--light)', borderRadius: 12, padding: 5, margin: '14px 0 22px' }}>
              {tabBtn('create', 'Create account')}
              {tabBtn('signin', 'Sign in')}
            </div>
            <h1 style={{ fontSize: 30, marginBottom: 10, lineHeight: 1.15 }}>{mode === 'reset' ? 'Choose a new password.' : creating ? 'Create your account.' : 'Welcome back.'}</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 28 }}>
              {DEMO
                ? 'Sign in to your practice dashboard. This preview uses a demo account.'
                : mode === 'reset'
                  ? 'Pick a password you will remember. After this you can sign in with your email and password any time.'
                  : creating
                    ? 'Tell us your first name and exam, add your email, and we will send you a secure sign-in link. Clicking it creates your account. You can manage your password from Account after signing in.'
                    : useLink
                      ? 'Enter your email and we will send you a sign-in link. No password needed.'
                      : 'Sign in with your email and password. First time here, or never set a password? Use the sign-in link option below.'}
            </p>
            {new URLSearchParams(window.location.search).get('signedout') === '1' && <p className="signed-out-notice" role="status">You're signed out.</p>}
            {expired && !sent && !done && (
              <p role="alert" style={{ background: 'var(--light)', border: '1px solid rgba(27,59,98,.15)', borderRadius: 12, padding: '12px 14px', fontSize: 14, fontWeight: 600, color: 'var(--ink-2)', margin: '-8px 0 20px' }}>That sign-in link has expired or was already used. Each link works once. Enter your email below and we will send a new one, then use the most recent email.</p>
            )}
            {done ? (
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--teal-3)' }}>Check your inbox - the reset link is on its way.</p>
            ) : sent ? (
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--teal-3)' }}>Check your inbox for the sign-in link.{creating ? ' It creates your account when you click it.' : ''} <span style={{ display: 'block', fontWeight: 600, fontSize: 13.5, color: 'var(--ink-2)', marginTop: 8 }}>If you request more than one, use the most recent email. Older links stop working.</span></p>
            ) : (<form onSubmit={go}>
              {creating && (<>
                <div className="field"><label htmlFor="pw-first-name">First name</label><input id="pw-first-name" autoComplete="given-name" type="text" placeholder="Your first name" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                <div className="field"><label htmlFor="pw-track">Which exam are you preparing for?</label>
                  <select id="pw-track" value={track} onChange={(e) => setTrack(e.target.value)}>
                    <option value="rbt">RBT exam</option>
                    <option value="bcba">BCBA exam</option>
                  </select></div>
              </>)}
              {mode !== 'reset' && <div className="field"><label htmlFor="pw-email">Email</label><input id="pw-email" required autoComplete="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>}
              {mode === 'reset'
                ? <div className="field"><label>New password</label><input type="password" required minLength={6} autoComplete="new-password" placeholder="At least 6 characters" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
                : (mode === 'signin' && !useLink && !DEMO) && <div className="field"><label>Password</label><input type="password" required autoComplete="current-password" placeholder="Your password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>}
              {err && <p style={{ color: '#a33b41', fontSize: 13, fontWeight: 600 }}>{err}</p>}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy || (mode !== 'reset' && !email)} type="submit">
                {busy ? 'One moment...' : mode === 'reset' ? 'Save my password' : creating ? 'Create my account' : useLink ? 'Email me a sign-in link' : 'Sign in'}
              </button>
              {!creating && mode !== 'reset' && !DEMO && (
                <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13.5, fontWeight: 600 }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setUseLink(!useLink); setErr(null); }} style={{ color: 'var(--teal-3)' }}>
                    {useLink ? 'Sign in with a password instead' : 'Email me a sign-in link instead'}
                  </a>
                  {!useLink && <> &nbsp;|&nbsp; <a href="#" onClick={(e) => { e.preventDefault(); forgot(); }} style={{ color: 'var(--teal-3)' }}>Forgot password</a></>}
                </p>
              )}
            </form>)}
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </>);
}
