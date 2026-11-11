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
import { fileDockFolders } from "./folders";

// Cloudinary resource types
export const cloudinaryResourceType = pgEnum("cloudinary_resource_type", [
  "image",
  "video",
  "raw",
]);

export const fileDockFiles = pgTable(
  "file_dock_files",
  {
    fileId: uuid("file_id").primaryKey().defaultRandom(),
    fileDockId: uuid("file_dock_id")
      .notNull()
      .references(() => fileDocks.fileDockId, { onDelete: "cascade" }),
    folderId: uuid("folder_id").references(() => fileDockFolders.folderId, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    cloudinaryPublicId: text("cloudinary_public_id").notNull(),
    cloudinaryUrl: text("cloudinary_url").notNull(),
    resourceType: cloudinaryResourceType("resource_type").notNull(),
    format: text("format"), // jpg, png, pdf, mp4...
    mimeType: text("mime_type"),
    bytes: bigint("bytes", { mode: "number" }),
    position: text("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("file_dock_files_dock_idx").on(t.fileDockId, t.position),
    index("file_dock_files_folder_idx").on(t.folderId),
  ],
);
