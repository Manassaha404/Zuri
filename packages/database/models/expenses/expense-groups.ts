import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "../users";

export const expenseGroups = pgTable(
  "expense_groups",
  {
    groupId: uuid("group_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").notNull().default("#3b82f6"),
    icon: text("icon").notNull().default("Users"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("expense_groups_user_idx").on(t.userId)],
);

export type ExpenseGroup = typeof expenseGroups.$inferSelect;
export type NewExpenseGroup = typeof expenseGroups.$inferInsert;
