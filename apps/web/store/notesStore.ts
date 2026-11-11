// Zustand store managing state for notes, chapters, pages, blocks, attachments & diagrams
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Notebook,
  Chapter,
  Page,
  Block,
  Attachment,
  Diagram,
  PageLink,
  BlockContent,
  BlockType,
} from "@/components/notes/types";
import {
  MOCK_NOTEBOOKS,
  MOCK_CHAPTERS,
  MOCK_PAGES,
  MOCK_BLOCKS,
  MOCK_ATTACHMENTS,
  MOCK_DIAGRAMS,
  MOCK_PAGE_LINKS,
} from "@/components/notes/mock-data";
import {
  generatePositionBetween,
  sortByPosition,
} from "@/components/notes/utils/fractional-index";

export interface NotesState {
  notebooks: Notebook[];
  chapters: Chapter[];
  pages: Page[];
  blocks: Block[];
  attachments: Attachment[];
  diagrams: Diagram[];
  pageLinks: PageLink[];

  activeNotebookId: string;
  activeChapterId: string | null;
  activePageId: string | null;
  activeView: "page" | "all-pages";

  // Modals & Drawers
  isSearchOpen: boolean;
  searchNotebookScope: string | null;
  isTrashOpen: boolean;
  isAttachmentsOpen: boolean;
  isChapterFileDockOpen: boolean;
  activeChapterFileDockId: string | null;
  isMovePageOpen: boolean;
  targetMovePageId: string | null;
  isNotebookModalOpen: boolean;
  editingNotebook: Notebook | null;
  isChapterModalOpen: boolean;
  editingChapter: Chapter | null;
  isDiagramModalOpen: boolean;
  activeDiagramId: string | null;

  // Actions - Navigation
  setActiveNotebook: (notebookId: string) => void;
  setActiveChapter: (chapterId: string | null) => void;
  setActivePage: (pageId: string | null) => void;
  setActiveView: (view: "page" | "all-pages") => void;

  // Actions - Notebooks
  createNotebook: (data: Partial<Notebook>) => void;
  updateNotebook: (id: string, data: Partial<Notebook>) => void;
  archiveNotebook: (id: string) => void;
  restoreNotebook: (id: string) => void;
  deleteNotebookPermanently: (id: string) => void;
  reorderNotebook: (id: string, newPosition: string) => void;

  // Actions - Chapters
  createChapter: (data: Partial<Chapter>) => void;
  updateChapter: (id: string, data: Partial<Chapter>) => void;
  toggleFavoriteChapter: (id: string) => void;
  archiveChapter: (id: string) => void;
  restoreChapter: (id: string) => void;
  deleteChapterPermanently: (id: string) => void;
  reorderChapter: (id: string, newPosition: string) => void;

  // Actions - Pages
  createPage: (notebookId: string, chapterId: string, title?: string) => string;
  updatePageTitle: (pageId: string, title: string) => void;
  updatePageSummary: (pageId: string, summary: string) => void;
  togglePinPage: (pageId: string) => void;
  movePage: (
    pageId: string,
    targetNotebookId: string,
    targetChapterId: string,
  ) => void;
  archivePage: (pageId: string) => void;
  restorePage: (pageId: string) => void;
  deletePagePermanently: (pageId: string) => void;
  reorderPage: (pageId: string, newPosition: string) => void;

  // Actions - Blocks
  focusedBlockId: string | null;
  setFocusedBlockId: (blockId: string | null) => void;
  addBlock: (
    pageId: string,
    type: BlockType,
    afterBlockId?: string,
    parentBlockId?: string | null,
  ) => string;
  updateBlockContent: (blockId: string, content: BlockContent) => void;
  deleteBlock: (blockId: string) => void;
  reorderBlock: (blockId: string, newPosition: string) => void;
  moveBlock: (blockId: string, direction: "up" | "down") => void;
  toggleTodoBlock: (blockId: string) => void;
  indentBlock: (blockId: string, parentBlockId: string) => void;
  outdentBlock: (blockId: string) => void;
  convertBlockType: (blockId: string, newType: BlockType) => void;

