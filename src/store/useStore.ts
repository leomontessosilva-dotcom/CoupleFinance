import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, FixedExpense, Investment, SavingsJar, UploadedDocument } from '../types';
import { mockTransactions, mockFixedExpenses, mockInvestments, mockSavingsJars, mockDocuments } from '../data/mockData';

interface AppState {
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  investments: Investment[];
  savingsJars: SavingsJar[];
  documents: UploadedDocument[];
  currentMonth: string; // 'YYYY-MM'
  activePage: string;

  // Actions
  setActivePage: (page: string) => void;
  setCurrentMonth: (month: string) => void;

  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;

  addFixedExpense: (f: FixedExpense) => void;
  updateFixedExpense: (f: FixedExpense) => void;
  deleteFixedExpense: (id: string) => void;
  toggleFixedExpense: (id: string) => void;

  addInvestment: (i: Investment) => void;
  updateInvestment: (i: Investment) => void;
  deleteInvestment: (id: string) => void;

  addSavingsJar: (j: SavingsJar) => void;
  updateSavingsJar: (j: SavingsJar) => void;
  deleteSavingsJar: (id: string) => void;
  addToJar: (id: string, amount: number) => void;

  addDocument: (d: UploadedDocument) => void;
  deleteDocument: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      transactions: mockTransactions,
      fixedExpenses: mockFixedExpenses,
      investments: mockInvestments,
      savingsJars: mockSavingsJars,
      documents: mockDocuments,
      currentMonth: '2026-04',
      activePage: 'dashboard',

      setActivePage: (page) => set({ activePage: page }),
      setCurrentMonth: (month) => set({ currentMonth: month }),

      addTransaction: (t) => set((s) => ({ transactions: [t, ...s.transactions] })),
      updateTransaction: (t) => set((s) => ({ transactions: s.transactions.map((x) => (x.id === t.id ? t : x)) })),
      deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((x) => x.id !== id) })),

      addFixedExpense: (f) => set((s) => ({ fixedExpenses: [...s.fixedExpenses, f] })),
      updateFixedExpense: (f) => set((s) => ({ fixedExpenses: s.fixedExpenses.map((x) => (x.id === f.id ? f : x)) })),
      deleteFixedExpense: (id) => set((s) => ({ fixedExpenses: s.fixedExpenses.filter((x) => x.id !== id) })),
      toggleFixedExpense: (id) => set((s) => ({ fixedExpenses: s.fixedExpenses.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) })),

      addInvestment: (i) => set((s) => ({ investments: [...s.investments, i] })),
      updateInvestment: (i) => set((s) => ({ investments: s.investments.map((x) => (x.id === i.id ? i : x)) })),
      deleteInvestment: (id) => set((s) => ({ investments: s.investments.filter((x) => x.id !== id) })),

      addSavingsJar: (j) => set((s) => ({ savingsJars: [...s.savingsJars, j] })),
      updateSavingsJar: (j) => set((s) => ({ savingsJars: s.savingsJars.map((x) => (x.id === j.id ? j : x)) })),
      deleteSavingsJar: (id) => set((s) => ({ savingsJars: s.savingsJars.filter((x) => x.id !== id) })),
      addToJar: (id, amount) => set((s) => ({
        savingsJars: s.savingsJars.map((x) =>
          x.id === id ? { ...x, currentValue: Math.max(0, x.currentValue + amount) } : x
        ),
      })),

      addDocument: (d) => set((s) => ({ documents: [d, ...s.documents] })),
      deleteDocument: (id) => set((s) => ({ documents: s.documents.filter((x) => x.id !== id) })),
    }),
    { name: 'couplefinance-store' }
  )
);
