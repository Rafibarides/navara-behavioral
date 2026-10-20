// Navara Pathways config. The Supabase anon key is public-by-design (safe to
// ship in the bundle; row-level security protects all data). Stripe stays
// TEST MODE until the NJ prepaid-services review clears and Nisan says go.
// Calendly event URLs are NEVER client-side: they live only in the
// get_booking_url RPC's secrets table, behind a server-side credit spend.
export const CFG = {
  supabaseUrl: 'https://tvvoauvtrgziwxtzlluq.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dm9hdXZ0cmd6aXd4dHpsbHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMzAzNTEsImV4cCI6MjEwNzcwNjM1MX0.NPuKe_KdzNIiexpsQf5alm_rbzmiCop6GlIEs_1nI88',
  stripePk: '',
};
export const DEMO = !CFG.supabaseUrl || !CFG.supabaseAnonKey;
export const CHECKOUT_TEST_MODE = true; // flip to live only after NJ review + Nisan's go
