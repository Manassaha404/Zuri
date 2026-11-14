import * as crypto from "node:crypto";
import db, { eq, desc, asc, and, or, sql, inArray } from "@repo/database";
import {
  notebooks,
  chapters,
  pages,
  blocks,
  diagrams,
  fileDocks,
  fileDockFolders,
  fileDockFiles,
  type BlockContent,
} from "@repo/database/models";
import { AppError } from "@repo/error";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (val: unknown): val is string =>
  typeof val === "string" && UUID_REGEX.test(val);

export class NoteService {
  // Verify user owns the notebook
  public async verifyNotebookOwner(notebookId: string, userId: string) {
    const [nb] = await db
      .select()
      .from(notebooks)
      .where(
        and(eq(notebooks.notebookId, notebookId), eq(notebooks.userId, userId)),
      )
      .limit(1);

    if (!nb) {
      throw new AppError("NOT_FOUND", "Notebook not found or unauthorized");
    }
    return nb;
  }

  // Verify user owns chapter via notebook relationship
  public async verifyChapterOwner(chapterId: string, userId: string) {
    const [row] = await db
      .select({
        chapter: chapters,
        notebook: notebooks,
      })
      .from(chapters)
      .innerJoin(notebooks, eq(chapters.notebookId, notebooks.notebookId))
      .where(
        and(eq(chapters.chapterId, chapterId), eq(notebooks.userId, userId)),
      )
      .limit(1);

    if (!row) {
      throw new AppError("NOT_FOUND", "Chapter not found or unauthorized");
    }
    return row.chapter;
  }

  // Verify user owns page via notebook relationship
  public async verifyPageOwner(pageId: string, userId: string) {
    const [row] = await db
      .select({
        page: pages,
        notebook: notebooks,
      })
      .from(pages)
      .innerJoin(notebooks, eq(pages.notebookId, notebooks.notebookId))
      .where(and(eq(pages.pageId, pageId), eq(notebooks.userId, userId)))
      .limit(1);

    if (!row) {
      throw new AppError("NOT_FOUND", "Page not found or unauthorized");
    }
    return row.page;
  }

  // Verify user owns file dock
  public async verifyFileDockOwner(fileDockId: string, userId: string) {
    const [dock] = await db
      .select()
      .from(fileDocks)
      .where(
        and(eq(fileDocks.fileDockId, fileDockId), eq(fileDocks.userId, userId)),
      )
      .limit(1);

    if (!dock) {
      throw new AppError("NOT_FOUND", "File dock not found or unauthorized");
    }
    return dock;
  }

  // Get complete workspace for user (auto-seeds starter notebook if empty)
  public async getWorkspace(userId: string) {
    let userNotebooks = await db
      .select()
      .from(notebooks)
      .where(and(eq(notebooks.userId, userId), eq(notebooks.isArchived, false)))
      .orderBy(asc(notebooks.position));

    // Auto-create initial notebook, chapter, and page if user has none
    if (userNotebooks.length === 0) {
      const [nb] = await db
        .insert(notebooks)
        .values({
          userId,
          title: "My Notebook",
          icon: "BookOpen",
          color: "#3b82f6",
          position: "a0",
        })
        .returning();

      if (nb) {
        userNotebooks = [nb];

        // Create default chapter
        const [ch] = await db
          .insert(chapters)
          .values({
            notebookId: nb.notebookId,
            title: "General",
            icon: "Folder",
            color: "#3b82f6",
            position: "a0",
          })
          .returning();

        if (ch) {
          // Create default blank page
          const [pg] = await db
            .insert(pages)
            .values({
              chapterId: ch.chapterId,
              notebookId: nb.notebookId,
              title: "Untitled",
              summary: "",
              position: "a0",
            })
            .returning();

          if (pg) {
            await db.insert(blocks).values([
              {
                pageId: pg.pageId,
                type: "paragraph",
                position: "a0",
                content: {
                  type: "paragraph",
                  richText: [{ text: "" }],
                },
                plainText: "",
              },
            ]);
          }
        }
      }
    }

    const notebookIds = userNotebooks.map((n) => n.notebookId);

    const userChapters =
      notebookIds.length > 0
        ? await db
            .select()
            .from(chapters)
            .where(
              and(
                inArray(chapters.notebookId, notebookIds),
                eq(chapters.isArchived, false),
              ),
            )
            .orderBy(asc(chapters.position))
        : [];

    const userPages =
      notebookIds.length > 0
        ? await db
            .select()
            .from(pages)
            .where(
              and(
                inArray(pages.notebookId, notebookIds),
                eq(pages.isArchived, false),
              ),
            )
            .orderBy(asc(pages.position))
        : [];

    return {
      notebooks: userNotebooks,
      chapters: userChapters,
      pages: userPages,
    };
  }

