-- ═══════════════════════════════════════════════════════════════
--  CoupleFinance — Migration v3
--  Run ONLY after migration.sql and migration_v2.sql.
--  Adds: savings_jar_id to transactions for contribution tracking.
-- ═══════════════════════════════════════════════════════════════

alter table transactions
  add column if not exists savings_jar_id text;
