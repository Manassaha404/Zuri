CREATE TABLE "contacts" (
	"contact_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"role" text,
	"company" text,
	"notes" text,
	"avatar_color" text DEFAULT '#3b82f6' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_projects" (
	"project_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"deadline" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"task_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" text,
	"due_time" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"recurrence" text DEFAULT 'none' NOT NULL,
	"reminder" text DEFAULT 'none' NOT NULL,
	"estimate_minutes" integer,
	"logged_minutes" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_subtasks" (
	"subtask_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_columns" (
	"column_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"position" text DEFAULT 'a0' NOT NULL,
	"wip_limit" integer,
	"is_done_column" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_sprints" (
	"sprint_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"goal" text,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_milestones" (
	"milestone_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"due_date" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_cards" (
	"card_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"column_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"sprint_id" uuid,
	"milestone_id" uuid,
	"position" text DEFAULT 'a0' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"labels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"start_date" text,
	"due_date" text,
	"assignee" text,
	"story_points" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_card_checklists" (
	"item_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_card_comments" (
	"comment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"author" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_projects" ADD CONSTRAINT "task_projects_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_task_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."task_projects"("project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_subtasks" ADD CONSTRAINT "task_subtasks_task_id_tasks_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("task_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_subtasks" ADD CONSTRAINT "task_subtasks_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_columns" ADD CONSTRAINT "board_columns_project_id_task_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."task_projects"("project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_columns" ADD CONSTRAINT "board_columns_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_sprints" ADD CONSTRAINT "board_sprints_project_id_task_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."task_projects"("project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_sprints" ADD CONSTRAINT "board_sprints_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_milestones" ADD CONSTRAINT "board_milestones_project_id_task_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."task_projects"("project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_milestones" ADD CONSTRAINT "board_milestones_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_project_id_task_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."task_projects"("project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_column_id_board_columns_column_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."board_columns"("column_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_sprint_id_board_sprints_sprint_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."board_sprints"("sprint_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_milestone_id_board_milestones_milestone_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."board_milestones"("milestone_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_card_checklists" ADD CONSTRAINT "board_card_checklists_card_id_board_cards_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."board_cards"("card_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_card_checklists" ADD CONSTRAINT "board_card_checklists_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_card_comments" ADD CONSTRAINT "board_card_comments_card_id_board_cards_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."board_cards"("card_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_card_comments" ADD CONSTRAINT "board_card_comments_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contacts_user_idx" ON "contacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contacts_name_idx" ON "contacts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "task_projects_user_idx" ON "task_projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "task_projects_status_idx" ON "task_projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_user_idx" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_project_idx" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_due_date_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "task_subtasks_task_idx" ON "task_subtasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_subtasks_user_idx" ON "task_subtasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "board_columns_project_idx" ON "board_columns" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "board_columns_user_idx" ON "board_columns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "board_sprints_project_idx" ON "board_sprints" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "board_sprints_user_idx" ON "board_sprints" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "board_milestones_project_idx" ON "board_milestones" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "board_milestones_user_idx" ON "board_milestones" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "board_cards_project_idx" ON "board_cards" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "board_cards_column_idx" ON "board_cards" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "board_cards_user_idx" ON "board_cards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "board_cards_sprint_idx" ON "board_cards" USING btree ("sprint_id");--> statement-breakpoint
CREATE INDEX "board_cards_milestone_idx" ON "board_cards" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "board_card_checklists_card_idx" ON "board_card_checklists" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "board_card_checklists_user_idx" ON "board_card_checklists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "board_card_comments_card_idx" ON "board_card_comments" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "board_card_comments_user_idx" ON "board_card_comments" USING btree ("user_id");