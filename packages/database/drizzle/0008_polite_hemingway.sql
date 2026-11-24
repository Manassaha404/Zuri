CREATE TABLE "habits" (
	"habit_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text DEFAULT 'Sparkles' NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"type" text DEFAULT 'boolean' NOT NULL,
	"frequency_type" text DEFAULT 'daily' NOT NULL,
	"frequency_days_of_week" integer[],
	"frequency_times_per_week" integer,
	"target_value" double precision,
	"unit" text,
	"time_of_day" text DEFAULT 'morning' NOT NULL,
	"reminder_time" text,
	"status" text DEFAULT 'active' NOT NULL,
	"clean_started_at" timestamp with time zone,
	"stacked_after_habit_id" uuid,
	"stack_routine_title" text,
	"grace_days_per_month" integer DEFAULT 2 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_check_ins" (
	"check_in_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"date" text NOT NULL,
	"completed" boolean DEFAULT true NOT NULL,
	"value" double precision,
	"target_value" double precision,
	"note" text,
	"skip_reason" text,
	"mood" text,
	"is_freeze_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_streak_freezes" (
	"freeze_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"date" text NOT NULL,
	"reason" text,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_stacked_after_habit_id_habits_habit_id_fk" FOREIGN KEY ("stacked_after_habit_id") REFERENCES "public"."habits"("habit_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_check_ins" ADD CONSTRAINT "habit_check_ins_habit_id_habits_habit_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("habit_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_check_ins" ADD CONSTRAINT "habit_check_ins_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_streak_freezes" ADD CONSTRAINT "habit_streak_freezes_habit_id_habits_habit_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("habit_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_streak_freezes" ADD CONSTRAINT "habit_streak_freezes_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "habits_user_idx" ON "habits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "habits_status_idx" ON "habits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "habits_time_of_day_idx" ON "habits" USING btree ("time_of_day");--> statement-breakpoint
CREATE INDEX "habits_stacked_after_idx" ON "habits" USING btree ("stacked_after_habit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "habit_check_ins_habit_date_idx" ON "habit_check_ins" USING btree ("habit_id","date");--> statement-breakpoint
CREATE INDEX "habit_check_ins_user_idx" ON "habit_check_ins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "habit_check_ins_date_idx" ON "habit_check_ins" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "habit_streak_freezes_habit_date_idx" ON "habit_streak_freezes" USING btree ("habit_id","date");--> statement-breakpoint
CREATE INDEX "habit_streak_freezes_user_idx" ON "habit_streak_freezes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "habit_streak_freezes_date_idx" ON "habit_streak_freezes" USING btree ("date");