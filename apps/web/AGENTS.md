# Agent Guidelines for `apps/web`

This document defines the architectural patterns, code style, UI standards, and design system rules for AI coding agents working inside `apps/web`.

> [!IMPORTANT]
> **PROHIBITION OF THIRD-PARTY BRAND NAMES (ZERO EXCEPTIONS)**:
> **Agents must NEVER use other third-party brand names (such as Notion, Eraser, Cal, Cal.com, Craft, etc.) anywhere in this project — including code, comments, documentation, UI strings, placeholders, file names, or variable identifiers.**
> Always use clean, generic, product-native terminology (e.g. "hierarchical block editor", "hand-crafted diagram studio", "canvas", "workspace").

---

## 1. Project Overview & Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript (strict mode, `@/*` path aliases pointing to `apps/web/*`)
- **State Management**: Zustand stores strictly centralized in `apps/web/store/`
  - `useUIStore`: Theme, responsive layout (`isMobile`), sidebar open/collapsed state.
  - `useUserInfoStore`: Dynamic user credentials, profile name, username, email.
  - `useAgentStore`: Agent chat, streaming tokens, interrupt handling, file attachments.
  - `useNotesStore`: Notebooks, chapters, pages, blocks, attachments, and visual diagrams.
  - `useDiagramStudioStore`: Hand-crafted diagram canvas elements, pan/zoom, connectors, and smart guides.
  - `useMeetingStore`: Meeting items, types, Markdown agenda/notes, action items, tags, and calendar/timeline views.
- **Styling**: Tailwind CSS v4 + Vanilla CSS Tokens in `app/globals.css`.
- **Icons**: `lucide-react` (SVG icons, size-controlled, minimal) and `simple-icons` (brand and cloud architecture icons in Canvas Studio).
- **API & Data Layer**: tRPC client (`apps/web/trpc/`) with `@tanstack/react-query`.
- **Avatar System**: `@bible-strong/avatar-react` + `apps/web/components/ui/avatar-logo/`.

---

## 2. Design System & CSS Variables

All colors and core surfaces are driven by CSS variables in `apps/web/app/globals.css`, following a clean, high-contrast, editorial design standard:

| Token            | Light Theme (`.L`, `[data-theme="light"]`) | Dark / Black Theme (`.D`, `.dark`, `[data-theme="dark"]`) | Description                             |
| ---------------- | ------------------------------------------ | --------------------------------------------------------- | --------------------------------------- |
| `--bg`           | `#ffffff` (Canvas white)                   | `#101010` (Deep near-black)                               | Main background canvas surface          |
| `--s`            | `#f8f9fa` (Soft surface)                   | `#141414` (Elevated dark surface)                         | Sidebar & secondary containers          |
| `--surface-card` | `#f5f5f5` (Card background)                | `#18181b` (Dark card background)                          | Feature cards, modal surfaces & wells   |
| `--h`            | `#e5e7eb` (Hairline border)                | `#27272a` (Dark hairline border)                          | Subtle 1px borders & dividers           |
| `--i`            | `#111111` (Ink black)                      | `#ffffff` (Pure white)                                    | Display headings & high-contrast titles |
| `--b`            | `#374151` (Body charcoal)                  | `#d4d4d8` (Body light zinc)                               | Body & descriptive text                 |
| `--m`            | `#6b7280` (Muted gray)                     | `#a1a1aa` (Dark muted zinc)                               | Secondary captions, badges & icons      |
| `--p`            | `#111111` (Solid black)                    | `#ffffff` (Solid white)                                   | Primary interactive buttons & badges    |
| `--pt`           | `#ffffff` (Pure white)                     | `#111111` (Ink black)                                     | Primary button label text               |
| `--accent`       | `#3b82f6` (System blue)                    | `#3b82f6` (System blue)                                   | Informational badges & active accents   |

