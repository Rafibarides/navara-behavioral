// Navara Pathways config. Values come from Vite env; without them the app runs in DEMO mode.
// Set in navara-site/.env.local (never committed):
//   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
//   VITE_SUPABASE_ANON_KEY=<anon public key>
//   VITE_STRIPE_PK=pk_test_... (test mode until the NJ prepaid-services review clears)
// Calendly event URLs are NEVER client env: they live only in the serverless
// booking function's env (CALENDLY_RBT_1ON1 / CALENDLY_BABA_1ON1).
export const CFG = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://tvvoauvtrgziwxtzlluq.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  stripePk: import.meta.env.VITE_STRIPE_PK || '',
};
export const DEMO = !CFG.supabaseUrl || !CFG.supabaseAnonKey;
export const CHECKOUT_TEST_MODE = true; // flip to live only after NJ review + Nisan's go
