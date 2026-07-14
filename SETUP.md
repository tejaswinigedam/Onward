# Onward — setup & deploy runbook

Monorepo: `packages/engine` (authoritative tax/salary/opportunity engine, unit-tested)
and `apps/web` (Next.js App Router frontend + API routes).

## Local development

```bash
npm install
npm test          # engine parity + dynamic-opportunity tests
npm run dev       # http://localhost:3000
```

Pages: `/` (landing) · `/salary` (Salary Demystifier) · `/offer` (Offer Analyzer)
· `/login` · `/account`. Calculators work fully without any backend config; sign-in
and saved history need Supabase (below).

## Phase 4 — activate auth & saved history (needs your Supabase project)

1. Create a Supabase project → Project Settings → API. Copy `apps/web/.env.example`
   to `apps/web/.env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` (same value), `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (`http://localhost:3000` locally; your domain in prod)
2. Run the schema: paste `supabase/migrations/0001_init.sql` into the Supabase SQL
   editor (creates `profiles`, `waitlist`, `computations` + RLS).
3. Auth providers (Supabase → Authentication):
   - **Google**: enable the Google provider, add OAuth client ID/secret, and add
     `<site>/auth/callback` to redirect URLs. (Primary sign-in — no email limits.)
   - **Magic link**: set an SMTP provider (Resend/SendGrid/SES) under Auth → SMTP,
     since Supabase's built-in sender is test-only and rate-limited.
4. Restart `npm run dev`. `/login` now shows Google + magic link; `/account` lists
   saved computations; "Save this calculation" on `/salary` persists per-user (RLS).

## Phase 5 — deploy (needs your Vercel project)

1. Import the repo in Vercel. Set the project root to `apps/web` (or keep root and
   let `next` build the app dir).
2. Add all env vars from `.env.local` to Vercel (Production + Preview).
3. Set `NEXT_PUBLIC_SITE_URL` to the production URL and add it to Supabase Auth
   redirect URLs.
4. Point the `onward.app` domain at Vercel; TLS is automatic.
5. Hardening (tracked): rate-limit public API routes, add Sentry, keep GA.
```