> [!IMPORTANT]
> **DARK & LIGHT MODE ACCESSIBILITY RULE**:
> **Every page, top-level layout, and major full-screen workspace view MUST provide an option to toggle between Dark Mode and Light Mode.**
>
> - **Shared Component**: Always use `<ThemeToggle darkMode={darkMode} onToggle={toggleTheme} />` from `@/components/ui/ThemeToggle`.
> - **State & Initialization**: Access `darkMode` and `toggleTheme` via `useUIStore()`. Every page, layout, or workspace root component must call `useInitUIStore()` to bind viewport listeners and synchronize theme with `localStorage` (`zuri-theme`) and system preference (`prefers-color-scheme`).
> - **Standard Placement Locations**:
>   - **Sidebar Footers**: Alongside trash/settings/profile actions (e.g. `Sidebar.tsx`, `NotesSidebar.tsx`).
>   - **Workspace & Editorial Headers**: In top-right action clusters (e.g. `NotesHeader.tsx`).
>   - **Standalone Layouts**: Top-right corner of viewport (e.g. `AuthLayout.tsx`).
>   - **Full-Screen Modals & Studios**: Top-right action headers (e.g. `DiagramModal.tsx`).

### Geometry & Component Primitives

- **Radii**:
  - Cards & Modals: `12px` to `16px` (`rounded-xl` / `rounded-2xl`).
  - Inputs & Standard Buttons: `8px` (`rounded-lg`).
  - Nav Pills & Status Badges: `9999px` (`rounded-full`).
- **Shadows**:
  - Soft diffused shadows only (`box-shadow: 0 1px 2px rgba(0,0,0,0.03)` or `0 1px 3px rgba(0,0,0,0.04)`).
  - No heavy, colored, or spread blur shadows.
- **Typography**:
  - Headings & Titles: Display weight 600 with tight negative letter-spacing (`tracking-[-0.035em]` to `tracking-[-0.025em]`).
  - Body & UI: Inter, 400-500 weight, standard spacing.
- **Segmented Nav Pill Groups**:
  - Container `.nav-pill-group`: `p-1 rounded-full bg-[var(--s)] border border-[var(--h)]`.
  - Item `.nav-pill-item`: `rounded-full text-xs font-semibold px-3.5 py-1.5`. Active pill takes `bg-[var(--p)] text-[var(--pt)] shadow-2xs`.
- **Badge Pills (`.badge-pill`)**:
  - Small status chips with `padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 500; border: 1px solid var(--h)`.
- **Focus Rings**:
  - Subtle 3px ring (`box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.08)` / dark: `rgba(255, 255, 255, 0.12)`).

### Mandatory Scrollbar Styling Standards

> [!IMPORTANT]
> **UNIVERSAL SCROLLBAR DESIGN MANDATE (ZERO EXCEPTIONS)**:
> **Default browser scrollbars are strictly forbidden anywhere in the user interface.**
> Wherever a scrollable container, list, drawer, modal, preformatted block, or panel can appear or have overflow (`overflow-y-auto`, `overflow-x-auto`, `overflow-auto`), the scrollbar **MUST** be explicitly styled using the design system's sleek hairline standards. Never leave any scrollbar unstyled or fallback to default clunky OS/browser scrollbars.

- **Available Styled Scrollbar Classes**:
  - `.styled-scrollbar`: General-purpose styled thin scrollbar (`width: 7px; height: 7px; border-radius: 9999px`) with theme-adaptive thumb (`#9ca3af` light, `#52525b` dark) and subtle hover feedback (`#6b7280` light, `#71717a` dark). Use for modals, popovers, virtualized grids, connector catalogs, and code/pre blocks.
  - `.notes-scrollbar` / `.notes-app`: Editorial workspace 6px hairline scrollbar (`scrollbar-width: thin; scrollbar-color: var(--h) transparent;`) with transparent track, rounded-full thumb styled with hairline token `var(--h)`, and smooth hover transition to muted token `var(--m)`.
  - `.habits-scrollbar` / `.habits-app`: Habit tracker and universal modern 6px scrollbar (`scrollbar-width: thin; scrollbar-color: var(--h) transparent;`) with transparent track and `var(--h)` / `var(--m)` hover transition.
  - `.sidebar-scrollbar`: Ultralight 5px minimalist scrollbar with transparent track and low-opacity thumb (`rgba(156, 163, 175, 0.4)` light, `rgba(161, 161, 170, 0.22)` dark) specifically tuned for long sidebar navigation lists.
  - `.habit-icon-scrollbar`: Compact 4px hairline scrollbar for tight popovers, dropdown lists, and icon pickers.
  - `.no-scrollbar`: Dedicated utility class when scrollbars must be completely hidden (`scrollbar-width: none !important; ::-webkit-scrollbar { display: none !important; }`).
