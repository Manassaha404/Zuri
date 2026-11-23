import { z } from "zod";
// RichText Zod schemas
export const richTextMarkSchema = z.enum([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
]);
export type RichTextMark = z.infer<typeof richTextMarkSchema>;

export const richTextSpanSchema = z.object({
  text: z.string().describe("The text content of the span"),
  marks: z
    .array(richTextMarkSchema)
    .optional()
    .describe(
      "Array of formatting marks: 'bold', 'italic', 'underline', 'strike', 'code'",
    ),
  href: z.string().optional().describe("Optional URL hyperlink"),
  pageId: z.string().optional().describe("Optional internal page ID link"),
});
export type RichTextSpan = z.infer<typeof richTextSpanSchema>;

export const richTextSchema = z
  .array(richTextSpanSchema)
  .describe("Array of rich text spans representing styled formatted text");
export type RichTextDto = z.infer<typeof richTextSchema>;

// Block type enum matching pgEnum block_type
export const blockTypeValues = [
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
] as const;

export const blockTypeSchema = z
  .enum(blockTypeValues)
  .describe("Type of block");
export type BlockType = z.infer<typeof blockTypeSchema>;

// Individual block content schemas
export const textBlockContentSchema = z.object({
  type: z
    .enum([
      "paragraph",
      "heading_1",
      "heading_2",
      "heading_3",
      "quote",
      "bulleted_list",
      "numbered_list",
      "toggle",
    ])
    .optional()
    .describe(
      "Text block type (paragraph, heading_1, heading_2, heading_3, quote, bulleted_list, numbered_list, toggle)",
    ),
  richText: richTextSchema,
});

export const todoBlockContentSchema = z.object({
  type: z.literal("todo").optional(),
  richText: richTextSchema,
  checked: z
    .boolean()
    .default(false)
    .describe("Whether the todo item is checked"),
});

export const calloutBlockContentSchema = z.object({
  type: z.literal("callout").optional(),
  richText: richTextSchema,
  icon: z.string().optional().describe("Callout icon or emoji"),
  color: z.string().optional().describe("Callout accent color"),
});

export const codeBlockContentSchema = z.object({
  type: z.literal("code").optional(),
  language: z
    .string()
    .describe("Programming language (e.g. typescript, python, json)"),
  code: z.string().describe("Source code content"),
  caption: z.string().optional().describe("Optional code caption"),
});

export const dividerBlockContentSchema = z.object({
  type: z.literal("divider").optional(),
});

export const imageBlockContentSchema = z.object({
  type: z.literal("image").optional(),
  cloudinaryPublicId: z
    .string()
    .optional()
    .describe("Cloudinary asset public ID"),
  cloudinaryUrl: z.string().optional().describe("Cloudinary asset URL"),
  attachmentId: z.string().optional().describe("Dock file attachment ID"),
  caption: z.string().optional().describe("Image caption"),
  width: z.number().optional().describe("Image width in pixels"),
  height: z.number().optional().describe("Image height in pixels"),
});

export const fileBlockContentSchema = z.object({
  type: z.literal("file").optional(),
  attachmentId: z.string().optional().describe("Dock file attachment ID"),
  cloudinaryPublicId: z
    .string()
    .optional()
    .describe("Cloudinary asset public ID"),
  cloudinaryUrl: z.string().optional().describe("Cloudinary asset URL"),
  fileName: z.string().optional().describe("Original filename"),
  mimeType: z.string().optional().describe("MIME type of file"),
  sizeBytes: z.number().optional().describe("File size in bytes"),
  caption: z.string().optional().describe("File caption"),
});

export const pageLinkBlockContentSchema = z.object({
  type: z.literal("page_link").optional(),
  pageId: z.string().describe("Target linked page ID"),
  title: z.string().optional().describe("Display title of linked page"),
  caption: z.string().optional().describe("Optional caption"),
});

export const bookmarkBlockContentSchema = z.object({
  type: z.literal("bookmark").optional(),
  url: z.string().describe("Target URL"),
  title: z.string().optional().describe("Page title"),
  description: z.string().optional().describe("Page description"),
  favicon: z.string().optional().describe("Favicon URL"),
});

export const tableBlockContentSchema = z.object({
  type: z.literal("table").optional(),
  rows: z
    .array(z.array(richTextSchema))
    .describe("2D array of table cells containing rich text spans"),
});

export const diagramBlockContentSchema = z.object({
  type: z.literal("diagram").optional(),
  diagramId: z.string().optional().describe("Associated diagram ID"),
  kind: z.enum(["canvas", "mermaid", "diagram_as_code"]).optional(),
  data: z.any().optional(),
  caption: z.string().optional(),
});

// Union of all block content structures with fallback for raw richText span arrays
export const blockContentSchema = z.union([
  textBlockContentSchema,
  todoBlockContentSchema,
  calloutBlockContentSchema,
  codeBlockContentSchema,
  dividerBlockContentSchema,
  imageBlockContentSchema,
  fileBlockContentSchema,
  pageLinkBlockContentSchema,
  bookmarkBlockContentSchema,
  tableBlockContentSchema,
  diagramBlockContentSchema,
  richTextSchema,
]);

export type BlockContentDto = z.infer<typeof blockContentSchema>;
