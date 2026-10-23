"use client";

import { useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useAgentStore } from "@/store/agentStore";

export function useUpdateConversationTitle() {
  const utils = trpc.useUtils();
  const activeConversationId = useAgentStore((state) => state.conversationId);
  const setTitle = useAgentStore((state) => state.setTitle);

  const mutation = trpc.agent.updateConversationTitle.useMutation({
    onMutate: async (variables) => {
      await utils.agent.getAllConversations.cancel();

      const previousConversations = utils.agent.getAllConversations.getData();

      if (previousConversations) {
        utils.agent.getAllConversations.setData(
          undefined,
          previousConversations.map((c) =>
            c.conversationId === variables.conversationId
              ? { ...c, title: variables.title.trim() }
              : c,
          ),
        );
      }

      if (variables.conversationId === activeConversationId) {
        setTitle(variables.title.trim());
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

  const updateTitle = useCallback(
    async (conversationId: string, title: string) => {
      const cleanTitle = title.trim();
      if (!cleanTitle) return;
      return await mutation.mutateAsync({
        conversationId,
        title: cleanTitle,
      });
    },
    [mutation],
  );

  return {
    updateTitle,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
