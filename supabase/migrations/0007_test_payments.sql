-- Test payments: internal/test accounts still get their credits on Verify, but
-- their amounts must not count toward reported revenue. Run AFTER 0006.

alter table public.payment_requests
  add column if not exists is_test boolean not null default false;

create index if not exists payment_requests_is_test_idx
  on public.payment_requests (is_test);
