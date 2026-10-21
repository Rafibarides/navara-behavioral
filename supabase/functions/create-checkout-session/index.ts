// Supabase Edge Function: create-checkout-session (LIVE).
// POST { track: 'rbt'|'bcba', plan: 'self-study'|'guided' } with the member's
// Authorization bearer -> { url } for Stripe Checkout. The webhook
// (stripe-webhook) grants the plan from the session metadata.
// Secrets: STRIPE_SK (live restricted key), STRIPE_PRICE_RBT_SELF,
// STRIPE_PRICE_RBT_GUIDED, STRIPE_PRICE_BCBA_SELF, STRIPE_PRICE_BCBA_GUIDED.
import Stripe from 'npm:stripe@^16';

const CORS = {
  'Access-Control-Allow-Origin': 'https://navarabehavioralgroup.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PRICES: Record<string, string | undefined> = {
  'rbt:self-study': Deno.env.get('STRIPE_PRICE_RBT_SELF'),
  'rbt:guided': Deno.env.get('STRIPE_PRICE_RBT_GUIDED'),
  'bcba:self-study': Deno.env.get('STRIPE_PRICE_BCBA_SELF'),
  'bcba:guided': Deno.env.get('STRIPE_PRICE_BCBA_GUIDED'),
};

async function userFromToken(token: string) {
  const res = await fetch(Deno.env.get('SUPABASE_URL') + '/auth/v1/user', {
    headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY')!, Authorization: 'Bearer ' + token },
  });
  if (!res.ok) return null;
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return new Response('{}', { status: 405, headers: CORS });
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return new Response(JSON.stringify({ error: 'sign-in required' }), { status: 401, headers: { ...CORS, 'content-type': 'application/json' } });
  const user = await userFromToken(token);
  if (!user || !user.id) return new Response(JSON.stringify({ error: 'sign-in required' }), { status: 401, headers: { ...CORS, 'content-type': 'application/json' } });

  const { track, plan } = await req.json().catch(() => ({}));
  const price = PRICES[`${track}:${plan}`];
  if (!price) return new Response('{}', { status: 400, headers: { ...CORS, 'content-type': 'application/json' } });

  const stripe = new Stripe(Deno.env.get('STRIPE_SK')!, { apiVersion: '2024-06-20' });
  const origin = req.headers.get('origin') || 'https://navarabehavioralgroup.com';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    client_reference_id: user.id,
    customer_email: user.email,
    metadata: { user_id: user.id, track, plan },
    subscription_data: { metadata: { user_id: user.id, track, plan } },
    success_url: origin + '/pathways/app/dashboard?welcome=1',
    cancel_url: origin + '/pathways/plans',
    custom_text: {
      submit: { message: 'Cancel anytime from your account - no refund for the current month. Full terms: navarabehavioralgroup.com/pathways/terms' },
    },
  });
  return new Response(JSON.stringify({ url: session.url }), {
    status: 200, headers: { ...CORS, 'content-type': 'application/json' },
  });
});
