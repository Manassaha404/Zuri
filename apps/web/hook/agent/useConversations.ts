"use client";

import { useMemo } from "react";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";

const EMPTY_CONVERSATIONS: any[] = [];

// Hook
export function useConversations() {
  const userId = useUserInfoStore((state) => state.userId);
  const isInitialized = useUserInfoStore((state) => state.isInitialized);

  const query = trpc.agent.getAllConversations.useQuery(undefined, {
    enabled: Boolean(userId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  const conversations = query.data ?? EMPTY_CONVERSATIONS;

  const pinnedConversations = useMemo(
    () => conversations.filter((c) => Boolean(c.isPinned)),
    [conversations],
  );

  const recentConversations = useMemo(
    () => conversations.filter((c) => !c.isPinned),
    [conversations],
  );

  return {
    conversations,
    pinnedConversations,
    recentConversations,
    isLoading: isInitialized && Boolean(userId) ? query.isLoading : false,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
