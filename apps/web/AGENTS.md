# Agent Guidelines for `apps/web`

This document defines the architectural patterns, code style, UI standards, and design system rules for AI coding agents working inside `apps/web`.

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
- **Styling**: Tailwind CSS v4 + Vanilla CSS Tokens in `app/globals.css`.
- **Icons**: `lucide-react` (SVG icons, size-controlled, minimal) and `simple-icons` (brand and cloud architecture icons in Canvas Studio).
- **API & Data Layer**: tRPC client (`apps/web/trpc/`) with `@tanstack/react-query`.
- **Avatar System**: `@bible-strong/avatar-react` + `apps/web/components/ui/avatar-logo/`.

---

## 2. Design System & CSS Variables (Cal.com Standard)

All colors and core surfaces are driven by CSS variables in `apps/web/app/globals.css`, following Cal.com's clean, high-contrast, editorial design standard:

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

### Cal.com Geometry & Component Primitives

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
- **Notes Sleek Scrollbars (`.notes-app`, `.notes-scrollbar`)**:
  - 6px hairline scrollbar with transparent track, rounded-full thumb styled with `var(--h)`, and subtle hover transition to `var(--m)` for minimal distraction across editorial and canvas surfaces.

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

## 4. UI & Layout Conventions

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
  - Full Notion/Craft-style hierarchical workspace: Notebooks -> Chapters -> Pages -> Blocks.
  - Fractional indexing (`fractional-index.ts` with `sortByPosition` and `generatePositionBetween`) ensures $O(1)$ reordering, drag-and-drop operations, and inter-chapter page transfers without bulk database renumbering.
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
    - `image` & `bookmark`: Responsive image embedding and rich web URL link metadata previews.
    - `table`: Full editable inline tables with row/column additions and header row toggles.
    - `page_link`: Inline references to other documentation pages with direct navigation.
    - `file`: Chapter and page-level downloadable file attachment blocks.
- **Command Palette & Formatting**:
  - **Slash Command Menu (`SlashCommandMenu.tsx`)**: Filterable keyboard-navigable command menu opened by typing `/` on an empty line to insert any block type or launch the diagram studio.
  - **Selection Formatting Toolbar (`BlockFormattingToolbar.tsx`)**: Floating contextual toolbar appearing on text selection for instant inline styling (bold, italic, code, underline, strikethrough, color highlights, link popover).
- **Eraser-Grade Hand-Crafted Diagram Studio (`DiagramModal.tsx`, `components/notes/diagrams/canvas-studio/`)**:
  - Infinite interactive architectural and workflow canvas with pan/zoom (0.1x to 8x), dot/line grid modes, smart alignment guides (`calculateSmartGuides`), and minimap overview.
  - Rich geometric shape primitives (rectangles, rounded cards, diamonds, cylinders, stickies, pills, callouts, frames, tables, sequence steps) alongside architecture brand icons (`simple-icons` + Lucide).
  - Smart arrow connectors with automatic orthogonal and curved routing, anchor point snapping, and `QuickAddPopover` for rapid flow charting.
- **Search & Asset Drawers**:
  - **Search Modal (`SearchModal.tsx`)**: Global full-text and title search modal across notebooks, chapters, pages, and block content with keyboard navigation (`Cmd+K` / `Ctrl+K`).
  - **Trash Modal (`TrashModal.tsx`)**: Soft-deletion lifecycle: archive, restore, and permanent deletion of pages and chapters.
  - **Chapter File Dock & Attachments Drawer (`ChapterFileDock.tsx`, `AttachmentsDrawer.tsx`)**: Centralized lateral slide-out drawers managing chapter-level assets and page attachments.

### Avatar & Graphic Logo Guidelines (`apps/web/components/ui/avatar-logo/`)

- `ZuriAvatar` uses `@bible-strong/avatar-react` and references `zuri.avatar.json`.
- **Client-Side Only**: Because avatar libraries access browser-only APIs (`window`, `useLayoutEffect`, `requestAnimationFrame`), `ZuriAvatar` must **always** be dynamically imported with `ssr: false` and render a `Skeleton` fallback during SSR.
- Server bundling: `next.config.js` specifies `serverExternalPackages: ["ajv", "@bible-strong/avatar-core"]`. Never remove these.
- **DO NOT TOUCH ZURI AVATAR**: Agents must never modify `apps/web/components/ui/avatar-logo/ZuriAvatar.tsx` or avatar rendering logic inside `ZuriAvatar`. The avatar component remains completely preserved during styling and layout overhauls.

### Component Decomposition & Granularity

- **Break UI into Small Components**: Break complex UI views, modals, and sections into small, focused, single-responsibility components (e.g., separate headers, tab bars, list items, and form cards).
- **Avoid Monolithic Files**: Do not build monolithic, excessively large component files. Extract self-contained visual elements and sub-sections into dedicated sub-components.
- **Clean Props & Reusability**: Ensure each extracted sub-component has clear, strictly typed props and delegates actions cleanly via callbacks or custom hooks for maximum maintainability.
- **AI Message Formatting (`MarkdownContent.tsx` & `.markdown-content`)**: All AI assistant messages must be rendered via `MarkdownContent` (`react-markdown` + `remark-gfm`) rather than raw text. Automatically formats bold/italics, inline code, links (`target="_blank" rel="noopener noreferrer"`), headers, lists, tables, and fenced code blocks with language indicators and copy buttons.

---

## 5. State Management & Hooks

> [!IMPORTANT]
> **STRICT ZUSTAND STORE LOCATION RULE (ZERO EXCEPTIONS)**:
> **EVERY Zustand store in `apps/web` MUST be located directly inside `apps/web/store/` without exception.**
>
> - **Current Stores**: `uiStore.ts`, `userInfoStore.ts`, `agentStore.ts`, `notesStore.ts`, and `diagramStudioStore.ts`.
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
- **Notes Store (`apps/web/store/notesStore.ts`)**:
  - `useNotesStore` manages the complete notes workspace hierarchy: notebooks, chapters, pages, blocks, attachments, and visual diagrams.
  - Manages fractional index ordering (`sortByPosition`, `generatePositionBetween`), active views (`"page"` | `"all-pages"`), full-text search scope, trash lifecycle (archive/restore/delete permanently), and chapter file dock modals.
  - Persists state with Zustand `persist` middleware and must always be imported via `@/store/notesStore` (or `@/store`), never from component folders.
- **Diagram Studio Store (`apps/web/store/diagramStudioStore.ts`)**:
  - `useDiagramStudioStore` manages canvas state for the Eraser-grade diagram canvas: element tree, multi-element selection, pan (`panX`, `panY`), zoom, grid modes (`dots`, `lines`), smart guide alignment calculations (`calculateSmartGuides`), anchor snap targets, and connector routing.
  - Located strictly in `apps/web/store/diagramStudioStore.ts` and exported via `@/store/diagramStudioStore` and `@/store/index.ts`.
- **RAG & File Upload Flow (`apps/web/hook/agent/useAgentUpload.ts`, `apps/web/hook/uploads/useCloudinaryUpload.ts`)**:
  - `useAgentUpload` coordinates file selection, uploads files to Cloudinary via `useCloudinaryUpload`, and synchronizes attachment states in `useAgentStore`.
  - Uploaded Cloudinary URLs are passed alongside user queries to trigger background document ingestion and RAG routing.
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
