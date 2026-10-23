"use client";

import { useCallback } from "react";
import { trpc } from "@/trpc/client";

export function useDeleteConversation() {
  const utils = trpc.useUtils();

  const mutation = trpc.agent.deleteConversation.useMutation({
    onMutate: async (variables) => {
      await utils.agent.getAllConversations.cancel();

      const previousConversations = utils.agent.getAllConversations.getData();

      if (previousConversations) {
        utils.agent.getAllConversations.setData(
          undefined,
          previousConversations.filter(
            (c) => c.conversationId !== variables.conversationId,
          ),
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

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      return await mutation.mutateAsync({
        conversationId,
      });
    },
    [mutation],
  );

  return {
    deleteConversation,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
