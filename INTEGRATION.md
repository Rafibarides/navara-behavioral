# Navara Pathways - /pathways integration

React port of the approved phase-1 prototype, structured for Supabase, Stripe (test mode), and Calendly.

## Layout

    navara-site/src/pathways/
      PathwaysApp.jsx        routes for /pathways/*
      pathways.css           the approved design system (ported from the prototype 1:1)
      config.js              env-driven config; DEMO mode when env is missing
      lib/auth.js            demo sign-in now, Supabase magic-link when keys exist
      lib/db.js              question/attempt/credit access; demo fallback
      lib/billing.js         Stripe Checkout (TEST MODE until NJ review clears + go-ahead)
      lib/booking.js         private Calendly event URLs per track
      data/questions.js      PLACEHOLDER sample questions, clearly marked; real banks replace this file
      components/            Chrome (nav/footer/effects), AppNav, Quiz engine, useRequireUser
      pages/                 Landing, RbtTrack, BcbaTrack, Plans, Login, SampleQuiz, app/{Dashboard,Practice,Mock,Book,Account}
    supabase/schema.sql      tables + RLS for profiles, questions, attempts, session_credits

## Wiring

1. Merge `navara-site/src/pathways/` into the repo.
2. In `src/App.jsx`: add `<Route path="/pathways/*" element={<PathwaysApp />} />` (see App.jsx.snippet).
3. In `src/seo/pages.json`: add the five public entries from pages.json.snippet so prerender/sitemap pick them up.
   Member pages under /pathways/app stay out of pages.json and get noindex.
4. `npm i @supabase/supabase-js` when Supabase keys exist (lib/db.js lazy-loads it).
5. Copy `.env.example` to `.env.local` and fill in values as they arrive.

## What is NOT done (needs Nisan / his accounts)

- Supabase project: he creates it (free tier), we collect project URL + anon key + service key via secure vault link.
- Stripe: test keys via secure vault link; an Edge Function (`supabase/functions/create-checkout-session/`, stub included) still needs to be written against his price IDs once prices are set. Nothing charges; test mode only.
- Calendly: both event types exist (RBT and BCBA 1:1). The URLs are server-side secrets only - they live in the booking function's env and are handed to a member's browser only after a server-side Guided-plan + credit check (supabase/functions/get-booking-url/ (Supabase Edge Function)). In demo mode the Book page shows the placeholder modal; no public preview can book a real slot.
- Deployment: nothing is pushed or deployed. The github tool surface here is read-only, so this tree is delivered as a zip for whoever pushes.
- Question banks: tab is producing the real banks in ~50-question batches; `data/questions.js` is marked sample-only until those land.

## Design

Branding, palette, Montserrat, and the arc logo come straight from navarabehavioralgroup.com; the Pathways look (orbs, gradients, rising headlines, counters) was approved by Nisan on the prototype screenshots.

## Hosting

The marketing site stays static on GitHub Pages - no new host is introduced.
The booking endpoint runs as a Postgres RPC (get_booking_url) inside the
project - already deployed. The Calendly URLs live in public.app_secrets, a
table with no RLS policies, so the API cannot read them; the only way out is
the RPC, which checks plan + credits and spends one credit first.

The Stripe checkout endpoint stays an Edge Function stub
(supabase/functions/create-checkout-session/) until test keys and price IDs
exist. Deploy it then with:

    supabase functions deploy create-checkout-session
    supabase secrets set STRIPE_SK=sk_test_... STRIPE_PRICE_RBT_SELF=... \
      STRIPE_PRICE_RBT_GUIDED=... STRIPE_PRICE_BCBAs_SELF=... STRIPE_PRICE_BCBA_GUIDED=...

## Error-pattern diagnostics + test-taking coaching (phase 1 addition)

- Every wrong option in the banks carries: misconception_tag, why_tempting,
  confuses_with, remediation_pointer (see data/questions.js for the exact shape;
  the same format went to Tab for the real banks).
- Member-facing: per-choice real-time feedback after each answer, pacing
  coaching in timed mocks (RBT 63s/question, BCBA ~78s/question per BACB exam
  format), test-taking tips on the dashboard, adaptive next sets via
  adaptive_set() targeting the member's active misconception tags.
- INTERNAL: the rolled-up pattern overview lives on /pathways/app/specialist,
  gated on profiles.role = 'staff'. Members never see it; the specialist walks
  the member through it in the 1:1.
- attempts rows store chosen_option, misconception, confuses_with, ms;
  pattern_summary view aggregates for the specialist.
- Stripe: checkout stays stubbed in TEST MODE (CHECKOUT_TEST_MODE=true in
  config.js). Live keys are never used. Flip only after the NJ review, test
  keys in the vault, and Nisan's explicit go.

## Live Supabase project

Project ref tvvoauvtrgziwxtzlluq is the default in config.js. Keys come from
the vault ("Supabase navara-pathways anon key" / "... service_role key").
Deploy schema.sql in the SQL editor (or via psql with the DB password), then:
supabase functions deploy get-booking-url create-checkout-session.
