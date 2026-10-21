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
export async function signIn(email) {
  if (DEMO) return signInDemo();
  const { getClient } = await import('./db');
  const sb = await getClient();
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/pathways/app/dashboard' } });
  if (error) throw error;
  return null; // user arrives via email link
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
  return {
    id: session.user.id,
    email: session.user.email,
    name: (prof && prof.full_name) || (session.user.email || '').split('@')[0],
    plan: (prof && prof.plan) || 'sample',
    track: (prof && prof.track) || 'rbt',
    role: (prof && prof.role) || 'member',
    createdAt: (prof && prof.created_at) || null,
  };
}

export async function signOut() {
  localStorage.removeItem(KEY);
  if (DEMO) return;
  const { getClient } = await import('./db');
  await getClient().auth.signOut();
}
