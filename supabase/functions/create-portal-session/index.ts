// Supabase Edge Function: create-portal-session (LIVE).
// POST with the member's Authorization bearer -> { url } for the Stripe
// customer portal (card, invoices, cancellation). Looks up the member's
// stripe_customer_id from profiles (service role).
// Secret: STRIPE_SK.
import Stripe from 'npm:stripe@^16';
import { createClient } from 'npm:@supabase/supabase-js@^2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('{}', { status: 405 });
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return new Response(JSON.stringify({ error: 'sign-in required' }), { status: 401 });
  const ures = await fetch(Deno.env.get('SUPABASE_URL') + '/auth/v1/user', {
    headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY')!, Authorization: 'Bearer ' + token },
  });
  if (!ures.ok) return new Response(JSON.stringify({ error: 'sign-in required' }), { status: 401 });
  const user = await ures.json();

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: prof } = await db.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
  if (!prof?.stripe_customer_id) return new Response(JSON.stringify({ error: 'no subscription on file' }), { status: 400 });

  const stripe = new Stripe(Deno.env.get('STRIPE_SK')!, { apiVersion: '2024-06-20' });
  const origin = req.headers.get('origin') || 'https://navarabehavioralgroup.com';
  const portal = await stripe.billingPortal.sessions.create({
    customer: prof.stripe_customer_id,
    return_url: origin + '/pathways/app/account',
  });
  return new Response(JSON.stringify({ url: portal.url }), { status: 200, headers: { 'content-type': 'application/json' } });
});
