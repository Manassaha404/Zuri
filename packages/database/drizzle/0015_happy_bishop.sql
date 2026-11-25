CREATE TABLE "fitness_exercises" (
	"exercise_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text,
	"user_id" uuid,
	"name" text NOT NULL,
	"muscle_group" text NOT NULL,
	"secondary_muscles" text[],
	"equipment" text NOT NULL,
	"default_rest_seconds" integer DEFAULT 90 NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fitness_exercises_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "fitness_workout_templates" (
	"template_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text,
	"user_id" uuid,
	"name" text NOT NULL,
	"category" text DEFAULT 'Custom' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"estimated_minutes" integer DEFAULT 45 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fitness_workout_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "fitness_template_exercises" (
	"template_exercise_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"target_sets" integer DEFAULT 3 NOT NULL,
	"target_reps" text DEFAULT '8-10' NOT NULL,
	"rest_seconds" integer DEFAULT 90 NOT NULL,
	"superset_group_id" text
);
--> statement-breakpoint
CREATE TABLE "fitness_programs" (
	"program_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"style" text DEFAULT 'Custom' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"total_weeks" integer DEFAULT 4 NOT NULL,
	"current_week" integer DEFAULT 1 NOT NULL,
	"deload_every_weeks" integer DEFAULT 4 NOT NULL,
	"progression_rule" text DEFAULT '' NOT NULL,
	"template_ids" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_workout_sessions" (
	"session_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_id" uuid,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"is_deload" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_workout_exercises" (
	"workout_exercise_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"exercise_name" text NOT NULL,
	"muscle_group" text NOT NULL,
	"equipment" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"superset_group_id" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "fitness_workout_sets" (
	"set_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_exercise_id" uuid NOT NULL,
	"set_number" integer DEFAULT 1 NOT NULL,
	"type" text DEFAULT 'working' NOT NULL,
	"weight" double precision DEFAULT 0 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"rpe" double precision,
	"rir" integer,
	"tempo" text,
	"rest_seconds" integer DEFAULT 90 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"prs" text[]
);
--> statement-breakpoint
CREATE TABLE "fitness_cardio_sessions" (
	"cardio_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text DEFAULT 'run' NOT NULL,
	"date" text NOT NULL,
	"distance_km" double precision DEFAULT 0 NOT NULL,
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"heart_rate_avg" integer,
	"calories" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_bodyweight_skills" (
	"skill_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Skill' NOT NULL,
	"stages" text[] DEFAULT '{}' NOT NULL,
	"stage_index" integer DEFAULT 0 NOT NULL,
	"current_stage" text NOT NULL,
	"target_hold_or_reps" text DEFAULT '' NOT NULL,
	"last_practiced" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_foods" (
	"food_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"barcode" text,
	"serving_size" text DEFAULT '100g' NOT NULL,
	"calories" double precision DEFAULT 0 NOT NULL,
	"protein" double precision DEFAULT 0 NOT NULL,
	"carbs" double precision DEFAULT 0 NOT NULL,
	"fat" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_food_logs" (
	"food_log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"food_id" text,
	"date" text NOT NULL,
	"meal" text DEFAULT 'Lunch' NOT NULL,
	"name" text NOT NULL,
	"servings" double precision DEFAULT 1 NOT NULL,
	"calories" double precision DEFAULT 0 NOT NULL,
	"protein" double precision DEFAULT 0 NOT NULL,
	"carbs" double precision DEFAULT 0 NOT NULL,
	"fat" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_saved_meals" (
	"saved_meal_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"calories" double precision DEFAULT 0 NOT NULL,
	"protein" double precision DEFAULT 0 NOT NULL,
	"carbs" double precision DEFAULT 0 NOT NULL,
	"fat" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_nutrition_settings" (
	"setting_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"calories" integer DEFAULT 2200 NOT NULL,
	"protein" integer DEFAULT 150 NOT NULL,
	"carbs" integer DEFAULT 240 NOT NULL,
	"fat" integer DEFAULT 70 NOT NULL,
	"water_ml" integer DEFAULT 3000 NOT NULL,
	"goal_mode" text DEFAULT 'maintain' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fitness_nutrition_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "fitness_water_logs" (
	"water_log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" text NOT NULL,
	"amount_ml" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_body_metrics" (
	"metric_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" text NOT NULL,
	"weight" double precision NOT NULL,
	"body_fat_pct" double precision,
	"chest_cm" double precision,
	"waist_cm" double precision,
	"arms_cm" double precision,
	"thighs_cm" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_progress_photos" (
	"photo_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" text NOT NULL,
	"pose" text DEFAULT 'Front' NOT NULL,
	"weight" double precision,
	"data_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_recovery_logs" (
	"recovery_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" text NOT NULL,
	"sleep_hours" double precision DEFAULT 7.5 NOT NULL,
	"sleep_quality" integer DEFAULT 4 NOT NULL,
	"soreness" integer DEFAULT 3 NOT NULL,
	"fatigue" integer DEFAULT 3 NOT NULL,
	"resting_heart_rate" integer,
	"steps" integer,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_injuries" (
	"injury_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body_part" text DEFAULT 'General' NOT NULL,
	"severity" text DEFAULT 'Mild' NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"started_at" text NOT NULL,
	"avoid_exercise_ids" text[] DEFAULT '{}' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_goals" (
	"goal_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'Strength' NOT NULL,
	"current_value" double precision DEFAULT 0 NOT NULL,
	"target_value" double precision DEFAULT 100 NOT NULL,
	"unit" text DEFAULT 'kg' NOT NULL,
	"target_date" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fitness_exercises" ADD CONSTRAINT "fitness_exercises_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_workout_templates" ADD CONSTRAINT "fitness_workout_templates_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_template_exercises" ADD CONSTRAINT "fitness_template_exercises_template_id_fitness_workout_templates_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."fitness_workout_templates"("template_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_template_exercises" ADD CONSTRAINT "fitness_template_exercises_exercise_id_fitness_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."fitness_exercises"("exercise_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_programs" ADD CONSTRAINT "fitness_programs_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_workout_sessions" ADD CONSTRAINT "fitness_workout_sessions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_workout_sessions" ADD CONSTRAINT "fitness_workout_sessions_template_id_fitness_workout_templates_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."fitness_workout_templates"("template_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_workout_exercises" ADD CONSTRAINT "fitness_workout_exercises_session_id_fitness_workout_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."fitness_workout_sessions"("session_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_workout_exercises" ADD CONSTRAINT "fitness_workout_exercises_exercise_id_fitness_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."fitness_exercises"("exercise_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_workout_sets" ADD CONSTRAINT "fitness_workout_sets_workout_exercise_id_fitness_workout_exercises_workout_exercise_id_fk" FOREIGN KEY ("workout_exercise_id") REFERENCES "public"."fitness_workout_exercises"("workout_exercise_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_cardio_sessions" ADD CONSTRAINT "fitness_cardio_sessions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_bodyweight_skills" ADD CONSTRAINT "fitness_bodyweight_skills_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_foods" ADD CONSTRAINT "fitness_foods_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_food_logs" ADD CONSTRAINT "fitness_food_logs_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_saved_meals" ADD CONSTRAINT "fitness_saved_meals_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_nutrition_settings" ADD CONSTRAINT "fitness_nutrition_settings_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_water_logs" ADD CONSTRAINT "fitness_water_logs_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_body_metrics" ADD CONSTRAINT "fitness_body_metrics_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_progress_photos" ADD CONSTRAINT "fitness_progress_photos_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_recovery_logs" ADD CONSTRAINT "fitness_recovery_logs_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_injuries" ADD CONSTRAINT "fitness_injuries_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_goals" ADD CONSTRAINT "fitness_goals_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fitness_exercises_user_idx" ON "fitness_exercises" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_exercises_muscle_idx" ON "fitness_exercises" USING btree ("muscle_group");--> statement-breakpoint
CREATE INDEX "fitness_exercises_equip_idx" ON "fitness_exercises" USING btree ("equipment");--> statement-breakpoint
CREATE INDEX "fitness_templates_user_idx" ON "fitness_workout_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_templates_cat_idx" ON "fitness_workout_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "fitness_tpl_ex_tpl_idx" ON "fitness_template_exercises" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "fitness_tpl_ex_ex_idx" ON "fitness_template_exercises" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "fitness_programs_user_idx" ON "fitness_programs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_sessions_user_idx" ON "fitness_workout_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_sessions_date_idx" ON "fitness_workout_sessions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "fitness_we_session_idx" ON "fitness_workout_exercises" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "fitness_we_ex_idx" ON "fitness_workout_exercises" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "fitness_sets_we_idx" ON "fitness_workout_sets" USING btree ("workout_exercise_id");--> statement-breakpoint
CREATE INDEX "fitness_cardio_user_idx" ON "fitness_cardio_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_cardio_date_idx" ON "fitness_cardio_sessions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "fitness_skills_user_idx" ON "fitness_bodyweight_skills" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_foods_user_idx" ON "fitness_foods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_foods_barcode_idx" ON "fitness_foods" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "fitness_food_logs_user_idx" ON "fitness_food_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_food_logs_date_idx" ON "fitness_food_logs" USING btree ("date");--> statement-breakpoint
CREATE INDEX "fitness_saved_meals_user_idx" ON "fitness_saved_meals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_water_user_idx" ON "fitness_water_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_water_date_idx" ON "fitness_water_logs" USING btree ("date");--> statement-breakpoint
CREATE INDEX "fitness_body_metrics_user_idx" ON "fitness_body_metrics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_body_metrics_date_idx" ON "fitness_body_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "fitness_photos_user_idx" ON "fitness_progress_photos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_recovery_user_idx" ON "fitness_recovery_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_recovery_date_idx" ON "fitness_recovery_logs" USING btree ("date");--> statement-breakpoint
CREATE INDEX "fitness_injuries_user_idx" ON "fitness_injuries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_goals_user_idx" ON "fitness_goals" USING btree ("user_id");