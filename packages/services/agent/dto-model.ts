import { z } from "zod";
export const chatDto = z.object({
  userId: z.string(),
  userMessage: z.string().trim(),
  conversationId: z.string().uuid().nullable().optional(),
});
export type chatDtoType = z.infer<typeof chatDto>;
