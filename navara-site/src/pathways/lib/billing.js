// Stripe Checkout. TEST MODE ONLY until the NJ prepaid-services review clears and Nisan says go.
// The secret key and price IDs never ship to the browser: checkout sessions are created
// by the create-checkout-session Supabase Edge Function (supabase/functions/).
import { CFG, CHECKOUT_TEST_MODE } from '../config';
import { getClient } from './db';

export async function startCheckout(track, plan) {
  if (CHECKOUT_TEST_MODE) {
    return { testMode: true, message: 'Checkout is in test mode. No payment is collected.' };
  }
  const sb = await getClient();
  const { data: { session } } = await sb.auth.getSession();
  const res = await fetch(CFG.supabaseUrl + '/functions/v1/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: CFG.supabaseAnonKey,
      ...(session ? { Authorization: 'Bearer ' + session.access_token } : {}),
    },
    body: JSON.stringify({ track, plan }),
  });
  const { url } = await res.json();
  window.location.href = url;
}
