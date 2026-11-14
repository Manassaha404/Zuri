"use client";

// Hook managing search and trash queries for notes workspace
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";

export function useNotesSearch(query: string, notebookId?: string) {
  const userId = useUserInfoStore((s) => s.userId);
  const cleanQuery = query.trim();

  const searchQuery = trpc.notes.searchNotes.useQuery(
    { query: cleanQuery, notebookId },
    {
      enabled: Boolean(userId && cleanQuery.length > 0),
      staleTime: 1000 * 10,
    },
  );

  return {
    results: searchQuery.data || [],
    isLoading: searchQuery.isLoading,
    isFetching: searchQuery.isFetching,
    error: searchQuery.error,
  };
}

export function useNotesTrash() {
  const userId = useUserInfoStore((s) => s.userId);

  const trashQuery = trpc.notes.getTrash.useQuery(undefined, {
    enabled: Boolean(userId),
    staleTime: 1000 * 30,
  });

  return {
    notebooks: trashQuery.data?.notebooks || [],
    chapters: trashQuery.data?.chapters || [],
    pages: trashQuery.data?.pages || [],
    isLoading: trashQuery.isLoading,
    refetch: trashQuery.refetch,
  };
}