  // Actions - Attachments
  addAttachment: (
    attachment: Omit<Attachment, "id" | "createdAt">,
  ) => Attachment;
  deleteAttachment: (id: string) => void;

  // Actions - Diagrams
  createDiagram: (pageId: string, data: Partial<Diagram>) => Diagram;
  updateDiagram: (id: string, data: Partial<Diagram>) => void;
  deleteDiagram: (id: string) => void;

  // Modals management
  openSearch: (scope?: string) => void;
  closeSearch: () => void;
  openTrash: () => void;
  closeTrash: () => void;
  openAttachments: () => void;
  closeAttachments: () => void;
  openChapterFileDock: (chapterId: string) => void;
  closeChapterFileDock: () => void;
  openMovePage: (pageId: string) => void;
  closeMovePage: () => void;
  openNotebookModal: (notebook?: Notebook) => void;
  closeNotebookModal: () => void;
  openChapterModal: (chapter?: Chapter) => void;
  closeChapterModal: () => void;
  openDiagramModal: (diagramId?: string) => void;
  openPageDiagram: (pageId: string) => void;
  closeDiagramModal: () => void;
  resetToDefaultData: () => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notebooks: MOCK_NOTEBOOKS,
      chapters: MOCK_CHAPTERS,
      pages: MOCK_PAGES,
      blocks: MOCK_BLOCKS,
      attachments: MOCK_ATTACHMENTS,
      diagrams: MOCK_DIAGRAMS,
      pageLinks: MOCK_PAGE_LINKS,

      activeNotebookId: "nb-eng-001",
      activeChapterId: "ch-db-02",
      activePageId: "pg-notes-db-design",
      activeView: "page",

      isSearchOpen: false,
      searchNotebookScope: null,
      isTrashOpen: false,
      isAttachmentsOpen: false,
      isChapterFileDockOpen: false,
      activeChapterFileDockId: null,
      isMovePageOpen: false,
      targetMovePageId: null,
      isNotebookModalOpen: false,
      editingNotebook: null,
      isChapterModalOpen: false,
      editingChapter: null,
      isDiagramModalOpen: false,
      activeDiagramId: null,
      focusedBlockId: null,

      setFocusedBlockId: (blockId) => set({ focusedBlockId: blockId }),

      setActiveNotebook: (notebookId) => {
        const { chapters, pages } = get();
        const nbChapters = chapters.filter(
          (c) => c.notebookId === notebookId && !c.isArchived,
        );
        const firstChapter = nbChapters[0];
        const firstPage = pages.find(
          (p) => p.notebookId === notebookId && !p.isArchived,
        );

        set({
          activeNotebookId: notebookId,
          activeChapterId: firstChapter ? firstChapter.chapterId : null,
          activePageId: firstPage ? firstPage.pageId : null,
          activeView: "page",
        });
      },

      setActiveChapter: (chapterId) => {
        const { pages, activeNotebookId } = get();
        if (!chapterId) {
          set({ activeChapterId: null });
          return;
        }
        const chapterPages = pages.filter(
          (p) => p.chapterId === chapterId && !p.isArchived,
        );
        const firstPage = chapterPages[0];
        set({
          activeChapterId: chapterId,
          activePageId: firstPage ? firstPage.pageId : get().activePageId,
          activeView: "page",
        });
      },

      setActivePage: (pageId) => {
        if (!pageId) {
          set({ activePageId: null });
          return;
        }
        const page = get().pages.find((p) => p.pageId === pageId);
        if (page) {
          set({
            activePageId: pageId,
            activeChapterId: page.chapterId,
            activeNotebookId: page.notebookId,
            activeView: "page",
          });
        }
      },

      setActiveView: (view) => set({ activeView: view }),

