-- Payments & Credits (manual QR flow). Clerk user ids are text.
-- Ownership/authorization is enforced in the API (service role); RLS stays on
-- with no policies so only the service role can read/write. Run AFTER 0002.

-- ── user_credits: current spendable balance per Clerk user ──
create table if not exists public.user_credits (
  user_id     text primary key,
  balance     int  not null default 0 check (balance >= 0),
  updated_at  timestamptz not null default now()
);

-- ── payment_requests: one row per "Payment Done" click (logged-in users) ──
create table if not exists public.payment_requests (
  id                 uuid primary key default gen_random_uuid(),
  user_id            text not null,
  name               text not null,          -- snapshot at click time
  email              text not null,          -- snapshot at click time
  plan               text not null check (plan in ('STARTER_149', 'POPULAR_299', 'PRO_499')),
  credits_requested  int  not null,
  amount             int  not null,
  status             text not null default 'PENDING_SCREENSHOT'
                       check (status in ('PENDING_SCREENSHOT', 'SCREENSHOT_RECEIVED', 'VERIFIED', 'REJECTED')),
  notes              text,
  created_at         timestamptz not null default now(),
  verified_at        timestamptz,
  verified_by        text
);
create index if not exists payment_requests_status_created_idx
  on public.payment_requests (status, created_at desc);
create index if not exists payment_requests_user_idx
  on public.payment_requests (user_id, created_at desc);

-- ── credit_ledger: append-only audit of every grant/spend ──
create table if not exists public.credit_ledger (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text not null,
  delta               int  not null,         -- +credits on grant, -1 on spend
  reason              text not null,         -- 'purchase' | 'analysis' | 'refund' | 'admin'
  payment_request_id  uuid references public.payment_requests (id),
  created_at          timestamptz not null default now()
);
create index if not exists credit_ledger_user_idx
  on public.credit_ledger (user_id, created_at desc);

-- ── Atomic spend: decrement only if balance > 0. Returns the new balance, or
--    no row when the user has insufficient credits (caller treats as 402). ──
create or replace function public.spend_credit(p_user_id text, p_reason text)
returns int
language plpgsql
as $$
declare
  new_balance int;
begin
  update public.user_credits
     set balance = balance - 1, updated_at = now()
   where user_id = p_user_id and balance > 0
   returning balance into new_balance;

  if new_balance is null then
    return null;  -- no row updated → insufficient credits
  end if;

  insert into public.credit_ledger (user_id, delta, reason)
  values (p_user_id, -1, p_reason);

  return new_balance;
end;
$$;

-- ── Grant credits (purchase activation or refund). Upserts the balance row and
--    writes a ledger entry. ──
create or replace function public.grant_credits(
  p_user_id text, p_delta int, p_reason text, p_payment_request_id uuid
)
returns int
language plpgsql
as $$
declare
  new_balance int;
begin
  insert into public.user_credits (user_id, balance)
  values (p_user_id, greatest(p_delta, 0))
  on conflict (user_id)
  do update set balance = public.user_credits.balance + p_delta, updated_at = now()
  returning balance into new_balance;

  insert into public.credit_ledger (user_id, delta, reason, payment_request_id)
  values (p_user_id, p_delta, p_reason, p_payment_request_id);

  return new_balance;
end;
$$;

-- ── RLS: enable, no policies → only the service-role key (API routes) has access ──
alter table public.user_credits     enable row level security;
alter table public.payment_requests enable row level security;
alter table public.credit_ledger    enable row level security;
