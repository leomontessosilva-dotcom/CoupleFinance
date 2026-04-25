import { create } from 'zustand';
import type { Transaction, FixedExpense, Investment, SavingsJar, UploadedDocument } from '../types';
import type { CreditCard } from '../types';
import { txDB, fxDB, invDB, jarDB, docDB, creditCardDB, settingsDB, metricsDB } from '../lib/db';
import type { MonthlyMetrics } from '../types';
import { generateId, getSalaryForMonth, prevMonth } from '../utils/format';

const salaryTxId = (person: 'Leonardo' | 'Serena', month: string) => `salary_${person}_${month}`;

// Builds a canonical "Salário" transaction for a given person/month.
// Date = day 5 of the month (typical payday).
const buildSalaryTx = (person: 'Leonardo' | 'Serena', month: string, amount: number): Transaction => ({
  id: salaryTxId(person, month),
  type: 'income',
  category: 'Salário',
  description: `Salário ${person}`,
  amount,
  date: `${month}-05`,
  person,
});

interface AppState {
  // Data
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  investments: Investment[];
  savingsJars: SavingsJar[];
  documents: UploadedDocument[];
  creditCards: CreditCard[];

  // UI state
  currentMonth: string;
  activePage: string;
  isLoading: boolean;
  metricsLoading: boolean;
  dbError: string | null;
  saveError: string | null;
  salaries: { Leonardo: number; Serena: number }; // kept for compat: current-month values
  salaryHistory: { Leonardo: Record<string, number>; Serena: Record<string, number> };
  monthlyMetrics: MonthlyMetrics | null;

  // Init
  initData: () => Promise<void>;
  fetchMetrics: (month?: string) => Promise<void>;
  clearSaveError: () => void;

  // UI actions
  setActivePage: (page: string) => void;
  setCurrentMonth: (month: string) => void;
  setSalary: (person: 'Leonardo' | 'Serena', value: number) => void;
  setSalaryForMonth: (person: 'Leonardo' | 'Serena', month: string, value: number) => void;

  // Ensures a "Salário" transaction exists for each person for the given month.
  // Uses carry-forward from salaryHistory. Idempotent.
  ensureSalaryTransactions: (month: string) => void;

  // Transactions
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;

  // Fixed Expenses
  addFixedExpense: (f: FixedExpense) => void;
  updateFixedExpense: (f: FixedExpense) => void;
  deleteFixedExpense: (id: string) => void;
  toggleFixedExpense: (id: string) => void;

  // Investments
  addInvestment: (i: Investment) => void;
  deleteInvestment: (id: string) => void;

  // Savings Jars
  addSavingsJar: (j: SavingsJar) => void;
  updateSavingsJar: (j: SavingsJar) => void;
  deleteSavingsJar: (id: string) => void;
  addToJar: (id: string, amount: number) => void;
  contributeToJar: (id: string, amount: number) => void; // addToJar + creates linked transaction

  // Documents
  addDocument: (d: UploadedDocument) => void;
  deleteDocument: (id: string) => void;

  // Credit Cards
  addCreditCard: (c: CreditCard) => void;
  updateCreditCard: (c: CreditCard) => void;
  deleteCreditCard: (id: string) => void;
}

