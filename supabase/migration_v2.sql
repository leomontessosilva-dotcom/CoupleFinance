-- ═══════════════════════════════════════════════════════════════
--  CoupleFinance — Migration v2
--  Run this ONLY if you already ran migration.sql.
--  Adds: payment_method on transactions, settings table.
-- ═══════════════════════════════════════════════════════════════

-- Add payment_method column to existing transactions table
alter table transactions
  add column if not exists payment_method text;

-- ── Credit Cards ───────────────────────────────────────────────
create table if not exists credit_cards (
  id         text primary key,
  name       text not null,
  card_limit numeric(14, 2) not null default 0,
  person     text not null check (person in ('Leonardo', 'Serena', 'Casal')),
  color      text default '#6D28D9',
  created_at timestamptz default now()
);
alter table credit_cards enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'credit_cards' and policyname = 'auth_all'
  ) then
    execute 'create policy "auth_all" on credit_cards
      for all to authenticated using (true) with check (true)';
  end if;
end $$;

-- Create settings table
create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz default now()
);

alter table settings enable row level security;

-- Only create policy if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'settings' and policyname = 'auth_all'
  ) then
    execute 'create policy "auth_all" on settings
      for all to authenticated using (true) with check (true)';
  end if;
end $$;
