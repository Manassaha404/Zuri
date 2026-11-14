import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { pages } from "./pages";

export type RichText = {
  text: string;
  marks?: Array<"bold" | "italic" | "underline" | "strike" | "code">;
  href?: string;
  pageId?: string;
}[];

export type BlockContent =
  | {
      type:
        | "paragraph"
        | "heading_1"
        | "heading_2"
        | "heading_3"
        | "quote"
        | "bulleted_list"
        | "numbered_list"
        | "toggle";
      richText: RichText;
    }
  | { type: "todo"; richText: RichText; checked: boolean }
  | { type: "callout"; richText: RichText; icon?: string; color?: string }
  | { type: "code"; language: string; code: string; caption?: string }
  | { type: "divider" }
  | {
      type: "image";
      cloudinaryPublicId?: string;
      cloudinaryUrl?: string;
      attachmentId?: string;
      caption?: string;
      width?: number;
      height?: number;
    }
  | {
      type: "file";
      attachmentId?: string;
      cloudinaryPublicId?: string;
      cloudinaryUrl?: string;
      fileName?: string;
      mimeType?: string;
      sizeBytes?: number;
      caption?: string;
    }
  | { type: "page_link"; pageId: string; title?: string; caption?: string }
  | {
      type: "bookmark";
      url: string;
      title?: string;
      description?: string;
      favicon?: string;
    }
  | { type: "table"; rows: RichText[][] };

export const blockType = pgEnum("block_type", [
  "paragraph",
  "heading_1",
  "heading_2",
  "heading_3",
  "bulleted_list",
  "numbered_list",
  "todo",
  "toggle",
  "quote",
  "callout",
  "code",
  "divider",
  "image",
  "file",
  "bookmark",
  "diagram",
  "table",
  "page_link",
]);

export const blocks = pgTable(
  "blocks",
  {
    blockId: uuid("block_id").primaryKey().defaultRandom(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.pageId, { onDelete: "cascade" }),
    parentBlockId: uuid("parent_block_id").references(
      (): any => blocks.blockId,
      { onDelete: "cascade" },
    ), // nesting (toggle children, sub-bullets)
    type: blockType("type").notNull(),
    content: jsonb("content")
      .$type<BlockContent>()
      .notNull()
      .default({} as BlockContent),
    position: text("position").notNull(), // fractional index (e.g. "a0", "a1", "a0V")
    plainText: text("plain_text"), // flattened text for search
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("blocks_page_idx").on(t.pageId, t.parentBlockId, t.position),
    unique("blocks_id_page_uq").on(t.blockId, t.pageId),
  ],
);