export const useStore = create<AppState>()((set, get) => ({
  transactions:   [],
  fixedExpenses:  [],
  investments:    [],
  savingsJars:    [],
  documents:      [],
  creditCards:    [],
  currentMonth:   '2026-04',
  activePage:     'dashboard',
  isLoading:      true,
  metricsLoading: true,
  dbError:        null,
  saveError:      null,
  salaries:       { Leonardo: 0, Serena: 0 },
  salaryHistory:  { Leonardo: {}, Serena: {} },
  monthlyMetrics: null,

  // ─── Init: load from Supabase ──────────────────────────────
  initData: async () => {
    set({ isLoading: true, dbError: null });
    try {
      const [tx, fx, inv, jars, docs, cc, salLeo, salSer, histLeo, histSer] = await Promise.all([
        txDB.getAll(), fxDB.getAll(), invDB.getAll(),
        jarDB.getAll(), docDB.getAll(),
        creditCardDB.getAll(),
        settingsDB.get('salary_Leonardo'),
        settingsDB.get('salary_Serena'),
        settingsDB.get('salary_history_Leonardo'),
        settingsDB.get('salary_history_Serena'),
      ]);

      // Build salary history (migrate from legacy single-value if needed)
      const parseHistory = (raw: string | null, legacyVal: string | null): Record<string, number> => {
        if (raw) { try { return JSON.parse(raw); } catch { /* fall through */ } }
        if (legacyVal) return { '2026-01': Number(legacyVal) };
        return {};
      };
      const leoHistory = parseHistory(histLeo, salLeo);
      const serHistory = parseHistory(histSer, salSer);

      // Load credit cards and salaries (non-fatal if missing)
      if (!cc.error) set({ creditCards: cc.data });
      set({
        salaryHistory: { Leonardo: leoHistory, Serena: serHistory },
        salaries: {
          Leonardo: salLeo ? Number(salLeo) : 0,
          Serena:   salSer ? Number(salSer) : 0,
        },
      });

      // Check if any table errored (likely tables don't exist yet)
      const firstError = [tx, fx, inv, jars, docs].find((r) => r.error);
      if (firstError?.error) {
        set({
          isLoading: false,
          dbError: 'tables_missing',
          transactions: [],
          fixedExpenses: [],
          investments: [],
          savingsJars: [],
          documents: [],
        });
        return;
      }

      const isEmpty =
        tx.data.length === 0 &&
        fx.data.length === 0 &&
        inv.data.length === 0 &&
        jars.data.length === 0;

      if (isEmpty) {
        set({
          transactions: [], fixedExpenses: [], investments: [],
          savingsJars: [], documents: [], isLoading: false,
        });
      } else {
        set({
          transactions:  tx.data,
          fixedExpenses: fx.data,
          investments:   inv.data,
          savingsJars:   jars.data,
          documents:     docs.data,
          isLoading: false,
        });
      }

      // Ensure salary transactions exist for the current month and the last 5
      // months (so the 6-month chart on the Dashboard lines up).
      let m = get().currentMonth;
      for (let i = 0; i < 6; i++) {
        get().ensureSalaryTransactions(m);
        m = prevMonth(m);
      }

      // Load backend-computed metrics (non-blocking — metricsLoading handles the UI)
      get().fetchMetrics();
    } catch (e: any) {
      set({ isLoading: false, dbError: String(e?.message ?? e) });
    }
  },

  // ─── Metrics (backend-first) ───────────────────────────────
  fetchMetrics: async (month) => {
    const m = month ?? get().currentMonth;
    set({ metricsLoading: true });
    const { data } = await metricsDB.getMonthly(m);
    if (data) set({ monthlyMetrics: data, metricsLoading: false });
    else set({ metricsLoading: false });
  },

  // ─── UI ────────────────────────────────────────────────────
  clearSaveError: () => set({ saveError: null }),
  setActivePage:   (page)  => set({ activePage: page }),
  setCurrentMonth: (month) => {
    set({ currentMonth: month });
    get().ensureSalaryTransactions(month);
    get().fetchMetrics(month);
  },
  setSalary: (person, value) => {
    set((s) => ({ salaries: { ...s.salaries, [person]: value } }));
    settingsDB.set(`salary_${person}`, String(value));
  },
  setSalaryForMonth: (person, month, value) => {
    // Update in-memory history + persist
    const newHist = { ...get().salaryHistory[person], [month]: value };
    set((s) => ({ salaryHistory: { ...s.salaryHistory, [person]: newHist } }));
    settingsDB.set(`salary_history_${person}`, JSON.stringify(newHist));

    // Create/update the Salário transaction for that specific month
    const id = salaryTxId(person, month);
    const existing = get().transactions.find((t) => t.id === id);
    if (existing) {
      const updated: Transaction = { ...existing, amount: value };
      set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? updated : t)) }));
      if (value > 0) txDB.update(updated);
      else {
        // value = 0 → remove the transaction (no income for that month)
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
        txDB.delete(id);
      }
    } else if (value > 0) {
      const t = buildSalaryTx(person, month, value);
      set((s) => ({ transactions: [t, ...s.transactions] }));
      txDB.insert(t);
    }
  },

  ensureSalaryTransactions: (month) => {
    const { salaryHistory, transactions } = get();
    (['Leonardo', 'Serena'] as const).forEach((person) => {
      const amount = getSalaryForMonth(salaryHistory[person], month);
      if (amount <= 0) return;
      const id = salaryTxId(person, month);
      if (transactions.some((t) => t.id === id)) return;
      const t = buildSalaryTx(person, month, amount);
      set((s) => ({ transactions: [t, ...s.transactions] }));
      txDB.insert(t);
    });
  },

  // ─── Transactions ──────────────────────────────────────────
  addTransaction: (t) => {
    set((s) => ({ transactions: [t, ...s.transactions] }));
    // Optimistic card bill update
    if (t.creditCardId && t.type === 'expense') {
      set((s) => ({
        creditCards: s.creditCards.map((c) =>
          c.id === t.creditCardId ? { ...c, currentBill: c.currentBill + t.amount } : c
        ),
      }));
    }
    txDB.insert(t).then((res: any) => {
      if (res?.error) {
        set((s) => ({ transactions: s.transactions.filter((x) => x.id !== t.id), saveError: `Erro ao salvar transação: ${res.error.message}` }));
        if (t.creditCardId && t.type === 'expense') {
          set((s) => ({
            creditCards: s.creditCards.map((c) =>
              c.id === t.creditCardId ? { ...c, currentBill: Math.max(0, c.currentBill - t.amount) } : c
            ),
          }));
        }
      } else {
        if (t.creditCardId && t.type === 'expense') creditCardDB.adjustBill(t.creditCardId, t.amount);
        get().fetchMetrics();
      }
    });
  },
  updateTransaction: (t) => {
    const prev = get().transactions.find((x) => x.id === t.id);
    set((s) => ({ transactions: s.transactions.map((x) => (x.id === t.id ? t : x)) }));
    // Optimistic card bill delta
    if (prev?.creditCardId && prev.type === 'expense' && t.creditCardId === prev.creditCardId) {
      const delta = t.amount - prev.amount;
      if (delta !== 0) {
        set((s) => ({
          creditCards: s.creditCards.map((c) =>
            c.id === t.creditCardId ? { ...c, currentBill: Math.max(0, c.currentBill + delta) } : c
          ),
        }));
      }
    }
    txDB.update(t).then((res: any) => {
      if (res?.error && prev) {
        set((s) => ({ transactions: s.transactions.map((x) => (x.id === t.id ? prev : x)), saveError: `Erro ao atualizar transação: ${res.error.message}` }));
        if (prev.creditCardId && prev.type === 'expense') {
          const delta = t.amount - prev.amount;
          if (delta !== 0) {
            set((s) => ({
              creditCards: s.creditCards.map((c) =>
                c.id === prev.creditCardId ? { ...c, currentBill: Math.max(0, c.currentBill - delta) } : c
              ),
            }));
          }
        }
      } else {
        if (prev?.creditCardId && prev.type === 'expense') {
          const delta = t.amount - prev.amount;
          if (delta !== 0) creditCardDB.adjustBill(prev.creditCardId, delta);
        }
        get().fetchMetrics();
      }
    });
  },
  deleteTransaction: (id) => {
    const prev = get().transactions.find((x) => x.id === id);
    set((s) => ({ transactions: s.transactions.filter((x) => x.id !== id) }));
    // Optimistic card bill rollback
    if (prev?.creditCardId && prev.type === 'expense') {
      set((s) => ({
        creditCards: s.creditCards.map((c) =>
          c.id === prev.creditCardId ? { ...c, currentBill: Math.max(0, c.currentBill - prev.amount) } : c
        ),
      }));
    }
    txDB.delete(id).then((res: any) => {
      if (res?.error && prev) {
        set((s) => ({ transactions: [prev, ...s.transactions], saveError: `Erro ao excluir transação: ${res.error.message}` }));
        if (prev.creditCardId && prev.type === 'expense') {
          set((s) => ({
            creditCards: s.creditCards.map((c) =>
              c.id === prev.creditCardId ? { ...c, currentBill: c.currentBill + prev.amount } : c
            ),
          }));
        }
      } else {
        if (prev?.creditCardId && prev.type === 'expense') creditCardDB.adjustBill(prev.creditCardId, -prev.amount);
        get().fetchMetrics();
      }
    });
  },

  // ─── Fixed Expenses ────────────────────────────────────────
  addFixedExpense: (f) => {
    set((s) => ({ fixedExpenses: [...s.fixedExpenses, f] }));
    fxDB.insert(f).then((res: any) => {
      if (res?.error) set((s) => ({ fixedExpenses: s.fixedExpenses.filter((x) => x.id !== f.id), saveError: `Erro ao salvar gasto fixo: ${res.error.message}` }));
      else get().fetchMetrics();
    });
  },
  updateFixedExpense: (f) => {
    const prev = get().fixedExpenses.find((x) => x.id === f.id);
    set((s) => ({ fixedExpenses: s.fixedExpenses.map((x) => (x.id === f.id ? f : x)) }));
    fxDB.update(f).then((res: any) => {
      if (res?.error && prev) set((s) => ({ fixedExpenses: s.fixedExpenses.map((x) => (x.id === f.id ? prev : x)), saveError: `Erro ao atualizar gasto fixo: ${res.error.message}` }));
      else get().fetchMetrics();
    });
  },
  deleteFixedExpense: (id) => {
    const prev = get().fixedExpenses.find((x) => x.id === id);
    set((s) => ({ fixedExpenses: s.fixedExpenses.filter((x) => x.id !== id) }));
    fxDB.delete(id).then((res: any) => {
      if (res?.error && prev) set((s) => ({ fixedExpenses: [...s.fixedExpenses, prev], saveError: `Erro ao excluir gasto fixo: ${res.error.message}` }));
      else get().fetchMetrics();
    });
  },
  toggleFixedExpense: (id) => {
    const updated = get().fixedExpenses.map((x) =>
      x.id === id ? { ...x, active: !x.active } : x
    );
    set({ fixedExpenses: updated });
    const item = updated.find((x) => x.id === id);
    if (item) fxDB.update(item).then((res: any) => {
      if (res?.error) set({ saveError: `Erro ao atualizar gasto fixo: ${res.error.message}` });
      else get().fetchMetrics();
    });
  },

  // ─── Investments ───────────────────────────────────────────
  addInvestment: (i) => {
    set((s) => ({ investments: [...s.investments, i] }));
    invDB.insert(i).then((res: any) => {
      if (res?.error) set((s) => ({ investments: s.investments.filter((x) => x.id !== i.id), saveError: `Erro ao salvar investimento: ${res.error.message}` }));
    });
  },
  deleteInvestment: (id) => {
    const prev = get().investments.find((x) => x.id === id);
    set((s) => ({ investments: s.investments.filter((x) => x.id !== id) }));
    invDB.delete(id).then((res: any) => {
      if (res?.error && prev) set((s) => ({ investments: [...s.investments, prev], saveError: `Erro ao excluir investimento: ${res.error.message}` }));
    });
  },

  // ─── Savings Jars ──────────────────────────────────────────
  addSavingsJar: (j) => {
    set((s) => ({ savingsJars: [...s.savingsJars, j] }));
    jarDB.insert(j).then((res: any) => {
      if (res?.error) set((s) => ({ savingsJars: s.savingsJars.filter((x) => x.id !== j.id), saveError: `Erro ao salvar cofrinho: ${res.error.message}` }));
    });
  },
  updateSavingsJar: (j) => {
    const prev = get().savingsJars.find((x) => x.id === j.id);
    set((s) => ({ savingsJars: s.savingsJars.map((x) => (x.id === j.id ? j : x)) }));
    jarDB.update(j).then((res: any) => {
      if (res?.error && prev) set((s) => ({ savingsJars: s.savingsJars.map((x) => (x.id === j.id ? prev : x)), saveError: `Erro ao atualizar cofrinho: ${res.error.message}` }));
    });
  },
  deleteSavingsJar: (id) => {
    const orphanTxIds = get().transactions.filter((t) => t.savingsJarId === id).map((t) => t.id);
    set((s) => ({
      savingsJars:  s.savingsJars.filter((x) => x.id !== id),
      transactions: s.transactions.filter((t) => t.savingsJarId !== id),
    }));
    jarDB.delete(id).then((res: any) => {
      if (res?.error) set({ saveError: `Erro ao excluir cofrinho: ${res.error.message}` });
    });
    orphanTxIds.forEach((txId) => txDB.delete(txId));
  },
  addToJar: (id, amount) => {
    const jars = get().savingsJars.map((x) =>
      x.id === id ? { ...x, currentValue: Math.max(0, x.currentValue + amount) } : x
    );
    set({ savingsJars: jars });
    const jar = jars.find((x) => x.id === id);
    if (jar) jarDB.update(jar).then((res: any) => {
      if (res?.error) set({ saveError: `Erro ao atualizar cofrinho: ${res.error.message}` });
    });
  },
  // Like addToJar but also records a linked transaction for monthly tracking.
  // amount > 0 = deposit (money leaves the balance, category 'Aporte')
  // amount < 0 = withdrawal (money returns to the balance, 'Outros Ganhos')
  contributeToJar: (id, amount) => {
    const prevJar = get().savingsJars.find((x) => x.id === id);
    if (!prevJar) return;
    const jars = get().savingsJars.map((x) =>
      x.id === id ? { ...x, currentValue: Math.max(0, x.currentValue + amount) } : x
    );
    set({ savingsJars: jars });
    const updated = jars.find((x) => x.id === id);
    if (updated) jarDB.update(updated).then((res: any) => {
      if (res?.error) set({ saveError: `Erro ao atualizar cofrinho: ${res.error.message}` });
    });

    const absAmt = Math.abs(amount);
    if (absAmt === 0) return;
    const isDeposit = amount > 0;
    const t: Transaction = {
      id: generateId(),
      type: isDeposit ? 'expense' : 'income',
      category: isDeposit ? 'Aporte' : 'Outros Ganhos',
      description: isDeposit ? `Aporte: ${prevJar.name}` : `Retirada: ${prevJar.name}`,
      amount: absAmt,
      date: new Date().toISOString().split('T')[0],
      person: 'Casal',
      savingsJarId: id,
    };
    set((s) => ({ transactions: [t, ...s.transactions] }));
    txDB.insert(t).then((res: any) => {
      if (res?.error) set((s) => ({ transactions: s.transactions.filter((x) => x.id !== t.id), saveError: `Erro ao salvar transação do cofrinho: ${res.error.message}` }));
      else get().fetchMetrics();
    });
  },

  // ─── Documents ─────────────────────────────────────────────
  addDocument: (d) => {
    set((s) => ({ documents: [d, ...s.documents] }));
    docDB.insert(d).then((res: any) => {
      if (res?.error) set((s) => ({ documents: s.documents.filter((x) => x.id !== d.id), saveError: `Erro ao salvar documento: ${res.error.message}` }));
    });
  },
  deleteDocument: (id) => {
    const prev = get().documents.find((x) => x.id === id);
    set((s) => ({ documents: s.documents.filter((x) => x.id !== id) }));
    docDB.delete(id).then((res: any) => {
      if (res?.error && prev) set((s) => ({ documents: [prev, ...s.documents], saveError: `Erro ao excluir documento: ${res.error.message}` }));
    });
  },

  // ─── Credit Cards ──────────────────────────────────────────
  addCreditCard: (c) => {
    set((s) => ({ creditCards: [...s.creditCards, c] }));
    creditCardDB.insert(c).then((res: any) => {
      if (res?.error) set((s) => ({ creditCards: s.creditCards.filter((x) => x.id !== c.id), saveError: `Erro ao salvar cartão: ${res.error.message}` }));
    });
  },
  updateCreditCard: (c) => {
    const prev = get().creditCards.find((x) => x.id === c.id);
    set((s) => ({ creditCards: s.creditCards.map((x) => (x.id === c.id ? c : x)) }));
    creditCardDB.update(c).then((res: any) => {
      if (res?.error && prev) set((s) => ({ creditCards: s.creditCards.map((x) => (x.id === c.id ? prev : x)), saveError: `Erro ao atualizar cartão: ${res.error.message}` }));
    });
  },
  deleteCreditCard: (id) => {
    // Unlink transactions from deleted card (keep the transaction, drop the cc link)
    const linkedTx = get().transactions.filter((t) => t.creditCardId === id);
    set((s) => ({
      creditCards:  s.creditCards.filter((x) => x.id !== id),
      transactions: s.transactions.map((t) => (t.creditCardId === id ? { ...t, creditCardId: undefined } : t)),
    }));
    creditCardDB.delete(id).then((res: any) => {
      if (res?.error) set({ saveError: `Erro ao excluir cartão: ${res.error.message}` });
    });
    linkedTx.forEach((t) => txDB.update({ ...t, creditCardId: undefined }));
  },
}));
