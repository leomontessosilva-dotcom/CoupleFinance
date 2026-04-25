-- migration_v6.sql: backend-first metrics + credit card current_bill
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ── 1. Add current_bill to credit_cards ──────────────────────────────────────
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS current_bill NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Sync existing bills from all-time credit card expense transactions
UPDATE credit_cards cc
SET current_bill = COALESCE((
  SELECT SUM(t.amount)
  FROM transactions t
  WHERE t.credit_card_id = cc.id AND t.type = 'expense'
), 0);

-- ── 2. Monthly metrics RPC ────────────────────────────────────────────────────
-- income: real cash inflows only — excludes jar withdrawals (savings_jar_id IS NOT NULL)
-- expenses: variable non-Aporte spending + active fixed expenses (no date filter on fixed)
-- aportes: deposits into jars (category = 'Aporte'), kept separate from expenses
-- fixed: active fixed expenses total (informational sub-line)
-- jar_total: snapshot of all savings jars current_value sum
CREATE OR REPLACE FUNCTION get_monthly_metrics(p_month text)
RETURNS json LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_build_object(
    'income',        COALESCE((
                       SELECT SUM(amount) FROM transactions
                       WHERE type = 'income'
                         AND savings_jar_id IS NULL
                         AND date LIKE p_month || '%'
                     ), 0),
    'salary_income', COALESCE((
                       SELECT SUM(amount) FROM transactions
                       WHERE type = 'income'
                         AND category = 'Salário'
                         AND date LIKE p_month || '%'
                     ), 0),
    'expenses',      COALESCE((
                       SELECT SUM(amount) FROM transactions
                       WHERE type = 'expense'
                         AND category != 'Aporte'
                         AND date LIKE p_month || '%'
                     ), 0)
                     + COALESCE((
                       SELECT SUM(amount) FROM fixed_expenses WHERE active = true
                     ), 0),
    'fixed',         COALESCE((
                       SELECT SUM(amount) FROM fixed_expenses WHERE active = true
                     ), 0),
    'aportes',       COALESCE((
                       SELECT SUM(amount) FROM transactions
                       WHERE category = 'Aporte'
                         AND date LIKE p_month || '%'
                     ), 0),
    'jar_total',     COALESCE((SELECT SUM(current_value) FROM savings_jars), 0)
  )
$$;

-- ── 3. Atomic credit card bill adjustment ────────────────────────────────────
-- Called on every credit-card expense insert/delete; never goes below 0.
CREATE OR REPLACE FUNCTION adjust_card_bill(p_id text, p_delta numeric)
RETURNS void LANGUAGE sql AS $$
  UPDATE credit_cards
  SET current_bill = GREATEST(0, current_bill + p_delta)
  WHERE id = p_id
$$;
