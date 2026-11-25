// File Dock Service - Core business logic for managing file docks, nestable folders, and saved files
import db, { eq, and, asc, desc, inArray } from "@repo/database";
import {
  fileDocks,
  fileDockFolders,
  fileDockFiles,
} from "@repo/database/models";
import { AppError } from "@repo/error";

export interface AddFileDockFileInput {
  fileDockId: string;
  folderId?: string | null;
  name: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  resourceType: "image" | "video" | "raw";
  format?: string | null;
  mimeType?: string | null;
  bytes?: number | null;
  position?: string | null;
}

export class FileDockService {
  // Verify user owns the file dock
  private async verifyDockOwner(fileDockId: string, userId: string) {
    const [dock] = await db
      .select()
      .from(fileDocks)
      .where(
        and(eq(fileDocks.fileDockId, fileDockId), eq(fileDocks.userId, userId)),
      )
      .limit(1);

    if (!dock) {
      throw new AppError("NOT_FOUND", "File dock not found");
    }
    return dock;
  }

  // Verify user owns the folder via its parent dock
  private async verifyFolderOwner(folderId: string, userId: string) {
    const [folder] = await db
      .select()
      .from(fileDockFolders)
      .where(eq(fileDockFolders.folderId, folderId))
      .limit(1);

    if (!folder) {
      throw new AppError("NOT_FOUND", "Folder not found");
    }

    await this.verifyDockOwner(folder.fileDockId, userId);
    return folder;
  }

  // Verify user owns the file via its parent dock
  private async verifyFileOwner(fileId: string, userId: string) {
    const [file] = await db
      .select()
      .from(fileDockFiles)
      .where(eq(fileDockFiles.fileId, fileId))
      .limit(1);

    if (!file) {
      throw new AppError("NOT_FOUND", "File not found");
    }

    await this.verifyDockOwner(file.fileDockId, userId);
    return file;
  }

  // Get full workspace (all docks, folders, and files for user; seeds default dock if empty)
  async getWorkspace(userId: string) {
    let docks = await db
      .select()
      .from(fileDocks)
      .where(eq(fileDocks.userId, userId))
      .orderBy(asc(fileDocks.createdAt));

    if (docks.length === 0) {
      const [defaultDock] = await db
        .insert(fileDocks)
        .values({
          userId,
          name: "File Dock",
        })
        .returning();

      if (defaultDock) {
        docks = [defaultDock];
      }
    }

    const dockIds = docks.map((d) => d.fileDockId);
    if (dockIds.length === 0) {
      return { docks: [], folders: [], files: [] };
    }

    const folders = await db
      .select()
      .from(fileDockFolders)
      .where(inArray(fileDockFolders.fileDockId, dockIds))
      .orderBy(asc(fileDockFolders.position), asc(fileDockFolders.createdAt));

    const files = await db
      .select()
      .from(fileDockFiles)
      .where(inArray(fileDockFiles.fileDockId, dockIds))
      .orderBy(desc(fileDockFiles.createdAt));

    return {
      docks,
      folders,
      files,
    };
  }

  // Create a new file dock
  async createDock(userId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new AppError("BAD_REQUEST", "Dock name is required");
    }

