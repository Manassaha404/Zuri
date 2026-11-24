import {
  pgTable,
  uuid,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { expenseGroups } from "./expense-groups";
import { debtPeople } from "./debt-people";

export const expenseGroupMembers = pgTable(
  "expense_group_members",
  {
    memberId: uuid("member_id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => expenseGroups.groupId, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => debtPeople.personId, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("expense_group_members_group_idx").on(t.groupId),
    index("expense_group_members_person_idx").on(t.personId),
    uniqueIndex("expense_group_member_unique_idx").on(t.groupId, t.personId),
  ],
);

export type ExpenseGroupMember = typeof expenseGroupMembers.$inferSelect;
export type NewExpenseGroupMember = typeof expenseGroupMembers.$inferInsert;
