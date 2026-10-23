"use client";

import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useAgentStore, type AgentStatus } from "@/store/agentStore";
import socket, { joinRoom, leaveRoom } from "@/lib/socket";
import { extractMessageContent } from "@/lib/utils";
import { useConversationMessages } from "./useConversationMessages";

// Socket payload shape
interface AgentStatusPayload {
  status: "running" | "done" | "error";
  result?: unknown;
  error?: string;
  title?: string;
}

interface AgentTitlePayload {
  conversationId?: string;
  title?: string;
}

// Hook
export function useAgent(existingConversationId?: string) {
  const {
    conversationId: storeConversationId,
    status,
    messages,
    error,
    title,
    isTitleUpdating,
    sendUserMessage,
    setConversationId,
    setTitle,
    setStatus,
    appendAssistantMessage,
    setError,
    reset,
  } = useAgentStore();

  const conversationId = existingConversationId ?? storeConversationId;
  const joinedRoom = useRef<string | null>(null);

  const { isLoading: isLoadingMessages } =
    useConversationMessages(conversationId);

  const mutation = trpc.agent.runChatAgent.useMutation();
  const utils = trpc.useUtils();

  // Stable handler ref
  const handleStatus = useCallback(
    (payload: AgentStatusPayload) => {
      const {
        status: agentStatus,
        result,
        error: errMsg,
        title: incomingTitle,
      } = payload;

      if (agentStatus === "running") {
        setStatus("running" as AgentStatus);
        return;
      }

      if (agentStatus === "done") {
        const content = extractMessageContent(result);
        appendAssistantMessage(content);

        const resolvedTitle =
          incomingTitle ??
          (result as any)?.title ??
          (result as any)?.result?.title;
        if (resolvedTitle && typeof resolvedTitle === "string") {
          setTitle(resolvedTitle);
        }
        utils.agent.getAllConversations.invalidate();
        return;
      }

      if (agentStatus === "error") {
        setError(errMsg ?? "An unknown agent error occurred.");
      }
    },
    [setStatus, appendAssistantMessage, setTitle, setError, utils],
  );

  const handleStatusRef = useRef(handleStatus);
  handleStatusRef.current = handleStatus;

  const handleTitle = useCallback(
    (payload: AgentTitlePayload | string) => {
      const resolvedTitle =
        typeof payload === "string" ? payload : payload?.title;
      if (resolvedTitle && typeof resolvedTitle === "string") {
        setTitle(resolvedTitle);
        utils.agent.getAllConversations.invalidate();
      }
    },
    [setTitle, utils],
  );

  const handleTitleRef = useRef(handleTitle);
  handleTitleRef.current = handleTitle;

  // Register socket event listeners
  useEffect(() => {
    const onStatus = (payload: AgentStatusPayload) => {
      handleStatusRef.current(payload);
    };

    const onTitle = (payload: AgentTitlePayload | string) => {
      handleTitleRef.current(payload);
    };

    socket.on("status", onStatus);
    socket.on("title", onTitle);

    return () => {
      socket.off("status", onStatus);
      socket.off("title", onTitle);
    };
  }, []);

  // Sync socket room with active conversation ID
  useEffect(() => {
    if (!conversationId) return;

    if (joinedRoom.current && joinedRoom.current !== conversationId) {
      leaveRoom("leave:agent", joinedRoom.current);
    }

    joinRoom("join:agent", conversationId);
    joinedRoom.current = conversationId;

    return () => {
      if (joinedRoom.current) {
        leaveRoom("leave:agent", joinedRoom.current);
        joinedRoom.current = null;
      }
    };
  }, [conversationId]);

  // Send message
  const send = useCallback(
    async (userMessage: string) => {
      const trimmed = userMessage.trim();
      if (!trimmed) return;

      // Optimistic user bubble
      sendUserMessage(trimmed);

      // Dispatch to server via tRPC mutation
      try {
        const res = await mutation.mutateAsync({
          userMessage: trimmed,
          conversationId: conversationId ?? null,
        });

        // Store backend conversation ID and join socket room
        if (res?.conversationId) {
          const backendId = res.conversationId;
          if (conversationId !== backendId) {
            setConversationId(backendId);
          }

          if (joinedRoom.current !== backendId) {
            if (joinedRoom.current) {
              leaveRoom("leave:agent", joinedRoom.current);
            }
            joinRoom("join:agent", backendId);
            joinedRoom.current = backendId;
          }
          utils.agent.getAllConversations.invalidate();
        }
      } catch (err: any) {
        setError(err?.message ?? "Failed to send message to agent.");
      }
    },
    [
      conversationId,
      mutation,
      sendUserMessage,
      setConversationId,
      setError,
      utils,
    ],
  );

  return {
    send,
    status,
    messages,
    isRunning: status === "running" || mutation.isPending,
    isLoadingMessages,
    error,
    conversationId,
    title,
    isTitleUpdating,
    reset,
  };
}
