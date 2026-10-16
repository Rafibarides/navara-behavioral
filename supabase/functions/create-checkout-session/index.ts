// Supabase Edge Function: create-checkout-session (STUB - pending launch prices).
// POST { track: 'rbt'|'bcba', plan: 'self-study'|'guided' } -> { url } for Stripe Checkout.
// Secrets: STRIPE_SK (sk_test_... while in test mode), STRIPE_PRICE_RBT_SELF,
// STRIPE_PRICE_RBT_GUIDED, STRIPE_PRICE_BCBAs_SELF, STRIPE_PRICE_BCBA_GUIDED.
// Keep TEST MODE keys until the NJ prepaid-services review clears and Nisan says go.
import Stripe from 'npm:stripe@^16';

const PRICES: Record<string, string | undefined> = {
  'rbt:self-study': Deno.env.get('STRIPE_PRICE_RBT_SELF'),
  'rbt:guided': Deno.env.get('STRIPE_PRICE_RBT_GUIDED'),
  'bcba:self-study': Deno.env.get('STRIPE_PRICE_BCBAs_SELF'),
  'bcba:guided': Deno.env.get('STRIPE_PRICE_BCBA_GUIDED'),
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('{}', { status: 405 });
  const { track, plan } = await req.json().catch(() => ({}));
  const price = PRICES[`${track}:${plan}`];
  if (!price) return new Response('{}', { status: 400 });

  const stripe = new Stripe(Deno.env.get('STRIPE_SK')!, { apiVersion: '2024-06-20' });
  const origin = req.headers.get('origin') || 'https://navarabehavioralgroup.com';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    success_url: origin + '/pathways/app/dashboard?welcome=1',
    cancel_url: origin + '/pathways/plans',
    // Refund policy text is shown at checkout via the Dashboard settings; keep visible.
  });
  return new Response(JSON.stringify({ url: session.url }), {
    status: 200, headers: { 'content-type': 'application/json' },
  });
});
