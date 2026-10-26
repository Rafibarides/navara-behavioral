// Stripe Checkout (LIVE). The secret key and price IDs never ship to the browser:
// checkout and billing-portal sessions are created by Supabase Edge Functions
// (supabase/functions/). The stripe-webhook function grants the plan on payment.
import { CFG, CHECKOUT_TEST_MODE } from '../config';
import { getClient } from './db';

export async function startCheckout(track, plan) {
  if (CFG.limitedLaunch && plan !== 'self-study') throw new Error('Guided enrollment is not available.');
  if (CFG.previewOnly) throw new Error('Payments are not available in this test version.');
  if (CHECKOUT_TEST_MODE) {
    return { testMode: true, message: 'Checkout is in test mode. No payment is collected.' };
  }
  const sb = await getClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { // checkout needs an account so the plan can be granted
    window.location.href = '/pathways/login';
    return;
  }
  const res = await fetch(CFG.supabaseUrl + '/functions/v1/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: CFG.supabaseAnonKey,
      Authorization: 'Bearer ' + session.access_token,
    },
    body: JSON.stringify({ track, plan }),
  });
  const data = await res.json();
  if (!data.url) throw new Error(data.error || 'checkout failed');
  window.location.href = data.url;
}

// Stripe customer portal: card, invoices, cancellation.
export async function startPortal() {
  if (CFG.previewOnly) throw new Error('Billing is not available in this test version.');
  const sb = await getClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = '/pathways/login'; return; }
  const res = await fetch(CFG.supabaseUrl + '/functions/v1/create-portal-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: CFG.supabaseAnonKey,
      Authorization: 'Bearer ' + session.access_token,
    },
    body: '{}',
  });
  const data = await res.json();
  if (!data.url) throw new Error(data.error || 'portal failed');
  window.location.href = data.url;
}
