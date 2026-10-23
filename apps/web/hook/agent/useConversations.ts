"use client";

import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";

// Hook
export function useConversations() {
  const userId = useUserInfoStore((state) => state.userId);
  const isInitialized = useUserInfoStore((state) => state.isInitialized);

  const query = trpc.agent.getAllConversations.useQuery(undefined, {
    enabled: Boolean(userId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  return {
    conversations: query.data ?? [],
    isLoading: isInitialized && Boolean(userId) ? query.isLoading : false,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