  // Notebooks CRUD
  public async getNotebooks(userId: string) {
    return await db
      .select()
      .from(notebooks)
      .where(and(eq(notebooks.userId, userId), eq(notebooks.isArchived, false)))
      .orderBy(asc(notebooks.position));
  }

  public async getNotebookById(notebookId: string, userId: string) {
    return await this.verifyNotebookOwner(notebookId, userId);
  }

  public async createNotebook(
    userId: string,
    data: {
      title?: string;
      icon?: string;
      color?: string;
      coverUrl?: string;
      position?: string;
    },
  ) {
    let position = data.position;
    if (!position) {
      const [last] = await db
        .select({ position: notebooks.position })
        .from(notebooks)
        .where(eq(notebooks.userId, userId))
        .orderBy(desc(notebooks.position))
        .limit(1);
      position = last?.position ? `${last.position}V` : "a0";
    }

    const [created] = await db
      .insert(notebooks)
      .values({
        userId,
        title: data.title?.trim() || "Untitled notebook",
        icon: data.icon,
        color: data.color,
        coverUrl: data.coverUrl,
        position,
      })
      .returning();

    return created;
  }

  public async updateNotebook(
    notebookId: string,
    userId: string,
    data: Partial<{
      title: string;
      icon: string;
      color: string;
      coverUrl: string;
      position: string;
    }>,
  ) {
    await this.verifyNotebookOwner(notebookId, userId);

    const [updated] = await db
      .update(notebooks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(notebooks.notebookId, notebookId))
      .returning();

    return updated;
  }

