"use client";

import { useMemo, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";

export type ZuriMemoryType = "profile" | "episodic" | "semantic" | "procedural";

// Backwards compatibility alias
export type MemoryBranchType = ZuriMemoryType;

export interface ZuriUserMemory {
  key: string;
  text: string;
  type: ZuriMemoryType;
  namespace?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Backwards compatibility alias
export type UserMemory = ZuriUserMemory;

const EMPTY_MEMORIES: ZuriUserMemory[] = [];

// Hook for fetching and managing user long-term memories
export function useUserMemories() {
  const userId = useUserInfoStore((state) => state.userId);
  const isInitialized = useUserInfoStore((state) => state.isInitialized);
  const utils = trpc.useUtils();

  const query = trpc.agent.getUserMemories.useQuery(undefined, {
    enabled: Boolean(userId),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const memories: ZuriUserMemory[] =
    (query.data as ZuriUserMemory[]) ?? EMPTY_MEMORIES;

  // Grouped memories by type
  const profileMemories = useMemo(
    () => memories.filter((m) => m.type === "profile"),
    [memories],
  );

  const episodicMemories = useMemo(
    () => memories.filter((m) => m.type === "episodic"),
    [memories],
  );

  const semanticMemories = useMemo(
    () => memories.filter((m) => m.type === "semantic"),
    [memories],
  );

  const proceduralMemories = useMemo(
    () => memories.filter((m) => m.type === "procedural"),
    [memories],
  );

  // Create memory mutation
  const createMutation = trpc.agent.createUserMemory.useMutation({
    onSuccess: () => {
      utils.agent.getUserMemories.invalidate();
    },
  });

  // Update memory mutation
  const updateMutation = trpc.agent.updateUserMemory.useMutation({
    onSuccess: () => {
      utils.agent.getUserMemories.invalidate();
    },
  });

  // Delete memory mutation
  const deleteMutation = trpc.agent.deleteUserMemory.useMutation({
    onSuccess: () => {
      utils.agent.getUserMemories.invalidate();
    },
  });

  const createMemory = useCallback(
    async (text: string, type: ZuriMemoryType) => {
      return await createMutation.mutateAsync({ text, type });
    },
    [createMutation],
  );

  const updateMemory = useCallback(
    async (
      key: string,
      text: string,
      type: ZuriMemoryType,
      currentNamespace?: string[],
    ) => {
      return await updateMutation.mutateAsync({
        key,
        text,
        type,
        currentNamespace,
      });
    },
    [updateMutation],
  );

  const deleteMemory = useCallback(
    async (key: string, type?: ZuriMemoryType, namespace?: string[]) => {
      return await deleteMutation.mutateAsync({
        key,
        type,
        namespace,
      });
    },
    [deleteMutation],
  );

  return {
    memories,
    profileMemories,
    episodicMemories,
    semanticMemories,
    proceduralMemories,
    isLoading: isInitialized && Boolean(userId) ? query.isLoading : false,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    createMemory,
    updateMemory,
    deleteMemory,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
