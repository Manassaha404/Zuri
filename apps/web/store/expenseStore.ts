// Expenses & Debt Ledger Zustand Store
"use client";

import { create } from "zustand";
import type {
  Account,
  BillSplit,
  Category,
  CurrencyCode,
  DebtEntry,
  DebtPayment,
  ExpenseGroup,
  MonthlyBudget,
  Person,
  Transaction,
} from "@/components/expenses/types";

export type ExpensesWorkspaceTab =
  | "overview"
  | "expenses"
  | "debts"
  | "splits"
  | "budgets";

export interface ExpenseState {
  // Navigation & View Preferences
  activeTab: ExpensesWorkspaceTab;
  currency: CurrencyCode;
  selectedMonth: string; // YYYY-MM
  selectedPersonId: string | null;
  selectedGroupId: string | null;

  // Data Collections (Synchronized with backend via useExpenses)
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgets: MonthlyBudget[];
  people: Person[];
  debtEntries: DebtEntry[];
  billSplits: BillSplit[];
  groups: ExpenseGroup[];

  // Setters & Navigation
  setActiveTab: (tab: ExpensesWorkspaceTab) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setSelectedMonth: (month: string) => void;
  setSelectedPersonId: (personId: string | null) => void;
  setSelectedGroupId: (groupId: string | null) => void;

  // Hydration from backend
  setWorkspaceData: (data: {
    transactions: Transaction[];
    categories: Category[];
    accounts: Account[];
    budgets: MonthlyBudget[];
    people: Person[];
    debtEntries: DebtEntry[];
    billSplits: BillSplit[];
    groups: ExpenseGroup[];
  }) => void;

  // Optimistic Mutations
  addTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;

  addAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  setBudget: (budget: MonthlyBudget) => void;

  addPerson: (person: Person) => void;
  deletePerson: (id: string) => void;

  addDebtEntry: (entry: DebtEntry) => void;
  addDebtRepayment: (debtId: string, payment: DebtPayment) => void;
  settlePersonDebts: (personId: string) => void;
  deleteDebtEntry: (id: string) => void;

  addBillSplit: (split: BillSplit) => void;
  toggleSplitItemPaid: (splitId: string, personId: string) => void;
  deleteBillSplit: (id: string) => void;

  addGroup: (group: ExpenseGroup) => void;
  deleteGroup: (id: string) => void;

  addCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  activeTab: "overview",
  currency: "USD",
  selectedMonth: new Date().toISOString().slice(0, 7),
  selectedPersonId: null,
  selectedGroupId: null,

  transactions: [],
  categories: [],
  accounts: [],
  budgets: [],
  people: [],
  debtEntries: [],
  billSplits: [],
  groups: [],

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrency: (currency) => set({ currency }),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setSelectedPersonId: (selectedPersonId) => set({ selectedPersonId }),
  setSelectedGroupId: (selectedGroupId) => set({ selectedGroupId }),

  setWorkspaceData: (data) => set(data),

  addTransaction: (tx) =>
    set((state) => {
      const updatedAccounts = state.accounts.map((acc) => {
        if (acc.id !== tx.accountId) return acc;
        const delta = tx.type === "income" ? tx.amount : -tx.amount;
        return { ...acc, balance: acc.balance + delta };
      });
      return {
        transactions: [tx, ...state.transactions],
        accounts: updatedAccounts,
      };
    }),

  deleteTransaction: (id) =>
    set((state) => {
      const target = state.transactions.find((tx) => tx.id === id);
      const updatedAccounts = target
        ? state.accounts.map((acc) => {
            if (acc.id !== target.accountId) return acc;
            const delta =
              target.type === "income" ? -target.amount : target.amount;
            return { ...acc, balance: acc.balance + delta };
          })
        : state.accounts;
      return {
        transactions: state.transactions.filter((tx) => tx.id !== id),
        accounts: updatedAccounts,
      };
    }),

  addAccount: (account) =>
    set((state) => ({
      accounts: [...state.accounts, account],
    })),

  deleteAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.filter((acc) => acc.id !== id),
    })),

  setBudget: (budget) =>
    set((state) => {
      const existing = state.budgets.find(
        (b) => b.categoryId === budget.categoryId && b.month === budget.month,
      );
      if (existing) {
        return {
          budgets: state.budgets.map((b) =>
            b.id === existing.id ? budget : b,
          ),
        };
      }
      return {
        budgets: [...state.budgets, budget],
      };
    }),

  addPerson: (person) =>
    set((state) => ({
      people: [...state.people, person],
    })),

  deletePerson: (id) =>
    set((state) => ({
      people: state.people.filter((p) => p.id !== id),
      debtEntries: state.debtEntries.filter((d) => d.personId !== id),
    })),

  addDebtEntry: (entry) =>
    set((state) => ({
      debtEntries: [entry, ...state.debtEntries],
    })),

  addDebtRepayment: (debtId, payment) =>
    set((state) => ({
      debtEntries: state.debtEntries.map((entry) => {
        if (entry.id !== debtId) return entry;
        const allRepayments = [...entry.repayments, payment];
        const totalRepaid = allRepayments.reduce((sum, p) => sum + p.amount, 0);
        const isSettled = totalRepaid >= entry.principalAmount;
        return {
          ...entry,
          repayments: allRepayments,
          isSettled,
          settledAt: isSettled ? new Date().toISOString() : entry.settledAt,
        };
      }),
    })),

  settlePersonDebts: (personId) =>
    set((state) => {
      const now = new Date().toISOString();
      const today = now.slice(0, 10);
      const updated = state.debtEntries.map((entry) => {
        if (entry.personId !== personId || entry.isSettled) return entry;
        const currentRepaid = entry.repayments.reduce(
          (s, p) => s + p.amount,
          0,
        );
        const remaining = Math.max(0, entry.principalAmount - currentRepaid);
        const finalRepayments = [
          ...entry.repayments,
          {
            id: `rep_settle_${Date.now()}`,
            entryDate: today,
            amount: remaining,
            note: "Balance Settled In Full",
          },
        ];
        return {
          ...entry,
          repayments: finalRepayments,
          isSettled: true,
          settledAt: now,
        };
      });
      return { debtEntries: updated };
    }),

  deleteDebtEntry: (id) =>
    set((state) => ({
      debtEntries: state.debtEntries.filter((d) => d.id !== id),
    })),

  addBillSplit: (split) =>
    set((state) => ({
      billSplits: [split, ...state.billSplits],
    })),

  toggleSplitItemPaid: (splitId, personId) =>
    set((state) => ({
      billSplits: state.billSplits.map((split) => {
        if (split.id !== splitId) return split;
        return {
          ...split,
          splits: split.splits.map((s) =>
            s.personId === personId ? { ...s, isPaid: !s.isPaid } : s,
          ),
        };
      }),
    })),

  deleteBillSplit: (id) =>
    set((state) => ({
      billSplits: state.billSplits.filter((s) => s.id !== id),
    })),

  addGroup: (group) =>
    set((state) => ({
      groups: [...state.groups, group],
    })),

  deleteGroup: (id) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
      billSplits: state.billSplits.filter((s) => s.groupId !== id),
    })),

  addCategory: (category) =>
    set((state) => ({
      categories: [category, ...state.categories],
    })),

  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
}));
