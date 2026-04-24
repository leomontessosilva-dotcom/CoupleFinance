-- ═══════════════════════════════════════════════════════════════
--  CoupleFinance — Migration v4
--  Run ONLY after migration.sql, migration_v2.sql, and migration_v3.sql.
--  Adds: credit_card_id to transactions for per-card CC tracking.
-- ═══════════════════════════════════════════════════════════════

alter table transactions
  add column if not exists credit_card_id text;
