// Supabase Edge Function: stripe-webhook. Stripe -> membership grants.
// checkout.session.completed: set profiles.plan/track + stripe_customer_id;
// Legacy Guided wallet writes removed.
// invoice.payment_succeeded: no legacy credits.
// customer.subscription.updated: re-sync plan from the subscription's price.
// customer.subscription.deleted: downgrade to 'sample'.
// Secrets: STRIPE_SK, STRIPE_WEBHOOK_SECRET. Service role is built in.
import Stripe from 'npm:stripe@^16';
import { createClient } from 'npm:@supabase/supabase-js@^2';

const stripe = new Stripe(Deno.env.get('STRIPE_SK')!, { apiVersion: '2024-06-20' });
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

async function grant(userId: string, track: string, plan: string, customerId: string | null) {
  const upd: Record<string, unknown> = { plan };
  if (track === 'rbt' || track === 'bcba') upd.track = track;
  if (customerId) upd.stripe_customer_id = customerId;
  await db.from('profiles').update(upd).eq('id', userId);

}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('{}', { status: 405 });
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('{}', { status: 400 });
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET')!);
  } catch {
    return new Response('{}', { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as Stripe.Checkout.Session;
      const m = s.metadata || {};
      if (m.user_id && m.plan) await grant(m.user_id, m.track || '', m.plan, (s.customer as string) || null);
    } else if (event.type === 'invoice.payment_succeeded') {
      // Legacy Guided wallet retired. Canonical paid-period ingress owns grants.
      // Invoice events never refill session_credits here.
    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      const m = sub.metadata || {};
      const active = sub.status === 'active' || sub.status === 'trialing';
      if (m.user_id && m.plan) {
        if (active) await grant(m.user_id, m.track || '', m.plan, (sub.customer as string) || null);
        else await db.from('profiles').update({ plan: 'sample' }).eq('id', m.user_id);
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const m = sub.metadata || {};
      if (m.user_id) await db.from('profiles').update({ plan: 'sample' }).eq('id', m.user_id);
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'content-type': 'application/json' } });
});
