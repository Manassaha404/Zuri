import { type InputPrompt } from "fastmcp";

export const EXPENSES_GUIDELINES_PROMPT = `# Expenses & Financial Ledger Guidelines
Comprehensive personal cash flow, expense tracking, monthly budgets, debt ledger, and bill splitting via MCP tools.

## 1. Pillars
1. Accounts: Financial repositories (bank, upi, cash) holding cash balances.
2. Categories: Classification for expenses (Food, Rent, Bills, Entertainment) and income (Salary, Freelance, Investment).
3. Transactions: Single income or expense entries affecting account balance, categorized, with date (YYYY-MM-DD), note, optional receipt URL, and recurrence.
4. Monthly Budgets: Category spending thresholds allocated per calendar month (YYYY-MM).
5. Debt Ledger (IOUs): Monies lent (owed to user) or borrowed (owed by user) tracked against people/contacts, supporting annual interest rates, partial repayments, and full settlement zeroing.
6. Bill Splitting & Groups: Shared bill management with equal, exact, or percentage allocations, paid toggle status, and expense groups simplifying multi-party debts.
7. Settings: User preferred currency (e.g. "USD", "INR", "EUR", "GBP").

## 2. Tools & Workflows
- Discovery: expenses_get_workspace (returns full financial snapshot: accounts, categories, budgets, transactions, people, debt entries, splits, groups, preferred currency).
- Transactions: expenses_add_transaction, expenses_delete_transaction.
- Accounts & Categories: expenses_add_account, expenses_delete_account, expenses_add_category, expenses_delete_category.
- Budgets: expenses_set_budget (format: month=YYYY-MM, amount>=0).
- Contacts / People: expenses_add_person, expenses_delete_person.
- Debt Ledger: expenses_add_debt_entry, expenses_add_debt_repayment, expenses_settle_person_debts, expenses_delete_debt_entry.
- Bill Splitting: expenses_add_bill_split, expenses_toggle_split_item_paid, expenses_delete_bill_split.
- Groups: expenses_add_group, expenses_delete_group.
- Settings: expenses_set_currency.

## 3. General Principles & Rules
- Dates: Strict YYYY-MM-DD format using current system date.
- Amounts: Positive numeric numbers (e.g. 15.50, 100). Never negative amounts.
- Accounts & Categories: Resolve or create accounts/categories before logging transactions.
- User Self Representation: In bill splits and groups, the authenticated user is represented by personId: "p_you" (or name "You").
- Tone: Clear, prudent, and constructive financial summaries without financial advice disclaimers.
`;

export const EXPENSES_TRANSACTION_GUIDELINES_PROMPT = `# Expenses Transaction Guidelines
Workflows for logging and managing cash flow transactions.

## 1. Transaction Types
- expense: Deducts amount from the selected account balance. Must link to an "expense" category.
- income: Credits amount to the selected account balance. Must link to an "income" category.

## 2. Required Fields & Validation
- type: "expense" | "income"
- amount: Positive number (amount > 0).
- categoryId: UUID of valid category matching transaction type.
- accountId: UUID of valid account (bank, upi, cash).
- date: YYYY-MM-DD string.
- note: Optional descriptive string (e.g. "Lunch with team", "Monthly salary").
- receiptUrl: Optional URL to attachment or proof.
- isRecurring: Optional boolean.
- recurrenceFrequency: Optional ("none" | "daily" | "weekly" | "monthly" | "yearly").

## 3. Best Practices
- Always check expenses_get_workspace first if accountId or categoryId is unknown or needs to be resolved by name.
- If an account or category does not exist, prompt or create it with expenses_add_account / expenses_add_category.
`;

export const EXPENSES_DEBT_AND_SPLIT_GUIDELINES_PROMPT = `# Debt Ledger & Bill Splitting Guidelines
Workflows for managing IOUs, debt repayments, settlements, and shared bill splits.

## 1. Debt Ledger (IOUs)
- People: Ensure contact exists via expenses_add_person before creating debt entries.
- Debt Types:
  - lent: User gave money to person (person owes user).
  - borrowed: User took money from person (user owes person).
- Interest Calculation:
  - interestRateAnnual: Optional annual percentage rate (e.g. 5 for 5%/year).
  - Accrues simple interest over time: accrued = principal * (annualRate / 100) * (daysElapsed / 365).
  - Total outstanding balance = (principal + accrued interest) - repayments.
- Repayments & Settlement:
  - expenses_add_debt_repayment: Records a partial repayment against a specific debt entry on date (YYYY-MM-DD).
  - expenses_settle_person_debts: Zeroes out all active debt entries for a person in one action.
  - expenses_delete_debt_entry: Permanently deletes a debt record.

## 2. Bill Splitting
- Split Types:
  - equal: Divides total amount equally among all participants (handles rounding).
  - exact: Specific amounts assigned to each participant summing to total amount.
  - percentage: Percentage allocated to each participant summing to 100%.
- Participants:
  - Authenticated user is represented by personId: "p_you" (name: "You").
  - Other participants use personId from contacts or custom participant names.
- Paid Status:
  - Toggle item status using expenses_toggle_split_item_paid({ itemId, isPaid }).
- Groups:
  - Group expenses simplify debts across roommates, trips, or projects via expenses_add_group.
`;

export const expensePrompts: InputPrompt[] = [
  {
    name: "expenses_guidelines",
    description:
      "Comprehensive guidelines and workflows for personal expenses, transactions, budgets, debt ledger, and bill splitting.",
    load: async () => EXPENSES_GUIDELINES_PROMPT,
  },
  {
    name: "expenses_transaction_guidelines",
    description:
      "Guidelines for logging income and expense transactions, category matching, account balance tracking, and recurrence.",
    load: async () => EXPENSES_TRANSACTION_GUIDELINES_PROMPT,
  },
  {
    name: "expenses_debt_and_split_guidelines",
    description:
      "Guidelines for debt ledger (IOU balances, interest, partial repayments, full settlement) and bill splitting.",
    load: async () => EXPENSES_DEBT_AND_SPLIT_GUIDELINES_PROMPT,
  },
];

export function registerExpensePrompts(server: any) {
  for (const prompt of expensePrompts) {
    server.addPrompt(prompt);
  }
}
