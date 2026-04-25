/**
 * Database layer — maps between app types (camelCase) and
 * Supabase tables (snake_case). Every function returns a
 * { data, error } pair matching the Supabase response shape.
 */
import { supabase } from './supabase';
import type {
  Transaction, FixedExpense, Investment,
  SavingsJar, UploadedDocument, CreditCard, YieldPeriod, MonthlyMetrics,
} from '../types';

// ── Mappers ──────────────────────────────────────────────────

const txToDb = (t: Transaction) => ({
  id: t.id, type: t.type, category: t.category,
  description: t.description, amount: t.amount,
  date: t.date, person: t.person,
  payment_method: t.paymentMethod ?? null,
  savings_jar_id: t.savingsJarId ?? null,
  credit_card_id: t.creditCardId ?? null,
  purchase_id: t.purchaseId ?? null,
  installment_number: t.installmentNumber ?? null,
  installments_total: t.installmentsTotal ?? null,
});
const txFromDb = (r: any): Transaction => ({
  id: r.id, type: r.type, category: r.category,
  description: r.description, amount: Number(r.amount),
  date: r.date, person: r.person,
  paymentMethod: r.payment_method ?? undefined,
  savingsJarId: r.savings_jar_id ?? undefined,
  creditCardId: r.credit_card_id ?? undefined,
  purchaseId: r.purchase_id ?? undefined,
  installmentNumber: r.installment_number != null ? Number(r.installment_number) : undefined,
  installmentsTotal: r.installments_total != null ? Number(r.installments_total) : undefined,
});

const fxToDb = (f: FixedExpense) => ({
  id: f.id, name: f.name, amount: f.amount,
  due_day: f.dueDay, category: f.category,
  person: f.person, active: f.active,
});
const fxFromDb = (r: any): FixedExpense => ({
  id: r.id, name: r.name, amount: Number(r.amount),
  dueDay: r.due_day, category: r.category,
  person: r.person, active: r.active,
});

const invToDb = (i: Investment) => ({
  id: i.id, name: i.name, type: i.type,
  institution: i.institution,
  initial_value: i.initialValue,
  current_value: i.currentValue,
  date: i.date, person: i.person,
  monthly_contribution: i.monthlyContribution ?? null,
});
const invFromDb = (r: any): Investment => ({
  id: r.id, name: r.name, type: r.type,
  institution: r.institution,
  initialValue: Number(r.initial_value),
  currentValue: Number(r.current_value),
  date: r.date, person: r.person,
  monthlyContribution: r.monthly_contribution != null
    ? Number(r.monthly_contribution) : undefined,
});

const jarToDb = (j: SavingsJar) => ({
  id: j.id, name: j.name, emoji: j.emoji,
  target_value: j.targetValue,
  current_value: j.currentValue,
  color: j.color,
  monthly_contribution: j.monthlyContribution,
  description: j.description ?? null,
  yield_rate: j.yieldRate ?? null,
  yield_period: j.yieldPeriod ?? null,
});
const jarFromDb = (r: any): SavingsJar => ({
  id: r.id, name: r.name, emoji: r.emoji,
  targetValue: Number(r.target_value),
  currentValue: Number(r.current_value),
  color: r.color,
  monthlyContribution: Number(r.monthly_contribution),
  description: r.description ?? undefined,
  yieldRate: r.yield_rate != null ? Number(r.yield_rate) : undefined,
  yieldPeriod: r.yield_period as YieldPeriod ?? undefined,
});

const docToDb = (d: UploadedDocument) => ({
  id: d.id, name: d.name, type: d.type,
  person: d.person, date: d.date,
  value: d.value ?? null,
  file_name: d.fileName,
  file_size: d.fileSize ?? null,
  file_path: null,
});
const docFromDb = (r: any): UploadedDocument => ({
  id: r.id, name: r.name, type: r.type,
  person: r.person, date: r.date,
  value: r.value != null ? Number(r.value) : undefined,
  fileName: r.file_name,
  fileSize: r.file_size ?? undefined,
});

const ccToDb = (c: CreditCard) => ({
  id: c.id, name: c.name, card_limit: c.limit, person: c.person, color: c.color,
  current_bill: c.currentBill,
});
const ccFromDb = (r: any): CreditCard => ({
  id: r.id, name: r.name, limit: Number(r.card_limit), person: r.person, color: r.color,
  currentBill: Number(r.current_bill ?? 0),
});

