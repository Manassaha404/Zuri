import AgentService from "../agent";
import { inngest } from "./client";
import { publisher } from "@repo/redis/pubsub";
import { db } from "@repo/database";
import { conversations } from "@repo/database/models";

type RunChatAgentData = {
  userId: string;
  userMessage: string;
  conversationId: string | null;
  fileUrls?: string[];
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
  }>;
};
const runAgent = inngest.createFunction(
  {
    id: "run-agent",
    triggers: {
      event: "run-chat-agent",
    },
  },
  async ({ event, step }) => {
    const { userId, userMessage, conversationId, fileUrls, attachments } =
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

    // Ingest uploaded files into vector store before agent execution
    if (fileUrls && fileUrls.length > 0) {
      await step.run("ingest-documents", async () => {
        for (const url of fileUrls) {
          try {
            await AgentService.ingestDocument(url, {
              conversationId,
              userId,
            });
          } catch (err) {
            console.error("Failed to ingest document:", url, err);
          }
        }
      });
    }

    try {
      const result = await step.run("call-openai", async () => {
        try {
          const data = await AgentService.chat(
            {
              userId,
              userMessage,
              conversationId,
              fileUrls,
              attachments,
              isFilesInclude: Boolean(fileUrls && fileUrls.length > 0),
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
        } catch (error: any) {
          if (
            error?.name === "GraphInterrupt" ||
            error?.constructor?.name === "GraphInterrupt"
          ) {
            return {
              isInterrupted: true,
              interrupt:
                (error as any)?.interrupts?.[0]?.value ||
                (error as any)?.interrupts?.[0],
            };
          }
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

      if ((result as any)?.isInterrupted) {
        await step.run("publish-agent-interrupted", async () => {
          await publisher.publish(
            "redis:agent:status",
            JSON.stringify({
              jobId: conversationId,
              topic: "status",
              payload: {
                status: "interrupted",
                interrupt: (result as any)?.interrupt,
              },
            }),
          );
        });
        return;
      }

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

type ResumeChatAgentData = {
  userId: string;
  conversationId: string;
  resumeValue: any;
};

const resumeAgent = inngest.createFunction(
  {
    id: "resume-agent",
    triggers: {
      event: "resume-chat-agent",
    },
  },
  async ({ event, step }) => {
    const { userId, conversationId, resumeValue } =
      event.data as ResumeChatAgentData;

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
      const result = await step.run("resume-agent-execution", async () => {
        try {
          return await AgentService.resumeChat(
            {
              userId,
              conversationId,
              resumeValue,
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
        } catch (error: any) {
          if (
            error?.name === "GraphInterrupt" ||
            error?.constructor?.name === "GraphInterrupt"
          ) {
            return {
              isInterrupted: true,
              interrupt:
                (error as any)?.interrupts?.[0]?.value ||
                (error as any)?.interrupts?.[0],
            };
          }
          throw error;
        }
      });

      if ((result as any)?.isInterrupted) {
        await step.run("publish-agent-interrupted", async () => {
          await publisher.publish(
            "redis:agent:status",
            JSON.stringify({
              jobId: conversationId,
              topic: "status",
              payload: {
                status: "interrupted",
                interrupt: (result as any)?.interrupt,
              },
            }),
          );
        });
        return;
      }

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
          : "Agent failed to resume execution";
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

export const AgentFunction = [runAgent, resumeAgent];
