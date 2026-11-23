import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import NoteService from "../../../notes";
import { blockTypeSchema, blockContentSchema, BlockType } from "./schema/note";
import {
  decomposeMarkdownToBlocks,
  extractPlainTextFromContent,
  normalizeBlockContentPayload,
  shouldDecomposeMarkdown,
} from "./helper/note";
const noteService = new NoteService();

function requireUserId(context: any): string {
  const userId = context?.session?.userId;
  if (!userId) {
    throw new UserError(
      "Unauthorized: This tool requires an authenticated user session.",
    );
  }
  return userId;
}

export const noteTools = [
  // Workspace
  {
    name: "notes_get_workspace",
    description:
      "Retrieve the complete workspace hierarchy including all active notebooks, chapters, and pages for the authenticated user.",
    parameters: z.object({}),
    execute: async (_args: {}, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.getWorkspace(userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get workspace");
      }
    },
  },
  // Notebooks
  {
    name: "notes_get_notebooks",
    description:
      "Get all active (non-archived) notebooks for the authenticated user.",
    parameters: z.object({}),
    execute: async (_args: {}, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.getNotebooks(userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get notebooks");
      }
    },
  },
  {
    name: "notes_get_notebook_by_id",
    description: "Get details of a specific notebook by its ID.",
    parameters: z.object({
      notebookId: z
        .string()
        .uuid()
        .describe("Unique identifier of the notebook"),
    }),
    execute: async (args: { notebookId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.getNotebookById(
          args.notebookId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get notebook");
      }
    },
  },
  {
    name: "notes_create_notebook",
    description:
      "Create a new notebook with optional title, icon, color, cover URL, and position.",
    parameters: z.object({
      title: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Title of the notebook"),
      icon: z
        .string()
        .optional()
        .describe("Icon name or emoji for the notebook"),
      color: z.string().optional().describe("Hex color code for the notebook"),
      coverUrl: z
        .string()
        .optional()
        .describe("Cover image URL for the notebook"),
      position: z
        .string()
        .optional()
        .describe("Fractional index position for ordering"),
    }),
    execute: async (
      args: {
        title?: string;
        icon?: string;
        color?: string;
        coverUrl?: string;
        position?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.createNotebook(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create notebook");
      }
    },
  },
  {
    name: "notes_update_notebook",
    description:
      "Update notebook properties such as title, icon, color, cover URL, or position.",
    parameters: z.object({
      notebookId: z
        .string()
        .uuid()
        .describe("Unique identifier of the notebook"),
      title: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Updated title of the notebook"),
      icon: z.string().optional().describe("Updated icon name or emoji"),
      color: z.string().optional().describe("Updated hex color code"),
      coverUrl: z.string().optional().describe("Updated cover image URL"),
      position: z
        .string()
        .optional()
        .describe("Updated fractional index position"),
    }),
    execute: async (
      args: {
        notebookId: string;
        title?: string;
        icon?: string;
        color?: string;
        coverUrl?: string;
        position?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      const { notebookId, ...data } = args;
      try {
        const result = await noteService.updateNotebook(
          notebookId,
          userId,
          data,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to update notebook");
      }
    },
  },
  {
    name: "notes_archive_notebook",
    description: "Archive (soft-delete/move to trash) a notebook.",
    parameters: z.object({
      notebookId: z
        .string()
        .uuid()
        .describe("Unique identifier of the notebook to archive"),
    }),
    execute: async (args: { notebookId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.archiveNotebook(
          args.notebookId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to archive notebook");
      }
    },
  },
  {
    name: "notes_restore_notebook",
    description: "Restore an archived notebook from the trash.",
    parameters: z.object({
      notebookId: z
        .string()
        .uuid()
        .describe("Unique identifier of the notebook to restore"),
    }),
    execute: async (args: { notebookId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.restoreNotebook(
          args.notebookId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to restore notebook");
      }
    },
  },
  {
    name: "notes_delete_notebook_permanently",
    description: "Permanently delete a notebook and all associated data.",
    parameters: z.object({
      notebookId: z
        .string()
        .uuid()
        .describe("Unique identifier of the notebook to permanently delete"),
    }),
    execute: async (args: { notebookId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.deleteNotebookPermanently(
          args.notebookId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(
          error.message || "Failed to delete notebook permanently",
        );
      }
    },
  },
  {
    name: "notes_reorder_notebook",
    description:
      "Reorder a notebook by updating its fractional index position.",
    parameters: z.object({
      notebookId: z
        .string()
        .uuid()
        .describe("Unique identifier of the notebook"),
      position: z
        .string()
        .describe("Target fractional index position (e.g. 'a0', 'a1')"),
    }),
    execute: async (
      args: { notebookId: string; position: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.reorderNotebook(
          args.notebookId,
          userId,
          args.position,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to reorder notebook");
      }
    },
  },

  // Chapters
  {
    name: "notes_get_chapters",
    description: "Get all active chapters within a specific notebook.",
    parameters: z.object({
      notebookId: z
        .string()
        .uuid()
        .describe("Unique identifier of the parent notebook"),
    }),
    execute: async (args: { notebookId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.getChapters(args.notebookId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get chapters");
      }
    },
  },
  {
    name: "notes_create_chapter",
    description:
      "Create a new chapter within a notebook, automatically creating a linked file dock.",
    parameters: z.object({
      notebookId: z
        .string()
        .uuid()
        .optional()
        .describe(
          "Unique identifier of the parent notebook (optional; defaults to the workspace's default notebook)",
        ),
      title: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Title of the chapter"),
      icon: z
        .string()
        .optional()
        .describe("Icon name or emoji for the chapter"),
      color: z.string().optional().describe("Hex color code for the chapter"),
      position: z
        .string()
        .optional()
        .describe("Fractional index position for ordering"),
      summary: z
        .string()
        .optional()
        .describe("Summary or overview of the chapter"),
    }),
    execute: async (
      args: {
        notebookId?: string;
        title?: string;
        icon?: string;
        color?: string;
        position?: string;
        summary?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.createChapter(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create chapter");
      }
    },
  },
  {
    name: "notes_update_chapter",
    description:
      "Update chapter metadata such as title, icon, color, position, summary, or favorite status.",
    parameters: z.object({
      chapterId: z.string().uuid().describe("Unique identifier of the chapter"),
      title: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Updated title of the chapter"),
      icon: z.string().optional().describe("Updated icon name or emoji"),
      color: z.string().optional().describe("Updated hex color code"),
      position: z
        .string()
        .optional()
        .describe("Updated fractional index position"),
      summary: z.string().optional().describe("Updated summary of the chapter"),
      isFavorite: z
        .boolean()
        .optional()
        .describe("Whether chapter is marked as favorite"),
    }),
    execute: async (
      args: {
        chapterId: string;
        title?: string;
        icon?: string;
        color?: string;
        position?: string;
        summary?: string;
        isFavorite?: boolean;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      const { chapterId, ...data } = args;
      try {
        const result = await noteService.updateChapter(chapterId, userId, data);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to update chapter");
      }
    },
  },
  {
    name: "notes_toggle_favorite_chapter",
    description: "Toggle the favorite/starred status of a chapter.",
    parameters: z.object({
      chapterId: z.string().uuid().describe("Unique identifier of the chapter"),
    }),
    execute: async (args: { chapterId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.toggleFavoriteChapter(
          args.chapterId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(
          error.message || "Failed to toggle favorite chapter",
        );
      }
    },
  },
  {
    name: "notes_archive_chapter",
    description: "Archive (soft-delete/move to trash) a chapter.",
    parameters: z.object({
      chapterId: z
        .string()
        .uuid()
        .describe("Unique identifier of the chapter to archive"),
    }),
    execute: async (args: { chapterId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.archiveChapter(args.chapterId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to archive chapter");
      }
    },
  },
  {
    name: "notes_restore_chapter",
    description: "Restore an archived chapter from the trash.",
    parameters: z.object({
      chapterId: z
        .string()
        .uuid()
        .describe("Unique identifier of the chapter to restore"),
    }),
    execute: async (args: { chapterId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.restoreChapter(args.chapterId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to restore chapter");
      }
    },
  },
  {
    name: "notes_delete_chapter_permanently",
    description: "Permanently delete a chapter and all associated data.",
    parameters: z.object({
      chapterId: z
        .string()
        .uuid()
        .describe("Unique identifier of the chapter to permanently delete"),
    }),
    execute: async (args: { chapterId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.deleteChapterPermanently(
          args.chapterId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(
          error.message || "Failed to delete chapter permanently",
        );
      }
    },
  },
  {
    name: "notes_reorder_chapter",
    description: "Reorder a chapter by updating its fractional index position.",
    parameters: z.object({
      chapterId: z.string().uuid().describe("Unique identifier of the chapter"),
      position: z
        .string()
        .describe("Target fractional index position (e.g. 'a0', 'a1')"),
    }),
    execute: async (
      args: { chapterId: string; position: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.reorderChapter(
          args.chapterId,
          userId,
          args.position,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to reorder chapter");
      }
    },
  },

  // Pages
  {
    name: "notes_get_pages",
    description: "Get all active pages within a chapter.",
    parameters: z.object({
      chapterId: z.string().uuid().describe("Unique identifier of the chapter"),
    }),
    execute: async (args: { chapterId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.getPages(args.chapterId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get pages");
      }
    },
  },
  {
    name: "notes_get_page_by_id",
    description: "Get page metadata by its ID.",
    parameters: z.object({
      pageId: z.string().uuid().describe("Unique identifier of the page"),
    }),
    execute: async (args: { pageId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.getPageById(args.pageId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get page");
      }
    },
  },
  {
    name: "notes_create_page",
    description:
      "Create a new page in a chapter with an initial blank paragraph block. If notebookId is omitted, it is automatically resolved from chapterId.",
    parameters: z.object({
      chapterId: z
        .string()
        .uuid()
        .optional()
        .describe(
          "Unique identifier of the chapter to place the page in (optional if notebookId is provided or to use default workspace chapter)",
        ),
      notebookId: z
        .string()
        .uuid()
        .optional()
        .describe(
          "Unique identifier of the notebook (optional; automatically resolved from chapterId if omitted)",
        ),
      title: z.string().trim().optional().describe("Title of the page"),
      summary: z
        .string()
        .optional()
        .describe("Summary or overview of the page"),
      position: z
        .string()
        .optional()
        .describe("Fractional index position for ordering"),
    }),
    execute: async (
      args: {
        notebookId?: string;
        chapterId?: string;
        title?: string;
        summary?: string;
        position?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.createPage(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create page");
      }
    },
  },
  {
    name: "notes_update_page",
    description: "Update page metadata (title, summary, position, isPinned).",
    parameters: z.object({
      pageId: z.string().uuid().describe("Unique identifier of the page"),
      title: z.string().trim().optional().describe("Updated title of the page"),
      summary: z.string().optional().describe("Updated summary of the page"),
      position: z
        .string()
        .optional()
        .describe("Updated fractional index position"),
      isPinned: z
        .boolean()
        .optional()
        .describe("Whether page is pinned in the navigation sidebar"),
    }),
    execute: async (
      args: {
        pageId: string;
        title?: string;
        summary?: string;
        position?: string;
        isPinned?: boolean;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      const { pageId, ...data } = args;
      try {
        const result = await noteService.updatePage(pageId, userId, data);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to update page");
      }
    },
  },
  {
    name: "notes_toggle_pin_page",
    description: "Toggle pinned status of a page.",
    parameters: z.object({
      pageId: z.string().uuid().describe("Unique identifier of the page"),
    }),
    execute: async (args: { pageId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.togglePinPage(args.pageId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to toggle pin page");
      }
    },
  },
  {
    name: "notes_move_page",
    description: "Move a page to a different notebook and chapter.",
    parameters: z.object({
      pageId: z
        .string()
        .uuid()
        .describe("Unique identifier of the page to move"),
      targetNotebookId: z.string().uuid().describe("Target notebook ID"),
      targetChapterId: z.string().uuid().describe("Target chapter ID"),
    }),
    execute: async (
      args: {
        pageId: string;
        targetNotebookId: string;
        targetChapterId: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.movePage(
          args.pageId,
          userId,
          args.targetNotebookId,
          args.targetChapterId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to move page");
      }
    },
  },
  {
    name: "notes_archive_page",
    description: "Archive (soft-delete/move to trash) a page.",
    parameters: z.object({
      pageId: z
        .string()
        .uuid()
        .describe("Unique identifier of the page to archive"),
    }),
    execute: async (args: { pageId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.archivePage(args.pageId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to archive page");
      }
    },
  },
  {
    name: "notes_restore_page",
    description: "Restore an archived page from trash.",
    parameters: z.object({
      pageId: z
        .string()
        .uuid()
        .describe("Unique identifier of the page to restore"),
    }),
    execute: async (args: { pageId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.restorePage(args.pageId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to restore page");
      }
    },
  },
  {
    name: "notes_delete_page_permanently",
    description: "Permanently delete a page and its blocks.",
    parameters: z.object({
      pageId: z
        .string()
        .uuid()
        .describe("Unique identifier of the page to permanently delete"),
    }),
    execute: async (args: { pageId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.deletePagePermanently(
          args.pageId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(
          error.message || "Failed to delete page permanently",
        );
      }
    },
  },
  {
    name: "notes_reorder_page",
    description: "Reorder a page by updating its fractional index position.",
    parameters: z.object({
      pageId: z.string().uuid().describe("Unique identifier of the page"),
      position: z
        .string()
        .describe("Target fractional index position (e.g. 'a0', 'a1')"),
    }),
    execute: async (
      args: { pageId: string; position: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.reorderPage(
          args.pageId,
          userId,
          args.position,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to reorder page");
      }
    },
  },

  // Blocks
  {
    name: "notes_get_blocks",
    description: "Get all content blocks for a page in position order.",
    parameters: z.object({
      pageId: z.string().uuid().describe("Unique identifier of the page"),
    }),
    execute: async (args: { pageId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.getBlocks(args.pageId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get blocks");
      }
    },
  },
  {
    name: "notes_create_block",
    description:
      "Create a new structured block within a page (paragraph, heading_1, heading_2, heading_3, bulleted_list, numbered_list, todo, toggle, quote, callout, code, divider, image, file, bookmark, table, diagram, page_link).",
    parameters: z.object({
      pageId: z.string().uuid().describe("Unique identifier of the page"),
      parentBlockId: z
        .string()
        .uuid()
        .nullable()
        .optional()
        .describe(
          "Parent block ID for nested hierarchies (e.g. toggle children, sub-bullets)",
        ),
      type: blockTypeSchema.describe("Block type matching block_type enum"),
      content: blockContentSchema.describe(
        "Structured block content JSON payload adhering to BlockContent schema",
      ),
      position: z
        .string()
        .describe(
          "Fractional index position for block order (e.g. 'a0', 'a1', 'a0V')",
        ),
      plainText: z
        .string()
        .optional()
        .describe("Searchable plain text extracted from content"),
    }),
    execute: async (
      args: {
        pageId: string;
        parentBlockId?: string | null;
        type: BlockType;
        content: any;
        position: string;
        plainText?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const normalizedContent = normalizeBlockContentPayload(
          args.type,
          args.content,
        );
        const plainText =
          args.plainText ?? extractPlainTextFromContent(normalizedContent);

        // Auto-decomposition: if an LLM provided a multi-element Markdown blob in a paragraph, unpack it into native blocks
        if (
          (args.type === "paragraph" || !args.type) &&
          shouldDecomposeMarkdown(plainText)
        ) {
          const decomposed = decomposeMarkdownToBlocks(
            plainText,
            args.position,
          );
          if (decomposed.length > 1) {
            const createdBlocks = [];
            for (const b of decomposed) {
              const created = await noteService.createBlock(userId, {
                pageId: args.pageId,
                parentBlockId: args.parentBlockId,
                type: b.type,
                content: b.content,
                position: b.position,
                plainText: b.plainText,
              });
              createdBlocks.push(created);
            }
            return JSON.stringify(createdBlocks, null, 2);
          }
        }

        const result = await noteService.createBlock(userId, {
          pageId: args.pageId,
          parentBlockId: args.parentBlockId,
          type: args.type,
          content: normalizedContent,
          position: args.position,
          plainText,
        });
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create block");
      }
    },
  },
  {
    name: "notes_update_block",
    description:
      "Update an existing block's type, content, plainText, parentBlockId, or position.",
    parameters: z.object({
      blockId: z
        .string()
        .uuid()
        .describe("Unique identifier of the block to update"),
      type: blockTypeSchema.optional().describe("Updated type of block"),
      content: blockContentSchema
        .optional()
        .describe("Updated block content payload adhering to BlockContent"),
      position: z
        .string()
        .optional()
        .describe("Updated fractional index position"),
      parentBlockId: z
        .string()
        .uuid()
        .nullable()
        .optional()
        .describe("Updated parent block ID"),
      plainText: z
        .string()
        .optional()
        .describe("Updated searchable plain text"),
    }),
    execute: async (
      args: {
        blockId: string;
        type?: BlockType;
        content?: any;
        position?: string;
        parentBlockId?: string | null;
        plainText?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      const { blockId, ...data } = args;
      try {
        const normalizedContent = data.content
          ? normalizeBlockContentPayload(data.type, data.content)
          : undefined;
        const plainText =
          data.plainText ??
          (normalizedContent
            ? extractPlainTextFromContent(normalizedContent)
            : undefined);
        const result = await noteService.updateBlock(blockId, userId, {
          ...data,
          ...(normalizedContent ? { content: normalizedContent } : {}),
          ...(plainText !== undefined ? { plainText } : {}),
        } as any);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to update block");
      }
    },
  },
  {
    name: "notes_delete_block",
    description: "Delete a block from a page.",
    parameters: z.object({
      blockId: z
        .string()
        .uuid()
        .describe("Unique identifier of the block to delete"),
    }),
    execute: async (args: { blockId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.deleteBlock(args.blockId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete block");
      }
    },
  },

  // Chapter File Dock & Files
  {
    name: "notes_get_chapter_file_dock",
    description: "Get file dock attachments and folders for a chapter.",
    parameters: z.object({
      chapterId: z.string().uuid().describe("Unique identifier of the chapter"),
    }),
    execute: async (args: { chapterId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.getChapterFileDock(
          args.chapterId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get chapter file dock");
      }
    },
  },
  {
    name: "notes_add_dock_file",
    description: "Add a file attachment to a chapter file dock.",
    parameters: z.object({
      chapterId: z.string().uuid().optional().describe("Associated chapter ID"),
      fileDockId: z.string().uuid().optional().describe("Direct file dock ID"),
      folderId: z
        .string()
        .uuid()
        .nullable()
        .optional()
        .describe("Folder ID within dock"),
      name: z.string().describe("File name"),
      cloudinaryPublicId: z.string().describe("Cloudinary storage public ID"),
      cloudinaryUrl: z.string().url().describe("Cloudinary asset URL"),
      resourceType: z
        .enum(["image", "video", "raw"])
        .describe("Cloudinary resource type"),
      format: z
        .string()
        .nullable()
        .optional()
        .describe("File extension/format"),
      mimeType: z.string().nullable().optional().describe("MIME type"),
      bytes: z.number().nullable().optional().describe("File size in bytes"),
      position: z
        .string()
        .nullable()
        .optional()
        .describe("Fractional index position"),
    }),
    execute: async (
      args: {
        chapterId?: string;
        fileDockId?: string;
        folderId?: string | null;
        name: string;
        cloudinaryPublicId: string;
        cloudinaryUrl: string;
        resourceType: "image" | "video" | "raw";
        format?: string | null;
        mimeType?: string | null;
        bytes?: number | null;
        position?: string | null;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.addDockFile(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add dock file");
      }
    },
  },
  {
    name: "notes_delete_dock_file",
    description: "Delete a file attachment from a file dock.",
    parameters: z.object({
      fileId: z
        .string()
        .uuid()
        .describe("Unique identifier of the dock file to delete"),
    }),
    execute: async (args: { fileId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.deleteDockFile(args.fileId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete dock file");
      }
    },
  },
  {
    name: "notes_create_dock_folder",
    description: "Create a folder inside a file dock.",
    parameters: z.object({
      fileDockId: z
        .string()
        .uuid()
        .describe("Unique identifier of the file dock"),
      parentFolderId: z
        .string()
        .uuid()
        .nullable()
        .optional()
        .describe("Parent folder ID for nested folders"),
      name: z.string().trim().min(1).describe("Folder name"),
      position: z.string().optional().describe("Fractional index position"),
    }),
    execute: async (
      args: {
        fileDockId: string;
        parentFolderId?: string | null;
        name: string;
        position?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.createDockFolder(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create dock folder");
      }
    },
  },
  {
    name: "notes_delete_dock_folder",
    description: "Delete a folder inside a file dock.",
    parameters: z.object({
      folderId: z
        .string()
        .uuid()
        .describe("Unique identifier of the folder to delete"),
    }),
    execute: async (args: { folderId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.deleteDockFolder(
          args.folderId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete dock folder");
      }
    },
  },

  // Search & Trash
  {
    name: "notes_search_notes",
    description:
      "Search notes across pages, titles, summaries, and block content by text query, with optional notebook filter.",
    parameters: z.object({
      query: z
        .string()
        .trim()
        .min(1)
        .describe(
          "Search text query to match against titles, summaries, and block content",
        ),
      notebookId: z
        .string()
        .uuid()
        .optional()
        .describe("Optional notebook ID to scope search results"),
    }),
    execute: async (
      args: { query: string; notebookId?: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.searchNotes(
          userId,
          args.query,
          args.notebookId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to search notes");
      }
    },
  },
  {
    name: "notes_get_trash",
    description:
      "Get all archived notebooks, chapters, and pages currently in trash.",
    parameters: z.object({}),
    execute: async (_args: {}, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await noteService.getTrash(userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get trash");
      }
    },
  },
  {
    name: "notes_get_link_preview",
    description:
      "Fetch bookmark metadata (title, description, favicon) for a given web URL.",
    parameters: z.object({
      url: z
        .string()
        .trim()
        .min(1)
        .describe("The URL to extract bookmark metadata and preview for"),
    }),
    execute: async (args: { url: string }, context: any) => {
      requireUserId(context);
      try {
        const result = await noteService.fetchBookmarkMetadata(args.url);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to fetch link preview");
      }
    },
  },
];

// Register all note tools and prompts to a FastMCP server instance
export function registerNoteTools(server: FastMCP<any>) {
  for (const tool of noteTools) {
    server.addTool(tool as any);
  }
}
export default registerNoteTools;
