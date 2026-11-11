CREATE TYPE "public"."block_type" AS ENUM('paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list', 'numbered_list', 'todo', 'toggle', 'quote', 'callout', 'code', 'divider', 'image', 'bookmark', 'diagram', 'table', 'page_link');--> statement-breakpoint
CREATE TYPE "public"."diagram_kind" AS ENUM('canvas', 'mermaid', 'diagram_as_code');--> statement-breakpoint
CREATE TYPE "public"."cloudinary_resource_type" AS ENUM('image', 'video', 'raw');--> statement-breakpoint
CREATE TABLE "notebooks" (
	"notebook_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'Untitled notebook' NOT NULL,
	"icon" text,
	"color" text,
	"position" text NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"chapter_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notebook_id" uuid NOT NULL,
	"file_dock_id" uuid,
	"title" text DEFAULT 'Untitled chapter' NOT NULL,
	"icon" text,
	"color" text,
	"position" text NOT NULL,
	"summary" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"page_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"notebook_id" uuid NOT NULL,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"summary" text,
	"position" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"search_vector" "tsvector",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"block_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"parent_block_id" uuid,
	"type" "block_type" NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"position" text NOT NULL,
	"plain_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_id_page_uq" UNIQUE("block_id","page_id")
);
--> statement-breakpoint
CREATE TABLE "diagrams" (
	"diagram_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"title" text,
	"kind" "diagram_kind" DEFAULT 'canvas' NOT NULL,
	"source" text,
	"scene" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_docks" (
	"file_dock_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text DEFAULT 'File Dock' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_dock_folders" (
	"folder_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_dock_id" uuid NOT NULL,
	"parent_folder_id" uuid,
	"name" text NOT NULL,
	"position" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_dock_files" (
	"file_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_dock_id" uuid NOT NULL,
	"folder_id" uuid,
	"name" text NOT NULL,
	"cloudinary_public_id" text NOT NULL,
	"cloudinary_url" text NOT NULL,
	"resource_type" "cloudinary_resource_type" NOT NULL,
	"format" text,
	"mime_type" text,
	"bytes" bigint,
	"position" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notebooks" ADD CONSTRAINT "notebooks_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_notebook_id_notebooks_notebook_id_fk" FOREIGN KEY ("notebook_id") REFERENCES "public"."notebooks"("notebook_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_file_dock_id_file_docks_file_dock_id_fk" FOREIGN KEY ("file_dock_id") REFERENCES "public"."file_docks"("file_dock_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_chapter_id_chapters_chapter_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("chapter_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_notebook_id_notebooks_notebook_id_fk" FOREIGN KEY ("notebook_id") REFERENCES "public"."notebooks"("notebook_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_page_id_pages_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("page_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_parent_block_id_blocks_block_id_fk" FOREIGN KEY ("parent_block_id") REFERENCES "public"."blocks"("block_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagrams" ADD CONSTRAINT "diagrams_page_id_pages_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("page_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_docks" ADD CONSTRAINT "file_docks_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_dock_folders" ADD CONSTRAINT "file_dock_folders_file_dock_id_file_docks_file_dock_id_fk" FOREIGN KEY ("file_dock_id") REFERENCES "public"."file_docks"("file_dock_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_dock_folders" ADD CONSTRAINT "file_dock_folders_parent_folder_id_file_dock_folders_folder_id_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."file_dock_folders"("folder_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_dock_files" ADD CONSTRAINT "file_dock_files_file_dock_id_file_docks_file_dock_id_fk" FOREIGN KEY ("file_dock_id") REFERENCES "public"."file_docks"("file_dock_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_dock_files" ADD CONSTRAINT "file_dock_files_folder_id_file_dock_folders_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."file_dock_folders"("folder_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notebooks_position_idx" ON "notebooks" USING btree ("position");--> statement-breakpoint
CREATE INDEX "notebooks_user_id_idx" ON "notebooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chapters_notebook_idx" ON "chapters" USING btree ("notebook_id","position");--> statement-breakpoint
CREATE INDEX "pages_chapter_idx" ON "pages" USING btree ("chapter_id","position");--> statement-breakpoint
CREATE INDEX "pages_notebook_idx" ON "pages" USING btree ("notebook_id");--> statement-breakpoint
CREATE INDEX "pages_search_idx" ON "pages" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "blocks_page_idx" ON "blocks" USING btree ("page_id","parent_block_id","position");--> statement-breakpoint
CREATE INDEX "file_docks_user_idx" ON "file_docks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "file_dock_folders_dock_idx" ON "file_dock_folders" USING btree ("file_dock_id","position");--> statement-breakpoint
CREATE INDEX "file_dock_files_dock_idx" ON "file_dock_files" USING btree ("file_dock_id","position");--> statement-breakpoint
CREATE INDEX "file_dock_files_folder_idx" ON "file_dock_files" USING btree ("folder_id");