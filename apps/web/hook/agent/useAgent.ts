"use client";

import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useAgentStore, type AgentStatus } from "@/store/agentStore";
import socket, { joinRoom, leaveRoom } from "@/lib/socket";
import { extractMessageContent } from "@/lib/utils";
import { useConversationMessages } from "./useConversationMessages";

// Socket payload shape
interface AgentStatusPayload {
  status: "running" | "interrupted" | "done" | "error";
  result?: unknown;
  interrupt?: any;
  error?: string;
  title?: string;
}

interface AgentTitlePayload {
  conversationId?: string;
  title?: string;
}

interface AgentStreamPayload {
  chunk: string;
  conversationId?: string;
}

// Hook
export function useAgent(existingConversationId?: string) {
  const {
    conversationId: storeConversationId,
    status,
    interrupt,
    messages,
    error,
    title,
    isTitleUpdating,
    sendUserMessage,
    setConversationId,
    setTitle,
    setStatus,
    setInterrupt,
    appendAssistantChunk,
    appendAssistantMessage,
    setError,
    reset,
  } = useAgentStore();

  const conversationId = existingConversationId ?? storeConversationId;
  const joinedRoom = useRef<string | null>(null);

  const { isLoading: isLoadingMessages } =
    useConversationMessages(conversationId);

  const mutation = trpc.agent.runChatAgent.useMutation();
  const resumeMutation = trpc.agent.resumeChatAgent.useMutation();
  const utils = trpc.useUtils();

  // Stable status handler ref
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

      if (agentStatus === "interrupted") {
        setStatus("interrupted" as AgentStatus);
        setInterrupt(payload.interrupt ?? null);
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
        utils.agent.getUserMemories.invalidate();
        return;
      }

      if (agentStatus === "error") {
        setError(errMsg ?? "An unknown agent error occurred.");
      }
    },
    [
      setStatus,
      setInterrupt,
      appendAssistantMessage,
      setTitle,
      setError,
      utils,
    ],
  );

  const handleStatusRef = useRef(handleStatus);
  handleStatusRef.current = handleStatus;

  // Stable stream handler ref
  const handleStream = useCallback(
    (payload: AgentStreamPayload) => {
      if (payload?.chunk) {
        appendAssistantChunk(payload.chunk);
      }
    },
    [appendAssistantChunk],
  );

  const handleStreamRef = useRef(handleStream);
  handleStreamRef.current = handleStream;

  // Stable title handler ref
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

    const onStream = (payload: AgentStreamPayload) => {
      handleStreamRef.current(payload);
    };

    const onConnectionSuccess = () => {
      utils.agent.getUserConnectedAccounts.invalidate();
    };

    socket.on("status", onStatus);
    socket.on("title", onTitle);
    socket.on("stream", onStream);
    socket.on("connection_success", onConnectionSuccess);

    return () => {
      socket.off("status", onStatus);
      socket.off("title", onTitle);
      socket.off("stream", onStream);
      socket.off("connection_success", onConnectionSuccess);
    };
  }, [utils]);

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
    async (
      userMessage: string,
      fileUrls?: string[],
      attachments?: import("@/store/agentStore").MessageAttachment[],
    ) => {
      const trimmed = userMessage.trim();
      const hasFiles = Boolean(fileUrls && fileUrls.length > 0);
      if (!trimmed && !hasFiles) return;

      const messageContent = trimmed || "Please review the attached file(s).";

      // Ensure conversation ID and socket room are bound prior to mutation
      const activeConversationId = conversationId ?? crypto.randomUUID();

      if (!conversationId) {
        setConversationId(activeConversationId);
      }

      if (joinedRoom.current !== activeConversationId) {
        if (joinedRoom.current) {
          leaveRoom("leave:agent", joinedRoom.current);
        }
        joinRoom("join:agent", activeConversationId);
        joinedRoom.current = activeConversationId;
      }

      // Optimistic user bubble
      sendUserMessage(messageContent, fileUrls, attachments);

      // Dispatch to server via tRPC mutation
      try {
        const res = await mutation.mutateAsync({
          userMessage: messageContent,
          conversationId: activeConversationId,
          fileUrls: fileUrls ?? [],
          attachments: attachments ?? [],
        });

        // Sync backend conversation ID if different
        if (
          res?.conversationId &&
          res.conversationId !== activeConversationId
        ) {
          const backendId = res.conversationId;
          setConversationId(backendId);

          if (joinedRoom.current !== backendId) {
            if (joinedRoom.current) {
              leaveRoom("leave:agent", joinedRoom.current);
            }
            joinRoom("join:agent", backendId);
            joinedRoom.current = backendId;
          }
        }
        utils.agent.getAllConversations.invalidate();
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

  // Resume interrupted agent execution
  const resume = useCallback(
    async (resumeValue: any) => {
      const activeConversationId = conversationId ?? storeConversationId;
      if (!activeConversationId) return;

      setStatus("running");
      setInterrupt(null);

      try {
        await resumeMutation.mutateAsync({
          conversationId: activeConversationId,
          resumeValue,
        });
      } catch (err: any) {
        setError(err?.message ?? "Failed to resume agent execution.");
      }
    },
    [
      conversationId,
      storeConversationId,
      resumeMutation,
      setStatus,
      setInterrupt,
      setError,
    ],
  );

  return {
    send,
    resume,
    status,
    interrupt,
    isInterrupted: status === "interrupted",
    messages,
    isRunning:
      status === "running" || mutation.isPending || resumeMutation.isPending,
    isLoadingMessages,
    error,
    conversationId,
    title,
    isTitleUpdating,
    reset,
  };
}
