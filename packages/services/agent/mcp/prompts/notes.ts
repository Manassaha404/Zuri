import { type InputPrompt } from "fastmcp";

// Read guidelines and workspace inspection prompt
export const NOTES_READ_PROMPT = `# Notes System - Read & Discovery Guidelines

You have access to a complete notes management system via MCP tools. Adhere to these architectural principles and workflows when searching, reading, and inspecting notes.

---

## 1. Workspace Hierarchy
The notes hierarchy consists of four main levels:
1. **Notebook**: The top-level collection (e.g. "Work", "Engineering", "Personal"). Contains chapters.
2. **Chapter**: A topic grouping within a notebook (e.g. "Architecture", "Sprint Notes"). Contains pages and a linked File Dock for attachments.
3. **Page**: A document containing content blocks and optional visual diagrams.
4. **Block**: An individual unit of content (paragraph, heading, code block, list item, etc.) inside a page.

Additional components:
- **File Dock**: Linked to each chapter to store uploaded files and attachments.
- **Diagrams**: Visual diagrams (Mermaid flowcharts, sequences, state diagrams, or canvas scenes) attached to specific pages.
- **Trash**: Soft-deleted notebooks, chapters, and pages.

---

## 2. Read Tools & Retrieval Workflow

### A. Discovering Workspace Structure
- **notes_get_workspace**: Fetches the complete workspace hierarchy with all active notebooks, chapters, and pages. Use this at the start of interactions when the user asks "what notebooks do I have?", "show my notes", or when you need to locate notebooks and chapters.
- **notes_get_notebooks**: Lists all notebooks in the workspace.
- **notes_get_chapters**: Lists all chapters within a given notebookId.
- **notes_get_pages**: Lists all pages within a given chapterId.
- **notes_get_page_by_id**: Retrieves page metadata (title, summary, pin status, chapter) by pageId.

### B. Searching Notes
- **notes_search_notes**: Fast global search across all notebooks, chapters, and pages matching a query keyword. Use this first when the user asks about a specific keyword, topic, or document name.

### C. Reading Note Content (Blocks & Diagrams)
- **notes_get_blocks**: Retrieves all content blocks on a page using pageId.
  - Every page's content is stored in granular blocks.
  - Blocks are returned with their id, type, position (fractional order), parentBlockId (for nested items), and structured content JSON.
  - To display or summarize a note's content to the user, always call notes_get_blocks with the target pageId.
- **notes_get_diagram**: Retrieves the diagram attached to a page (returns kind: "mermaid" | "canvas" and the diagram data).

### D. File Docks & Trash Inspection
- **notes_get_chapter_file_dock**: Fetches the file dock and all uploaded attachments for a given chapterId.
- **notes_get_trash**: Lists all archived (soft-deleted) notebooks, chapters, and pages. Use when the user asks what is in trash or wants to restore archived items.

---

## 3. Best Practices for Reading Notes
- Prefer parallel tool calls: If you need to search notes and check workspace hierarchy, emit both notes_search_notes and notes_get_workspace in the same turn.
- When the user asks "summarize my note about X", first search for the page, then fetch its blocks with notes_get_blocks, and synthesize the response accurately from the block contents.
`;

