import { handleRouteError } from "../../utils/error";
import { AppError } from "@repo/error";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { chatDto } from "./model";
import { inngest } from "@repo/services/inngest";
import { db } from "@repo/database";
import { conversations } from "@repo/database/models";

export const agentRouter = router({
  runChatAgent: protectedProcedure
    .input(chatDto)
    .mutation(async ({ input, ctx }) => {
      try {
        let { userMessage, conversationId } = input;
        const userId = ctx.user.id;

        // Create conversation ID in backend once if not provided (new chat)
        if (!conversationId) {
          conversationId = crypto.randomUUID();
        }

        // Save conversation record with userId in database
        await db
          .insert(conversations)
          .values({
            conversationId,
            userId,
            title: "New Chat",
          })
          .onConflictDoNothing();

        await inngest.send({
          name: "run-chat-agent",
          data: {
            conversationId,
            userId,
            userMessage,
          },
        });

        return {
          conversationId,
          message:
            "Agent is processing your request. You will receive updates on the status of the job.",
        };
      } catch (error) {
        handleRouteError(error);
      }
    }),
});
