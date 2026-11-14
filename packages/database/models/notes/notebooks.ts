import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";
export const notebooks = pgTable(
  "notebooks",
  {
    notebookId: uuid("notebook_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull().default("Untitled notebook"),
    icon: text("icon"),
    color: text("color"),
    coverUrl: text("cover_url"),
    position: text("position").notNull(), // fractional index
    isArchived: boolean("is_archived").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("notebooks_position_idx").on(t.position),
    index("notebooks_user_id_idx").on(t.userId),
  ],
);