- **Standard CSS Properties for Custom Overflow Containers**:
  - Always couple Firefox/standard properties with WebKit pseudo-elements:

    ```css
    /* Standard thin scrollbar with hairline tokens */
    scrollbar-width: thin;
    scrollbar-color: var(--h) transparent;

    /* WebKit / Chromium */
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background-color: var(--h);
      border-radius: 9999px;
      border: 1px solid transparent;
      background-clip: content-box;
      transition: background-color 0.15s ease;
    }
    &::-webkit-scrollbar-thumb:hover {
      background-color: var(--m);
    }
    ```

- **Dark and Light Theme Consistency**:
  - Never hardcode bright or un-themed scrollbar colors. All scrollbar thumbs and tracks must either adapt to `var(--h)` (border hairline) and `var(--m)` (muted zinc/gray) or supply explicit `.dark` / `[data-theme="dark"]` overrides matching the palette tokens.
  - Ensure contrast is clear yet unobtrusive across both canvas white (`#ffffff`) and deep dark (`#101010`) surfaces.
- **Rule of Thumb for Components**:
  - Whenever adding `overflow-y-auto`, `overflow-x-auto`, or `overflow-auto` in Tailwind, **always** append the appropriate scrollbar utility class (e.g. `className="overflow-y-auto styled-scrollbar ..."` or `className="overflow-y-auto notes-scrollbar ..."`).

---

## 3. Button Standards & Hover Animation Rules

> [!IMPORTANT]
> **HOVER ANIMATION RULE**:
> All button hover animations must be **SIMPLE and NEVER GLOWING**.
>
> - **DO NOT** add glowing `box-shadow` or colored halos (e.g., `box-shadow: 0 6px 20px ...`).
> - **DO NOT** add sweeping gradient shine animations (`@keyframes btn-shine` or `::after` light streaks).
> - **DO NOT** add `translateY(-1.5px)` lifting effects.
> - **DO** use clean, subtle background shade transitions and tactile active press feedback (`transform: scale(0.99)`).

### Button Classes:

1. **Primary Button (`.bt.p`, `.btn-signin`, `.btn-login`, `.btn-create-account`, `.btn-new-chat`)**:
   - **Light Theme**:
     - Base: Solid black background (`#111111`), White text (`#ffffff`), 8px border-radius, font-weight 600.
     - Hover: Soft dark gray background (`#27272a`), border `#27272a`, text `#ffffff`.
   - **Dark / Black Theme**:
     - Base: Solid white background (`#ffffff`), Dark text (`#111111`), 8px border-radius, font-weight 600.
     - Hover: Soft light gray background (`#e4e4e7`), border `#e4e4e7`, text `#111111`.
   - **Active State**: `transform: scale(0.99); opacity: 0.9;` (tactile press).
2. **Secondary Button (`.bt`)**:
   - Base: Border `1px solid var(--h)`, background `var(--bg)`, text `var(--i)`, 8px border-radius.
   - Hover: Background `var(--s)`, border-color `var(--m)`.
   - Active: `transform: scale(0.99);`.
3. **Icon Button (`.ib`)**:
   - Base: 36px circular button (`border-radius: 50%`), border `1px solid var(--h)`.
   - Hover: Background `var(--s)`, border-color `var(--m)`.
   - Active: `transform: scale(0.96);`.

---

## 4. Dropdown Select & Checklist Input Standards

> [!IMPORTANT]
> **UNIVERSAL FORM CONTROLS MANDATE (ZERO EXCEPTIONS)**:
> Default browser-native dropdown arrows, clunky native selects, and unstyled raw OS checkboxes are strictly forbidden. All dropdown select inputs and checklist toggles must be cleanly styled using the design system tokens (`var(--bg)`, `var(--s)`, `var(--h)`, `var(--i)`, `var(--p)`).

### A. Dropdown Select Inputs (`select`, `.select-input`)

- **Appearance & Arrow Reset**:
  - Reset default browser arrow via `appearance: none; -webkit-appearance: none;`.
  - Provide a clean, centered custom SVG chevron indicator positioned on the right using design tokens `var(--m)` or `var(--i)` (with `padding-right: 2.25rem`).
  - Base styling: `bg-[var(--bg)]` or `bg-[var(--s)]`, hairline border `1px solid var(--h)`, rounded 8px (`rounded-lg`), text `var(--i)` / `var(--b)`, font-weight 500.
