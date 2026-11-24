import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { expenseCategories } from "./expense-categories";

export const monthlyBudgets = pgTable(
  "monthly_budgets",
  {
    budgetId: uuid("budget_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => expenseCategories.categoryId, { onDelete: "cascade" }),
    month: text("month").notNull(), // 'YYYY-MM'
    amount: doublePrecision("amount").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("monthly_budgets_user_idx").on(t.userId),
    index("monthly_budgets_month_idx").on(t.month),
    uniqueIndex("monthly_budgets_user_cat_month_idx").on(
      t.userId,
      t.categoryId,
      t.month,
    ),
  ],
);

export type MonthlyBudget = typeof monthlyBudgets.$inferSelect;
export type NewMonthlyBudget = typeof monthlyBudgets.$inferInsert;
