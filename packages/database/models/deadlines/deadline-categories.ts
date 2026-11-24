import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const deadlineCategories = pgTable(
  "deadline_categories",
  {
    categoryId: uuid("category_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#3b82f6"),
    icon: text("icon").notNull().default("Tag"),
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
    index("deadline_categories_user_idx").on(t.userId),
    index("deadline_categories_name_idx").on(t.name),
  ],
);

export type DeadlineCategoryRecord = typeof deadlineCategories.$inferSelect;
export type NewDeadlineCategoryRecord = typeof deadlineCategories.$inferInsert;