- **Interactive Feedback**:
  - Hover: Subtle border contrast increase (`border-color: var(--m); bg-[var(--s)]`).
  - Focus: Clear hairline focus ring without default browser outline (`outline: none; border-color: var(--p); box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.08)` / dark: `rgba(255, 255, 255, 0.12)`).
- **Option Tags**:
  - `option` items must explicitly style `background-color: var(--surface-card)` or `var(--bg)` and `color: var(--i)` to prevent white-on-white or dark-on-dark browser rendering bugs.

### B. Checklist Inputs & Checkboxes (`input[type="checkbox"]`, `.checkbox-input`)

- **Appearance & Geometry**:
  - Compact, crisp 16px to 18px square dimensions with subtle 4px corner radius (`rounded-md` / `rounded`).
  - Base: `border: 1.5px solid var(--h); background-color: var(--bg); cursor: pointer;`.
- **Checked State**:
  - Solid high-contrast fill (`background-color: var(--p); border-color: var(--p); color: var(--pt);`).
  - Accent / Checkmark: High-contrast primary text token `var(--pt)` for the check indicator.
- **Checklist Container Items**:
  - Checklist groups must be wrapped in structured container panels with hairline separators (`divide-y divide-[var(--h)] border border-[var(--h)] rounded-xl`).
  - Checklist row labels must offer full-row pointer cursor, subtle hover highlights (`hover:bg-[var(--s)]`), and accessible keyboard focus.

---

## 5. UI & Layout Conventions

### Sidebar Chats & Hierarchy (`apps/web/components/chat/Sidebar.tsx`)

- **Pinned Conversations**:
  - Must remain at the **very top** of the conversation list.
  - **No partition line** (`border-t` divider) separating Pinned from chat groups.
  - Pinned items appear as clean bullet points without quotation marks (`“...”`).
- **Collapsible Dropdown Headings**:
  - All section headings (**Pinned**, **Today**, **Yesterday**, **Last 7 days**) are interactive collapsible dropdowns with a chevron (`ChevronDown`) that rotates when toggled.
  - Chats under each heading drop down as **bullet points** with a subtle bullet indicator dot (`w-1.5 h-1.5 rounded-full`) that highlights blue (`#3b82f6`) when hovered or active.
- **No Overarching "Previous Chats" Header**:
  - Headings should only be the category names (`Pinned`, `Today`, `Yesterday`, etc.).
- **No Emojis**:
  - Do not use emoji glyphs (e.g. 📌, 💬, 🤖). Use clean Lucide SVG icons and modern typography.
- **Notes & Docs Workspace Navigation**:
  - Dedicated workspace entry point with `BookOpen` icon leading to `/notes` ("Notes & Docs"), rendered in both expanded action cluster and collapsed icon dock with a clean "Workspace" badge pill.

### Notes & Documentation Workspace (`apps/web/components/notes/`)

- **Information Architecture**:
  - Full hierarchical workspace: Notebooks -> Chapters -> Pages -> Blocks.
  - Fractional indexing (`fractional-index.ts` with `sortByPosition` and `generatePositionBetween`) ensures $O(1)$ reordering, drag-and-drop operations, and inter-chapter page transfers without bulk database renumbering. Natural alphanumeric sorting (`localeCompare` with `numeric: true`) guarantees proper sequence ordering (e.g. `a2` before `a10`), with secondary creation timestamp (`createdAt`) tie-breaking when blocks share duplicate position values.
- **Sidebar Tree Navigation (`NotesSidebar.tsx`)**:
  - Collapsible tree view (`NotebookSelector.tsx`, `ChapterTreeItem.tsx`, `PageTreeItem.tsx`) with customizable Lucide icons via `IconPicker.tsx`.
  - Supports quick-add actions (+ Chapter, + Page), active page indicators, all-pages view toggle, and chapter-level asset drawer access.
  - Sidebar footer houses the trash lifecycle modal trigger, dark/light theme toggle, and desktop collapse controls.
- **Editorial Header (`NotesHeader.tsx`)**:
  - Path breadcrumbs with chapter dropdown navigation.
  - Quick action cluster: Move page modal (`MovePageModal.tsx`), chapter asset repository dock (`ChapterFileDock.tsx`), page attachments drawer (`AttachmentsDrawer.tsx`), global search trigger (`Cmd+K`), and page lifecycle actions (archive, pin, export).
