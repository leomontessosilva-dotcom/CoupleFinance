import { create } from 'zustand';
import type { Transaction, FixedExpense, Investment, SavingsJar, UploadedDocument } from '../types';
import type { CreditCard } from '../types';
import { txDB, fxDB, invDB, jarDB, docDB, creditCardDB, settingsDB } from '../lib/db';
import { generateId } from '../utils/format';

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
  dbError: string | null;
  salaries: { Leonardo: number; Serena: number }; // kept for compat: current-month values
  salaryHistory: { Leonardo: Record<string, number>; Serena: Record<string, number> };

  // Init
  initData: () => Promise<void>;

  // UI actions
  setActivePage: (page: string) => void;
  setCurrentMonth: (month: string) => void;
  setSalary: (person: 'Leonardo' | 'Serena', value: number) => void;
  setSalaryForMonth: (person: 'Leonardo' | 'Serena', month: string, value: number) => void;

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
  transactions:  [],
  fixedExpenses: [],
  investments:   [],
  savingsJars:   [],
  documents:     [],
  creditCards:   [],
  currentMonth:  '2026-04',
  activePage:    'dashboard',
  isLoading:     true,
  dbError:       null,
  salaries:      { Leonardo: 0, Serena: 0 },
  salaryHistory: { Leonardo: {}, Serena: {} },

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
    } catch (e: any) {
      set({ isLoading: false, dbError: String(e?.message ?? e) });
    }
  },

  // ─── UI ────────────────────────────────────────────────────
  setActivePage:   (page)  => set({ activePage: page }),
  setCurrentMonth: (month) => set({ currentMonth: month }),
  setSalary: (person, value) => {
    set((s) => ({ salaries: { ...s.salaries, [person]: value } }));
    settingsDB.set(`salary_${person}`, String(value));
  },
  setSalaryForMonth: (person, month, value) => {
    set((s) => {
      const updated = { ...s.salaryHistory[person], [month]: value };
      return { salaryHistory: { ...s.salaryHistory, [person]: updated } };
    });
    const history = { ...get().salaryHistory[person], [month]: value };
    settingsDB.set(`salary_history_${person}`, JSON.stringify(history));
  },

  // ─── Transactions ──────────────────────────────────────────
  addTransaction: (t) => {
    set((s) => ({ transactions: [t, ...s.transactions] }));
    txDB.insert(t);
  },
  updateTransaction: (t) => {
    set((s) => ({ transactions: s.transactions.map((x) => (x.id === t.id ? t : x)) }));
    txDB.update(t);
  },
  deleteTransaction: (id) => {
    set((s) => ({ transactions: s.transactions.filter((x) => x.id !== id) }));
    txDB.delete(id);
  },

  // ─── Fixed Expenses ────────────────────────────────────────
  addFixedExpense: (f) => {
    set((s) => ({ fixedExpenses: [...s.fixedExpenses, f] }));
    fxDB.insert(f);
  },
  updateFixedExpense: (f) => {
    set((s) => ({ fixedExpenses: s.fixedExpenses.map((x) => (x.id === f.id ? f : x)) }));
    fxDB.update(f);
  },
  deleteFixedExpense: (id) => {
    set((s) => ({ fixedExpenses: s.fixedExpenses.filter((x) => x.id !== id) }));
    fxDB.delete(id);
  },
  toggleFixedExpense: (id) => {
    const updated = get().fixedExpenses.map((x) =>
      x.id === id ? { ...x, active: !x.active } : x
    );
    set({ fixedExpenses: updated });
    const item = updated.find((x) => x.id === id);
    if (item) fxDB.update(item);
  },

  // ─── Investments ───────────────────────────────────────────
  addInvestment: (i) => {
    set((s) => ({ investments: [...s.investments, i] }));
    invDB.insert(i);
  },
  deleteInvestment: (id) => {
    set((s) => ({ investments: s.investments.filter((x) => x.id !== id) }));
    invDB.delete(id);
  },

  // ─── Savings Jars ──────────────────────────────────────────
  addSavingsJar: (j) => {
    set((s) => ({ savingsJars: [...s.savingsJars, j] }));
    jarDB.insert(j);
  },
  updateSavingsJar: (j) => {
    set((s) => ({ savingsJars: s.savingsJars.map((x) => (x.id === j.id ? j : x)) }));
    jarDB.update(j);
  },
  deleteSavingsJar: (id) => {
    const orphanTxIds = get().transactions.filter((t) => t.savingsJarId === id).map((t) => t.id);
    set((s) => ({
      savingsJars:  s.savingsJars.filter((x) => x.id !== id),
      transactions: s.transactions.filter((t) => t.savingsJarId !== id),
    }));
    jarDB.delete(id);
    orphanTxIds.forEach((txId) => txDB.delete(txId));
  },
  addToJar: (id, amount) => {
    const jars = get().savingsJars.map((x) =>
      x.id === id ? { ...x, currentValue: Math.max(0, x.currentValue + amount) } : x
    );
    set({ savingsJars: jars });
    const jar = jars.find((x) => x.id === id);
    if (jar) jarDB.update(jar);
  },
  // Like addToJar but also records a linked transaction for monthly tracking
  contributeToJar: (id, amount) => {
    const prevJar = get().savingsJars.find((x) => x.id === id);
    if (!prevJar) return;
    const jars = get().savingsJars.map((x) =>
      x.id === id ? { ...x, currentValue: Math.max(0, x.currentValue + amount) } : x
    );
    set({ savingsJars: jars });
    const updated = jars.find((x) => x.id === id);
    if (updated) jarDB.update(updated);

    const absAmt = Math.abs(amount);
    if (absAmt === 0) return;
    const t: Transaction = {
      id: generateId(),
      type: amount > 0 ? 'income' : 'expense',
      category: 'Outros',
      description: amount > 0 ? `Aporte: ${prevJar.name}` : `Retirada: ${prevJar.name}`,
      amount: absAmt,
      date: new Date().toISOString().split('T')[0],
      person: 'Casal',
      savingsJarId: id,
    };
    set((s) => ({ transactions: [t, ...s.transactions] }));
    txDB.insert(t);
  },

  // ─── Documents ─────────────────────────────────────────────
  addDocument: (d) => {
    set((s) => ({ documents: [d, ...s.documents] }));
    docDB.insert(d);
  },
  deleteDocument: (id) => {
    set((s) => ({ documents: s.documents.filter((x) => x.id !== id) }));
    docDB.delete(id);
  },

  // ─── Credit Cards ──────────────────────────────────────────
  addCreditCard: (c) => {
    set((s) => ({ creditCards: [...s.creditCards, c] }));
    creditCardDB.insert(c);
  },
  updateCreditCard: (c) => {
    set((s) => ({ creditCards: s.creditCards.map((x) => (x.id === c.id ? c : x)) }));
    creditCardDB.update(c);
  },
  deleteCreditCard: (id) => {
    // Unlink transactions from deleted card (keep the transaction, drop the cc link)
    const linkedTx = get().transactions.filter((t) => t.creditCardId === id);
    set((s) => ({
      creditCards:  s.creditCards.filter((x) => x.id !== id),
      transactions: s.transactions.map((t) => (t.creditCardId === id ? { ...t, creditCardId: undefined } : t)),
    }));
    creditCardDB.delete(id);
    linkedTx.forEach((t) => txDB.update({ ...t, creditCardId: undefined }));
  },
}));
