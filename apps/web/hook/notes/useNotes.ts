"use client";

// Hook managing notes workspace query, hierarchical navigation, and lifecycle mutations
import { useEffect, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";
import { useNotesStore } from "@/store/notesStore";
import type { Notebook, Chapter, Page } from "@/components/notes/types";

export function useNotes() {
  const userId = useUserInfoStore((s) => s.userId);
  const isInitialized = useUserInfoStore((s) => s.isInitialized);
  const setWorkspaceData = useNotesStore((s) => s.setWorkspaceData);

  const utils = trpc.useUtils();

  // Query workspace hierarchy (notebooks, chapters, pages)
  const workspaceQuery = trpc.notes.getWorkspace.useQuery(undefined, {
    enabled: Boolean(isInitialized && userId),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  // Sync workspace data into Zustand store
  useEffect(() => {
    if (workspaceQuery.data) {
      setWorkspaceData({
        notebooks:
          (workspaceQuery.data.notebooks as unknown as Notebook[]) || [],
        chapters: (workspaceQuery.data.chapters as unknown as Chapter[]) || [],
        pages: (workspaceQuery.data.pages as unknown as Page[]) || [],
      });
    }
  }, [workspaceQuery.data, setWorkspaceData]);

  // Notebook Mutations
  const createNotebookMutation = trpc.notes.createNotebook.useMutation({
    onSuccess: (newNb) => {
      utils.notes.getWorkspace.invalidate();
      if (newNb) {
        useNotesStore.getState().setActiveNotebook(newNb.notebookId);
      }
    },
  });

  const updateNotebookMutation = trpc.notes.updateNotebook.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
    },
  });

  const archiveNotebookMutation = trpc.notes.archiveNotebook.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
      utils.notes.getTrash.invalidate();
    },
  });

  const restoreNotebookMutation = trpc.notes.restoreNotebook.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
      utils.notes.getTrash.invalidate();
    },
  });

  const deleteNotebookMutation =
    trpc.notes.deleteNotebookPermanently.useMutation({
      onSuccess: () => {
        utils.notes.getWorkspace.invalidate();
        utils.notes.getTrash.invalidate();
      },
    });

  const reorderNotebookMutation = trpc.notes.reorderNotebook.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
    },
  });

  // Chapter Mutations
  const createChapterMutation = trpc.notes.createChapter.useMutation({
    onSuccess: (newCh) => {
      utils.notes.getWorkspace.invalidate();
      if (newCh) {
        useNotesStore.getState().setActiveChapter(newCh.chapterId);
      }
    },
  });

  const updateChapterMutation = trpc.notes.updateChapter.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
    },
  });

  const toggleFavoriteChapterMutation =
    trpc.notes.toggleFavoriteChapter.useMutation({
      onSuccess: () => {
        utils.notes.getWorkspace.invalidate();
      },
    });

  const archiveChapterMutation = trpc.notes.archiveChapter.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
      utils.notes.getTrash.invalidate();
    },
  });

  const restoreChapterMutation = trpc.notes.restoreChapter.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
      utils.notes.getTrash.invalidate();
    },
  });

  const deleteChapterMutation = trpc.notes.deleteChapterPermanently.useMutation(
    {
      onSuccess: () => {
        utils.notes.getWorkspace.invalidate();
        utils.notes.getTrash.invalidate();
      },
    },
  );

  const reorderChapterMutation = trpc.notes.reorderChapter.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
    },
  });

  // Page Mutations
  const createPageMutation = trpc.notes.createPage.useMutation({
    onSuccess: (newPage) => {
      utils.notes.getWorkspace.invalidate();
      if (newPage) {
        useNotesStore.getState().setActivePage(newPage.pageId);
      }
    },
  });

  const updatePageMutation = trpc.notes.updatePage.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
    },
  });

  const togglePinPageMutation = trpc.notes.togglePinPage.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
    },
  });

  const movePageMutation = trpc.notes.movePage.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
    },
  });

  const archivePageMutation = trpc.notes.archivePage.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
      utils.notes.getTrash.invalidate();
    },
  });

  const restorePageMutation = trpc.notes.restorePage.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
      utils.notes.getTrash.invalidate();
    },
  });

  const deletePageMutation = trpc.notes.deletePagePermanently.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
      utils.notes.getTrash.invalidate();
    },
  });

  const reorderPageMutation = trpc.notes.reorderPage.useMutation({
    onSuccess: () => {
      utils.notes.getWorkspace.invalidate();
    },
  });

  // Actions connecting store and server mutations
  const createNotebook = useCallback(
    async (data: Partial<Notebook>) => {
      const res = await createNotebookMutation.mutateAsync({
        title: data.title,
        icon: data.icon,
        color: data.color,
        coverUrl: data.coverUrl,
        position: data.position,
      });
      return res;
    },
    [createNotebookMutation],
  );

  const updateNotebook = useCallback(
    async (notebookId: string, data: Partial<Notebook>) => {
      useNotesStore.getState().updateNotebook(notebookId, data);
      return await updateNotebookMutation.mutateAsync({
        notebookId,
        title: data.title,
        icon: data.icon,
        color: data.color,
        coverUrl: data.coverUrl,
        position: data.position,
      });
    },
    [updateNotebookMutation],
  );

  const archiveNotebook = useCallback(
    async (notebookId: string) => {
      useNotesStore.getState().archiveNotebook(notebookId);
      return await archiveNotebookMutation.mutateAsync({ notebookId });
    },
    [archiveNotebookMutation],
  );

  const restoreNotebook = useCallback(
    async (notebookId: string) => {
      useNotesStore.getState().restoreNotebook(notebookId);
      return await restoreNotebookMutation.mutateAsync({ notebookId });
    },
    [restoreNotebookMutation],
  );

  const deleteNotebookPermanently = useCallback(
    async (notebookId: string) => {
      useNotesStore.getState().deleteNotebookPermanently(notebookId);
      return await deleteNotebookMutation.mutateAsync({ notebookId });
    },
    [deleteNotebookMutation],
  );

  const reorderNotebook = useCallback(
    async (notebookId: string, position: string) => {
      useNotesStore.getState().reorderNotebook(notebookId, position);
      return await reorderNotebookMutation.mutateAsync({
        notebookId,
        position,
      });
    },
    [reorderNotebookMutation],
  );

  const createChapter = useCallback(
    async (data: {
      notebookId: string;
      title?: string;
      icon?: string;
      color?: string;
      position?: string;
      summary?: string;
    }) => {
      return await createChapterMutation.mutateAsync(data);
    },
    [createChapterMutation],
  );

  const updateChapter = useCallback(
    async (chapterId: string, data: Partial<Chapter>) => {
      useNotesStore.getState().updateChapter(chapterId, data);
      return await updateChapterMutation.mutateAsync({
        chapterId,
        title: data.title,
        icon: data.icon,
        color: data.color,
        position: data.position,
        summary: data.summary,
        isFavorite: data.isFavorite,
      });
    },
    [updateChapterMutation],
  );

  const toggleFavoriteChapter = useCallback(
    async (chapterId: string) => {
      useNotesStore.getState().toggleFavoriteChapter(chapterId);
      return await toggleFavoriteChapterMutation.mutateAsync({ chapterId });
    },
    [toggleFavoriteChapterMutation],
  );

  const archiveChapter = useCallback(
    async (chapterId: string) => {
      useNotesStore.getState().archiveChapter(chapterId);
      return await archiveChapterMutation.mutateAsync({ chapterId });
    },
    [archiveChapterMutation],
  );

  const restoreChapter = useCallback(
    async (chapterId: string) => {
      useNotesStore.getState().restoreChapter(chapterId);
      return await restoreChapterMutation.mutateAsync({ chapterId });
    },
    [restoreChapterMutation],
  );

  const deleteChapterPermanently = useCallback(
    async (chapterId: string) => {
      useNotesStore.getState().deleteChapterPermanently(chapterId);
      return await deleteChapterMutation.mutateAsync({ chapterId });
    },
    [deleteChapterMutation],
  );

  const reorderChapter = useCallback(
    async (chapterId: string, position: string) => {
      useNotesStore.getState().reorderChapter(chapterId, position);
      return await reorderChapterMutation.mutateAsync({ chapterId, position });
    },
    [reorderChapterMutation],
  );

  const createPage = useCallback(
    async (notebookId: string, chapterId: string, title?: string) => {
      return await createPageMutation.mutateAsync({
        notebookId,
        chapterId,
        title,
      });
    },
    [createPageMutation],
  );

  const updatePageTitle = useCallback(
    async (pageId: string, title: string) => {
      useNotesStore.getState().updatePageTitle(pageId, title);
      return await updatePageMutation.mutateAsync({ pageId, title });
    },
    [updatePageMutation],
  );

  const updatePageSummary = useCallback(
    async (pageId: string, summary: string) => {
      useNotesStore.getState().updatePageSummary(pageId, summary);
      return await updatePageMutation.mutateAsync({ pageId, summary });
    },
    [updatePageMutation],
  );

  const togglePinPage = useCallback(
    async (pageId: string) => {
      useNotesStore.getState().togglePinPage(pageId);
      return await togglePinPageMutation.mutateAsync({ pageId });
    },
    [togglePinPageMutation],
  );

  const movePage = useCallback(
    async (
      pageId: string,
      targetNotebookId: string,
      targetChapterId: string,
    ) => {
      useNotesStore
        .getState()
        .movePage(pageId, targetNotebookId, targetChapterId);
      return await movePageMutation.mutateAsync({
        pageId,
        targetNotebookId,
        targetChapterId,
      });
    },
    [movePageMutation],
  );

  const archivePage = useCallback(
    async (pageId: string) => {
      useNotesStore.getState().archivePage(pageId);
      try {
        return await archivePageMutation.mutateAsync({ pageId });
      } catch (err) {
        utils.notes.getWorkspace.invalidate();
        throw err;
      }
    },
    [archivePageMutation, utils],
  );

  const restorePage = useCallback(
    async (pageId: string) => {
      useNotesStore.getState().restorePage(pageId);
      try {
        return await restorePageMutation.mutateAsync({ pageId });
      } catch (err) {
        utils.notes.getWorkspace.invalidate();
        throw err;
      }
    },
    [restorePageMutation, utils],
  );

  const deletePagePermanently = useCallback(
    async (pageId: string) => {
      useNotesStore.getState().deletePagePermanently(pageId);
      try {
        return await deletePageMutation.mutateAsync({ pageId });
      } catch (err) {
        utils.notes.getWorkspace.invalidate();
        throw err;
      }
    },
    [deletePageMutation, utils],
  );

  const reorderPage = useCallback(
    async (pageId: string, position: string) => {
      useNotesStore.getState().reorderPage(pageId, position);
      return await reorderPageMutation.mutateAsync({ pageId, position });
    },
    [reorderPageMutation],
  );

  return {
    isLoading: workspaceQuery.isLoading,
    isFetching: workspaceQuery.isFetching,
    error: workspaceQuery.error,
    refetch: workspaceQuery.refetch,

    // Notebook Actions
    createNotebook,
    updateNotebook,
    archiveNotebook,
    restoreNotebook,
    deleteNotebookPermanently,
    reorderNotebook,

    // Chapter Actions
    createChapter,
    updateChapter,
    toggleFavoriteChapter,
    archiveChapter,
    restoreChapter,
    deleteChapterPermanently,
    reorderChapter,

    // Page Actions
    createPage,
    updatePageTitle,
    updatePageSummary,
    togglePinPage,
    movePage,
    archivePage,
    restorePage,
    deletePagePermanently,
    reorderPage,
  };
}
