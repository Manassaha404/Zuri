CREATE TABLE "deadlines" (
	"deadline_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'assignment' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"soft_due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"recurrence" text DEFAULT 'none' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deadline_reminders" (
	"reminder_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deadline_id" uuid NOT NULL,
	"offset" text NOT NULL,
	"is_triggered" boolean DEFAULT false NOT NULL,
	"triggered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline_reminders" ADD CONSTRAINT "deadline_reminders_deadline_id_deadlines_deadline_id_fk" FOREIGN KEY ("deadline_id") REFERENCES "public"."deadlines"("deadline_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deadlines_user_idx" ON "deadlines" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deadlines_status_idx" ON "deadlines" USING btree ("status");--> statement-breakpoint
CREATE INDEX "deadlines_category_idx" ON "deadlines" USING btree ("category");--> statement-breakpoint
CREATE INDEX "deadlines_due_date_idx" ON "deadlines" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "deadline_reminders_deadline_idx" ON "deadline_reminders" USING btree ("deadline_id");--> statement-breakpoint
CREATE INDEX "deadline_reminders_offset_idx" ON "deadline_reminders" USING btree ("offset");