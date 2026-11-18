// Optional self-practice exercises (P2 procedure spec, P3 unstipulated decision)
// for BCBA Guided members. Not part of the lesson flow: nothing here calls
// recordAttempt, evidence/progress loaders, or any program edge function.
//
// Gate (runs on every mount, every exercise switch, and every bfcache restore):
//   signed in (useRequireUser) AND a fresh, read-only, server-verified read of
//   profiles.plan === 'guided' AND profiles.track === 'bcba'.
// The decision never uses the user object from useRequireUser, because that
// hook can return a localStorage demo record without a live check. Any error,
// missing row, demo user, or DEMO build fails closed to the neutral page.
//
// Serving: the verified exercise HTML lives in src/ (not public/) and is
// dynamically imported only AFTER the check passes, then rendered in an iframe
// sandboxed to scripts only (opaque origin: no cookies, storage, session token,
// forms, popups or top navigation). What the learner types stays in that frame.
// This is app-level entitlement like the Guided pathway, not server
// confidentiality: the exercise text is not secret.
import React, { useEffect, useRef, useState } from 'react';
import AppNav from './AppNav';
import { useRequireUser } from './useRequireUser';
import { getClient } from '../lib/db';
import { DEMO } from '../config';

const EXERCISES = {
  'procedure-spec': { title: 'P2 procedure spec', load: () => import('../practice/editor_proto-p2s-procedure-spec.html?raw') },
  'unstipulated-decision': { title: 'P3 unstipulated decision', load: () => import('../practice/editor_proto-p3s-unstipulated-decision.html?raw') },
};

// Fresh read-only entitlement check. auth.getUser() is verified by the auth
// server (not just the locally stored session); the profile row is read under RLS.
export async function checkOptionalPracticeAccess() {
  if (DEMO) return false;
  try {
    const sb = await getClient();
    const { data: u, error: ue } = await sb.auth.getUser();
    if (ue || !u || !u.user) return false;
    const { data: p, error: pe } = await sb.from('profiles').select('plan,track').eq('id', u.user.id).single();
    if (pe || !p) return false;
    return p.plan === 'guided' && p.track === 'bcba';
  } catch { return false; }
}

// Wrapper-only addition (the stored exercise file is untouched): reports the
// document height so the frame can size itself instead of scrolling inside.
const HEIGHT_REPORTER = '<script>(function(){function s(){parent.postMessage({pwPracticeHeight:document.documentElement.scrollHeight},"*");}if(window.ResizeObserver)new ResizeObserver(s).observe(document.documentElement);addEventListener("load",s);s();})();</script>';
function withHeightReporter(html) {
  const i = html.lastIndexOf('</body>');
  return i < 0 ? html + HEIGHT_REPORTER : html.slice(0, i) + HEIGHT_REPORTER + html.slice(i);
}

export default function OptionalPracticeExercise({ exercise }) {
  const user = useRequireUser();
  const ex = EXERCISES[exercise];
  const [status, setStatus] = useState('checking');
  const [html, setHtml] = useState(null);
  const [height, setHeight] = useState(900);
  const frame = useRef(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!user) return;
    let live = true;
    const verify = async () => {
      const run = ++seq.current;
      setStatus('checking'); setHtml(null);
      const ok = !user.demo && !!ex && await checkOptionalPracticeAccess();
      if (!live || run !== seq.current) return;
      if (!ok) { setStatus('denied'); return; }
      try {
        const m = await ex.load();
        if (!live || run !== seq.current) return;
        setHtml(withHeightReporter(m.default));
        setStatus('ok');
      } catch { if (live && run === seq.current) setStatus('denied'); }
    };
    verify();
    const onShow = (e) => { if (e.persisted) verify(); };
    window.addEventListener('pageshow', onShow);
    return () => { live = false; window.removeEventListener('pageshow', onShow); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.demo, exercise]);

  useEffect(() => {
    const onMsg = (e) => {
      if (!frame.current || e.source !== frame.current.contentWindow) return;
      const h = e.data && e.data.pwPracticeHeight;
      if (Number.isFinite(h) && h > 0) setHeight(Math.ceil(h) + 8);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  if (!user || status === 'checking') return <section className="section"><div className="wrap" style={{ maxWidth: 780 }}><p role="status">Checking your access...</p></div></section>;
  if (status !== 'ok') return <><AppNav /><section className="section"><div className="wrap" style={{ maxWidth: 780 }}><h1>Optional practice</h1><p>This experience is part of the BCBA Guided plan. Your current plan and practice are unchanged.</p><a className="btn btn-navy" href="/pathways/app/dashboard">Back to dashboard</a></div></section></>;
  return <><AppNav /><section className="section" style={{ paddingTop: 24 }}><div className="wrap" style={{ maxWidth: 900 }}>
    <a href="/pathways/app/dashboard">Back to dashboard</a>
    <iframe ref={frame} title={ex.title} sandbox="allow-scripts" srcDoc={html} style={{ display: 'block', width: '100%', height, border: 0, marginTop: 12 }} />
  </div></section></>;
}