- **Block-Based Document Editor (`BlockEditor.tsx`)**:
  - Modular, extensible block-based document editor supporting:
    - `text`: Rich text with inline formatting (bold, italic, underline, strikethrough, inline code, highlights, links, and inline math).
    - `heading_1`, `heading_2`, `heading_3`: Structured section headings with automatic anchors.
    - `bullet_list`, `numbered_list`, `todo_list`: Interactive checkbox lists and nested ordered/unordered items.
    - `code`: Multi-language code blocks with copy-to-clipboard actions and syntax highlighting.
    - `callout`: Highlighted informational boxes with customizable status icons and themes.
    - `divider`: Subtle hairline horizontal rules.
    - `image` & `bookmark`: Responsive image embedding and rich web URL link metadata previews with OpenGraph title/description/favicon fetching and in-place URL and metadata editing.
    - `table`: Full editable inline tables with row/column additions and header row toggles.
    - `page_link`: Internal documentation page reference cards featuring chapter-wise page selection, custom display title, editable caption note, and direct page navigation.
    - `file`: Chapter and page-level downloadable file attachment blocks.
  - **Block Content Normalization**: The editor dynamically normalizes block content from both backend queries and external agent tool calls via `extractRichText`, `normalizeBlockContent`, and `normalizeBlock` in `richTextUtils.ts`. Handles raw text span arrays (`[{ text: '...', type: 'text' }]`), objects without `richText` wrappers, JSON strings, and plain text, preventing null renders across block components. Server blocks arriving via `useNoteAutosave` are normalized on entry in `setPageBlocks`.
- **Command Palette & Formatting**:
  - **Slash Command Menu (`SlashCommandMenu.tsx`)**: Filterable keyboard-navigable command menu opened by typing `/` on an empty line to insert any block type or launch the diagram studio.
  - **Selection Formatting Toolbar (`BlockFormattingToolbar.tsx`)**: Floating contextual toolbar appearing on text selection for instant inline styling (bold, italic, code, underline, strikethrough, color highlights, link popover).
- **Hand-Crafted Diagram Studio (`DiagramModal.tsx`, `components/notes/diagrams/canvas-studio/`)**:
  - Infinite interactive architectural and workflow canvas with pan/zoom (0.1x to 8x), dot/line grid modes, smart alignment guides (`calculateSmartGuides`), and minimap overview.
  - Rich geometric shape primitives (rectangles, rounded cards, diamonds, cylinders, stickies, pills, callouts, frames, tables, sequence steps) alongside architecture brand icons (`simple-icons` + Lucide).
  - Smart arrow connectors with automatic orthogonal and curved routing, anchor point snapping, and `QuickAddPopover` for rapid flow charting.
- **Search & Asset Drawers**:
  - **Search Modal (`SearchModal.tsx`)**: Global full-text and title search modal across notebooks, chapters, pages, and block content with keyboard navigation (`Cmd+K` / `Ctrl+K`).
  - **Trash Modal (`TrashModal.tsx`)**: Soft-deletion lifecycle: archive, restore, and permanent deletion of pages and chapters.
  - **Chapter File Dock & Attachments Drawer (`ChapterFileDock.tsx`, `AttachmentsDrawer.tsx`)**: Centralized lateral slide-out drawers managing chapter-level assets and page attachments, supporting drag-and-drop Cloudinary direct uploads, deduplication, opening files in a new tab, copy storage keys, and downloads.

### Avatar & Graphic Logo Guidelines (`apps/web/components/ui/avatar-logo/`)

- `ZuriAvatar` uses `@bible-strong/avatar-react` and references `zuri.avatar.json`.
- **Client-Side Only**: Because avatar libraries access browser-only APIs (`window`, `useLayoutEffect`, `requestAnimationFrame`), `ZuriAvatar` must **always** be dynamically imported with `ssr: false` and render a `Skeleton` fallback during SSR.
- Server bundling: `next.config.js` specifies `serverExternalPackages: ["ajv", "@bible-strong/avatar-core"]`. Never remove these.
- **DO NOT TOUCH ZURI AVATAR**: Agents must never modify `apps/web/components/ui/avatar-logo/ZuriAvatar.tsx` or avatar rendering logic inside `ZuriAvatar`. The avatar component remains completely preserved during styling and layout overhauls.

### Component Decomposition & Granularity

