// Auth: demo (localStorage) or Supabase magic-link when config is present.
import { DEMO } from '../config';

const KEY = 'pw_demo';

function demoUser() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}

export function signInDemo() {
  const user = { plan: 'guided', track: 'rbt', name: 'Demo Member', email: 'demo@navara.test', demo: true };
  localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

// Send a magic link (live) or sign into the demo account (demo mode).
export async function signIn(email, meta = null) {
  if (DEMO) return signInDemo();
  const { getClient } = await import('./db');
  const sb = await getClient();
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/pathways/app/dashboard', ...(meta ? { data: meta } : {}) } });
  if (error) throw error;
  return null; // user arrives via email link
}

// Password sign-in for returning members who set a password.
export async function signInWithPassword(email, password) {
  const { getClient } = await import('./db');
  const sb = await getClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

// Set (or change) the signed-in member's password; marks the account so the
// dashboard stops prompting.
export async function setPassword(password) {
  const { getClient } = await import('./db');
  const sb = await getClient();
  const { error } = await sb.auth.updateUser({ password, data: { has_password: true } });
  if (error) throw error;
}

// True when the live account already has a password set.
export async function hasPassword() {
  if (DEMO) return true;
  const { getClient } = await import('./db');
  const sb = await getClient();
  const { data: { session } } = await sb.auth.getSession();
  return !!(session && session.user && session.user.user_metadata && session.user.user_metadata.has_password);
}

// Send a password-reset link; lands on /pathways/login?reset=1 with a session.
export async function sendPasswordReset(email) {
  const { getClient } = await import('./db');
  const sb = await getClient();
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/pathways/login?reset=1' });
  if (error) throw error;
}

// Synchronous read: demo account only. Live sessions resolve via getSessionUser().
export function currentUser() {
  return demoUser();
}

// Async live session read; returns a normalized member object or null.
export async function getSessionUser() {
  if (DEMO) return demoUser();
  const { getClient } = await import('./db');
  const sb = await getClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  let prof = null;
  try {
    const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
    prof = data;
  } catch { prof = null; }
  // First visit after a magic-link signup: save the name/track they entered.
  try {
    const pending = JSON.parse(localStorage.getItem('pw_pending_profile') || 'null');
    if (pending && (pending.full_name || pending.track)) {
      const row = { id: session.user.id };
      if (pending.full_name) row.full_name = pending.full_name;
      if (pending.track) row.track = pending.track;
      await sb.from('profiles').upsert(row, { onConflict: 'id' });
      prof = { ...(prof || {}), ...row };
      localStorage.removeItem('pw_pending_profile');
    }
  } catch { /* profile save can be retried from Account */ }
  // Same details travel with the sign-in link itself, so opening it on another device still works.
  try {
    const md = session.user.user_metadata || {};
    const row = { id: session.user.id };
    if (!(prof && prof.full_name) && md.full_name) row.full_name = md.full_name;
    if (!(prof && prof.track) && ['rbt', 'bcba'].includes(md.track)) row.track = md.track;
    if (row.full_name || row.track) {
      await sb.from('profiles').upsert(row, { onConflict: 'id' });
      prof = { ...(prof || {}), ...row };
    }
  } catch { /* retry from Account */ }
  return {
    id: session.user.id,
    email: session.user.email,
    name: (prof && prof.full_name) || null,
    plan: (prof && prof.plan) || 'sample',
    track: (prof && prof.track) || 'rbt',
    trackSet: !!(prof && prof.track),
    role: (prof && prof.role) || 'member',
    createdAt: (prof && prof.created_at) || null,
  };
}

export async function signOut() {
  localStorage.removeItem(KEY);
  if (DEMO) return;
  const { getClient } = await import('./db');
  const sb = await getClient();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}
