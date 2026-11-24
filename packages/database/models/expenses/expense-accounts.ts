import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const expenseAccounts = pgTable(
  "expense_accounts",
  {
    accountId: uuid("account_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("bank"), // 'bank' | 'upi' | 'cash'
    balance: doublePrecision("balance").notNull().default(0),
    accountNumber: text("account_number"),
    color: text("color").notNull().default("#3b82f6"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("expense_accounts_user_idx").on(t.userId),
    index("expense_accounts_type_idx").on(t.type),
  ],
);

export type ExpenseAccount = typeof expenseAccounts.$inferSelect;
export type NewExpenseAccount = typeof expenseAccounts.$inferInsert;
