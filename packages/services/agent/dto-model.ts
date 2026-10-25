import { z } from "zod";
export const chatDto = z.object({
  userId: z.string(),
  userMessage: z.string().trim(),
  conversationId: z.string().uuid().nullable().optional(),
  fileUrls: z.array(z.string()).optional(),
  isFilesInclude: z.boolean().optional(),
});
export type chatDtoType = z.infer<typeof chatDto>;
