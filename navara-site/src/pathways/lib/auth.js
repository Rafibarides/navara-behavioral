// Auth: demo (localStorage) now, Supabase Auth when config is present.
import { DEMO } from '../config';

const KEY = 'pw_demo';
export async function signIn(email) {
  if (DEMO) {
    const user = { plan: 'guided', track: 'rbt', name: 'Demo Member', email: email || 'demo@navara.test' };
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  }
  // Supabase: magic-link sign-in, wired when keys exist.
  const { getClient } = await import('./db');
  const sb = getClient();
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/pathways/app' } });
  if (error) throw error;
  return null; // user arrives via email link
}
export function currentUser() {
  if (DEMO) { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
  return null; // real session is read async via db.getSession() when Supabase is live
}
export async function signOut() {
  if (DEMO) { localStorage.removeItem(KEY); return; }
  const { getClient } = await import('./db');
  await getClient().auth.signOut();
}
