import {
  pgTable,
  uuid,
  text,
  bigint,
  integer,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { fileDocks } from "./docks";

// Folders inside a dock (nestable)
export const fileDockFolders = pgTable(
  "file_dock_folders",
  {
    folderId: uuid("folder_id").primaryKey().defaultRandom(),
    fileDockId: uuid("file_dock_id")
      .notNull()
      .references(() => fileDocks.fileDockId, { onDelete: "cascade" }),
    parentFolderId: uuid("parent_folder_id").references(
      (): any => fileDockFolders.folderId,
      { onDelete: "cascade" },
    ),
    name: text("name").notNull(),
    position: text("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("file_dock_folders_dock_idx").on(t.fileDockId, t.position)],
);
