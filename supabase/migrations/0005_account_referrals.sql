-- Account dashboard + referrals.
-- - analysis_results gains `saved`: the "Save analysis for future" flag so the
--   account page can show a user's kept reports.
-- - referral_codes: one shareable code per user.
-- - referral_signups: one row per friend who signed up via a code; converted_at
--   is stamped when that friend's payment is verified. Tracking only (no reward).
-- Run AFTER 0004.

alter table public.analysis_results add column if not exists saved boolean not null default false;
alter table public.analysis_results add column if not exists title text;

create table if not exists public.referral_codes (
  user_id     text primary key,
  code        text unique not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.referral_signups (
  referred_id   text primary key,          -- friend's Clerk id (one referral per person)
  referrer_id   text not null,
  code          text not null,
  signed_up_at  timestamptz not null default now(),
  converted_at  timestamptz                -- set when the friend's payment is verified
);
create index if not exists referral_signups_referrer_idx
  on public.referral_signups (referrer_id, signed_up_at desc);

alter table public.referral_codes   enable row level security;
alter table public.referral_signups enable row level security;
