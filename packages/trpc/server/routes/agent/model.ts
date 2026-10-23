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

export const togglePinConversationDto = z.object({
  conversationId: z.string().uuid(),
  isPinned: z.boolean().optional(),
});
export type togglePinConversationDtoType = z.infer<
  typeof togglePinConversationDto
>;

export const updateConversationTitleDto = z.object({
  conversationId: z.string().uuid(),
  title: z.string().trim().min(1, "Title cannot be empty").max(255),
});
export type updateConversationTitleDtoType = z.infer<
  typeof updateConversationTitleDto
>;

export const deleteConversationDto = z.object({
  conversationId: z.string().uuid(),
});
export type deleteConversationDtoType = z.infer<
  typeof deleteConversationDto
>;


