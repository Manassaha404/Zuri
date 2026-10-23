"use client";

import { useCallback } from "react";
import { trpc } from "@/trpc/client";

export function usePinConversation() {
  const utils = trpc.useUtils();

  const toggleMutation = trpc.agent.togglePinConversation.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await utils.agent.getAllConversations.cancel();

      // Snapshot previous cache
      const previousConversations = utils.agent.getAllConversations.getData();

      // Optimistically update
      if (previousConversations) {
        utils.agent.getAllConversations.setData(
          undefined,
          previousConversations.map((c) => {
            if (c.conversationId === variables.conversationId) {
              const nextPinned =
                typeof variables.isPinned === "boolean"
                  ? variables.isPinned
                  : !c.isPinned;
              return {
                ...c,
                isPinned: nextPinned,
              };
            }
            return c;
          }),
        );
      }

      return { previousConversations };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousConversations) {
        utils.agent.getAllConversations.setData(
          undefined,
          context.previousConversations,
        );
      }
    },
    onSettled: () => {
      utils.agent.getAllConversations.invalidate();
    },
  });

  const togglePin = useCallback(
    async (conversationId: string, isPinned?: boolean) => {
      return await toggleMutation.mutateAsync({
        conversationId,
        isPinned,
      });
    },
    [toggleMutation],
  );

  const pin = useCallback(
    async (conversationId: string) => {
      return await togglePin(conversationId, true);
    },
    [togglePin],
  );

  const unpin = useCallback(
    async (conversationId: string) => {
      return await togglePin(conversationId, false);
    },
    [togglePin],
  );

  return {
    togglePin,
    pin,
    unpin,
    isPending: toggleMutation.isPending,
    error: toggleMutation.error,
  };
}
