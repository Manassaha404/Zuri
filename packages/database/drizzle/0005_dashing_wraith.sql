ALTER TYPE "public"."block_type" ADD VALUE 'file' BEFORE 'bookmark';--> statement-breakpoint
ALTER TABLE "notebooks" ADD COLUMN "cover_attachment_id" text;--> statement-breakpoint
ALTER TABLE "notebooks" ADD COLUMN "cover_url" text;