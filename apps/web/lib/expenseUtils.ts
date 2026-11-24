// Helper utilities for Personal Expenses, Debt Ledger, Currency formatting, and Simplification
import type {
  CurrencyCode,
  DebtEntry,
  Person,
} from "@/components/expenses/types";

export const CURRENCIES: Record<
  CurrencyCode,
  { symbol: string; name: string; rate: number }
> = {
  USD: { symbol: "$", name: "US Dollar", rate: 1.0 },
  INR: { symbol: "₹", name: "Indian Rupee", rate: 86.5 },
  EUR: { symbol: "€", name: "Euro", rate: 0.92 },
  GBP: { symbol: "£", name: "British Pound", rate: 0.79 },
  JPY: { symbol: "¥", name: "Japanese Yen", rate: 154.0 },
  CAD: { symbol: "CA$", name: "Canadian Dollar", rate: 1.38 },
  AUD: { symbol: "AU$", name: "Australian Dollar", rate: 1.52 },
};

// Format currency with selected code
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "USD",
  decimals = 2,
): string {
  const config = CURRENCIES[currency] || CURRENCIES.USD;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${amount < 0 ? "-" : ""}${config.symbol}${formatted}`;
}

// Compute simple interest on debt entry
export function calculateDebtInterest(
  entry: DebtEntry,
  asOfDate: string = new Date().toISOString().slice(0, 10),
): number {
  if (!entry.interestRateAnnual || entry.interestRateAnnual <= 0) return 0;
  const start = new Date(entry.startDate).getTime();
  const current = new Date(asOfDate).getTime();
  if (current <= start) return 0;
  const days = Math.max(
    0,
    Math.floor((current - start) / (1000 * 60 * 60 * 24)),
  );
  const years = days / 365;
  const interest =
    entry.principalAmount * (entry.interestRateAnnual / 100) * years;
  return Math.round(interest * 100) / 100;
}

// Compute outstanding balance for a single debt entry
export function calculateEntryBalance(entry: DebtEntry): number {
  if (entry.isSettled) return 0;
  const interest = calculateDebtInterest(entry);
  const totalDue = entry.principalAmount + interest;
  const totalRepaid = entry.repayments.reduce((sum, p) => sum + p.amount, 0);
  return Math.max(0, totalDue - totalRepaid);
}

// Compute total net balance for a person (positive = they owe you, negative = you owe them)
export function calculatePersonNetBalance(
  personId: string,
  entries: DebtEntry[],
): {
  netBalance: number;
  totalTheyOwe: number;
  totalYouOwe: number;
  hasOverdue: boolean;
  overdueCount: number;
} {
  const personEntries = entries.filter(
    (e) => e.personId === personId && !e.isSettled,
  );
  let totalTheyOwe = 0;
  let totalYouOwe = 0;
  let overdueCount = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const entry of personEntries) {
    const balance = calculateEntryBalance(entry);
    if (balance <= 0) continue;

    if (entry.type === "lent") {
      totalTheyOwe += balance;
    } else {
      totalYouOwe += balance;
    }

    if (entry.dueDate && entry.dueDate < today) {
      overdueCount++;
    }
  }

  return {
    netBalance: totalTheyOwe - totalYouOwe,
    totalTheyOwe,
    totalYouOwe,
    hasOverdue: overdueCount > 0,
    overdueCount,
  };
}

// Debt simplification algorithm for group expenses
export interface SimplifiedDebt {
  fromPersonId: string;
  toPersonId: string;
  amount: number;
}

export function simplifyDebts(
  balances: Record<string, number>, // personId -> net amount (positive = gets money, negative = owes money)
): SimplifiedDebt[] {
  const debtors: { personId: string; amount: number }[] = [];
  const creditors: { personId: string; amount: number }[] = [];

  for (const [personId, amount] of Object.entries(balances)) {
    if (amount < -0.01) {
      debtors.push({ personId, amount: -amount });
    } else if (amount > 0.01) {
      creditors.push({ personId, amount });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: SimplifiedDebt[] = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    if (!debtor || !creditor) break;

    const minAmount = Math.min(debtor.amount, creditor.amount);
    if (minAmount > 0.01) {
      transactions.push({
        fromPersonId: debtor.personId,
        toPersonId: creditor.personId,
        amount: Math.round(minAmount * 100) / 100,
      });
    }

    debtor.amount -= minAmount;
    creditor.amount -= minAmount;

    if (debtor.amount <= 0.01) d++;
    if (creditor.amount <= 0.01) c++;
  }

  return transactions;
}
