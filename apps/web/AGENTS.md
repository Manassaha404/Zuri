# Agent Guidelines for `apps/web`

This document defines the architectural patterns, code style, UI standards, and design system rules for AI coding agents working inside `apps/web`.

---

## 1. Project Overview & Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript (strict mode, `@/*` path aliases pointing to `apps/web/*`)
- **State Management**: Zustand stores in `apps/web/store/`
  - `useUIStore`: Theme, responsive layout (`isMobile`), sidebar open/collapsed state.
  - `useUserInfoStore`: Dynamic user credentials, profile name, username, email.
- **Styling**: Tailwind CSS v4 + Vanilla CSS Tokens in `app/globals.css`.
- **Icons**: `lucide-react` (SVG icons, size-controlled, minimal).
- **API & Data Layer**: tRPC client (`apps/web/trpc/`) with `@tanstack/react-query`.
- **Avatar System**: `@bible-strong/avatar-react` + `apps/web/components/ui/avatar-logo/`.

---

## 2. Design System & CSS Variables

All colors and core surfaces are driven by CSS variables in `apps/web/app/globals.css`:

| Token      | Light Theme (`.L`, `[data-theme="light"]`) | Dark / Black Theme (`.D`, `.dark`, `[data-theme="dark"]`) | Description                     |
| ---------- | ------------------------------------------ | --------------------------------------------------------- | ------------------------------- |
| `--bg`     | `#ffffff`                                  | `#1a1a1a`                                                 | Main background surface         |
| `--s`      | `#f5f5f5`                                  | `#101010`                                                 | Secondary / Sidebar background  |
| `--h`      | `#d9dce1`                                  | `#333333`                                                 | Border, hairline, divider color |
| `--i`      | `#111111`                                  | `#ffffff`                                                 | Primary text & headings         |
| `--b`      | `#374151`                                  | `#d4d4d8`                                                 | Secondary body text             |
| `--m`      | `#5b6270`                                  | `#a1a1aa`                                                 | Muted captions & subheadings    |
| `--p`      | `#111111`                                  | `#ffffff`                                                 | Primary button background       |
| `--pt`     | `#ffffff`                                  | `#111111`                                                 | Primary button text             |
| `--accent` | `#3b82f6`                                  | `#3b82f6`                                                 | Brand blue accent               |

---

## 3. Button Standards & Hover Animation Rules

> [!IMPORTANT]
> **HOVER ANIMATION RULE**:
> All button hover animations must be **SIMPLE and NEVER GLOWING**.
>
> - **DO NOT** add glowing `box-shadow` or colored halos (e.g., `box-shadow: 0 6px 20px ...`).
> - **DO NOT** add sweeping gradient shine animations (`@keyframes btn-shine` or `::after` light streaks).
> - **DO NOT** add `translateY(-1.5px)` lifting effects.
> - **DO** use clean, subtle background shade transitions and tactile active press feedback.

### Button Classes:

1. **Primary Button (`.bt.p`, `.btn-signin`, `.btn-login`, `.btn-create-account`, `.btn-new-chat`)**:
   - **Light Theme**:
     - Base: Black background (`#111111`), White text (`#ffffff`).
     - Hover: Soft dark gray background (`#27272a`), border `#27272a`, text `#ffffff`.
   - **Dark / Black Theme**:
     - Base: White background (`#ffffff`), Dark text (`#111111`).
     - Hover: Soft light gray background (`#e4e4e7`), border `#e4e4e7`, text `#111111`.
   - **Active State**: `transform: scale(0.99); opacity: 0.9;` (smooth press).
2. **Secondary Button (`.bt`)**:
   - Base: Border `1px solid var(--h)`, background `var(--bg)`, text `var(--i)`.
   - Hover: Background `var(--s)`.
   - Active: `transform: scale(0.99);`.
3. **Icon Button (`.ib`)**:
   - Base: 36px circular button (`border-radius: 50%`), border `var(--h)`.
   - Hover: Background `var(--s)`.
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

### Avatar & Graphic Logo Guidelines (`apps/web/components/ui/avatar-logo/`)

- `ZuriAvatar` uses `@bible-strong/avatar-react` and references `zuri.avatar.json`.
- **Client-Side Only**: Because avatar libraries access browser-only APIs (`window`, `useLayoutEffect`, `requestAnimationFrame`), `ZuriAvatar` must **always** be dynamically imported with `ssr: false` and render a `Skeleton` fallback during SSR.
- Server bundling: `next.config.js` specifies `serverExternalPackages: ["ajv", "@bible-strong/avatar-core"]`. Never remove these.

---

## 5. State Management & Hooks

- **UI Store (`apps/web/store/uiStore.ts`)**:
  - Use `useInitUIStore()` in top-level pages (`app/page.tsx`) to bind viewport change listeners and theme synchronization.
  - Access `darkMode`, `isMobile`, `sidebarOpen`, `sidebarCollapsed`, and `toggleTheme` via `useUIStore`.
- **User Store (`apps/web/store/userInfoStore.ts`)**:
  - Never hardcode usernames (like `"alex"`). Pull `fullName`, `username`, or `email` from `useUserInfoStore()`.

---

## 6. TypeScript & Code Standards

- **Strict Mode**: Ensure zero compile errors with `pnpm --filter web exec tsc --noEmit`.
- **Path Aliases**: Always use `@/...` to import local files from `apps/web/` (e.g. `@/components/chat`, `@/store/uiStore`).
- **Client Components**: Any file using React hooks (`useState`, `useEffect`, `useRef`), event handlers, or browser APIs must have `"use client";` as the very first line.
- **Linting**: Keep code clean, free of unused imports, and avoid inline styles where design system variables/classes exist.
