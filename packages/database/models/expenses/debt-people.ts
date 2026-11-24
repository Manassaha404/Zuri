import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "../users";

export const debtPeople = pgTable(
  "debt_people",
  {
    personId: uuid("person_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("debt_people_user_idx").on(t.userId),
    index("debt_people_name_idx").on(t.name),
  ],
);

export type DebtPerson = typeof debtPeople.$inferSelect;
export type NewDebtPerson = typeof debtPeople.$inferInsert;
