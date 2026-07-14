-- Onward initial schema: profiles, waitlist, computations + RLS.
-- Apply in the Supabase SQL editor (or `supabase db push`).

-- ── profiles: one row per auth user, holds onboarding data ──
create table if not exists public.profiles (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  role               text,
  experience_years   numeric,
  city_tier          text check (city_tier in ('metro', 'non-metro')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── waitlist: public signups (written via service role from /api/waitlist) ──
create table if not exists public.waitlist (
  id          bigint generated always as identity primary key,
  email       text not null unique,
  source      text not null default 'landing',
  created_at  timestamptz not null default now()
);

-- ── computations: a user's saved salary/offer runs ──
create table if not exists public.computations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('salary', 'offer')),
  inputs      jsonb not null,
  results     jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists computations_user_created_idx
  on public.computations (user_id, created_at desc);

-- ── Row Level Security ──
alter table public.profiles     enable row level security;
alter table public.computations enable row level security;
alter table public.waitlist     enable row level security;

-- profiles: a user sees and edits only their own row.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);

-- computations: a user reads/writes only their own rows.
create policy "computations_select_own" on public.computations
  for select using (auth.uid() = user_id);
create policy "computations_insert_own" on public.computations
  for insert with check (auth.uid() = user_id);
create policy "computations_delete_own" on public.computations
  for delete using (auth.uid() = user_id);

-- waitlist: no anon access; only the service role (which bypasses RLS) writes.
-- (No policies = deny all for anon/authenticated, which is what we want.)