      // Notebooks
      createNotebook: (data) => {
        const { notebooks } = get();
        const sorted = sortByPosition(notebooks);
        const lastPos = sorted.length
          ? sorted[sorted.length - 1]?.position
          : null;
        const newPos = generatePositionBetween(lastPos, null);

        const newNb: Notebook = {
          notebookId: `nb-${Date.now()}`,
          userId: "usr-001",
          title: data.title || "Untitled Notebook",
          icon: data.icon || "BookOpen",
          color: data.color || "#3b82f6",
          coverAttachmentId: data.coverAttachmentId || null,
          coverUrl: data.coverUrl,
          position: newPos,
          isArchived: false,
          archivedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data,
        };

        set({
          notebooks: [...notebooks, newNb],
          activeNotebookId: newNb.notebookId,
        });
      },

      updateNotebook: (id, data) => {
        set((state) => ({
          notebooks: state.notebooks.map((nb) =>
            nb.notebookId === id
              ? { ...nb, ...data, updatedAt: new Date().toISOString() }
              : nb,
          ),
        }));
      },

      archiveNotebook: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          notebooks: state.notebooks.map((nb) =>
            nb.notebookId === id
              ? { ...nb, isArchived: true, archivedAt: now }
              : nb,
          ),
        }));
      },

      restoreNotebook: (id) => {
        set((state) => ({
          notebooks: state.notebooks.map((nb) =>
            nb.notebookId === id
              ? { ...nb, isArchived: false, archivedAt: null }
              : nb,
          ),
        }));
      },

      deleteNotebookPermanently: (id) => {
        // Cascade delete chapters, pages, blocks, attachments
        set((state) => {
          const remainingNotebooks = state.notebooks.filter(
            (nb) => nb.notebookId !== id,
          );
          const remainingChapters = state.chapters.filter(
            (c) => c.notebookId !== id,
          );
          const remainingPages = state.pages.filter((p) => p.notebookId !== id);
          const remainingPageIds = new Set(remainingPages.map((p) => p.pageId));
          const remainingChapterIds = new Set(
            remainingChapters.map((c) => c.chapterId),
          );
          const remainingBlocks = state.blocks.filter((b) =>
            remainingPageIds.has(b.pageId),
          );
          const remainingAttachments = state.attachments.filter((a) => {
            if (a.pageId) return remainingPageIds.has(a.pageId);
            if (a.chapterId) return remainingChapterIds.has(a.chapterId);
            return true;
          });
          const remainingDiagrams = state.diagrams.filter((d) =>
            remainingPageIds.has(d.pageId),
          );

          const nextActiveNb = remainingNotebooks[0]?.notebookId || "";
          return {
            notebooks: remainingNotebooks,
            chapters: remainingChapters,
            pages: remainingPages,
            blocks: remainingBlocks,
            attachments: remainingAttachments,
            diagrams: remainingDiagrams,
            activeNotebookId: nextActiveNb,
          };
        });
      },

      reorderNotebook: (id, newPosition) => {
        set((state) => ({
          notebooks: state.notebooks.map((nb) =>
            nb.notebookId === id
              ? {
                  ...nb,
                  position: newPosition,
                  updatedAt: new Date().toISOString(),
                }
              : nb,
          ),
        }));
      },

      // Chapters
      createChapter: (data) => {
        const { chapters, activeNotebookId } = get();
        const nbChapters = sortByPosition(
          chapters.filter((c) => c.notebookId === activeNotebookId),
        );
        const lastPos = nbChapters.length
          ? nbChapters[nbChapters.length - 1]?.position
          : null;
        const newPos = generatePositionBetween(lastPos, null);

        const newCh: Chapter = {
          chapterId: `ch-${Date.now()}`,
          notebookId: data.notebookId || activeNotebookId,
          title: data.title || "Untitled Chapter",
          icon: data.icon || "Folder",
          color: data.color || "#3b82f6",
          position: newPos,
          isArchived: false,
          isFavorite: false,
          archivedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data,
        };

        set({
          chapters: [...chapters, newCh],
          activeChapterId: newCh.chapterId,
        });
      },

      updateChapter: (id, data) => {
        set((state) => ({
          chapters: state.chapters.map((ch) =>
            ch.chapterId === id
              ? { ...ch, ...data, updatedAt: new Date().toISOString() }
              : ch,
          ),
        }));
      },

      toggleFavoriteChapter: (id) => {
        set((state) => ({
          chapters: state.chapters.map((ch) =>
            ch.chapterId === id ? { ...ch, isFavorite: !ch.isFavorite } : ch,
          ),
        }));
      },

      archiveChapter: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          chapters: state.chapters.map((ch) =>
            ch.chapterId === id
              ? { ...ch, isArchived: true, archivedAt: now }
              : ch,
          ),
        }));
      },

      restoreChapter: (id) => {
        set((state) => ({
          chapters: state.chapters.map((ch) =>
            ch.chapterId === id
              ? { ...ch, isArchived: false, archivedAt: null }
              : ch,
          ),
        }));
      },

      deleteChapterPermanently: (id) => {
        // Cascade delete pages, blocks, attachments
        set((state) => {
          const remainingChapters = state.chapters.filter(
            (c) => c.chapterId !== id,
          );
          const remainingPages = state.pages.filter((p) => p.chapterId !== id);
          const remainingPageIds = new Set(remainingPages.map((p) => p.pageId));
          const remainingChapterIds = new Set(
            remainingChapters.map((c) => c.chapterId),
          );
          const remainingBlocks = state.blocks.filter((b) =>
            remainingPageIds.has(b.pageId),
          );
          const remainingAttachments = state.attachments.filter((a) => {
            if (a.pageId) return remainingPageIds.has(a.pageId);
            if (a.chapterId) return remainingChapterIds.has(a.chapterId);
            return true;
          });
          const remainingDiagrams = state.diagrams.filter((d) =>
            remainingPageIds.has(d.pageId),
          );

          return {
            chapters: remainingChapters,
            pages: remainingPages,
            blocks: remainingBlocks,
            attachments: remainingAttachments,
            diagrams: remainingDiagrams,
            activeChapterId: remainingChapters[0]?.chapterId || null,
          };
        });
      },

      reorderChapter: (id, newPosition) => {
        set((state) => ({
          chapters: state.chapters.map((ch) =>
            ch.chapterId === id
              ? {
                  ...ch,
                  position: newPosition,
                  updatedAt: new Date().toISOString(),
                }
              : ch,
          ),
        }));
      },

      // Pages
      createPage: (notebookId, chapterId, title = "Untitled Page") => {
        const { pages } = get();
        const chPages = sortByPosition(
          pages.filter((p) => p.chapterId === chapterId),
        );
        const lastPos = chPages.length
          ? chPages[chPages.length - 1]?.position
          : null;
        const newPos = generatePositionBetween(lastPos, null);

        const pageId = `pg-${Date.now()}`;
        const newPage: Page = {
          pageId,
          chapterId,
          notebookId, // denormalized
          title,
          position: newPos,
          isPinned: false,
          isArchived: false,
          archivedAt: null,
          searchVector: title.toLowerCase(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Create an initial paragraph block
        const initialBlock: Block = {
          blockId: `blk-${Date.now()}`,
          pageId,
          parentBlockId: null,
          type: "paragraph",
          content: {
            type: "paragraph",
            richText: [{ text: "Start writing or type '/' for commands..." }],
          },
          position: "a0",
          plainText: "Start writing or type '/' for commands...",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          pages: [...pages, newPage],
          blocks: [...get().blocks, initialBlock],
          activePageId: pageId,
          activeChapterId: chapterId,
          activeNotebookId: notebookId,
          activeView: "page",
        });

        return pageId;
      },

      updatePageTitle: (pageId, title) => {
        set((state) => ({
          pages: state.pages.map((p) =>
            p.pageId === pageId
              ? {
                  ...p,
                  title,
                  searchVector: `${title} ${p.searchVector || ""}`.trim(),
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      updatePageSummary: (pageId, summary) => {
        set((state) => ({
          pages: state.pages.map((p) =>
            p.pageId === pageId
              ? {
                  ...p,
                  summary,
                  searchVector:
                    `${p.title} ${summary} ${p.searchVector || ""}`.trim(),
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      togglePinPage: (pageId) => {
        set((state) => ({
          pages: state.pages.map((p) =>
            p.pageId === pageId ? { ...p, isPinned: !p.isPinned } : p,
          ),
        }));
      },

      movePage: (pageId, targetNotebookId, targetChapterId) => {
        set((state) => ({
          pages: state.pages.map((p) =>
            p.pageId === pageId
              ? {
                  ...p,
                  notebookId: targetNotebookId, // denormalized update
                  chapterId: targetChapterId,
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
          activeNotebookId: targetNotebookId,
          activeChapterId: targetChapterId,
          activePageId: pageId,
        }));
      },

      archivePage: (pageId) => {
        const now = new Date().toISOString();
        set((state) => ({
          pages: state.pages.map((p) =>
            p.pageId === pageId
              ? { ...p, isArchived: true, archivedAt: now }
              : p,
          ),
        }));
      },

      restorePage: (pageId) => {
        set((state) => ({
          pages: state.pages.map((p) =>
            p.pageId === pageId
              ? { ...p, isArchived: false, archivedAt: null }
              : p,
          ),
        }));
      },

      deletePagePermanently: (pageId) => {
        // Cascade delete blocks, attachments, diagrams, and page links
        set((state) => {
          const remainingPages = state.pages.filter((p) => p.pageId !== pageId);
          const remainingBlocks = state.blocks.filter(
            (b) => b.pageId !== pageId,
          );
          const remainingAttachments = state.attachments.filter(
            (a) => a.pageId !== pageId,
          );
          const remainingDiagrams = state.diagrams.filter(
            (d) => d.pageId !== pageId,
          );
          const remainingLinks = state.pageLinks.filter(
            (l) => l.sourcePageId !== pageId && l.targetPageId !== pageId,
          );

          const nextActivePage =
            remainingPages.find((p) => !p.isArchived)?.pageId || null;

          return {
            pages: remainingPages,
            blocks: remainingBlocks,
            attachments: remainingAttachments,
            diagrams: remainingDiagrams,
            pageLinks: remainingLinks,
            activePageId: nextActivePage,
          };
        });
      },

      reorderPage: (pageId, newPosition) => {
        set((state) => ({
          pages: state.pages.map((p) =>
            p.pageId === pageId
              ? {
                  ...p,
                  position: newPosition,
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      // Blocks
      addBlock: (pageId, type, afterBlockId, parentBlockId = null) => {
        const { blocks } = get();
        const pageBlocks = sortByPosition(
          blocks.filter((b) => b.pageId === pageId),
        );
        let newPosition = "a0";

        if (afterBlockId) {
          const currIdx = pageBlocks.findIndex(
            (b) => b.blockId === afterBlockId,
          );
          if (currIdx !== -1) {
            const prevPos = pageBlocks[currIdx]?.position;
            const nextPos = pageBlocks[currIdx + 1]?.position || null;
            newPosition = generatePositionBetween(prevPos, nextPos);
          }
        } else if (pageBlocks.length > 0) {
          newPosition = generatePositionBetween(
            pageBlocks[pageBlocks.length - 1]?.position,
            null,
          );
        }

        const blockId = `blk-${Date.now()}`;
        let content: BlockContent;

        switch (type) {
          case "paragraph":
          case "heading_1":
          case "heading_2":
          case "heading_3":
          case "quote":
          case "bulleted_list":
          case "numbered_list":
          case "toggle":
            content = { type, richText: [{ text: "" }] };
            break;
          case "todo":
            content = {
              type: "todo",
              richText: [{ text: "" }],
              checked: false,
            };
            break;
          case "callout":
            content = {
              type: "callout",
              richText: [{ text: "" }],
              icon: "Info",
              color: "blue",
            };
            break;
          case "code":
            content = {
              type: "code",
              language: "typescript",
              code: "// Type code here...",
              caption: "",
            };
            break;
          case "divider":
            content = { type: "divider" };
            break;
          case "image":
            content = {
              type: "image",
              attachmentId: "att-img-arch-01",
              caption: "",
            };
            break;
          case "file":
            content = {
              type: "file",
              attachmentId: "att-pdf-drizzle-02",
              caption: "",
            };
            break;
          case "bookmark":
            content = {
              type: "bookmark",
              url: "https://orm.drizzle.team",
              title: "Drizzle ORM Documentation",
              description:
                "TypeScript ORM with type safety and schema migrations.",
            };
            break;
          case "diagram":
            content = { type: "diagram", diagramId: "diag-mer-01" };
            break;
          case "page_link":
            content = { type: "page_link", pageId: "" };
            break;
          case "table":
            content = {
              type: "table",
              rows: [
                [
                  [{ text: "Column 1", marks: ["bold"] }],
                  [{ text: "Column 2", marks: ["bold"] }],
                ],
                [[{ text: "Cell A1" }], [{ text: "Cell B1" }]],
              ],
            };
            break;
          default:
            content = { type: "paragraph", richText: [{ text: "" }] };
        }

        const newBlock: Block = {
          blockId,
          pageId,
          parentBlockId,
          type,
          content,
          position: newPosition,
          plainText: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({ blocks: [...blocks, newBlock], focusedBlockId: blockId });
        return blockId;
      },

      moveBlock: (blockId, direction) => {
        const { blocks } = get();
        const currentBlock = blocks.find((b) => b.blockId === blockId);
        if (!currentBlock) return;

        const pageBlocks = sortByPosition(
          blocks.filter(
            (b) =>
              b.pageId === currentBlock.pageId &&
              b.parentBlockId === currentBlock.parentBlockId,
          ),
        );
        const currIdx = pageBlocks.findIndex((b) => b.blockId === blockId);
        if (currIdx === -1) return;

        if (direction === "up") {
          if (currIdx === 0) return;
          const prevBlock = pageBlocks[currIdx - 1];
          const prevPrevBlock = currIdx > 1 ? pageBlocks[currIdx - 2] : null;
          const newPos = generatePositionBetween(
            prevPrevBlock?.position || null,
            prevBlock?.position || null,
          );
          get().reorderBlock(blockId, newPos);
        } else {
          if (currIdx === pageBlocks.length - 1) return;
          const nextBlock = pageBlocks[currIdx + 1];
          const nextNextBlock =
            currIdx + 2 < pageBlocks.length ? pageBlocks[currIdx + 2] : null;
          const newPos = generatePositionBetween(
            nextBlock?.position || null,
            nextNextBlock?.position || null,
          );
          get().reorderBlock(blockId, newPos);
        }
      },

      updateBlockContent: (blockId, content) => {
        let plainText = "";
        if ("richText" in content) {
          plainText = content.richText.map((t) => t.text).join("");
        } else if (content.type === "code") {
          plainText = content.code;
        } else if (content.type === "bookmark") {
          plainText = `${content.title || ""} ${content.url}`;
        }

        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.blockId === blockId
              ? {
                  ...b,
                  content,
                  plainText,
                  updatedAt: new Date().toISOString(),
                }
              : b,
          ),
        }));
      },

      deleteBlock: (blockId) => {
        // When deleting block, attachment's blockId is set to null (survives block delete)
        set((state) => ({
          blocks: state.blocks.filter(
            (b) => b.blockId !== blockId && b.parentBlockId !== blockId,
          ),
          attachments: state.attachments.map((a) =>
            a.blockId === blockId ? { ...a, blockId: null } : a,
          ),
        }));
      },

      reorderBlock: (blockId, newPosition) => {
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.blockId === blockId
              ? {
                  ...b,
                  position: newPosition,
                  updatedAt: new Date().toISOString(),
                }
              : b,
          ),
        }));
      },

      toggleTodoBlock: (blockId) => {
        set((state) => ({
          blocks: state.blocks.map((b) => {
            if (b.blockId === blockId && b.content.type === "todo") {
              return {
                ...b,
                content: {
                  ...b.content,
                  checked: !b.content.checked,
                },
                updatedAt: new Date().toISOString(),
              };
            }
            return b;
          }),
        }));
      },

      indentBlock: (blockId, parentBlockId) => {
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.blockId === blockId ? { ...b, parentBlockId } : b,
          ),
        }));
      },

      outdentBlock: (blockId) => {
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.blockId === blockId ? { ...b, parentBlockId: null } : b,
          ),
        }));
      },

      convertBlockType: (blockId, newType) => {
        set((state) => ({
          blocks: state.blocks.map((b) => {
            if (b.blockId !== blockId) return b;
            const currentRichText =
              "richText" in b.content
                ? b.content.richText
                : [{ text: b.plainText || "" }];
            const cleanedRichText = currentRichText.map((span, i) =>
              i === 0 ? { ...span, text: span.text.replace(/^\//, "") } : span,
            );
            let content: BlockContent;
            switch (newType) {
              case "paragraph":
              case "heading_1":
              case "heading_2":
              case "heading_3":
              case "quote":
              case "bulleted_list":
              case "numbered_list":
              case "toggle":
                content = { type: newType, richText: cleanedRichText };
                break;
              case "todo":
                content = {
                  type: "todo",
                  richText: cleanedRichText,
                  checked: false,
                };
                break;
              case "callout":
                content = {
                  type: "callout",
                  richText: cleanedRichText,
                  icon: "Info",
                  color: "blue",
                };
                break;
              case "code":
                content = {
                  type: "code",
                  language: "typescript",
                  code: b.plainText.replace(/^\//, "") || "",
                  caption: "",
                };
                break;
              case "divider":
                content = { type: "divider" };
                break;
              case "bookmark":
                content = {
                  type: "bookmark",
                  url: "https://orm.drizzle.team",
                  title: "Drizzle ORM Documentation",
                  description:
                    "TypeScript ORM with type safety and schema migrations.",
                };
                break;
              case "table":
                content = {
                  type: "table",
                  rows: [
                    [
                      [{ text: "Column 1", marks: ["bold"] }],
                      [{ text: "Column 2", marks: ["bold"] }],
                    ],
                    [[{ text: "Cell A1" }], [{ text: "Cell B1" }]],
                  ],
                };
                break;
              default:
                content = { type: "paragraph", richText: cleanedRichText };
            }
            const plainText = cleanedRichText.map((t) => t.text).join("");
            return {
              ...b,
              type: newType,
              content,
              plainText,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));

        if (newType === "divider") {
          const block = get().blocks.find((b) => b.blockId === blockId);
          if (block) {
            const newBlockId = get().addBlock(
              block.pageId,
              "paragraph",
              blockId,
            );
            get().setFocusedBlockId(newBlockId);
          }
        }
      },

      // Attachments
      addAttachment: (data) => {
        const { attachments } = get();

        // Checksum dedupe check
        if (data.checksum) {
          const existing = attachments.find(
            (a) => a.checksum === data.checksum,
          );
          if (existing) {
            return existing;
          }
        }

        const newAtt: Attachment = {
          id: `att-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...data,
        };

        set({ attachments: [newAtt, ...attachments] });
        return newAtt;
      },

      deleteAttachment: (id) => {
        set((state) => ({
          attachments: state.attachments.filter((a) => a.id !== id),
        }));
      },

      // Diagrams
      createDiagram: (pageId, data) => {
        const { diagrams } = get();
        const newDiag: Diagram = {
          diagramId: `diag-${Date.now()}`,
          pageId,
          title: data.title || "Untitled Diagram",
          kind: data.kind || "canvas",
          source: data.source || "graph TD\nA[Start] --> B[Process] --> C[End]",
          scene: data.scene,
          thumbnailAttachmentId: null,
          updatedAt: new Date().toISOString(),
        };

        set({ diagrams: [...diagrams, newDiag] });
        return newDiag;
      },

      updateDiagram: (id, data) => {
        set((state) => ({
          diagrams: state.diagrams.map((d) =>
            d.diagramId === id
              ? { ...d, ...data, updatedAt: new Date().toISOString() }
              : d,
          ),
        }));
      },

      deleteDiagram: (id) => {
        set((state) => ({
          diagrams: state.diagrams.filter((d) => d.diagramId !== id),
        }));
      },

      // Modals management
      openSearch: (scope) =>
        set({ isSearchOpen: true, searchNotebookScope: scope || null }),
      closeSearch: () =>
        set({ isSearchOpen: false, searchNotebookScope: null }),
      openTrash: () => set({ isTrashOpen: true }),
      closeTrash: () => set({ isTrashOpen: false }),
      openAttachments: () => set({ isAttachmentsOpen: true }),
      closeAttachments: () => set({ isAttachmentsOpen: false }),
      openChapterFileDock: (chapterId) =>
        set({
          isChapterFileDockOpen: true,
          activeChapterFileDockId: chapterId,
        }),
      closeChapterFileDock: () =>
        set({ isChapterFileDockOpen: false, activeChapterFileDockId: null }),
      openMovePage: (pageId) =>
        set({ isMovePageOpen: true, targetMovePageId: pageId }),
      closeMovePage: () =>
        set({ isMovePageOpen: false, targetMovePageId: null }),
      openNotebookModal: (notebook) =>
        set({ isNotebookModalOpen: true, editingNotebook: notebook || null }),
      closeNotebookModal: () =>
        set({ isNotebookModalOpen: false, editingNotebook: null }),
      openChapterModal: (chapter) =>
        set({ isChapterModalOpen: true, editingChapter: chapter || null }),
      closeChapterModal: () =>
        set({ isChapterModalOpen: false, editingChapter: null }),
      openDiagramModal: (diagramId) =>
        set({ isDiagramModalOpen: true, activeDiagramId: diagramId || null }),
      openPageDiagram: (pageId) => {
        const { diagrams } = get();
        let diag = diagrams.find((d) => d.pageId === pageId);
        if (!diag) {
          diag = get().createDiagram(pageId, {
            title: "Page Diagram",
            kind: "canvas",
            scene: {
              elements: [],
              zoom: 1,
              panX: 0,
              panY: 0,
            },
          });
        }
        set({ isDiagramModalOpen: true, activeDiagramId: diag.diagramId });
      },
      closeDiagramModal: () =>
        set({ isDiagramModalOpen: false, activeDiagramId: null }),

      resetToDefaultData: () => {
        set({
          notebooks: MOCK_NOTEBOOKS,
          chapters: MOCK_CHAPTERS,
          pages: MOCK_PAGES,
          blocks: MOCK_BLOCKS,
          attachments: MOCK_ATTACHMENTS,
          diagrams: MOCK_DIAGRAMS,
          pageLinks: MOCK_PAGE_LINKS,
          activeNotebookId: "nb-eng-001",
          activeChapterId: "ch-db-02",
          activePageId: "pg-notes-db-design",
          activeView: "page",
        });
      },
    }),
    {
      name: "zuri_notes_store",
      partialize: (state) => ({
        notebooks: state.notebooks,
        chapters: state.chapters,
        pages: state.pages,
        blocks: state.blocks,
        attachments: state.attachments,
        diagrams: state.diagrams,
        pageLinks: state.pageLinks,
        activeNotebookId: state.activeNotebookId,
        activeChapterId: state.activeChapterId,
        activePageId: state.activePageId,
      }),
    },
  ),
);
