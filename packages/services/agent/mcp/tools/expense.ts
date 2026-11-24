import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import ExpenseService from "../../../expenses";

const expenseService = new ExpenseService();

// Extract authenticated user ID from FastMCP session context
function requireUserId(context: any): string {
  const userId = context?.session?.userId;
  if (!userId) {
    throw new UserError(
      "Unauthorized: This tool requires an authenticated user session.",
    );
  }
  return userId;
}

export const expenseTools = [
  // Workspace
  {
    name: "expenses_get_workspace",
    description:
      "Retrieve the complete expense workspace data including categories, accounts, budgets, transactions, people, debtEntries with repayments, groups with members, billSplits with items, and preferred currency.",
    parameters: z.object({}),
    execute: async (_args: {}, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.getWorkspace(userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get expense workspace");
      }
    },
  },

  // Transactions
  {
    name: "expenses_add_transaction",
    description:
      "Add an income or expense transaction and automatically adjust the corresponding account balance.",
    parameters: z.object({
      type: z
        .enum(["income", "expense"])
        .describe("Transaction type ('income' or 'expense')"),
      amount: z.number().positive().describe("Transaction monetary amount"),
      categoryId: z
        .string()
        .uuid()
        .describe("Unique identifier of the category"),
      accountId: z.string().uuid().describe("Unique identifier of the account"),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .describe("Transaction date in YYYY-MM-DD format"),
      note: z
        .string()
        .trim()
        .optional()
        .describe("Optional description or note for the transaction"),
      receiptUrl: z
        .string()
        .url()
        .optional()
        .describe("Optional URL to receipt image or document"),
      isRecurring: z
        .boolean()
        .optional()
        .describe("Whether this is a recurring transaction"),
      recurrenceFrequency: z
        .enum(["none", "daily", "weekly", "monthly", "yearly"])
        .optional()
        .describe("Recurrence frequency cadence"),
    }),
    execute: async (
      args: {
        type: "income" | "expense";
        amount: number;
        categoryId: string;
        accountId: string;
        date: string;
        note?: string;
        receiptUrl?: string;
        isRecurring?: boolean;
        recurrenceFrequency?:
          | "none"
          | "daily"
          | "weekly"
          | "monthly"
          | "yearly";
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.addTransaction(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add transaction");
      }
    },
  },
  {
    name: "expenses_delete_transaction",
    description:
      "Delete a transaction and revert the balance adjustment on the linked account.",
    parameters: z.object({
      transactionId: z
        .string()
        .uuid()
        .describe("Unique identifier of the transaction to delete"),
    }),
    execute: async (args: { transactionId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.deleteTransaction(
          userId,
          args.transactionId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete transaction");
      }
    },
  },

  // Categories
  {
    name: "expenses_add_category",
    description:
      "Add a custom category for classifying income or expense transactions.",
    parameters: z.object({
      name: z.string().trim().min(1).describe("Category display name"),
      type: z
        .enum(["income", "expense"])
        .describe("Category type ('income' or 'expense')"),
      icon: z
        .string()
        .optional()
        .describe("Icon name (Lucide icon, e.g. 'Tag', 'Coffee', 'Car')"),
      color: z
        .string()
        .optional()
        .describe("Hex color code for the category badge"),
    }),
    execute: async (
      args: {
        name: string;
        type: "income" | "expense";
        icon?: string;
        color?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.addCategory(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add category");
      }
    },
  },
  {
    name: "expenses_delete_category",
    description: "Delete an expense category.",
    parameters: z.object({
      categoryId: z
        .string()
        .uuid()
        .describe("Unique identifier of the category to delete"),
    }),
    execute: async (args: { categoryId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.deleteCategory(
          userId,
          args.categoryId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete category");
      }
    },
  },

  // Accounts
  {
    name: "expenses_add_account",
    description:
      "Add a financial account (e.g. bank, cash, credit card, investment, savings).",
    parameters: z.object({
      name: z.string().trim().min(1).describe("Account display name"),
      type: z
        .enum(["bank", "cash", "credit", "investment", "savings"])
        .describe("Type of financial account"),
      balance: z
        .number()
        .optional()
        .describe("Initial opening balance (defaults to 0)"),
      accountNumber: z
        .string()
        .trim()
        .optional()
        .describe("Optional masked or full account identifier"),
      color: z
        .string()
        .optional()
        .describe("Hex color code for the account card"),
    }),
    execute: async (
      args: {
        name: string;
        type: "bank" | "cash" | "credit" | "investment" | "savings";
        balance?: number;
        accountNumber?: string;
        color?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.addAccount(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add account");
      }
    },
  },
  {
    name: "expenses_delete_account",
    description: "Delete an account.",
    parameters: z.object({
      accountId: z
        .string()
        .uuid()
        .describe("Unique identifier of the account to delete"),
    }),
    execute: async (args: { accountId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.deleteAccount(
          userId,
          args.accountId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete account");
      }
    },
  },

  // Budgets
  {
    name: "expenses_set_budget",
    description:
      "Set or update the monthly spending budget limit for a specific category and month (YYYY-MM).",
    parameters: z.object({
      categoryId: z
        .string()
        .uuid()
        .describe("Unique identifier of the category"),
      month: z
        .string()
        .regex(/^\d{4}-\d{2}$/, "Invalid month format (YYYY-MM)")
        .describe("Target month in YYYY-MM format (e.g. '2026-11')"),
      amount: z
        .number()
        .positive()
        .describe("Budget limit amount for the month"),
    }),
    execute: async (
      args: { categoryId: string; month: string; amount: number },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.setBudget(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to set budget");
      }
    },
  },

  // People / Contacts
  {
    name: "expenses_add_person",
    description:
      "Add a person/contact for debt ledger tracking and bill splitting.",
    parameters: z.object({
      name: z.string().trim().min(1).describe("Contact full name"),
      email: z.string().email().optional().describe("Contact email address"),
      phone: z.string().trim().optional().describe("Contact phone number"),
      notes: z.string().trim().optional().describe("Optional notes on contact"),
    }),
    execute: async (
      args: {
        name: string;
        email?: string;
        phone?: string;
        notes?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.addPerson(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add person");
      }
    },
  },
  {
    name: "expenses_delete_person",
    description: "Delete a person/contact.",
    parameters: z.object({
      personId: z
        .string()
        .uuid()
        .describe("Unique identifier of the person to delete"),
    }),
    execute: async (args: { personId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.deletePerson(userId, args.personId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete person");
      }
    },
  },

  // Debt Ledger
  {
    name: "expenses_add_debt_entry",
    description:
      "Record an IOU debt entry (money lent to someone or borrowed from someone).",
    parameters: z.object({
      personId: z
        .string()
        .uuid()
        .describe("Unique identifier of the counterparty person"),
      type: z
        .enum(["lent", "borrowed"])
        .describe(
          "Type of debt: 'lent' (you lent money) or 'borrowed' (you borrowed money)",
        ),
      principalAmount: z.number().positive().describe("Principal debt amount"),
      interestRateAnnual: z
        .number()
        .min(0)
        .optional()
        .describe("Annual interest rate percentage (defaults to 0)"),
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .describe("Debt origination date in YYYY-MM-DD format"),
      dueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .optional()
        .describe("Optional target repayment due date in YYYY-MM-DD format"),
      note: z.string().trim().optional().describe("Optional note or terms"),
      proofUrl: z
        .string()
        .url()
        .optional()
        .describe("Optional URL to loan proof or contract document"),
    }),
    execute: async (
      args: {
        personId: string;
        type: "lent" | "borrowed";
        principalAmount: number;
        interestRateAnnual?: number;
        startDate: string;
        dueDate?: string;
        note?: string;
        proofUrl?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.addDebtEntry(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add debt entry");
      }
    },
  },
  {
    name: "expenses_add_debt_repayment",
    description:
      "Record a partial or full repayment toward an open debt entry. Automatically marks debt as settled when principal is met.",
    parameters: z.object({
      entryId: z
        .string()
        .uuid()
        .describe("Unique identifier of the debt entry"),
      entryDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .describe("Repayment date in YYYY-MM-DD format"),
      amount: z.number().positive().describe("Repayment amount"),
      note: z
        .string()
        .trim()
        .optional()
        .describe("Optional note for this repayment"),
      proofUrl: z
        .string()
        .url()
        .optional()
        .describe("Optional URL to payment receipt or transfer proof"),
    }),
    execute: async (
      args: {
        entryId: string;
        entryDate: string;
        amount: number;
        note?: string;
        proofUrl?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.addDebtRepayment(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add debt repayment");
      }
    },
  },
  {
    name: "expenses_settle_person_debts",
    description:
      "Settle all open debts for a person in full by auto-recording final repayments and closing entries.",
    parameters: z.object({
      personId: z
        .string()
        .uuid()
        .describe("Unique identifier of the person whose debts to settle"),
    }),
    execute: async (args: { personId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.settlePersonDebts(
          userId,
          args.personId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to settle person debts");
      }
    },
  },
  {
    name: "expenses_delete_debt_entry",
    description:
      "Delete a debt entry and all associated repayments permanently.",
    parameters: z.object({
      entryId: z
        .string()
        .uuid()
        .describe("Unique identifier of the debt entry to delete"),
    }),
    execute: async (args: { entryId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.deleteDebtEntry(
          userId,
          args.entryId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete debt entry");
      }
    },
  },

  // Bill Splits & Groups
  {
    name: "expenses_add_bill_split",
    description:
      "Record a shared bill split among multiple participants, specifying individual shares and payment status.",
    parameters: z.object({
      title: z
        .string()
        .trim()
        .min(1)
        .describe("Bill title (e.g. 'Team Lunch')"),
      totalAmount: z.number().positive().describe("Total bill amount"),
      paidByPersonId: z
        .string()
        .describe(
          "ID of the person who paid the bill upfront (UUID or 'p_you' for user)",
        ),
      groupId: z
        .string()
        .uuid()
        .optional()
        .describe("Optional expense group ID linking this split"),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .describe("Bill date in YYYY-MM-DD format"),
      splitMethod: z
        .enum(["equal", "exact", "percentage"])
        .optional()
        .describe("Split calculation method (defaults to 'equal')"),
      note: z
        .string()
        .trim()
        .optional()
        .describe("Optional description or note"),
      receiptUrl: z
        .string()
        .url()
        .optional()
        .describe("Optional URL to bill receipt image"),
      splits: z
        .array(
          z.object({
            personId: z
              .string()
              .describe(
                "Participant ID (UUID or 'p_you' for the authenticated user)",
              ),
            amount: z
              .number()
              .nonnegative()
              .describe("Participant's owed or paid share"),
            percentage: z
              .number()
              .optional()
              .describe("Percentage share if split by percentage"),
            isPaid: z
              .boolean()
              .optional()
              .describe("Whether participant has already paid their share"),
          }),
        )
        .min(1)
        .describe("List of participant split shares"),
    }),
    execute: async (
      args: {
        title: string;
        totalAmount: number;
        paidByPersonId: string;
        groupId?: string;
        date: string;
        splitMethod?: "equal" | "exact" | "percentage";
        note?: string;
        receiptUrl?: string;
        splits: Array<{
          personId: string;
          amount: number;
          percentage?: number;
          isPaid?: boolean;
        }>;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.addBillSplit(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add bill split");
      }
    },
  },
  {
    name: "expenses_toggle_split_item_paid",
    description:
      "Toggle payment status of a participant's share in a bill split.",
    parameters: z.object({
      splitId: z
        .string()
        .uuid()
        .describe("Unique identifier of the bill split"),
      personId: z
        .string()
        .describe(
          "Participant ID whose item payment status to toggle (UUID or 'p_you')",
        ),
    }),
    execute: async (
      args: { splitId: string; personId: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.toggleSplitItemPaid(
          userId,
          args.splitId,
          args.personId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(
          error.message || "Failed to toggle split item payment status",
        );
      }
    },
  },
  {
    name: "expenses_delete_bill_split",
    description:
      "Delete a bill split and all associated participant split records.",
    parameters: z.object({
      splitId: z
        .string()
        .uuid()
        .describe("Unique identifier of the bill split to delete"),
    }),
    execute: async (args: { splitId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.deleteBillSplit(
          userId,
          args.splitId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete bill split");
      }
    },
  },
  {
    name: "expenses_add_group",
    description:
      "Add an expense group (e.g. 'Flatmates', 'Trip to Alps') and add member contacts.",
    parameters: z.object({
      name: z.string().trim().min(1).describe("Expense group name"),
      description: z
        .string()
        .trim()
        .optional()
        .describe("Optional group description"),
      color: z.string().optional().describe("Hex color code for the group"),
      icon: z
        .string()
        .optional()
        .describe("Icon name (Lucide icon, e.g. 'Users', 'Home', 'Plane')"),
      memberIds: z
        .array(z.string())
        .optional()
        .describe(
          "Array of person IDs to include as group members (UUIDs or 'p_you')",
        ),
    }),
    execute: async (
      args: {
        name: string;
        description?: string;
        color?: string;
        icon?: string;
        memberIds?: string[];
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.addGroup(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add group");
      }
    },
  },
  {
    name: "expenses_delete_group",
    description:
      "Delete an expense group and remove all group member associations.",
    parameters: z.object({
      groupId: z
        .string()
        .uuid()
        .describe("Unique identifier of the group to delete"),
    }),
    execute: async (args: { groupId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.deleteGroup(userId, args.groupId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete group");
      }
    },
  },

  // Currency
  {
    name: "expenses_set_preferred_currency",
    description:
      "Set the user's preferred currency code across expense tracking (e.g. 'USD', 'EUR', 'INR', 'GBP').",
    parameters: z.object({
      currency: z
        .string()
        .trim()
        .min(1)
        .max(10)
        .describe("Currency code, e.g. 'USD', 'EUR', 'INR', 'GBP'"),
    }),
    execute: async (args: { currency: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await expenseService.setPreferredCurrency(
          userId,
          args.currency,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(
          error.message || "Failed to set preferred currency",
        );
      }
    },
  },
];

// Register all expense tools to a FastMCP server instance
export function registerExpenseTools(server: FastMCP<any>) {
  for (const tool of expenseTools) {
    server.addTool(tool as any);
  }
}

export default registerExpenseTools;
