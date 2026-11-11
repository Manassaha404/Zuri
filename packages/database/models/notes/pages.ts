import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  customType,
} from "drizzle-orm/pg-core";
import { chapters } from "./chapters";
import { notebooks } from "./notebooks";
const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });
export const pages = pgTable(
  "pages",
  {
    pageId: uuid("page_id").primaryKey().defaultRandom(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.chapterId, { onDelete: "cascade" }),
    notebookId: uuid("notebook_id")
      .notNull()
      .references(() => notebooks.notebookId, { onDelete: "cascade" }), // denormalized
    title: text("title").notNull().default("Untitled"),
    summary: text("summary"),
    position: text("position").notNull(),
    isPinned: boolean("is_pinned").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    searchVector: tsvector("search_vector"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("pages_chapter_idx").on(t.chapterId, t.position),
    index("pages_notebook_idx").on(t.notebookId),
    index("pages_search_idx").using("gin", t.searchVector),
  ],
);
