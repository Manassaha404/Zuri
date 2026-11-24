// Types for Personal Expenses, Debt Ledger, and Bill Splitting
export type AccountType = "cash" | "bank" | "upi";

export type TransactionType = "expense" | "income";

export type RecurrenceFrequency =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  accountNumber?: string;
  color: string;
}

export interface MonthlyBudget {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM
  amount: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  accountId: string;
  note?: string;
  receiptUrl?: string;
  isRecurring: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  createdAt: string;
}

export type DebtType = "lent" | "borrowed";

export interface DebtPayment {
  id: string;
  entryDate: string; // YYYY-MM-DD
  amount: number;
  note?: string;
  proofUrl?: string;
}

export interface DebtEntry {
  id: string;
  personId: string;
  type: DebtType; // lent (they owe me) or borrowed (I owe them)
  principalAmount: number;
  interestRateAnnual?: number; // annual interest rate percentage e.g. 5%
  startDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  note?: string;
  proofUrl?: string;
  repayments: DebtPayment[];
  isSettled: boolean;
  settledAt?: string;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  notes?: string;
}

export type SplitMethod = "equal" | "exact" | "percentage";

export interface BillSplitItem {
  personId: string;
  amount: number;
  percentage?: number;
  isPaid: boolean;
}

export interface BillSplit {
  id: string;
  title: string;
  totalAmount: number;
  paidByPersonId: string; // who paid initially
  date: string;
  splitMethod: SplitMethod;
  splits: BillSplitItem[];
  groupId?: string;
  note?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface ExpenseGroup {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  color: string;
  icon: string;
  createdAt: string;
}

export type CurrencyCode =
  | "USD"
  | "INR"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateAgainstUSD: number;
}
