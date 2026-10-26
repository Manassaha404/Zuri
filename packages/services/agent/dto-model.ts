import { z } from "zod";

export const chatAttachmentDto = z.object({
  name: z.string(),
  url: z.string(),
  size: z.number().optional(),
});
export type chatAttachmentDtoType = z.infer<typeof chatAttachmentDto>;

export const chatDto = z.object({
  userId: z.string(),
  userMessage: z.string().trim(),
  conversationId: z.string().uuid().nullable().optional(),
  fileUrls: z.array(z.string()).optional(),
  attachments: z.array(chatAttachmentDto).optional(),
  isFilesInclude: z.boolean().optional(),
});
export type chatDtoType = z.infer<typeof chatDto>;
