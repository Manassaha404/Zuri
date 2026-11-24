// Hook managing expenses workspace data, queries, mutations, and store synchronization
"use client";

import { useEffect, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";
import { useExpenseStore } from "@/store/expenseStore";
import type {
  Transaction,
  Account,
  MonthlyBudget,
  Person,
  DebtEntry,
  BillSplit,
  ExpenseGroup,
  Category,
} from "@/components/expenses/types";

export function useExpenses() {
  const userId = useUserInfoStore((s) => s.userId);
  const isInitialized = useUserInfoStore((s) => s.isInitialized);

  const {
    transactions,
    categories,
    accounts,
    budgets,
    people,
    debtEntries,
    billSplits,
    groups,
    currency,
    selectedMonth,
    selectedPersonId,
    selectedGroupId,
    setWorkspaceData,
    setCurrency: storeSetCurrency,
    addTransaction: storeAddTransaction,
    deleteTransaction: storeDeleteTransaction,
    addAccount: storeAddAccount,
    deleteAccount: storeDeleteAccount,
    setBudget: storeSetBudget,
    addPerson: storeAddPerson,
    deletePerson: storeDeletePerson,
    addDebtEntry: storeAddDebtEntry,
    addDebtRepayment: storeAddDebtRepayment,
    settlePersonDebts: storeSettlePersonDebts,
    deleteDebtEntry: storeDeleteDebtEntry,
    addBillSplit: storeAddBillSplit,
    toggleSplitItemPaid: storeToggleSplitItemPaid,
    deleteBillSplit: storeDeleteBillSplit,
    addGroup: storeAddGroup,
    deleteGroup: storeDeleteGroup,
    addCategory: storeAddCategory,
    deleteCategory: storeDeleteCategory,
  } = useExpenseStore();

  const utils = trpc.useUtils();

  // Query workspace
  const workspaceQuery = trpc.expenses.getWorkspace.useQuery(undefined, {
    enabled: Boolean(isInitialized && userId),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  // Sync server data into Zustand store
  useEffect(() => {
    if (workspaceQuery.data && "categories" in workspaceQuery.data) {
      const data = workspaceQuery.data;
      if (data.currency) {
        storeSetCurrency(data.currency as any);
      }
      setWorkspaceData({
        categories: (data.categories || []).map((c: any) => ({
          id: c.categoryId,
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: c.type,
        })),
        accounts: (data.accounts || []).map((a: any) => ({
          id: a.accountId,
          name: a.name,
          type: a.type,
          balance: a.balance,
          accountNumber: a.accountNumber || undefined,
          color: a.color,
        })),
        budgets: (data.budgets || []).map((b: any) => ({
          id: b.budgetId,
          categoryId: b.categoryId,
          month: b.month,
          amount: b.amount,
        })),
        transactions: (data.transactions || []).map((t: any) => ({
          id: t.transactionId,
          type: t.type,
          amount: t.amount,
          categoryId: t.categoryId,
          date: t.date,
          accountId: t.accountId,
          note: t.note || undefined,
          receiptUrl: t.receiptUrl || undefined,
          isRecurring: t.isRecurring,
          recurrenceFrequency: t.recurrenceFrequency || undefined,
          createdAt:
            typeof t.createdAt === "string"
              ? t.createdAt
              : new Date(t.createdAt).toISOString(),
        })),
        people: (data.people || []).map((p: any) => ({
          id: p.personId,
          name: p.name,
          email: p.email || undefined,
          phone: p.phone || undefined,
          avatarUrl: p.avatarUrl || undefined,
          notes: p.notes || undefined,
        })),
        debtEntries: (data.debtEntries || []).map((d: any) => ({
          id: d.entryId,
          personId: d.personId,
          type: d.type,
          principalAmount: d.principalAmount,
          interestRateAnnual: d.interestRateAnnual || 0,
          startDate: d.startDate,
          dueDate: d.dueDate || undefined,
          note: d.note || undefined,
          proofUrl: d.proofUrl || undefined,
          repayments: (d.repayments || []).map((r: any) => ({
            id: r.repaymentId,
            entryDate: r.entryDate,
            amount: r.amount,
            note: r.note || undefined,
            proofUrl: r.proofUrl || undefined,
          })),
          isSettled: d.isSettled,
          settledAt: d.settledAt
            ? new Date(d.settledAt).toISOString()
            : undefined,
          createdAt:
            typeof d.createdAt === "string"
              ? d.createdAt
              : new Date(d.createdAt).toISOString(),
        })),
        groups: (data.groups || []).map((g: any) => ({
          id: g.groupId,
          name: g.name,
          description: g.description || undefined,
          memberIds: g.memberIds || [],
          color: g.color,
          icon: g.icon,
          createdAt:
            typeof g.createdAt === "string"
              ? g.createdAt
              : new Date(g.createdAt).toISOString(),
        })),
        billSplits: (data.billSplits || []).map((s: any) => ({
          id: s.splitId,
          title: s.title,
          totalAmount: s.totalAmount,
          paidByPersonId: s.paidByPersonId,
          groupId: s.groupId || undefined,
          date: s.date,
          splitMethod: s.splitMethod,
          splits: (s.splits || []).map((item: any) => ({
            personId: item.personId,
            amount: item.amount,
            percentage: item.percentage || undefined,
            isPaid: item.isPaid,
          })),
          note: s.note || undefined,
          receiptUrl: s.receiptUrl || undefined,
          createdAt:
            typeof s.createdAt === "string"
              ? s.createdAt
              : new Date(s.createdAt).toISOString(),
        })),
      });
    }
  }, [workspaceQuery.data, setWorkspaceData]);

  // Mutations
  const addTransactionMutation = trpc.expenses.addTransaction.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const deleteTransactionMutation = trpc.expenses.deleteTransaction.useMutation(
    {
      onSuccess: () => utils.expenses.getWorkspace.invalidate(),
    },
  );

  const addAccountMutation = trpc.expenses.addAccount.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const deleteAccountMutation = trpc.expenses.deleteAccount.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const setBudgetMutation = trpc.expenses.setBudget.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const addPersonMutation = trpc.expenses.addPerson.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const deletePersonMutation = trpc.expenses.deletePerson.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const addDebtEntryMutation = trpc.expenses.addDebtEntry.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const addDebtRepaymentMutation = trpc.expenses.addDebtRepayment.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const settlePersonDebtsMutation = trpc.expenses.settlePersonDebts.useMutation(
    {
      onSuccess: () => utils.expenses.getWorkspace.invalidate(),
    },
  );

  const deleteDebtEntryMutation = trpc.expenses.deleteDebtEntry.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const addBillSplitMutation = trpc.expenses.addBillSplit.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const toggleSplitItemPaidMutation =
    trpc.expenses.toggleSplitItemPaid.useMutation({
      onSuccess: () => utils.expenses.getWorkspace.invalidate(),
    });

  const deleteBillSplitMutation = trpc.expenses.deleteBillSplit.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const addGroupMutation = trpc.expenses.addGroup.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const deleteGroupMutation = trpc.expenses.deleteGroup.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const addCategoryMutation = trpc.expenses.addCategory.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const deleteCategoryMutation = trpc.expenses.deleteCategory.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  const setCurrencyMutation = trpc.expenses.setCurrency.useMutation({
    onSuccess: () => utils.expenses.getWorkspace.invalidate(),
  });

  // Action methods
  const addTransaction = useCallback(
    async (tx: Omit<Transaction, "id" | "createdAt">) => {
      const tempId = `tx_${Date.now()}`;
      const optimistic: Transaction = {
        ...tx,
        id: tempId,
        createdAt: new Date().toISOString(),
      };
      storeAddTransaction(optimistic);

      if (userId) {
        try {
          const res = await addTransactionMutation.mutateAsync({
            type: tx.type,
            amount: tx.amount,
            categoryId: tx.categoryId,
            accountId: tx.accountId,
            date: tx.date,
            note: tx.note,
            receiptUrl: tx.receiptUrl,
            isRecurring: tx.isRecurring,
            recurrenceFrequency: tx.recurrenceFrequency,
          });
          return res;
        } catch (e) {
          console.error("Failed to persist transaction:", e);
        }
      }
      return optimistic;
    },
    [userId, storeAddTransaction, addTransactionMutation],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      storeDeleteTransaction(id);
      if (userId && !id.startsWith("tx_")) {
        await deleteTransactionMutation
          .mutateAsync({ transactionId: id })
          .catch(console.error);
      }
    },
    [userId, storeDeleteTransaction, deleteTransactionMutation],
  );

  const addAccount = useCallback(
    async (account: Omit<Account, "id">) => {
      const tempId = `acc_${Date.now()}`;
      const optimistic: Account = { ...account, id: tempId };
      storeAddAccount(optimistic);

      if (userId) {
        try {
          const res = await addAccountMutation.mutateAsync(account);
          return res;
        } catch (e) {
          console.error("Failed to add account:", e);
        }
      }
      return optimistic;
    },
    [userId, storeAddAccount, addAccountMutation],
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      storeDeleteAccount(id);
      if (userId && !id.startsWith("acc_")) {
        await deleteAccountMutation
          .mutateAsync({ accountId: id })
          .catch(console.error);
      }
    },
    [userId, storeDeleteAccount, deleteAccountMutation],
  );

  const setBudget = useCallback(
    async (categoryId: string, month: string, amount: number) => {
      const optimistic: MonthlyBudget = {
        id: `b_${Date.now()}`,
        categoryId,
        month,
        amount,
      };
      storeSetBudget(optimistic);

      if (userId) {
        await setBudgetMutation
          .mutateAsync({ categoryId, month, amount })
          .catch(console.error);
      }
    },
    [userId, storeSetBudget, setBudgetMutation],
  );

  const addPerson = useCallback(
    async (person: Omit<Person, "id">): Promise<string> => {
      const tempId = `p_${Date.now()}`;
      const optimistic: Person = { ...person, id: tempId };
      storeAddPerson(optimistic);

      if (userId) {
        try {
          const res = await addPersonMutation.mutateAsync(person);
          if (res && "personId" in res) {
            return res.personId;
          }
        } catch (e) {
          console.error("Failed to add person:", e);
        }
      }
      return tempId;
    },
    [userId, storeAddPerson, addPersonMutation],
  );

  const deletePerson = useCallback(
    async (id: string) => {
      storeDeletePerson(id);
      if (userId && !id.startsWith("p_")) {
        await deletePersonMutation
          .mutateAsync({ personId: id })
          .catch(console.error);
      }
    },
    [userId, storeDeletePerson, deletePersonMutation],
  );

  const addDebtEntry = useCallback(
    async (
      entry: Omit<DebtEntry, "id" | "repayments" | "isSettled" | "createdAt">,
    ) => {
      const tempId = `debt_${Date.now()}`;
      const optimistic: DebtEntry = {
        ...entry,
        id: tempId,
        repayments: [],
        isSettled: false,
        createdAt: new Date().toISOString(),
      };
      storeAddDebtEntry(optimistic);

      if (userId) {
        try {
          const res = await addDebtEntryMutation.mutateAsync({
            personId: entry.personId,
            type: entry.type,
            principalAmount: entry.principalAmount,
            interestRateAnnual: entry.interestRateAnnual,
            startDate: entry.startDate,
            dueDate: entry.dueDate,
            note: entry.note,
            proofUrl: entry.proofUrl,
          });
          return res;
        } catch (e) {
          console.error("Failed to add debt entry:", e);
        }
      }
      return optimistic;
    },
    [userId, storeAddDebtEntry, addDebtEntryMutation],
  );

  const addDebtRepayment = useCallback(
    async (
      debtId: string,
      payment: {
        entryDate: string;
        amount: number;
        note?: string;
        proofUrl?: string;
      },
    ) => {
      const repId = `rep_${Date.now()}`;
      const optimistic = { ...payment, id: repId };
      storeAddDebtRepayment(debtId, optimistic);

      if (userId && !debtId.startsWith("debt_")) {
        await addDebtRepaymentMutation
          .mutateAsync({
            entryId: debtId,
            entryDate: payment.entryDate,
            amount: payment.amount,
            note: payment.note,
            proofUrl: payment.proofUrl,
          })
          .catch(console.error);
      }
    },
    [userId, storeAddDebtRepayment, addDebtRepaymentMutation],
  );

  const settlePersonDebts = useCallback(
    async (personId: string) => {
      storeSettlePersonDebts(personId);
      if (userId && !personId.startsWith("p_")) {
        await settlePersonDebtsMutation
          .mutateAsync({ personId })
          .catch(console.error);
      }
    },
    [userId, storeSettlePersonDebts, settlePersonDebtsMutation],
  );

  const deleteDebtEntry = useCallback(
    async (id: string) => {
      storeDeleteDebtEntry(id);
      if (userId && !id.startsWith("debt_")) {
        await deleteDebtEntryMutation
          .mutateAsync({ entryId: id })
          .catch(console.error);
      }
    },
    [userId, storeDeleteDebtEntry, deleteDebtEntryMutation],
  );

  const addBillSplit = useCallback(
    async (split: Omit<BillSplit, "id" | "createdAt">) => {
      const tempId = `split_${Date.now()}`;
      const optimistic: BillSplit = {
        ...split,
        id: tempId,
        createdAt: new Date().toISOString(),
      };
      storeAddBillSplit(optimistic);

      if (userId) {
        try {
          const res = await addBillSplitMutation.mutateAsync({
            title: split.title,
            totalAmount: split.totalAmount,
            paidByPersonId: split.paidByPersonId,
            groupId: split.groupId,
            date: split.date,
            splitMethod: split.splitMethod,
            note: split.note,
            receiptUrl: split.receiptUrl,
            splits: split.splits,
          });
          return res;
        } catch (e) {
          console.error("Failed to add split bill:", e);
        }
      }
      return optimistic;
    },
    [userId, storeAddBillSplit, addBillSplitMutation],
  );

  const toggleSplitItemPaid = useCallback(
    async (splitId: string, personId: string) => {
      storeToggleSplitItemPaid(splitId, personId);
      if (userId && !splitId.startsWith("split_")) {
        await toggleSplitItemPaidMutation
          .mutateAsync({ splitId, personId })
          .catch(console.error);
      }
    },
    [userId, storeToggleSplitItemPaid, toggleSplitItemPaidMutation],
  );

  const deleteBillSplit = useCallback(
    async (id: string) => {
      storeDeleteBillSplit(id);
      if (userId && !id.startsWith("split_")) {
        await deleteBillSplitMutation
          .mutateAsync({ splitId: id })
          .catch(console.error);
      }
    },
    [userId, storeDeleteBillSplit, deleteBillSplitMutation],
  );

  const addGroup = useCallback(
    async (group: Omit<ExpenseGroup, "id" | "createdAt">) => {
      const tempId = `grp_${Date.now()}`;
      const optimistic: ExpenseGroup = {
        ...group,
        id: tempId,
        createdAt: new Date().toISOString(),
      };
      storeAddGroup(optimistic);

      if (userId) {
        try {
          const res = await addGroupMutation.mutateAsync(group);
          return res;
        } catch (e) {
          console.error("Failed to add group:", e);
        }
      }
      return optimistic;
    },
    [userId, storeAddGroup, addGroupMutation],
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      storeDeleteGroup(id);
      if (userId && !id.startsWith("grp_")) {
        await deleteGroupMutation
          .mutateAsync({ groupId: id })
          .catch(console.error);
      }
    },
    [userId, storeDeleteGroup, deleteGroupMutation],
  );

  const addCategory = useCallback(
    async (category: Omit<Category, "id">) => {
      const tempId = `cat_${Date.now()}`;
      const optimistic: Category = {
        ...category,
        id: tempId,
      };
      storeAddCategory(optimistic);

      if (userId) {
        try {
          const res = await addCategoryMutation.mutateAsync(category);
          return res;
        } catch (e) {
          console.error("Failed to add category:", e);
        }
      }
      return optimistic;
    },
    [userId, storeAddCategory, addCategoryMutation],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      storeDeleteCategory(id);
      if (userId && !id.startsWith("cat_")) {
        await deleteCategoryMutation
          .mutateAsync({ categoryId: id })
          .catch(console.error);
      }
    },
    [userId, storeDeleteCategory, deleteCategoryMutation],
  );

  const setCurrency = useCallback(
    async (newCurrency: any) => {
      storeSetCurrency(newCurrency);
      if (userId) {
        await setCurrencyMutation
          .mutateAsync({ currency: newCurrency })
          .catch(console.error);
      }
    },
    [userId, storeSetCurrency, setCurrencyMutation],
  );

  return {
    isLoading: workspaceQuery.isLoading,
    isRefetching: workspaceQuery.isRefetching,
    refetch: workspaceQuery.refetch,
    transactions,
    categories,
    accounts,
    budgets,
    people,
    debtEntries,
    billSplits,
    groups,
    currency,
    setCurrency,
    selectedMonth,
    selectedPersonId,
    selectedGroupId,
    addTransaction,
    deleteTransaction,
    addAccount,
    deleteAccount,
    setBudget,
    addPerson,
    deletePerson,
    addDebtEntry,
    addDebtRepayment,
    settlePersonDebts,
    deleteDebtEntry,
    addBillSplit,
    toggleSplitItemPaid,
    deleteBillSplit,
    addGroup,
    deleteGroup,
    addCategory,
    deleteCategory,
  };
}