- **Break UI into Small Components**: Break complex UI views, modals, and sections into small, focused, single-responsibility components (e.g., separate headers, tab bars, list items, and form cards).
- **Avoid Monolithic Files**: Do not build monolithic, excessively large component files. Extract self-contained visual elements and sub-sections into dedicated sub-components.
- **Clean Props & Reusability**: Ensure each extracted sub-component has clear, strictly typed props and delegates actions cleanly via callbacks or custom hooks for maximum maintainability.
- **AI Message Formatting (`MarkdownContent.tsx` & `.markdown-content`)**: All AI assistant messages must be rendered via `MarkdownContent` (`react-markdown` + `remark-gfm`) rather than raw text. Automatically formats bold/italics, inline code, links (`target="_blank" rel="noopener noreferrer"`), headers, lists, tables, and fenced code blocks with language indicators and copy buttons. Empty messages (`m.content !== ""`) are filtered out in `ChatInterface.tsx` to prevent blank bubbles during streaming or tool call cycles.

---

## 5. State Management & Hooks

> [!IMPORTANT]
> **STRICT ZUSTAND STORE LOCATION RULE (ZERO EXCEPTIONS)**:
> **EVERY Zustand store in `apps/web` MUST be located directly inside `apps/web/store/` without exception.**
>
> - **Current Stores**: `uiStore.ts`, `userInfoStore.ts`, `agentStore.ts`, `notesStore.ts`, `diagramStudioStore.ts`, `habitStore.ts`, and `expenseStore.ts`.
> - **ABSOLUTELY NO STORES OUTSIDE `apps/web/store/`**: Feature directories and component folders (e.g. `components/notes/`, `components/notes/diagrams/canvas-studio/`, etc.) must **NEVER** contain store files. All state stores must live strictly in `apps/web/store/`.
> - **Index Export**: Every store must be exported from `apps/web/store/index.ts` and imported across the app via `@/store/<storeName>` or `@/store`.
> - **Naming Standard**: All stores follow the `<feature>Store.ts` file naming convention with corresponding `use<Feature>Store` hook export.

- **UI Store (`apps/web/store/uiStore.ts`)**:
  - Use `useInitUIStore()` in top-level pages and workspace roots (`app/page.tsx`, `NotesWorkspace.tsx`, `AuthLayout.tsx`) to bind viewport change listeners and theme synchronization.
  - Access `darkMode`, `isMobile`, `sidebarOpen`, `sidebarCollapsed`, and `toggleTheme` via `useUIStore`. Every page must provide an accessible theme toggle using `ThemeToggle`.
- **Agent Store (`apps/web/store/agentStore.ts`) & Streaming (`apps/web/hook/agent/useAgent.ts`)**:
  - `appendAssistantChunk(chunk)` appends in-flight token chunks received over WebSocket `"stream"` event.
  - `appendAssistantMessage(content)` synchronizes the final completion message on `"done"`.
  - `attachedFiles`: Tracks in-flight and uploaded attachments (`id`, `name`, `url`, `size`, `status`).
  - In `useAgent`, conversation IDs are pre-bound so the socket room is joined prior to mutation dispatch, preventing initial token drop. `send(message, fileUrls)` dispatches message and attachment URLs to `trpc.agent.runChatAgent`.
- **Notes Store (`apps/web/store/notesStore.ts`) & Notes Hooks (`apps/web/hook/notes/`)**:
  - `useNotesStore` manages the complete notes workspace hierarchy: notebooks, chapters, pages, blocks, attachments, and visual diagrams with zero mock data.
  - Manages fractional index ordering (`sortByPosition`, `generatePositionBetween`), active views (`"page"` | `"all-pages"`), full-text search scope, trash lifecycle (archive/restore/delete permanently), save status (`"idle" | "unsaved" | "saving" | "saved" | "error"`), and chapter file dock modals.
  - `useNotes`: Coordinates workspace loading via `trpc.notes.getWorkspace` (auto-seeding an initial notebook if empty) and provides typed mutation methods for notebooks, chapters, and pages.
  - `useNoteAutosave`: Automatically queries blocks and diagrams for `activePageId`, detects local changes to title, summary, or blocks, and executes dual-stage batch autosave via `trpc.notes.autosavePage`: an **Idle Debounce** (1.5s, 1 to 2s window) that resets with keystrokes to prevent saving mid-word or overloading the backend, and a **Max-Wait Throttle** (6s, 5 to 10s window) that guarantees continuous non-stop typing is persisted without data loss, plus automatic flush on navigation or `beforeunload`. Client blocks are the authoritative in-flight state and are never overwritten on autosave success, preventing cursor reset or component reloads while typing. Server blocks are synchronized on initial page load, when current local blocks are only empty placeholders, or when the active page in store has zero blocks while server records exist.
  - `useChapterFileDock`: Manages chapter file dock queries and Cloudinary file uploads integrated into database `file_dock_files`. Creates `file_docks` records on demand only when a user uploads a file using the chapter's name and links it to `chapters.fileDockId` without creating folder scaffolding. Provides `getPreviewType` and `openFileInNewTab` helpers to support in-website modal previews for images, videos, and PDFs, and tab-links for other asset types without exposing internal infrastructure storage keys.
  - `useNotesSearch`: Powers fast GIN/trigram full-text search across titles and block contents via `trpc.notes.searchNotes` and trash management via `trpc.notes.getTrash`.
  - Persists state with Zustand `persist` middleware and must always be imported via `@/store/notesStore` (or `@/store`), never from component folders.
