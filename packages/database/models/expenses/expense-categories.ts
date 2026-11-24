import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const expenseCategories = pgTable(
  "expense_categories",
  {
    categoryId: uuid("category_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("Tag"),
    color: text("color").notNull().default("#3b82f6"),
    type: text("type").notNull().default("expense"), // 'expense' | 'income'
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("expense_categories_user_idx").on(t.userId),
    index("expense_categories_type_idx").on(t.type),
  ],
);

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type NewExpenseCategory = typeof expenseCategories.$inferInsert;
