-- ═══════════════════════════════════════════════════════════════
--  CoupleFinance — Migration v5
--  Run ONLY after migration.sql through migration_v4.sql.
--  Adds: installments support on transactions.
--   - purchase_id:          groups the N installments of a single purchase.
--   - installment_number:   which installment (1..N).
--   - installments_total:   total number of installments (N).
-- ═══════════════════════════════════════════════════════════════

alter table transactions
  add column if not exists purchase_id         text,
  add column if not exists installment_number  integer,
  add column if not exists installments_total  integer;
