-- ═══════════════════════════════════════════════════════════════
--  CoupleFinance — Supabase Migration
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ── Transactions ──────────────────────────────────────────────
create table if not exists transactions (
  id             text primary key,
  type           text not null check (type in ('income', 'expense')),
  category       text not null,
  description    text not null,
  amount         numeric(14, 2) not null,
  date           text not null,
  person         text not null check (person in ('Leonardo', 'Serena', 'Casal')),
  payment_method text,
  created_at     timestamptz default now()
);

-- ── Fixed Expenses ─────────────────────────────────────────────
create table if not exists fixed_expenses (
  id          text primary key,
  name        text not null,
  amount      numeric(14, 2) not null,
  due_day     integer not null check (due_day between 1 and 31),
  category    text not null,
  person      text not null check (person in ('Leonardo', 'Serena', 'Casal')),
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ── Investments ────────────────────────────────────────────────
create table if not exists investments (
  id                   text primary key,
  name                 text not null,
  type                 text not null,
  institution          text,
  initial_value        numeric(14, 2) not null default 0,
  current_value        numeric(14, 2) not null default 0,
  date                 text not null,
  person               text not null check (person in ('Leonardo', 'Serena', 'Casal')),
  monthly_contribution numeric(14, 2),
  created_at           timestamptz default now()
);

-- ── Savings Jars ───────────────────────────────────────────────
create table if not exists savings_jars (
  id                   text primary key,
  name                 text not null,
  emoji                text default '🎯',
  target_value         numeric(14, 2) not null,
  current_value        numeric(14, 2) default 0,
  color                text default '#7c3aed',
  monthly_contribution numeric(14, 2) default 0,
  description          text,
  created_at           timestamptz default now()
);

-- ── Documents ──────────────────────────────────────────────────
create table if not exists documents (
  id         text primary key,
  name       text not null,
  type       text not null,
  person     text not null,
  date       text not null,
  value      numeric(14, 2),
  file_name  text,
  file_size  integer,
  file_path  text,
  created_at timestamptz default now()
);

-- ── Settings ───────────────────────────────────────────────────
create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz default now()
);

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
create policy "auth_all" on credit_cards
  for all to authenticated using (true) with check (true);

-- ── Row Level Security ─────────────────────────────────────────
-- Enable RLS on all tables
alter table transactions   enable row level security;
alter table fixed_expenses enable row level security;
alter table investments    enable row level security;
alter table savings_jars   enable row level security;
alter table documents      enable row level security;

-- Allow any authenticated user to read/write all data
-- (Perfect for a shared couple app)
create policy "auth_all" on transactions
  for all to authenticated using (true) with check (true);

create policy "auth_all" on fixed_expenses
  for all to authenticated using (true) with check (true);

create policy "auth_all" on investments
  for all to authenticated using (true) with check (true);

create policy "auth_all" on savings_jars
  for all to authenticated using (true) with check (true);

create policy "auth_all" on documents
  for all to authenticated using (true) with check (true);

alter table settings enable row level security;
create policy "auth_all" on settings
  for all to authenticated using (true) with check (true);

-- ── Enable Realtime ────────────────────────────────────────────
-- Run these to enable realtime sync between devices
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table fixed_expenses;
alter publication supabase_realtime add table investments;
alter publication supabase_realtime add table savings_jars;
alter publication supabase_realtime add table documents;
alter publication supabase_realtime add table credit_cards;
