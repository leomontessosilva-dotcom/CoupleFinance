-- reset_data.sql
-- Clears all user-entered test data.
-- Run in Supabase SQL Editor. Credit cards and settings are preserved.

DELETE FROM transactions;
DELETE FROM fixed_expenses;
DELETE FROM investments;
DELETE FROM savings_jars;
DELETE FROM documents;
