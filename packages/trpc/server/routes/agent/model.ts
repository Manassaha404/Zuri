import { z } from "zod";
export const chatDto = z.object({
  userMessage: z.string().trim(),
  conversationId: z.string().uuid().nullable().optional(),
});
export type chatDtoType = z.infer<typeof chatDto>;

export const getConversationMessagesDto = z.object({
  conversationId: z.string().uuid(),
});
export type getConversationMessagesDtoType = z.infer<
  typeof getConversationMessagesDto
>;