- **Diagram Studio Store (`apps/web/store/diagramStudioStore.ts`)**:
  - `useDiagramStudioStore` manages canvas state for the diagram canvas: element tree, multi-element selection, pan (`panX`, `panY`), zoom, grid modes (`dots`, `lines`), smart guide alignment calculations (`calculateSmartGuides`), anchor snap targets, and connector routing.
  - Located strictly in `apps/web/store/diagramStudioStore.ts` and exported via `@/store/diagramStudioStore` and `@/store/index.ts`.
- **Habit Tracker Store (`apps/web/store/habitStore.ts`) & Habit Hooks (`apps/web/hook/habits/`)**:
  - `useHabitStore` manages habit records, daily check-in histories, numeric target progression, negative clean counters, habit stacking routines, and streak freezes with local storage persistence.
  - Located strictly in `apps/web/store/habitStore.ts` and exported via `@/store/habitStore` and `@/store/index.ts`.
  - `useHabits`: Coordinates habit workspace synchronization via `trpc.habits.getWorkspace`, providing typed optimistic local mutations and backend persistence for habits, daily check-ins, numeric counters, streak freezes, and routine stacks.
  - **Hook-First Data Access Rule (Zero Exceptions)**: When custom hooks are created for a feature domain (such as `useHabits` in `apps/web/hook/habits/`), all components must consume data and dispatch mutations exclusively through the domain hook — never reading or mutating entity data directly from local storage, in-memory state, or raw store entity collections. Zustand stores in persistent domains must only persist UI preferences/session state (e.g. `selectedDate`, `activeFilter`, `activeTab`, `viewMode`) via `partialize`, while entity data and operations flow through dedicated hooks.
- **Personal Expenses & Debt Ledger Store (`apps/web/store/expenseStore.ts`) & Expenses Hooks (`apps/web/hook/expenses/`)**:
  - `useExpenseStore` manages cash flow transactions, payment accounts, monthly budgets, debt ledger IOU records, partial repayments, bill splits, and group simplified debts.
  - Located strictly in `apps/web/store/expenseStore.ts` and exported via `@/store/expenseStore` and `@/store/index.ts`.
  - `useExpenses`: Coordinates expense workspace synchronization via `trpc.expenses.getWorkspace` and provides optimistic local mutations with full tRPC backend persistence for all transactions, debt entries, accounts, budgets, and bill splits.
- **Meetings Tracker Store (`apps/web/store/meetingStore.ts`) & Meetings Hooks (`apps/web/hook/meetings/`)**:
  - `useMeetingStore` manages UI preferences (`activeTab`, `filters`) via `partialize` and hydrated meeting items with zero mock data.
  - Located strictly in `apps/web/store/meetingStore.ts` and exported via `@/store/meetingStore` and `@/store/index.ts`.
  - `useMeetings`: Coordinates meeting workspace synchronization via `trpc.meetings.getWorkspace`, providing optimistic local updates and full tRPC backend persistence for meetings, attendees, reminders, and action items. All meeting components consume data exclusively through `useMeetings`.
- **RAG & File Upload Flow (`apps/web/hook/agent/useAgentUpload.ts`, `apps/web/hook/uploads/useCloudinaryUpload.ts`, `apps/web/lib/youtube.ts`)**:
  - `useAgentUpload` coordinates file selection, uploads files to Cloudinary via `useCloudinaryUpload`, and synchronizes attachment states in `useAgentStore`.
  - YouTube video links can be pasted into the chat composer, attached via the YouTube link button, or pasted within query text. YouTube transcripts are ingested as timestamped RAG documents.
  - Uploaded Cloudinary URLs and YouTube video URLs are passed alongside user queries to trigger background document ingestion and RAG routing.