    const [created] = await db
      .insert(fileDocks)
      .values({
        userId,
        name: trimmed,
      })
      .returning();

    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create file dock");
    }

    return created;
  }

  // Rename an existing file dock
  async renameDock(userId: string, fileDockId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new AppError("BAD_REQUEST", "Dock name is required");
    }

    await this.verifyDockOwner(fileDockId, userId);

    const [updated] = await db
      .update(fileDocks)
      .set({ name: trimmed, updatedAt: new Date() })
      .where(
        and(eq(fileDocks.fileDockId, fileDockId), eq(fileDocks.userId, userId)),
      )
      .returning();

    return updated;
  }

  // Delete a file dock (cascades folders and files)
  async deleteDock(userId: string, fileDockId: string) {
    await this.verifyDockOwner(fileDockId, userId);
    await db
      .delete(fileDocks)
      .where(
        and(eq(fileDocks.fileDockId, fileDockId), eq(fileDocks.userId, userId)),
      );
    return { success: true, fileDockId };
  }

  // Create a nestable folder inside a dock
  async createFolder(
    userId: string,
    data: {
      fileDockId: string;
      parentFolderId?: string | null;
      name: string;
    },
  ) {
    const trimmed = data.name.trim();
    if (!trimmed) {
      throw new AppError("BAD_REQUEST", "Folder name is required");
    }

    await this.verifyDockOwner(data.fileDockId, userId);

    if (data.parentFolderId) {
      const parent = await this.verifyFolderOwner(data.parentFolderId, userId);
      if (parent.fileDockId !== data.fileDockId) {
        throw new AppError(
          "BAD_REQUEST",
          "Parent folder belongs to a different dock",
        );
      }
    }

    const [last] = await db
      .select({ position: fileDockFolders.position })
      .from(fileDockFolders)
      .where(eq(fileDockFolders.fileDockId, data.fileDockId))
      .orderBy(desc(fileDockFolders.position))
      .limit(1);

    const position = last?.position ? `${last.position}V` : "a0";

    const [created] = await db
      .insert(fileDockFolders)
      .values({
        fileDockId: data.fileDockId,
        parentFolderId: data.parentFolderId ?? null,
        name: trimmed,
        position,
      })
      .returning();

    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create folder");
    }

    return created;
  }

  // Rename a folder
  async renameFolder(userId: string, folderId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new AppError("BAD_REQUEST", "Folder name is required");
    }

    await this.verifyFolderOwner(folderId, userId);

    const [updated] = await db
      .update(fileDockFolders)
      .set({ name: trimmed, updatedAt: new Date() })
      .where(eq(fileDockFolders.folderId, folderId))
      .returning();

    return updated;
  }

  // Move a folder to another parent folder (or root when parentFolderId is null)
  async moveFolder(
    userId: string,
    folderId: string,
    parentFolderId: string | null,
  ) {
    const folder = await this.verifyFolderOwner(folderId, userId);

    if (parentFolderId) {
      if (parentFolderId === folderId) {
        throw new AppError("BAD_REQUEST", "Cannot move a folder into itself");
      }

      const targetParent = await this.verifyFolderOwner(parentFolderId, userId);
      if (targetParent.fileDockId !== folder.fileDockId) {
        throw new AppError(
          "BAD_REQUEST",
          "Target parent folder belongs to a different dock",
        );
      }

      // Prevent circular nesting by walking up the target parent's ancestors
      const dockFolders = await db
        .select()
        .from(fileDockFolders)
        .where(eq(fileDockFolders.fileDockId, folder.fileDockId));

      const parentMap = new Map(
        dockFolders.map((f) => [f.folderId, f.parentFolderId]),
      );

      let cursor: string | null | undefined = parentFolderId;
      while (cursor) {
        if (cursor === folderId) {
          throw new AppError(
            "BAD_REQUEST",
            "Cannot move a folder into its own descendant",
          );
        }
        cursor = parentMap.get(cursor);
      }
    }

    const [updated] = await db
      .update(fileDockFolders)
      .set({ parentFolderId, updatedAt: new Date() })
      .where(eq(fileDockFolders.folderId, folderId))
      .returning();

    return updated;
  }

  // Delete a folder (cascades child folders; files in deleted folders move to root via set null)
  async deleteFolder(userId: string, folderId: string) {
    await this.verifyFolderOwner(folderId, userId);
    await db
      .delete(fileDockFolders)
      .where(eq(fileDockFolders.folderId, folderId));
    return { success: true, folderId };
  }

  // Save a newly uploaded file into a dock / folder
  async addFile(userId: string, data: AddFileDockFileInput) {
    await this.verifyDockOwner(data.fileDockId, userId);

    if (data.folderId) {
      const folder = await this.verifyFolderOwner(data.folderId, userId);
      if (folder.fileDockId !== data.fileDockId) {
        throw new AppError("BAD_REQUEST", "Folder belongs to a different dock");
      }
    }

    let position = data.position;
    if (!position) {
      const [last] = await db
        .select({ position: fileDockFiles.position })
        .from(fileDockFiles)
        .where(eq(fileDockFiles.fileDockId, data.fileDockId))
        .orderBy(desc(fileDockFiles.position))
        .limit(1);
      position = last?.position ? `${last.position}V` : "a0";
    }

    const [created] = await db
      .insert(fileDockFiles)
      .values({
        fileDockId: data.fileDockId,
        folderId: data.folderId ?? null,
        name: data.name.trim() || "Untitled file",
        cloudinaryPublicId: data.cloudinaryPublicId,
        cloudinaryUrl: data.cloudinaryUrl,
        resourceType: data.resourceType,
        format: data.format ?? null,
        mimeType: data.mimeType ?? null,
        bytes: data.bytes ?? null,
        position,
      })
      .returning();

    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to save file");
    }

    return created;
  }

  // Rename a saved file
  async renameFile(userId: string, fileId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new AppError("BAD_REQUEST", "File name is required");
    }

    await this.verifyFileOwner(fileId, userId);

    const [updated] = await db
      .update(fileDockFiles)
      .set({ name: trimmed })
      .where(eq(fileDockFiles.fileId, fileId))
      .returning();

    return updated;
  }

  // Move a file to another dock and/or folder
  async moveFile(
    userId: string,
    fileId: string,
    targetDockId: string,
    targetFolderId: string | null,
  ) {
    await this.verifyFileOwner(fileId, userId);
    await this.verifyDockOwner(targetDockId, userId);

    if (targetFolderId) {
      const folder = await this.verifyFolderOwner(targetFolderId, userId);
      if (folder.fileDockId !== targetDockId) {
        throw new AppError(
          "BAD_REQUEST",
          "Target folder belongs to a different dock",
        );
      }
    }

    const [updated] = await db
      .update(fileDockFiles)
      .set({
        fileDockId: targetDockId,
        folderId: targetFolderId,
      })
      .where(eq(fileDockFiles.fileId, fileId))
      .returning();

    return updated;
  }

  // Delete a saved file
  async deleteFile(userId: string, fileId: string) {
    await this.verifyFileOwner(fileId, userId);
    await db.delete(fileDockFiles).where(eq(fileDockFiles.fileId, fileId));
    return { success: true, fileId };
  }
}

export default FileDockService;
