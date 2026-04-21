-- ═══════════════════════════════════════════════════════════════
--  CoupleFinance — Migration v2
--  Run this ONLY if you already ran migration.sql.
--  Adds: payment_method on transactions, settings table.
-- ═══════════════════════════════════════════════════════════════

-- Add payment_method column to existing transactions table
alter table transactions
  add column if not exists payment_method text;

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
