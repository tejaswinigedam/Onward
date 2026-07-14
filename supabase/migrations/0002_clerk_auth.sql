-- Switch auth from Supabase Auth to Clerk.
-- Clerk user ids are text (e.g. "user_2ab..."), not auth.users UUIDs, and
-- ownership is enforced in the API (service role) rather than via auth.uid()
-- RLS. Run AFTER 0001_init.sql. Safe on an empty dataset.

-- profiles ----------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_user_id_fkey;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_upsert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
alter table public.profiles alter column user_id type text;

-- computations ------------------------------------------------------------
alter table public.computations drop constraint if exists computations_user_id_fkey;
drop policy if exists "computations_select_own" on public.computations;
drop policy if exists "computations_insert_own" on public.computations;
drop policy if exists "computations_delete_own" on public.computations;
alter table public.computations alter column user_id type text;

-- RLS stays enabled with no policies → anon/authenticated are denied; only the
-- service-role key (used by our API routes) can read/write. The API filters by
-- the Clerk user id, so users only ever see their own rows.
