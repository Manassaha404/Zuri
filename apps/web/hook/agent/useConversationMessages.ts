"use client";

import { useEffect, useRef } from "react";
import { trpc } from "@/trpc/client";
import { useAgentStore, type AgentMessage } from "@/store/agentStore";

// Hook
export function useConversationMessages(conversationId?: string | null) {
  const setMessages = useAgentStore((state) => state.setMessages);
  const setTitle = useAgentStore((state) => state.setTitle);
  const loadedConversationIdRef = useRef<string | null>(null);

  const isValidUuid = Boolean(
    conversationId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      conversationId,
    ),
  );

  const query = trpc.agent.getConversationMessages.useQuery(
    { conversationId: conversationId! },
    {
      enabled: isValidUuid,
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  );

  // Sync loaded past messages into agent store without overwriting active user turns
  useEffect(() => {
    if (
      query.data &&
      query.data.conversationId === conversationId &&
      Array.isArray(query.data.messages) &&
      query.data.messages.length > 0
    ) {
      const storeState = useAgentStore.getState();
      // Only populate if not currently in an active running turn
      if (
        storeState.status !== "running" &&
        (storeState.messages.length === 0 ||
          loadedConversationIdRef.current !== conversationId)
      ) {
        loadedConversationIdRef.current = conversationId;
        setMessages(query.data.messages as AgentMessage[]);
        if (query.data.title) {
          setTitle(query.data.title);
        }
      }
    }
  }, [query.data, conversationId, setMessages, setTitle]);

  return {
    messages: (query.data?.messages ?? []) as AgentMessage[],
    title: query.data?.title,
    isLoading:
      isValidUuid && useAgentStore.getState().messages.length === 0
        ? query.isLoading
        : false,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
