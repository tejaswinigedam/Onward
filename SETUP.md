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

## Phase 4 — activate auth & saved history

**Auth = Clerk. Data store = Supabase Postgres** (not Supabase Auth).

1. Copy `apps/web/.env.example` to `apps/web/.env.local` and fill:
   - Clerk (Clerk dashboard → API Keys): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
     `CLERK_SECRET_KEY`.
   - Supabase (Project Settings → API): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
   - `NEXT_PUBLIC_SITE_URL` (`http://localhost:3000` locally; the Vercel URL in prod).
2. Run the schema in the Supabase SQL editor, in order:
   `supabase/migrations/0001_init.sql` then `supabase/migrations/0002_clerk_auth.sql`
   (0002 switches `user_id` to Clerk text ids and drops the Supabase-auth RLS).
3. In the Clerk dashboard, enable the sign-in methods you want (e.g. Google, email).
   Sign-in/up pages are already wired at `/sign-in` and `/sign-up`.
4. Restart `npm run dev`. The nav shows Sign in → Clerk; after signing in it shows
   Account + the Clerk user button. `/account` lists saved computations; "Save this
   calculation" on `/salary` persists per user (ownership enforced by the API via the
   Clerk user id + Supabase service role).

## Phase 5 — deploy (reuse existing Vercel project)

The repo `github.com/tejaswinigedam/Onward` now holds the monorepo (legacy static
site under `legacy/`). In the existing Vercel project → Settings:

1. **Build & Development → Root Directory** = `apps/web` (Vercel auto-detects the
   npm workspace and installs from the repo root). Framework = **Next.js**.
2. **Environment Variables** (Production + Preview) — from your Supabase project:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` (same URL), `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = your `https://<project>.vercel.app` URL
3. Redeploy (Deployments → Redeploy, or it auto-builds on the push).
4. In Supabase → Authentication → URL Configuration, add
   `https://<project>.vercel.app/auth/callback` to the redirect allow-list, and add
   the same to the Google OAuth client's authorized redirect URIs.

The app builds and the calculators work **without** any env vars; auth simply
stays inactive until the Supabase vars are present.

Hardening (tracked): rate-limit public API routes, add Sentry, keep GA.
```