// ── Transactions ──────────────────────────────────────────────

export const txDB = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('transactions').select('*').order('date', { ascending: false });
    return { data: data?.map(txFromDb) ?? [], error };
  },
  insert: (t: Transaction) =>
    supabase.from('transactions').insert(txToDb(t)),
  update: (t: Transaction) =>
    supabase.from('transactions').update(txToDb(t)).eq('id', t.id),
  delete: (id: string) =>
    supabase.from('transactions').delete().eq('id', id),
};

// ── Fixed Expenses ────────────────────────────────────────────

export const fxDB = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('fixed_expenses').select('*').order('due_day');
    return { data: data?.map(fxFromDb) ?? [], error };
  },
  insert: (f: FixedExpense) =>
    supabase.from('fixed_expenses').insert(fxToDb(f)),
  update: (f: FixedExpense) =>
    supabase.from('fixed_expenses').update(fxToDb(f)).eq('id', f.id),
  delete: (id: string) =>
    supabase.from('fixed_expenses').delete().eq('id', id),
};

// ── Investments ───────────────────────────────────────────────

export const invDB = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('investments').select('*').order('created_at');
    return { data: data?.map(invFromDb) ?? [], error };
  },
  insert: (i: Investment) =>
    supabase.from('investments').insert(invToDb(i)),
  delete: (id: string) =>
    supabase.from('investments').delete().eq('id', id),
};

// ── Savings Jars ──────────────────────────────────────────────

export const jarDB = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('savings_jars').select('*').order('created_at');
    return { data: data?.map(jarFromDb) ?? [], error };
  },
  insert: (j: SavingsJar) =>
    supabase.from('savings_jars').insert(jarToDb(j)),
  update: (j: SavingsJar) =>
    supabase.from('savings_jars').update(jarToDb(j)).eq('id', j.id),
  delete: (id: string) =>
    supabase.from('savings_jars').delete().eq('id', id),
};

// ── Documents ─────────────────────────────────────────────────

export const docDB = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('documents').select('*').order('date', { ascending: false });
    return { data: data?.map(docFromDb) ?? [], error };
  },
  insert: (d: UploadedDocument) =>
    supabase.from('documents').insert(docToDb(d)),
  delete: (id: string) =>
    supabase.from('documents').delete().eq('id', id),
};

// ── Settings ──────────────────────────────────────────────────

export const settingsDB = {
  get: async (key: string): Promise<string | null> => {
    const { data } = await supabase
      .from('settings').select('value').eq('key', key).single();
    return data?.value ?? null;
  },
  set: (key: string, value: string) =>
    supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }),
};

// ── Credit Cards ──────────────────────────────────────────────

export const creditCardDB = {
  getAll: async () => {
    const { data, error } = await supabase.from('credit_cards').select('*').order('created_at');
    return { data: data?.map(ccFromDb) ?? [], error };
  },
  insert: (c: CreditCard) => supabase.from('credit_cards').insert(ccToDb(c)),
  update: (c: CreditCard) => supabase.from('credit_cards').update(ccToDb(c)).eq('id', c.id),
  delete: (id: string) => supabase.from('credit_cards').delete().eq('id', id),
  adjustBill: (id: string, delta: number) =>
    supabase.rpc('adjust_card_bill', { p_id: id, p_delta: delta }),
};

// ── Monthly Metrics ───────────────────────────────────────────

export const metricsDB = {
  getMonthly: async (month: string): Promise<{ data: MonthlyMetrics | null; error: any }> => {
    const { data, error } = await supabase.rpc('get_monthly_metrics', { p_month: month });
    if (error || !data) return { data: null, error };
    return {
      data: {
        income:       Number(data.income       ?? 0),
        salaryIncome: Number(data.salary_income ?? 0),
        expenses:     Number(data.expenses     ?? 0),
        fixed:        Number(data.fixed        ?? 0),
        aportes:      Number(data.aportes      ?? 0),
        jarTotal:     Number(data.jar_total    ?? 0),
      },
      error: null,
    };
  },
};
