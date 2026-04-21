import { create } from 'zustand';
import type { Transaction, FixedExpense, Investment, SavingsJar, UploadedDocument } from '../types';
import { mockTransactions, mockFixedExpenses, mockInvestments, mockSavingsJars, mockDocuments } from '../data/mockData';
import { txDB, fxDB, invDB, jarDB, docDB, seedAll } from '../lib/db';

interface AppState {
  // Data
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  investments: Investment[];
  savingsJars: SavingsJar[];
  documents: UploadedDocument[];

  // UI state
  currentMonth: string;
  activePage: string;
  isLoading: boolean;
  dbError: string | null;

  // Init
  initData: () => Promise<void>;

  // UI actions
  setActivePage: (page: string) => void;
  setCurrentMonth: (month: string) => void;

  // Transactions
  addTransaction: (t: Transaction) => void;
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

  // Documents
  addDocument: (d: UploadedDocument) => void;
  deleteDocument: (id: string) => void;
}

export const useStore = create<AppState>()((set, get) => ({
  transactions:  [],
  fixedExpenses: [],
  investments:   [],
  savingsJars:   [],
  documents:     [],
  currentMonth:  '2026-04',
  activePage:    'dashboard',
  isLoading:     true,
  dbError:       null,

  // ─── Init: load from Supabase, seed if empty ───────────────
  initData: async () => {
    set({ isLoading: true, dbError: null });
    try {
      const [tx, fx, inv, jars, docs] = await Promise.all([
        txDB.getAll(), fxDB.getAll(), invDB.getAll(),
        jarDB.getAll(), docDB.getAll(),
      ]);

      // Check if any table errored (likely tables don't exist yet)
      const firstError = [tx, fx, inv, jars, docs].find((r) => r.error);
      if (firstError?.error) {
        set({
          isLoading: false,
          dbError: 'tables_missing',
          // Fall back to mock data so UI is still usable
          transactions: mockTransactions,
          fixedExpenses: mockFixedExpenses,
          investments: mockInvestments,
          savingsJars: mockSavingsJars,
          documents: mockDocuments,
        });
        return;
      }

      const isEmpty =
        tx.data.length === 0 &&
        fx.data.length === 0 &&
        inv.data.length === 0 &&
        jars.data.length === 0;

      if (isEmpty) {
        // First time: seed with demo data
        await seedAll(
          mockTransactions, mockFixedExpenses,
          mockInvestments, mockSavingsJars, mockDocuments,
        );
        set({
          transactions: mockTransactions,
          fixedExpenses: mockFixedExpenses,
          investments: mockInvestments,
          savingsJars: mockSavingsJars,
          documents: mockDocuments,
          isLoading: false,
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
  setActivePage:    (page)  => set({ activePage: page }),
  setCurrentMonth:  (month) => set({ currentMonth: month }),

  // ─── Transactions ──────────────────────────────────────────
  addTransaction: (t) => {
    set((s) => ({ transactions: [t, ...s.transactions] }));
    txDB.insert(t);
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
    set((s) => ({ savingsJars: s.savingsJars.filter((x) => x.id !== id) }));
    jarDB.delete(id);
  },
  addToJar: (id, amount) => {
    const jars = get().savingsJars.map((x) =>
      x.id === id ? { ...x, currentValue: Math.max(0, x.currentValue + amount) } : x
    );
    set({ savingsJars: jars });
    const jar = jars.find((x) => x.id === id);
    if (jar) jarDB.update(jar);
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
}));
