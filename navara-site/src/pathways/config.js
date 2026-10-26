// Navara Pathways config. The Supabase anon key is public-by-design (safe to
// ship in the bundle; row-level security protects all data). Stripe checkout
// sessions are created server-side by the
// create-checkout-session edge function, plans granted by the stripe-webhook
// edge function.
// Calendly event URLs are NEVER client-side: they live only in the
// get_booking_url RPC's secrets table, behind a server-side credit spend.
export const CFG = {
  supabaseUrl: 'https://tvvoauvtrgziwxtzlluq.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dm9hdXZ0cmd6aXd4dHpsbHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMzAzNTEsImV4cCI6MjEwNzcwNjM1MX0.NPuKe_KdzNIiexpsQf5alm_rbzmiCop6GlIEs_1nI88',
  stripePk: '',
  previewOnly: false,
  limitedLaunch: true,
  safeLearnerEndpoint: 'https://tvvoauvtrgziwxtzlluq.supabase.co/functions/v1/learner-contract',
};
export const DEMO = !CFG.supabaseUrl || !CFG.supabaseAnonKey;
export const CHECKOUT_TEST_MODE = false; // live since Oct 20 2026