  public async archiveNotebook(notebookId: string, userId: string) {
    await this.verifyNotebookOwner(notebookId, userId);

    const [updated] = await db
      .update(notebooks)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notebooks.notebookId, notebookId))
      .returning();

    return updated;
  }

  public async restoreNotebook(notebookId: string, userId: string) {
    await this.verifyNotebookOwner(notebookId, userId);

    const [updated] = await db
      .update(notebooks)
      .set({
        isArchived: false,
        archivedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(notebooks.notebookId, notebookId))
      .returning();

    return updated;
  }

  public async deleteNotebookPermanently(notebookId: string, userId: string) {
    await this.verifyNotebookOwner(notebookId, userId);

    await db.delete(notebooks).where(eq(notebooks.notebookId, notebookId));
    return { success: true, notebookId };
  }

  public async reorderNotebook(
    notebookId: string,
    userId: string,
    position: string,
  ) {
    return await this.updateNotebook(notebookId, userId, { position });
  }

  // Chapters CRUD
  public async getChapters(notebookId: string, userId: string) {
    await this.verifyNotebookOwner(notebookId, userId);

    return await db
      .select()
      .from(chapters)
      .where(
        and(
          eq(chapters.notebookId, notebookId),
          eq(chapters.isArchived, false),
        ),
      )
      .orderBy(asc(chapters.position));
  }

  public async createChapter(
    userId: string,
    data: {
      notebookId: string;
      title?: string;
      icon?: string;
      color?: string;
      position?: string;
      summary?: string;
    },
  ) {
    await this.verifyNotebookOwner(data.notebookId, userId);

    let position = data.position;
    if (!position) {
      const [last] = await db
        .select({ position: chapters.position })
        .from(chapters)
        .where(eq(chapters.notebookId, data.notebookId))
        .orderBy(desc(chapters.position))
        .limit(1);
      position = last?.position ? `${last.position}V` : "a0";
    }

    // Automatically create a dedicated File Dock for this chapter
    const [dock] = await db
      .insert(fileDocks)
      .values({
        userId,
        name: `${data.title || "Untitled"} Files`,
      })
      .returning();

    const [created] = await db
      .insert(chapters)
      .values({
        notebookId: data.notebookId,
        fileDockId: dock?.fileDockId,
        title: data.title?.trim() || "Untitled chapter",
        icon: data.icon,
        color: data.color,
        position,
        summary: data.summary,
      })
      .returning();

    return created;
  }

  public async updateChapter(
    chapterId: string,
    userId: string,
    data: Partial<{
      title: string;
      icon: string;
      color: string;
      position: string;
      summary: string;
      isFavorite: boolean;
    }>,
  ) {
    await this.verifyChapterOwner(chapterId, userId);

    const [updated] = await db
      .update(chapters)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(chapters.chapterId, chapterId))
      .returning();

    return updated;
  }

  public async toggleFavoriteChapter(chapterId: string, userId: string) {
    const chapter = await this.verifyChapterOwner(chapterId, userId);

    const [updated] = await db
      .update(chapters)
      .set({
        isFavorite: !chapter.isFavorite,
        updatedAt: new Date(),
      })
      .where(eq(chapters.chapterId, chapterId))
      .returning();

    return updated;
  }

  public async archiveChapter(chapterId: string, userId: string) {
    await this.verifyChapterOwner(chapterId, userId);

    const [updated] = await db
      .update(chapters)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(chapters.chapterId, chapterId))
      .returning();

    return updated;
  }

  public async restoreChapter(chapterId: string, userId: string) {
    await this.verifyChapterOwner(chapterId, userId);

    const [updated] = await db
      .update(chapters)
      .set({
        isArchived: false,
        archivedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(chapters.chapterId, chapterId))
      .returning();

    return updated;
  }

  public async deleteChapterPermanently(chapterId: string, userId: string) {
    await this.verifyChapterOwner(chapterId, userId);

    await db.delete(chapters).where(eq(chapters.chapterId, chapterId));
    return { success: true, chapterId };
  }

  public async reorderChapter(
    chapterId: string,
    userId: string,
    position: string,
  ) {
    return await this.updateChapter(chapterId, userId, { position });
  }

  // Pages CRUD
  public async getPages(chapterId: string, userId: string) {
    await this.verifyChapterOwner(chapterId, userId);

    return await db
      .select()
      .from(pages)
      .where(and(eq(pages.chapterId, chapterId), eq(pages.isArchived, false)))
      .orderBy(asc(pages.position));
  }

  public async getPageById(pageId: string, userId: string) {
    return await this.verifyPageOwner(pageId, userId);
  }

  public async createPage(
    userId: string,
    data: {
      chapterId: string;
      notebookId: string;
      title?: string;
      summary?: string;
      position?: string;
    },
  ) {
    await this.verifyChapterOwner(data.chapterId, userId);
    await this.verifyNotebookOwner(data.notebookId, userId);

    let position = data.position;
    if (!position) {
      const [last] = await db
        .select({ position: pages.position })
        .from(pages)
        .where(eq(pages.chapterId, data.chapterId))
        .orderBy(desc(pages.position))
        .limit(1);
      position = last?.position ? `${last.position}V` : "a0";
    }

    const [created] = await db
      .insert(pages)
      .values({
        chapterId: data.chapterId,
        notebookId: data.notebookId,
        title: data.title?.trim() || "Untitled",
        summary: data.summary,
        position,
      })
      .returning();

    if (created) {
      // Seed initial empty paragraph block
      await db.insert(blocks).values({
        pageId: created.pageId,
        type: "paragraph",
        position: "a0",
        content: {
          type: "paragraph",
          richText: [{ text: "" }],
        },
        plainText: "",
      });
    }

    return created;
  }

  public async updatePage(
    pageId: string,
    userId: string,
    data: Partial<{
      title: string;
      summary: string;
      position: string;
      isPinned: boolean;
    }>,
  ) {
    await this.verifyPageOwner(pageId, userId);

    const [updated] = await db
      .update(pages)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(pages.pageId, pageId))
      .returning();

    return updated;
  }

  public async togglePinPage(pageId: string, userId: string) {
    const page = await this.verifyPageOwner(pageId, userId);

    const [updated] = await db
      .update(pages)
      .set({
        isPinned: !page.isPinned,
        updatedAt: new Date(),
      })
      .where(eq(pages.pageId, pageId))
      .returning();

    return updated;
  }

  public async movePage(
    pageId: string,
    userId: string,
    targetNotebookId: string,
    targetChapterId: string,
  ) {
    await this.verifyPageOwner(pageId, userId);
    await this.verifyNotebookOwner(targetNotebookId, userId);
    await this.verifyChapterOwner(targetChapterId, userId);

    const [updated] = await db
      .update(pages)
      .set({
        notebookId: targetNotebookId,
        chapterId: targetChapterId,
        updatedAt: new Date(),
      })
      .where(eq(pages.pageId, pageId))
      .returning();

    return updated;
  }

  public async archivePage(pageId: string, userId: string) {
    await this.verifyPageOwner(pageId, userId);

    const [updated] = await db
      .update(pages)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pages.pageId, pageId))
      .returning();

    return updated;
  }

  public async restorePage(pageId: string, userId: string) {
    await this.verifyPageOwner(pageId, userId);

    const [updated] = await db
      .update(pages)
      .set({
        isArchived: false,
        archivedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(pages.pageId, pageId))
      .returning();

    return updated;
  }

  public async deletePagePermanently(pageId: string, userId: string) {
    await this.verifyPageOwner(pageId, userId);

    await db.delete(pages).where(eq(pages.pageId, pageId));
    return { success: true, pageId };
  }

  public async reorderPage(pageId: string, userId: string, position: string) {
    return await this.updatePage(pageId, userId, { position });
  }

  // Blocks CRUD & Autosave
  public async getBlocks(pageId: string, userId: string) {
    await this.verifyPageOwner(pageId, userId);

    return await db
      .select()
      .from(blocks)
      .where(eq(blocks.pageId, pageId))
      .orderBy(asc(blocks.position));
  }

  public async createBlock(
    userId: string,
    data: {
      pageId: string;
      parentBlockId?: string | null;
      type: any;
      content: BlockContent;
      position: string;
      plainText?: string;
    },
  ) {
    await this.verifyPageOwner(data.pageId, userId);

    const [created] = await db
      .insert(blocks)
      .values({
        pageId: data.pageId,
        parentBlockId: data.parentBlockId,
        type: data.type,
        content: data.content,
        position: data.position,
        plainText: data.plainText ?? "",
      })
      .returning();

    // Bump page updatedAt
    await db
      .update(pages)
      .set({ updatedAt: new Date() })
      .where(eq(pages.pageId, data.pageId));

    return created;
  }

  public async updateBlock(
    blockId: string,
    userId: string,
    data: Partial<{
      type: any;
      content: BlockContent;
      position: string;
      parentBlockId: string | null;
      plainText: string;
    }>,
  ) {
    // Find block and verify page ownership
    const [existing] = await db
      .select()
      .from(blocks)
      .where(eq(blocks.blockId, blockId))
      .limit(1);

    if (!existing) {
      throw new AppError("NOT_FOUND", "Block not found");
    }

    await this.verifyPageOwner(existing.pageId, userId);

    const [updated] = await db
      .update(blocks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(blocks.blockId, blockId))
      .returning();

    // Bump page updatedAt
    await db
      .update(pages)
      .set({ updatedAt: new Date() })
      .where(eq(pages.pageId, existing.pageId));

    return updated;
  }

  public async deleteBlock(blockId: string, userId: string) {
    const [existing] = await db
      .select()
      .from(blocks)
      .where(eq(blocks.blockId, blockId))
      .limit(1);

    if (!existing) {
      throw new AppError("NOT_FOUND", "Block not found");
    }

    await this.verifyPageOwner(existing.pageId, userId);

    await db.delete(blocks).where(eq(blocks.blockId, blockId));

    // Bump page updatedAt
    await db
      .update(pages)
      .set({ updatedAt: new Date() })
      .where(eq(pages.pageId, existing.pageId));

    return { success: true, blockId };
  }

  // Atomic batch autosave of page metadata and blocks in a single operation
  public async autosavePage(
    pageId: string,
    userId: string,
    payload: {
      title?: string;
      summary?: string;
      blocks?: Array<{
        blockId?: string;
        parentBlockId?: string | null;
        type: any;
        content: any;
        position: string;
        plainText?: string;
      }>;
    },
  ) {
    await this.verifyPageOwner(pageId, userId);

    // Update page metadata if provided, and always bump updatedAt
    if (payload.title !== undefined || payload.summary !== undefined) {
      await db
        .update(pages)
        .set({
          ...(payload.title !== undefined ? { title: payload.title } : {}),
          ...(payload.summary !== undefined
            ? { summary: payload.summary }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(pages.pageId, pageId));
    } else {
      await db
        .update(pages)
        .set({ updatedAt: new Date() })
        .where(eq(pages.pageId, pageId));
    }

    // Reconcile blocks if provided
    if (payload.blocks && Array.isArray(payload.blocks)) {
      // Fetch existing blocks in database for this page
      const existingDbBlocks = await db
        .select({ blockId: blocks.blockId })
        .from(blocks)
        .where(eq(blocks.pageId, pageId));

      const existingDbBlockIdSet = new Set(
        existingDbBlocks.map((b) => b.blockId),
      );

      // Filter only incoming valid UUIDs that actually exist in the DB for deletion exclusion
      const retainedDbBlockIds = payload.blocks
        .map((b) => b.blockId)
        .filter(
          (id): id is string => isUuid(id) && existingDbBlockIdSet.has(id),
        );

      // Delete blocks no longer present on page
      if (retainedDbBlockIds.length > 0) {
        await db.delete(blocks).where(
          and(
            eq(blocks.pageId, pageId),
            sql`${blocks.blockId} NOT IN (${sql.join(
              retainedDbBlockIds.map((id) => sql`${id}::uuid`),
              sql`, `,
            )})`,
          ),
        );
      } else {
        await db.delete(blocks).where(eq(blocks.pageId, pageId));
      }

      // Map client ID to assigned UUID
      const idMap = new Map<string, string>();
      for (const item of payload.blocks) {
        if (item.blockId) {
          if (isUuid(item.blockId) && existingDbBlockIdSet.has(item.blockId)) {
            idMap.set(item.blockId, item.blockId);
          } else {
            idMap.set(item.blockId, crypto.randomUUID());
          }
        }
      }

      // Upsert incoming blocks
      for (const item of payload.blocks) {
        const assignedId =
          (item.blockId && idMap.get(item.blockId)) ||
          (isUuid(item.blockId) ? item.blockId : crypto.randomUUID());
        const isExistingInDb =
          isUuid(item.blockId) && existingDbBlockIdSet.has(item.blockId);

        let parentId: string | null = null;
        if (item.parentBlockId) {
          parentId =
            idMap.get(item.parentBlockId) ||
            (isUuid(item.parentBlockId) ? item.parentBlockId : null);
        }

        if (isExistingInDb && item.blockId) {
          await db
            .update(blocks)
            .set({
              parentBlockId: parentId,
              type: item.type,
              content: item.content,
              position: item.position,
              plainText: item.plainText ?? "",
              updatedAt: new Date(),
            })
            .where(eq(blocks.blockId, item.blockId));
        } else {
          await db.insert(blocks).values({
            blockId: assignedId,
            pageId,
            parentBlockId: parentId,
            type: item.type,
            content: item.content,
            position: item.position,
            plainText: item.plainText ?? "",
          });
        }
      }
    }

    // Return refreshed page and blocks
    const [refreshedPage] = await db
      .select()
      .from(pages)
      .where(eq(pages.pageId, pageId))
      .limit(1);

    const refreshedBlocks = await db
      .select()
      .from(blocks)
      .where(eq(blocks.pageId, pageId))
      .orderBy(asc(blocks.position));

    return {
      page: refreshedPage,
      blocks: refreshedBlocks,
    };
  }

  // Diagrams CRUD
  public async getDiagram(pageId: string, userId: string) {
    await this.verifyPageOwner(pageId, userId);

    const [diagram] = await db
      .select()
      .from(diagrams)
      .where(eq(diagrams.pageId, pageId))
      .limit(1);

    return diagram ?? null;
  }

  public async saveDiagram(
    pageId: string,
    userId: string,
    data: {
      title?: string;
      kind?: "canvas" | "mermaid" | "diagram_as_code";
      source?: string;
      scene?: any;
    },
  ) {
    await this.verifyPageOwner(pageId, userId);

    const [existing] = await db
      .select()
      .from(diagrams)
      .where(eq(diagrams.pageId, pageId))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(diagrams)
        .set({
          title: data.title ?? existing.title,
          kind: data.kind ?? existing.kind,
          source: data.source ?? existing.source,
          scene: data.scene ?? existing.scene,
          updatedAt: new Date(),
        })
        .where(eq(diagrams.diagramId, existing.diagramId))
        .returning();

      return updated;
    }

    const [created] = await db
      .insert(diagrams)
      .values({
        pageId,
        title: data.title ?? "Untitled Diagram",
        kind: data.kind ?? "canvas",
        source: data.source,
        scene: data.scene,
      })
      .returning();

    return created;
  }

  public async deleteDiagram(diagramId: string, userId: string) {
    const [existing] = await db
      .select()
      .from(diagrams)
      .where(eq(diagrams.diagramId, diagramId))
      .limit(1);

    if (!existing) {
      throw new AppError("NOT_FOUND", "Diagram not found");
    }

    await this.verifyPageOwner(existing.pageId, userId);
    await db.delete(diagrams).where(eq(diagrams.diagramId, diagramId));
    return { success: true, diagramId };
  }

  // Chapter File Dock & Files
  public async getChapterFileDock(chapterId: string, userId: string) {
    const chapter = await this.verifyChapterOwner(chapterId, userId);

    const dockId = chapter.fileDockId;
    if (!dockId) {
      // Do not create a file dock or folder on view - only return empty state
      return {
        dock: null,
        folders: [],
        files: [],
      };
    }

    const [dock] = await db
      .select()
      .from(fileDocks)
      .where(eq(fileDocks.fileDockId, dockId))
      .limit(1);

    const folders = await db
      .select()
      .from(fileDockFolders)
      .where(eq(fileDockFolders.fileDockId, dockId))
      .orderBy(asc(fileDockFolders.position));

    const files = await db
      .select()
      .from(fileDockFiles)
      .where(eq(fileDockFiles.fileDockId, dockId))
      .orderBy(asc(fileDockFiles.position));

    return {
      dock: dock || null,
      folders,
      files,
    };
  }

  public async addDockFile(
    userId: string,
    data: {
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
  ) {
    let effectiveFileDockId = data.fileDockId;

    if (data.chapterId) {
      const chapter = await this.verifyChapterOwner(data.chapterId, userId);
      if (!chapter.fileDockId) {
        // Create file dock with the chapter name and link it to chapter
        const [newDock] = await db
          .insert(fileDocks)
          .values({
            userId,
            name: chapter.title,
          })
          .returning();

        if (!newDock) {
          throw new AppError(
            "INTERNAL_SERVER_ERROR",
            "Failed to create file dock for chapter",
          );
        }

        await db
          .update(chapters)
          .set({ fileDockId: newDock.fileDockId })
          .where(eq(chapters.chapterId, data.chapterId));

        effectiveFileDockId = newDock.fileDockId;
      } else {
        effectiveFileDockId = chapter.fileDockId;
      }
    } else if (effectiveFileDockId) {
      await this.verifyFileDockOwner(effectiveFileDockId, userId);
    } else {
      throw new AppError(
        "BAD_REQUEST",
        "Either chapterId or fileDockId must be provided",
      );
    }

    let position = data.position;
    if (!position) {
      const [last] = await db
        .select({ position: fileDockFiles.position })
        .from(fileDockFiles)
        .where(eq(fileDockFiles.fileDockId, effectiveFileDockId))
        .orderBy(desc(fileDockFiles.position))
        .limit(1);
      position = last?.position ? `${last.position}V` : "a0";
    }

    const [created] = await db
      .insert(fileDockFiles)
      .values({
        fileDockId: effectiveFileDockId,
        folderId: null, // do not create or assign folder for chapter dock
        name: data.name,
        cloudinaryPublicId: data.cloudinaryPublicId,
        cloudinaryUrl: data.cloudinaryUrl,
        resourceType: data.resourceType,
        format: data.format,
        mimeType: data.mimeType,
        bytes: data.bytes,
        position,
      })
      .returning();

    return created;
  }

  public async deleteDockFile(fileId: string, userId: string) {
    const [file] = await db
      .select()
      .from(fileDockFiles)
      .where(eq(fileDockFiles.fileId, fileId))
      .limit(1);

    if (!file) {
      throw new AppError("NOT_FOUND", "File not found");
    }

    await this.verifyFileDockOwner(file.fileDockId, userId);
    await db.delete(fileDockFiles).where(eq(fileDockFiles.fileId, fileId));
    return { success: true, fileId };
  }

  public async createDockFolder(
    userId: string,
    data: {
      fileDockId: string;
      parentFolderId?: string | null;
      name: string;
      position?: string;
    },
  ) {
    await this.verifyFileDockOwner(data.fileDockId, userId);

    let position = data.position;
    if (!position) {
      const [last] = await db
        .select({ position: fileDockFolders.position })
        .from(fileDockFolders)
        .where(eq(fileDockFolders.fileDockId, data.fileDockId))
        .orderBy(desc(fileDockFolders.position))
        .limit(1);
      position = last?.position ? `${last.position}V` : "a0";
    }

    const [created] = await db
      .insert(fileDockFolders)
      .values({
        fileDockId: data.fileDockId,
        parentFolderId: data.parentFolderId ?? null,
        name: data.name,
        position,
      })
      .returning();

    return created;
  }

  public async deleteDockFolder(folderId: string, userId: string) {
    const [folder] = await db
      .select()
      .from(fileDockFolders)
      .where(eq(fileDockFolders.folderId, folderId))
      .limit(1);

    if (!folder) {
      throw new AppError("NOT_FOUND", "Folder not found");
    }

    await this.verifyFileDockOwner(folder.fileDockId, userId);
    await db
      .delete(fileDockFolders)
      .where(eq(fileDockFolders.folderId, folderId));
    return { success: true, folderId };
  }

  // Search & Trash
  public async searchNotes(userId: string, query: string, notebookId?: string) {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    // Search matching pages by title and plainText content in blocks
    const conditions = [
      eq(notebooks.userId, userId),
      eq(pages.isArchived, false),
      notebookId ? eq(pages.notebookId, notebookId) : sql`true`,
      or(
        sql`LOWER(${pages.title}) LIKE ${`%${cleanQuery}%`}`,
        sql`LOWER(${pages.summary}) LIKE ${`%${cleanQuery}%`}`,
        sql`LOWER(${blocks.plainText}) LIKE ${`%${cleanQuery}%`}`,
      ),
    ];

    const results = await db
      .select({
        page: pages,
        notebookTitle: notebooks.title,
        chapterTitle: chapters.title,
        blockPlainText: blocks.plainText,
      })
      .from(pages)
      .innerJoin(notebooks, eq(pages.notebookId, notebooks.notebookId))
      .innerJoin(chapters, eq(pages.chapterId, chapters.chapterId))
      .leftJoin(blocks, eq(pages.pageId, blocks.pageId))
      .where(and(...conditions))
      .limit(30);

    // Group by page to avoid duplicate search rows
    const pageMap = new Map<string, any>();
    for (const r of results) {
      if (!pageMap.has(r.page.pageId)) {
        const isTitleMatch = r.page.title.toLowerCase().includes(cleanQuery);
        pageMap.set(r.page.pageId, {
          page: r.page,
          notebookTitle: r.notebookTitle,
          chapterTitle: r.chapterTitle,
          matchedText: isTitleMatch
            ? r.page.title
            : r.blockPlainText || r.page.summary || "",
          rankingScore: isTitleMatch ? 100 : 50,
          matchType: isTitleMatch ? "title" : "content",
        });
      }
    }

    return Array.from(pageMap.values());
  }

  public async getTrash(userId: string) {
    const archivedNotebooks = await db
      .select()
      .from(notebooks)
      .where(and(eq(notebooks.userId, userId), eq(notebooks.isArchived, true)))
      .orderBy(desc(notebooks.archivedAt));

    const archivedChapters = await db
      .select({ chapter: chapters, notebook: notebooks })
      .from(chapters)
      .innerJoin(notebooks, eq(chapters.notebookId, notebooks.notebookId))
      .where(and(eq(notebooks.userId, userId), eq(chapters.isArchived, true)))
      .orderBy(desc(chapters.archivedAt));

    const archivedPages = await db
      .select({ page: pages, notebook: notebooks, chapter: chapters })
      .from(pages)
      .innerJoin(notebooks, eq(pages.notebookId, notebooks.notebookId))
      .innerJoin(chapters, eq(pages.chapterId, chapters.chapterId))
      .where(and(eq(notebooks.userId, userId), eq(pages.isArchived, true)))
      .orderBy(desc(pages.archivedAt));

    return {
      notebooks: archivedNotebooks,
      chapters: archivedChapters.map((c) => ({
        ...c.chapter,
        notebookTitle: c.notebook.title,
      })),
      pages: archivedPages.map((p) => ({
        ...p.page,
        notebookTitle: p.notebook.title,
        chapterTitle: p.chapter.title,
      })),
    };
  }

  // Fetch bookmark metadata with OpenGraph and HTML title/description parsing
  public async fetchBookmarkMetadata(rawUrl: string) {
    let url = rawUrl.trim();
    if (!url) {
      return { url: "", title: "", description: "", favicon: "" };
    }
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { url, title: url, description: "", favicon: "" };
    }

    const fallback = {
      url: parsed.href,
      title: parsed.hostname.replace(/^www\./, ""),
      description: "",
      favicon: `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`,
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(parsed.href, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return fallback;
      }

      const html = await res.text();

      let title = "";
      const ogTitle =
        html.match(
          /<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["']/i,
        ) ||
        html.match(
          /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:title["']/i,
        );
      if (ogTitle?.[1]) {
        title = ogTitle[1];
      } else {
        const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleTag?.[1]) {
          title = titleTag[1];
        }
      }

      let description = "";
      const ogDesc =
        html.match(
          /<meta[^>]+(?:property|name)=["']og:description["'][^>]+content=["']([^"']+)["']/i,
        ) ||
        html.match(
          /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:description["']/i,
        );
      if (ogDesc?.[1]) {
        description = ogDesc[1];
      } else {
        const metaDesc =
          html.match(
            /<meta[^>]+(?:property|name)=["']description["'][^>]+content=["']([^"']+)["']/i,
          ) ||
          html.match(
            /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']description["']/i,
          );
        if (metaDesc?.[1]) {
          description = metaDesc[1];
        }
      }

      let favicon = fallback.favicon;
      const iconMatch =
        html.match(
          /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
        ) ||
        html.match(
          /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
        );
      if (iconMatch?.[1]) {
        const rawIcon = iconMatch[1].trim();
        if (rawIcon.startsWith("//")) {
          favicon = `${parsed.protocol}${rawIcon}`;
        } else if (rawIcon.startsWith("/")) {
          favicon = `${parsed.origin}${rawIcon}`;
        } else if (/^https?:\/\//i.test(rawIcon)) {
          favicon = rawIcon;
        } else {
          favicon = `${parsed.origin}/${rawIcon}`;
        }
      }

      const clean = (s: string) =>
        s
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, "/")
          .replace(/\s+/g, " ")
          .trim();

      return {
        url: parsed.href,
        title: title ? clean(title) : fallback.title,
        description: description ? clean(description) : "",
        favicon,
      };
    } catch {
      return fallback;
    }
  }
}

export default NoteService;
