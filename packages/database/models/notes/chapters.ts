import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { notebooks } from "./notebooks";
import { fileDocks } from "../file-dock/docks";
export const chapters = pgTable(
  "chapters",
  {
    chapterId: uuid("chapter_id").primaryKey().defaultRandom(),
    notebookId: uuid("notebook_id")
      .notNull()
      .references(() => notebooks.notebookId, { onDelete: "cascade" }),
    fileDockId: uuid("file_dock_id").references(() => fileDocks.fileDockId, {
      onDelete: "set null",
    }),
    title: text("title").notNull().default("Untitled chapter"),
    icon: text("icon"),
    color: text("color"),
    position: text("position").notNull(),
    summary: text("summary"),
    isArchived: boolean("is_archived").notNull().default(false),
    isFavorite: boolean("is_favorite").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("chapters_notebook_idx").on(t.notebookId, t.position)],
);
