-- Freemium lock: the salary/component breakdown is free for everyone; the
-- analysis (tax regime, opportunities, clauses, actions, assumptions) is locked
-- until a credit is spent. To enforce this server-side, the FULL analysis is
-- stored here on extract and only the locked half is returned on unlock — so the
-- paid content never reaches the browser until it's paid for. Run AFTER 0003.

create table if not exists public.analysis_results (
  id          uuid primary key default gen_random_uuid(),
  user_id     text,                    -- null when uploaded anonymously; claimed on unlock
  analysis    jsonb not null,          -- the full OfferAnalysis
  unlocked    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists analysis_results_user_idx
  on public.analysis_results (user_id, created_at desc);

-- RLS on, no policies → only the service-role key (API routes) can read/write.
alter table public.analysis_results enable row level security;