// Write guidelines, block schemas, and mutation workflows prompt
export const NOTES_WRITE_PROMPT = `# Notes System - Write & Mutation Guidelines

You have access to a complete notes management system via MCP tools. Adhere to these schemas, block specifications, and mutation workflows when creating, editing, or reorganizing notes.

---

## 1. Workspace Hierarchy & Entity Creation
Hierarchy: **Notebook** -> **Chapter** -> **Page** -> **Block**.
- To create a new notebook: notes_create_notebook({ title, icon?, color?, summary? }).
- To create a new chapter: notes_create_chapter({ notebookId?, title?, summary? }).
- To create a new page: notes_create_page({ chapterId?, notebookId?, title?, summary? }).
- **Best Practice for Page Creation**:
  1. Call notes_get_workspace first to inspect available notebooks and chapters so you have the valid chapterId and notebookId.
  2. If chapterId is provided to notes_create_page, notebookId is automatically inferred.
  3. If neither chapterId nor notebookId is provided, the page is automatically created in the user's default workspace chapter.
- Always check notes_get_workspace first to locate appropriate existing notebooks and chapters before creating duplicates.

---

## 2. Block Types & Content JSON Schema
Every block on a page has a type, a fractional index position (e.g. "a0", "a1"), an optional parentBlockId (for nesting), and a content JSON payload.

### Standard Text Blocks
- **paragraph**:
  \`\`\`json
  { "type": "paragraph", "richText": [{ "text": "Content goes here" }] }
  \`\`\`
- **heading_1**, **heading_2**, **heading_3**:
  \`\`\`json
  { "type": "heading_1", "richText": [{ "text": "Section Title" }] }
  \`\`\`
- **bulleted_list**, **numbered_list**:
  \`\`\`json
  { "type": "bulleted_list", "richText": [{ "text": "List item" }] }
  \`\`\`
- **quote**:
  \`\`\`json
  { "type": "quote", "richText": [{ "text": "Quoted text..." }] }
  \`\`\`
- **toggle**:
  \`\`\`json
  { "type": "toggle", "richText": [{ "text": "Toggle Header" }] }
  \`\`\`
  *(Nested blocks under a toggle reference the toggle's blockId as their parentBlockId)*

### Interactive & Formatted Blocks
- **todo**:
  \`\`\`json
  { "type": "todo", "richText": [{ "text": "Action item" }], "checked": false }
  \`\`\`
- **callout**:
  \`\`\`json
  { "type": "callout", "richText": [{ "text": "Key takeaway or note" }], "icon": "💡", "color": "#3b82f6" }
  \`\`\`
- **code**:
  \`\`\`json
  { "type": "code", "language": "typescript", "code": "console.log('Hello world');", "caption": "Optional description" }
  \`\`\`
- **divider**:
  \`\`\`json
  { "type": "divider" }
  \`\`\`
- **bookmark**:
  \`\`\`json
  { "type": "bookmark", "url": "https://example.com", "title": "Example", "description": "Preview description", "favicon": "https://..." }
  \`\`\`
- **table**:
  \`\`\`json
  {
    "type": "table",
    "rows": [
      [[{ "text": "Header 1" }], [{ "text": "Header 2" }]],
      [[{ "text": "Value 1" }], [{ "text": "Value 2" }]]
    ]
  }
  \`\`\`

### RichText Formatting Options
Each item inside the richText array supports inline text formatting:
\`\`\`json
{
  "text": "styled text",
  "marks": ["bold", "italic", "underline", "strike", "code"],
  "href": "https://optional-link.com"
}
\`\`\`

---

## 3. Atomic Autosave & Block Composition Rules

### CRITICAL: Granular Blocks (Never Dump Raw Markdown)
- The editor is a block-based editor. NEVER dump an entire multi-paragraph markdown document, raw markdown symbols, or code fences into a single paragraph block.
- Decompose content into individual native blocks:
  - Headings -> heading_1, heading_2, or heading_3 blocks (do NOT include '#' in text).
  - Code -> code blocks with language (e.g. python, typescript) and code strings (NEVER put triple backticks in text).
  - Lists -> individual bulleted_list or numbered_list blocks per item (do NOT write '1. ' or '- ' in text).
  - To-dos -> todo blocks with checked: false.
  - Callouts -> callout blocks with icon and richText.
- Provide sequential fractional positions ("a0", "a1", "a2", ...).

### Preferred Saving Workflow: Atomic Autosave (notes_autosave_page)
- When populating a newly created page or performing major updates, ALWAYS use notes_autosave_page.
- notes_autosave_page accepts pageId, optional updated title and summary, and the complete array of blocks. It atomically reconciles the page in a single operation.
- For small single-block edits or insertions, you can alternatively use notes_create_block or notes_update_block.

---

## 4. Visual Diagrams
- To attach or update an architectural diagram, flowchart, or sequence diagram on a page, call notes_save_diagram:
  - pageId: Target page ID.
  - kind: "mermaid" (or "canvas").
  - data: Valid Mermaid source code (e.g. "graph TD; A-->B") or canvas scene data.

---

## 5. Archiving vs Deleting Rules
- **Prefer Archiving (Soft Delete)**: Always use notes_archive_page, notes_archive_chapter, or notes_archive_notebook. This moves items to the Trash, allowing users to restore them via notes_restore_page, etc.
- **Permanent Deletion**: Only use permanent deletion tools (notes_delete_page_permanently, notes_delete_chapter_permanently, notes_delete_notebook_permanently) when the user explicitly instructs permanent or irreversible deletion.
`;

// FastMCP prompt definitions for notes
export const notePrompts: InputPrompt[] = [
  {
    name: "notes_read_guidelines",
    description:
      "Guidelines, architecture, and workflows for reading, searching, and inspecting notebooks, chapters, pages, and blocks.",
    load: async () => NOTES_READ_PROMPT,
  },
  {
    name: "notes_write_guidelines",
    description:
      "Guidelines, block schemas, and workflows for creating, updating, autosaving pages, blocks, and diagrams.",
    load: async () => NOTES_WRITE_PROMPT,
  },
  {
    name: "notes_guidelines",
    description:
      "System guidelines and complete specifications for working with notes (both reading and writing).",
    load: async () => `${NOTES_READ_PROMPT}\n\n---\n\n${NOTES_WRITE_PROMPT}`,
  },
  {
    name: "notes_page_structure",
    description:
      "Best practices and prompt template for structuring clean, organized pages with rich blocks for a specific topic.",
    arguments: [
      {
        name: "topic",
        description: "The topic or subject of the note to create",
        required: true,
      },
    ],
    load: async (args: { topic?: string }) => {
      const topic = args?.topic || "the specified topic";
      return `${NOTES_WRITE_PROMPT}\n\n## Instructions for "${topic}":\nCreate a well-structured page for "${topic}". Include a summary, introduction callout, structured headings, code or bullet lists where appropriate, and actionable to-do items.`;
    },
  },
];

// Register note prompts with FastMCP server
export function registerNotePrompts(server: any) {
  for (const prompt of notePrompts) {
    server.addPrompt(prompt);
  }
}
