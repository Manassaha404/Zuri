import AgentService from "../agent";
import { inngest } from "./client";
import { publisher } from "@repo/redis/pubsub";
import { db } from "@repo/database";
import { conversations } from "@repo/database/models";

type RunChatAgentData = {
  userId: string;
  userMessage: string;
  conversationId: string | null;
};
const runAgent = inngest.createFunction(
  {
    id: "run-agent",
    triggers: {
      event: "run-chat-agent",
    },
  },
  async ({ event, step }) => {
    const { userId, userMessage, conversationId } =
      event.data as RunChatAgentData;
    await step.run("publish-agent-running", async () => {
      await publisher.publish(
        "redis:agent:status",
        JSON.stringify({
          jobId: conversationId,
          topic: "status",
          payload: { status: "running" },
        }),
      );
    });
    try {
      const result = await step.run("call-openai", async () => {
        try {
          const data = await AgentService.chat(
            {
              userId,
              userMessage,
              conversationId,
            },
            {
              onChunk: async (chunk: string) => {
                await publisher.publish(
                  "redis:agent:status",
                  JSON.stringify({
                    jobId: conversationId,
                    topic: "stream",
                    payload: { chunk, conversationId },
                  }),
                );
              },
            },
          );
          return data;
        } catch (error) {
          if (
            error instanceof Error &&
            (error.constructor.name === "InputGuardrailTripwireTriggered" ||
              error.constructor.name === "OutputGuardrailTripwireTriggered")
          ) {
            return {
              error: true,
              message: error.message,
            };
          }
          throw error;
        }
      });

      const conversationTitle = (result as any)?.title || "New Chat";

      if (conversationId) {
        await step.run("save-conversation-to-db", async () => {
          await db
            .insert(conversations)
            .values({
              conversationId,
              userId,
              title: conversationTitle,
            })
            .onConflictDoUpdate({
              target: conversations.conversationId,
              set: {
                title: conversationTitle,
                updatedAt: new Date(),
              },
            });
        });
      }

      if (conversationTitle) {
        await step.run("publish-agent-title", async () => {
          await publisher.publish(
            "redis:agent:status",
            JSON.stringify({
              jobId: conversationId,
              topic: "title",
              payload: { conversationId, title: conversationTitle },
            }),
          );
        });
      }

      await step.run("publish-agent-done", async () => {
        await publisher.publish(
          "redis:agent:status",
          JSON.stringify({
            jobId: conversationId,
            topic: "status",
            payload: { status: "done", result, title: conversationTitle },
          }),
        );
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Agent failed to process request";
      await step.run("publish-agent-error", async () => {
        await publisher.publish(
          "redis:agent:status",
          JSON.stringify({
            jobId: conversationId,
            topic: "status",
            payload: { status: "error", error: errorMessage },
          }),
        );
      });
      throw error;
    }
  },
);
export const AgentFunction = [runAgent];