- **Memory System (`apps/web/hook/agent/useUserMemories.ts`, `apps/web/components/chat/MemoryModal.tsx`)**:
  - `staleTime: 0` ensures memory data is always treated as fresh when fetched.
  - `MemoryModal` refetches automatically via `useEffect` whenever `isOpen` transitions to `true`.
  - In `useAgent`, `utils.agent.getUserMemories.invalidate()` is called when agent responses complete (`"done"`).
- **Toolkit Connectors & User Connections (`apps/web/hook/agent/useToolkits.ts`, `apps/web/hook/agent/useUserConnections.ts`, `apps/web/components/chat/ConnectorsModal.tsx`)**:
  - `useToolkits` fetches available Composio toolkits via `trpc.agent.getAvailableToolkits` with infinite query cursor pagination.
  - `useUserConnections` manages user's active third-party connections (`getUserConnectedAccounts`) with 24-hr cache synchronization matching Redis, and coordinates OAuth popup flows via `initiateToolkitConnection`, `disconnectToolkit`, and `checkToolkitConnectionStatus`.
  - `ConnectorsModal` virtualizes the responsive card grid with `@tanstack/react-virtual` and CSS `content-visibility: auto` to prevent DOM bloat across 1,600+ toolkits, provides real-time search, category filtering (including a dedicated "Connected" view), live connect/disconnect action buttons, and styled scrollbars.
- **Human-in-the-Loop Interrupts (`apps/web/components/chat/AgentInterruptCard.tsx`, `useAgent.ts`)**:
  - `useAgentStore` supports `"interrupted"` status and `AgentInterrupt` payloads (`type: "connection" | "approval"`).
  - When missing toolkits or sensitive actions are detected, the agent interrupts execution and displays `AgentInterruptCard`.
  - For connection interrupts, `AgentInterruptCard` displays OAuth redirect links, listens for automated Composio webhooks via socket `"connection_success"`, and provides manual "I've Connected, Continue" and "Cancel / Deny" actions invoking `resume(resumeValue)`.
  - For action approvals (e.g. sensitive tool calls, HLD reviews), tool calls are decomposed into `ApprovalCallItem` with strict horizontal containment (`min-w-0 max-w-full overflow-hidden`, `whitespace-pre-wrap break-all sm:break-words`, and `.styled-scrollbar`), preventing x-axis overflow during large AI payload displays while providing a quick parameters copy action.
- **User Store (`apps/web/store/userInfoStore.ts`)**:
  - Never hardcode usernames (like `"alex"`). Pull `fullName`, `username`, or `email` from `useUserInfoStore()`.

---

## 6. TypeScript & Code Standards

- **Strict Mode**: Ensure zero compile errors with `pnpm --filter web exec tsc --noEmit`.
- **Path Aliases**: Always use `@/...` to import local files from `apps/web/` (e.g. `@/components/chat`, `@/store/uiStore`).
- **Store Architecture**: All Zustand stores must be located strictly in `apps/web/store/` (`uiStore.ts`, `userInfoStore.ts`, `agentStore.ts`, `notesStore.ts`, `diagramStudioStore.ts`). Feature and component directories must never contain any store files or store subfolders under any circumstances.
- **Client Components**: Any file using React hooks (`useState`, `useEffect`, `useRef`), event handlers, or browser APIs must have `"use client";` as the very first line.
- **Component Granularity**: Break complex UI views into small, focused sub-components rather than writing large, monolithic single-file components.
- **Linting**: Keep code clean, free of unused imports, and avoid inline styles where design system variables/classes exist.

---

## 7. Comments & Utility Functions

- **Comment Style**:
  - All comments must follow a clean, single-line format: `// <Comment>` (e.g. `// Hook`, `// Check nested result object`, `// Check direct output / message properties`).
  - No extra or verbose comments. Avoid decorative divider banners (`// ──── ... ────`) and multi-line JSDocs.
- **Utility Functions**:
  - All utility and helper functions must be placed in utility files (e.g. `@/lib/utils.ts`), not defined directly inside hooks or UI components.
