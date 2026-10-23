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
export type deleteConversationDtoType = z.infer<typeof deleteConversationDto>;

export const memoryTypeEnum = z.enum([
  "profile",
  "episodic",
  "semantic",
  "procedural",
]);
export type memoryType = z.infer<typeof memoryTypeEnum>;

export const createUserMemoryDto = z.object({
  text: z.string().trim().min(1, "Memory content cannot be empty").max(2000),
  type: memoryTypeEnum,
});
export type createUserMemoryDtoType = z.infer<typeof createUserMemoryDto>;

export const updateUserMemoryDto = z.object({
  key: z.string().min(1),
  text: z.string().trim().min(1, "Memory content cannot be empty").max(2000),
  type: memoryTypeEnum,
  currentNamespace: z.array(z.string()).optional(),
});
export type updateUserMemoryDtoType = z.infer<typeof updateUserMemoryDto>;

export const deleteUserMemoryDto = z.object({
  key: z.string().min(1),
  namespace: z.array(z.string()).optional(),
  type: memoryTypeEnum.optional(),
});
export type deleteUserMemoryDtoType = z.infer<typeof deleteUserMemoryDto>;
