import { db } from "@repo/database";
import {
  expenseCategories,
  expenseAccounts,
  monthlyBudgets,
  transactions,
  debtPeople,
  debtEntries,
  debtRepayments,
  expenseGroups,
  expenseGroupMembers,
  billSplits,
  billSplitItems,
  userExpenseSettings,
  users,
} from "@repo/database/models";
import { eq, and, desc, sql } from "drizzle-orm";
import { AppError } from "@repo/error";

export class ExpenseService {
  // Get full workspace data for the authenticated user
  async getWorkspace(userId: string) {
    // Seed default categories and accounts if user is brand new
    await this.seedDefaultsIfNeeded(userId);

    const [
      userCategories,
      userAccounts,
      userBudgets,
      userTransactions,
      userPeople,
      userDebtEntries,
      userDebtRepayments,
      userGroups,
      userGroupMembers,
      userBillSplits,
      userBillSplitItems,
      userSettings,
    ] = await Promise.all([
      db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.userId, userId))
        .orderBy(desc(expenseCategories.createdAt)),
      db
        .select()
        .from(expenseAccounts)
        .where(eq(expenseAccounts.userId, userId))
        .orderBy(desc(expenseAccounts.createdAt)),
      db.select().from(monthlyBudgets).where(eq(monthlyBudgets.userId, userId)),
      db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date), desc(transactions.createdAt)),
      db
        .select()
        .from(debtPeople)
        .where(eq(debtPeople.userId, userId))
        .orderBy(desc(debtPeople.createdAt)),
      db
        .select()
        .from(debtEntries)
        .where(eq(debtEntries.userId, userId))
        .orderBy(desc(debtEntries.startDate), desc(debtEntries.createdAt)),
      db
        .select()
        .from(debtRepayments)
        .where(eq(debtRepayments.userId, userId))
        .orderBy(desc(debtRepayments.entryDate)),
      db
        .select()
        .from(expenseGroups)
        .where(eq(expenseGroups.userId, userId))
        .orderBy(desc(expenseGroups.createdAt)),
      db.select().from(expenseGroupMembers),
      db
        .select()
        .from(billSplits)
        .where(eq(billSplits.userId, userId))
        .orderBy(desc(billSplits.date), desc(billSplits.createdAt)),
      db.select().from(billSplitItems),
      db
        .select()
        .from(userExpenseSettings)
        .where(eq(userExpenseSettings.userId, userId)),
    ]);

    // Attach repayments to debt entries
    const entriesWithRepayments = userDebtEntries.map((entry) => ({
      ...entry,
      repayments: userDebtRepayments.filter((r) => r.entryId === entry.entryId),
    }));

    // Find self person ID if already created
    const selfPerson = userPeople.find((p) => p.name === "You");
    const selfPersonId = selfPerson?.personId;

    // Attach members to groups, normalizing any self person ID to "p_you" and deduplicating
    const groupsWithMembers = userGroups.map((group) => {
      const rawMemberIds = userGroupMembers
        .filter((m) => m.groupId === group.groupId)
        .map((m) =>
          selfPersonId && m.personId === selfPersonId ? "p_you" : m.personId,
        );
      return {
        ...group,
        memberIds: Array.from(new Set(rawMemberIds)),
      };
    });

    // Attach split items to bill splits, normalizing self person ID to "p_you"
    const splitsWithItems = userBillSplits.map((split) => ({
      ...split,
      paidByPersonId:
        selfPersonId && split.paidByPersonId === selfPersonId
          ? "p_you"
          : split.paidByPersonId,
      splits: userBillSplitItems
        .filter((item) => item.splitId === split.splitId)
        .map((item) => ({
          ...item,
          personId:
            selfPersonId && item.personId === selfPersonId
              ? "p_you"
              : item.personId,
        })),
    }));

    // Filter out internal "You" records from userPeople so "You" is purely virtual on the frontend
    const filteredPeople = userPeople.filter((p) => p.name !== "You");

    return {
      currency: userSettings[0]?.currency || "USD",
      categories: userCategories,
      accounts: userAccounts,
      budgets: userBudgets,
      transactions: userTransactions,
      people: filteredPeople,
      debtEntries: entriesWithRepayments,
      groups: groupsWithMembers,
      billSplits: splitsWithItems,
    };
  }

  // Helper to resolve or create a DebtPerson record for "You" (the user)
  private async getOrCreateSelfPerson(userId: string): Promise<string> {
    const existingSelf = await db
      .select()
      .from(debtPeople)
      .where(and(eq(debtPeople.userId, userId), eq(debtPeople.name, "You")));

    if (existingSelf[0]) {
      return existingSelf[0].personId;
    }

    // Fetch user profile info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId));

    const [created] = await db
      .insert(debtPeople)
      .values({
        userId,
        name: "You",
        email: user?.email || undefined,
        notes: "Self profile for bill splitting and ledger calculations",
      })
      .returning();

    if (!created) {
      throw new AppError(
        "INTERNAL_SERVER_ERROR",
        "Failed to resolve self user contact",
      );
    }
    return created.personId;
  }

  // Seed default categories & starter account for a user if empty
  private async seedDefaultsIfNeeded(userId: string) {
    const existing = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(expenseCategories)
      .where(eq(expenseCategories.userId, userId));

    if (existing[0]?.count === 0) {
      const defaultCategories = [
        {
          name: "Food & Dining",
          icon: "Utensils",
          color: "#f97316",
          type: "expense",
          isSystem: true,
        },
        {
          name: "Housing & Rent",
          icon: "Home",
          color: "#3b82f6",
          type: "expense",
          isSystem: true,
        },
        {
          name: "Groceries",
          icon: "ShoppingCart",
          color: "#10b981",
          type: "expense",
          isSystem: true,
        },
        {
          name: "Transportation",
          icon: "Car",
          color: "#8b5cf6",
          type: "expense",
          isSystem: true,
        },
        {
          name: "Utilities & Bills",
          icon: "Zap",
          color: "#eab308",
          type: "expense",
          isSystem: true,
        },
        {
          name: "Entertainment",
          icon: "Film",
          color: "#ec4899",
          type: "expense",
          isSystem: true,
        },
        {
          name: "Healthcare",
          icon: "HeartPulse",
          color: "#ef4444",
          type: "expense",
          isSystem: true,
        },
        {
          name: "Shopping",
          icon: "ShoppingBag",
          color: "#06b6d4",
          type: "expense",
          isSystem: true,
        },
        {
          name: "Salary & Wages",
          icon: "Briefcase",
          color: "#10b981",
          type: "income",
          isSystem: true,
        },
        {
          name: "Freelance",
          icon: "Laptop",
          color: "#6366f1",
          type: "income",
          isSystem: true,
        },
        {
          name: "Investments",
          icon: "TrendingUp",
          color: "#14b8a6",
          type: "income",
          isSystem: true,
        },
      ];

      for (const cat of defaultCategories) {
        await db.insert(expenseCategories).values({
          userId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type,
          isSystem: cat.isSystem,
        });
      }

      await db.insert(expenseAccounts).values({
        userId,
        name: "Primary Bank Account",
        type: "bank",
        balance: 0,
        color: "#3b82f6",
      });
    }
  }

  // --- Transactions ---
  async addTransaction(
    userId: string,
    data: {
      type: string;
      amount: number;
      categoryId: string;
      accountId: string;
      date: string;
      note?: string;
      receiptUrl?: string;
      isRecurring?: boolean;
      recurrenceFrequency?: string;
    },
  ) {
    const [tx] = await db
      .insert(transactions)
      .values({
        userId,
        type: data.type,
        amount: data.amount,
        categoryId: data.categoryId,
        accountId: data.accountId,
        date: data.date,
        note: data.note,
        receiptUrl: data.receiptUrl,
        isRecurring: data.isRecurring ?? false,
        recurrenceFrequency: data.recurrenceFrequency ?? "none",
      })
      .returning();

    // Update account balance
    const delta = data.type === "income" ? data.amount : -data.amount;
    await db
      .update(expenseAccounts)
      .set({
        balance: sql`${expenseAccounts.balance} + ${delta}`,
      })
      .where(
        and(
          eq(expenseAccounts.accountId, data.accountId),
          eq(expenseAccounts.userId, userId),
        ),
      );

    return tx;
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const [existing] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionId, transactionId),
          eq(transactions.userId, userId),
        ),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Transaction not found");
    }

    // Revert account balance
    const revertDelta =
      existing.type === "income" ? -existing.amount : existing.amount;
    await db
      .update(expenseAccounts)
      .set({
        balance: sql`${expenseAccounts.balance} + ${revertDelta}`,
      })
      .where(
        and(
          eq(expenseAccounts.accountId, existing.accountId),
          eq(expenseAccounts.userId, userId),
        ),
      );

    await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.transactionId, transactionId),
          eq(transactions.userId, userId),
        ),
      );

    return { success: true };
  }

  // --- Categories ---
  async addCategory(
    userId: string,
    data: {
      name: string;
      type: string;
      icon?: string;
      color?: string;
    },
  ) {
    const [cat] = await db
      .insert(expenseCategories)
      .values({
        userId,
        name: data.name,
        type: data.type,
        icon: data.icon ?? "Tag",
        color: data.color ?? "#3b82f6",
        isSystem: false,
      })
      .returning();
    return cat;
  }

  async deleteCategory(userId: string, categoryId: string) {
    await db
      .delete(expenseCategories)
      .where(
        and(
          eq(expenseCategories.categoryId, categoryId),
          eq(expenseCategories.userId, userId),
        ),
      );
    return { success: true };
  }

  // --- Accounts & Budgets ---
  async addAccount(
    userId: string,
    data: {
      name: string;
      type: string;
      balance?: number;
      accountNumber?: string;
      color?: string;
    },
  ) {
    const [acc] = await db
      .insert(expenseAccounts)
      .values({
        userId,
        name: data.name,
        type: data.type,
        balance: data.balance ?? 0,
        accountNumber: data.accountNumber,
        color: data.color ?? "#3b82f6",
      })
      .returning();
    return acc;
  }

  async deleteAccount(userId: string, accountId: string) {
    await db
      .delete(expenseAccounts)
      .where(
        and(
          eq(expenseAccounts.accountId, accountId),
          eq(expenseAccounts.userId, userId),
        ),
      );
    return { success: true };
  }

  async setBudget(
    userId: string,
    data: {
      categoryId: string;
      month: string;
      amount: number;
    },
  ) {
    const existing = await db
      .select()
      .from(monthlyBudgets)
      .where(
        and(
          eq(monthlyBudgets.userId, userId),
          eq(monthlyBudgets.categoryId, data.categoryId),
          eq(monthlyBudgets.month, data.month),
        ),
      );

    if (existing[0]) {
      const [updated] = await db
        .update(monthlyBudgets)
        .set({ amount: data.amount })
        .where(eq(monthlyBudgets.budgetId, existing[0].budgetId))
        .returning();
      return updated;
    }

    const [budget] = await db
      .insert(monthlyBudgets)
      .values({
        userId,
        categoryId: data.categoryId,
        month: data.month,
        amount: data.amount,
      })
      .returning();
    return budget;
  }

  // --- People ---
  async addPerson(
    userId: string,
    data: {
      name: string;
      email?: string;
      phone?: string;
      notes?: string;
    },
  ) {
    const [person] = await db
      .insert(debtPeople)
      .values({
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
      })
      .returning();
    return person;
  }

  async deletePerson(userId: string, personId: string) {
    await db
      .delete(debtPeople)
      .where(
        and(eq(debtPeople.personId, personId), eq(debtPeople.userId, userId)),
      );
    return { success: true };
  }

  // --- Debt Ledger ---
  async addDebtEntry(
    userId: string,
    data: {
      personId: string;
      type: string;
      principalAmount: number;
      interestRateAnnual?: number;
      startDate: string;
      dueDate?: string;
      note?: string;
      proofUrl?: string;
    },
  ) {
    const [entry] = await db
      .insert(debtEntries)
      .values({
        userId,
        personId: data.personId,
        type: data.type,
        principalAmount: data.principalAmount,
        interestRateAnnual: data.interestRateAnnual ?? 0,
        startDate: data.startDate,
        dueDate: data.dueDate,
        note: data.note,
        proofUrl: data.proofUrl,
      })
      .returning();
    return entry;
  }

  async addDebtRepayment(
    userId: string,
    data: {
      entryId: string;
      entryDate: string;
      amount: number;
      note?: string;
      proofUrl?: string;
    },
  ) {
    const [entry] = await db
      .select()
      .from(debtEntries)
      .where(
        and(
          eq(debtEntries.entryId, data.entryId),
          eq(debtEntries.userId, userId),
        ),
      );

    if (!entry) {
      throw new AppError("NOT_FOUND", "Debt entry not found");
    }

    const [repayment] = await db
      .insert(debtRepayments)
      .values({
        userId,
        entryId: data.entryId,
        entryDate: data.entryDate,
        amount: data.amount,
        note: data.note,
        proofUrl: data.proofUrl,
      })
      .returning();

    // Check if fully settled
    const existingRepayments = await db
      .select()
      .from(debtRepayments)
      .where(eq(debtRepayments.entryId, data.entryId));

    const totalRepaid = existingRepayments.reduce((s, r) => s + r.amount, 0);
    if (totalRepaid >= entry.principalAmount) {
      await db
        .update(debtEntries)
        .set({
          isSettled: true,
          settledAt: new Date(),
        })
        .where(eq(debtEntries.entryId, data.entryId));
    }

    return repayment;
  }

  async settlePersonDebts(userId: string, personId: string) {
    const openEntries = await db
      .select()
      .from(debtEntries)
      .where(
        and(
          eq(debtEntries.userId, userId),
          eq(debtEntries.personId, personId),
          eq(debtEntries.isSettled, false),
        ),
      );

    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    for (const entry of openEntries) {
      const existingRepayments = await db
        .select()
        .from(debtRepayments)
        .where(eq(debtRepayments.entryId, entry.entryId));

      const totalRepaid = existingRepayments.reduce((s, r) => s + r.amount, 0);
      const remaining = Math.max(0, entry.principalAmount - totalRepaid);

      if (remaining > 0) {
        await db.insert(debtRepayments).values({
          userId,
          entryId: entry.entryId,
          entryDate: today,
          amount: remaining,
          note: "Balance Settled In Full",
        });
      }

      await db
        .update(debtEntries)
        .set({
          isSettled: true,
          settledAt: now,
        })
        .where(eq(debtEntries.entryId, entry.entryId));
    }

    return { success: true };
  }

  async deleteDebtEntry(userId: string, entryId: string) {
    await db
      .delete(debtEntries)
      .where(
        and(eq(debtEntries.entryId, entryId), eq(debtEntries.userId, userId)),
      );
    return { success: true };
  }

  // --- Bill Splits & Groups ---
  async addBillSplit(
    userId: string,
    data: {
      title: string;
      totalAmount: number;
      paidByPersonId: string;
      groupId?: string;
      date: string;
      splitMethod?: string;
      note?: string;
      receiptUrl?: string;
      splits: Array<{
        personId: string;
        amount: number;
        percentage?: number;
        isPaid?: boolean;
      }>;
    },
  ) {
    let resolvedPaidByPersonId = data.paidByPersonId;
    if (resolvedPaidByPersonId === "p_you") {
      resolvedPaidByPersonId = await this.getOrCreateSelfPerson(userId);
    }

    const [split] = await db
      .insert(billSplits)
      .values({
        userId,
        title: data.title,
        totalAmount: data.totalAmount,
        paidByPersonId: resolvedPaidByPersonId,
        groupId: data.groupId,
        date: data.date,
        splitMethod: data.splitMethod ?? "equal",
        note: data.note,
        receiptUrl: data.receiptUrl,
      })
      .returning();

    if (!split) {
      throw new AppError(
        "INTERNAL_SERVER_ERROR",
        "Failed to create bill split",
      );
    }

    const seenPersonIds = new Set<string>();
    for (const item of data.splits) {
      let resolvedPersonId = item.personId;
      if (resolvedPersonId === "p_you") {
        resolvedPersonId = await this.getOrCreateSelfPerson(userId);
      }

      if (seenPersonIds.has(resolvedPersonId)) {
        continue;
      }
      seenPersonIds.add(resolvedPersonId);

      await db.insert(billSplitItems).values({
        splitId: split.splitId,
        personId: resolvedPersonId,
        amount: item.amount,
        percentage: item.percentage,
        isPaid: item.isPaid ?? false,
      });
    }

    return split;
  }

  async toggleSplitItemPaid(userId: string, splitId: string, personId: string) {
    const [split] = await db
      .select()
      .from(billSplits)
      .where(
        and(eq(billSplits.splitId, splitId), eq(billSplits.userId, userId)),
      );

    if (!split) {
      throw new AppError("NOT_FOUND", "Split bill not found");
    }

    let targetPersonId = personId;
    if (targetPersonId === "p_you") {
      targetPersonId = await this.getOrCreateSelfPerson(userId);
    }

    const [item] = await db
      .select()
      .from(billSplitItems)
      .where(
        and(
          eq(billSplitItems.splitId, splitId),
          eq(billSplitItems.personId, targetPersonId),
        ),
      );

    if (!item) {
      throw new AppError("NOT_FOUND", "Split item not found");
    }

    const nextPaid = !item.isPaid;
    const [updated] = await db
      .update(billSplitItems)
      .set({
        isPaid: nextPaid,
        paidAt: nextPaid ? new Date() : null,
      })
      .where(eq(billSplitItems.itemId, item.itemId))
      .returning();

    return updated;
  }

  async deleteBillSplit(userId: string, splitId: string) {
    await db
      .delete(billSplits)
      .where(
        and(eq(billSplits.splitId, splitId), eq(billSplits.userId, userId)),
      );
    return { success: true };
  }

  async addGroup(
    userId: string,
    data: {
      name: string;
      description?: string;
      color?: string;
      icon?: string;
      memberIds?: string[];
    },
  ) {
    const [group] = await db
      .insert(expenseGroups)
      .values({
        userId,
        name: data.name,
        description: data.description,
        color: data.color ?? "#3b82f6",
        icon: data.icon ?? "Users",
      })
      .returning();

    if (!group) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create group");
    }

    if (data.memberIds && data.memberIds.length > 0) {
      const uniqueMemberIds = new Set<string>();
      for (let pId of data.memberIds) {
        if (pId === "p_you") {
          pId = await this.getOrCreateSelfPerson(userId);
        }
        uniqueMemberIds.add(pId);
      }

      for (const pId of uniqueMemberIds) {
        await db.insert(expenseGroupMembers).values({
          groupId: group.groupId,
          personId: pId,
        });
      }
    }

    return group;
  }

  async deleteGroup(userId: string, groupId: string) {
    await db
      .delete(expenseGroups)
      .where(
        and(
          eq(expenseGroups.groupId, groupId),
          eq(expenseGroups.userId, userId),
        ),
      );
    return { success: true };
  }

  // --- Preferred Currency Settings ---
  async setPreferredCurrency(userId: string, currency: string) {
    const existing = await db
      .select()
      .from(userExpenseSettings)
      .where(eq(userExpenseSettings.userId, userId));

    if (existing[0]) {
      const [updated] = await db
        .update(userExpenseSettings)
        .set({ currency })
        .where(eq(userExpenseSettings.settingsId, existing[0].settingsId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(userExpenseSettings)
      .values({
        userId,
        currency,
      })
      .returning();
    return created;
  }
}

export default ExpenseService;
