import { z } from "zod";

// Transactions DTOs
export const addTransactionDto = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.number().positive("Amount must be positive"),
  categoryId: z.string().uuid("Invalid category ID"),
  accountId: z.string().uuid("Invalid account ID"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  note: z.string().trim().optional(),
  receiptUrl: z.string().trim().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceFrequency: z
    .enum(["none", "daily", "weekly", "monthly", "yearly"])
    .optional(),
});
export type AddTransactionDto = z.infer<typeof addTransactionDto>;

export const transactionIdDto = z.object({
  transactionId: z.string().uuid(),
});
export type TransactionIdDto = z.infer<typeof transactionIdDto>;

// Accounts DTOs
export const addAccountDto = z.object({
  name: z.string().trim().min(1, "Account name is required"),
  type: z.enum(["bank", "upi", "cash"]),
  balance: z.number().optional(),
  accountNumber: z.string().trim().optional(),
  color: z.string().optional(),
});
export type AddAccountDto = z.infer<typeof addAccountDto>;

export const accountIdDto = z.object({
  accountId: z.string().uuid(),
});
export type AccountIdDto = z.infer<typeof accountIdDto>;

// Categories DTOs
export const addCategoryDto = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  type: z.enum(["expense", "income"]),
  icon: z.string().optional(),
  color: z.string().optional(),
});
export type AddCategoryDto = z.infer<typeof addCategoryDto>;

export const categoryIdDto = z.object({
  categoryId: z.string().uuid(),
});
export type CategoryIdDto = z.infer<typeof categoryIdDto>;

// Monthly Budgets DTOs
export const setBudgetDto = z.object({
  categoryId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format (YYYY-MM)"),
  amount: z.number().min(0, "Budget cannot be negative"),
});
export type SetBudgetDto = z.infer<typeof setBudgetDto>;

// People DTOs
export const addPersonDto = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export type AddPersonDto = z.infer<typeof addPersonDto>;

export const personIdDto = z.object({
  personId: z.string().uuid(),
});
export type PersonIdDto = z.infer<typeof personIdDto>;

// Debt Ledger DTOs
export const addDebtEntryDto = z.object({
  personId: z.string().uuid(),
  type: z.enum(["lent", "borrowed"]),
  principalAmount: z.number().positive("Principal amount must be positive"),
  interestRateAnnual: z.number().min(0).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional()
    .or(z.literal("")),
  note: z.string().trim().optional(),
  proofUrl: z.string().trim().optional(),
});
export type AddDebtEntryDto = z.infer<typeof addDebtEntryDto>;

export const addDebtRepaymentDto = z.object({
  entryId: z.string().uuid(),
  entryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  amount: z.number().positive("Repayment amount must be positive"),
  note: z.string().trim().optional(),
  proofUrl: z.string().trim().optional(),
});
export type AddDebtRepaymentDto = z.infer<typeof addDebtRepaymentDto>;

export const debtEntryIdDto = z.object({
  entryId: z.string().uuid(),
});
export type DebtEntryIdDto = z.infer<typeof debtEntryIdDto>;

// Bill Splits DTOs
export const addBillSplitDto = z.object({
  title: z.string().trim().min(1, "Title is required"),
  totalAmount: z.number().positive("Total amount must be positive"),
  paidByPersonId: z.string().trim().min(1, "Paid by person ID is required"),
  groupId: z.string().uuid().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  splitMethod: z.enum(["equal", "exact", "percentage"]).optional(),
  note: z.string().trim().optional(),
  receiptUrl: z.string().trim().optional(),
  splits: z.array(
    z.object({
      personId: z.string().trim().min(1, "Person ID is required"),
      amount: z.number().min(0),
      percentage: z.number().optional(),
      isPaid: z.boolean().optional(),
    }),
  ),
});
export type AddBillSplitDto = z.infer<typeof addBillSplitDto>;

export const toggleSplitItemPaidDto = z.object({
  splitId: z.string().uuid(),
  personId: z.string().trim().min(1, "Person ID is required"),
});
export type ToggleSplitItemPaidDto = z.infer<typeof toggleSplitItemPaidDto>;

export const splitIdDto = z.object({
  splitId: z.string().uuid(),
});
export type SplitIdDto = z.infer<typeof splitIdDto>;

// Groups DTOs
export const addGroupDto = z.object({
  name: z.string().trim().min(1, "Group name is required"),
  description: z.string().trim().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  memberIds: z.array(z.string().trim().min(1)).optional(),
});
export type AddGroupDto = z.infer<typeof addGroupDto>;

export const groupIdDto = z.object({
  groupId: z.string().uuid(),
});
export type GroupIdDto = z.infer<typeof groupIdDto>;

// User Currency Setting DTO
export const setCurrencyDto = z.object({
  currency: z.enum(["USD", "INR", "EUR", "GBP", "JPY", "CAD", "AUD"]),
});
export type SetCurrencyDto = z.infer<typeof setCurrencyDto>;
