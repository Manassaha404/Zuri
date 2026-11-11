import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { pages } from "./pages";

export const diagramKind = pgEnum("diagram_kind", [
  "canvas",
  "mermaid",
  "diagram_as_code",
]);

export const diagrams = pgTable("diagrams", {
  diagramId: uuid("diagram_id").primaryKey().defaultRandom(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.pageId, { onDelete: "cascade" }),
  title: text("title"),
  kind: diagramKind("kind").notNull().default("canvas"),
  source: text("source"),
  scene: jsonb("scene"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
