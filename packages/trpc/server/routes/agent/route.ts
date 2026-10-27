import { handleRouteError } from "../../utils/error";
import { AppError } from "@repo/error";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import {
  chatDto,
  getConversationMessagesDto,
  togglePinConversationDto,
  updateConversationTitleDto,
  deleteConversationDto,
  createUserMemoryDto,
  updateUserMemoryDto,
  deleteUserMemoryDto,
  getAvailableToolkitsDto,
  initiateToolkitConnectionDto,
  disconnectToolkitDto,
  checkToolkitConnectionStatusDto,
  resumeChatAgentDto,
} from "./model";
import { inngest } from "@repo/services/inngest";
import { db } from "@repo/database";
import { conversations } from "@repo/database/models";

import { agentService, toolService } from "../../services";

export const agentRouter = router({
  getAllConversations: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await agentService.getAllConversations(ctx.user.id);
    } catch (error) {
      handleRouteError(error);
    }
  }),
  togglePinConversation: protectedProcedure
    .input(togglePinConversationDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await agentService.togglePinConversation(
          input.conversationId,
          ctx.user.id,
          input.isPinned,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),
  pinConversation: protectedProcedure
    .input(togglePinConversationDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await agentService.pinConversation(
          input.conversationId,
          ctx.user.id,
          input.isPinned ?? true,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),
  updateConversationTitle: protectedProcedure
    .input(updateConversationTitleDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await agentService.updateConversationTitle(
          input.conversationId,
          ctx.user.id,
          input.title,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),
  deleteConversation: protectedProcedure
    .input(deleteConversationDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await agentService.deleteConversation(
          input.conversationId,
          ctx.user.id,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),
  getConversationMessages: protectedProcedure
    .input(getConversationMessagesDto)
    .query(async ({ input, ctx }) => {
      try {
        return await agentService.getConversationMessages(
          input.conversationId,
          ctx.user.id,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),
  runChatAgent: protectedProcedure
    .input(chatDto)
    .mutation(async ({ input, ctx }) => {
      try {
        let { userMessage, conversationId, fileUrls, attachments } = input;
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
            fileUrls: fileUrls ?? [],
            attachments: attachments ?? [],
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
  getUserMemories: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await agentService.getUserMemories(ctx.user.id);
    } catch (error) {
      handleRouteError(error);
    }
  }),
  createUserMemory: protectedProcedure
    .input(createUserMemoryDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await agentService.createUserMemory(ctx.user.id, input);
      } catch (error) {
        handleRouteError(error);
      }
    }),
  updateUserMemory: protectedProcedure
    .input(updateUserMemoryDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await agentService.updateUserMemory(ctx.user.id, input);
      } catch (error) {
        handleRouteError(error);
      }
    }),
  deleteUserMemory: protectedProcedure
    .input(deleteUserMemoryDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await agentService.deleteUserMemory(ctx.user.id, input);
      } catch (error) {
        handleRouteError(error);
      }
    }),
  getAvailableToolkits: protectedProcedure
    .input(getAvailableToolkitsDto)
    .query(async ({ input }) => {
      try {
        return await toolService.getAvailableToolkits(input);
      } catch (error) {
        handleRouteError(error);
      }
    }),
  getToolkitCategories: protectedProcedure.query(async () => {
    try {
      return await toolService.getToolkitCategories();
    } catch (error) {
      handleRouteError(error);
    }
  }),
  getUserConnectedAccounts: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await toolService.getUserConnectedAccounts(ctx.user.id);
    } catch (error) {
      handleRouteError(error);
    }
  }),
  initiateToolkitConnection: protectedProcedure
    .input(initiateToolkitConnectionDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await toolService.initiateToolkitConnection(
          ctx.user.id,
          input.toolkit,
          input.callbackUrl,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),
  disconnectToolkit: protectedProcedure
    .input(disconnectToolkitDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await toolService.disconnectToolkit(
          ctx.user.id,
          input.connectionId,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),
  checkToolkitConnectionStatus: protectedProcedure
    .input(checkToolkitConnectionStatusDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await toolService.checkToolkitConnectionStatus(
          ctx.user.id,
          input.connectionId,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),
  refreshUserConnectedAccounts: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return await toolService.refreshUserConnectedAccounts(ctx.user.id);
    } catch (error) {
      handleRouteError(error);
    }
  }),
  resumeChatAgent: protectedProcedure
    .input(resumeChatAgentDto)
    .mutation(async ({ input, ctx }) => {
      try {
        await inngest.send({
          name: "resume-chat-agent",
          data: {
            userId: ctx.user.id,
            conversationId: input.conversationId,
            resumeValue: input.resumeValue,
          },
        });
        return { success: true, conversationId: input.conversationId };
      } catch (error) {
        handleRouteError(error);
      }
    }),
});
