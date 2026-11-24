CREATE TABLE "expense_categories" (
	"category_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT 'Tag' NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"type" text DEFAULT 'expense' NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_accounts" (
	"account_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'bank' NOT NULL,
	"balance" double precision DEFAULT 0 NOT NULL,
	"account_number" text,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_budgets" (
	"budget_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"month" text NOT NULL,
	"amount" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"transaction_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text DEFAULT 'expense' NOT NULL,
	"amount" double precision NOT NULL,
	"category_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"date" text NOT NULL,
	"note" text,
	"receipt_url" text,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_frequency" text DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debt_people" (
	"person_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"avatar_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debt_entries" (
	"entry_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"type" text DEFAULT 'lent' NOT NULL,
	"principal_amount" double precision NOT NULL,
	"interest_rate_annual" double precision DEFAULT 0,
	"start_date" text NOT NULL,
	"due_date" text,
	"note" text,
	"proof_url" text,
	"is_settled" boolean DEFAULT false NOT NULL,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debt_repayments" (
	"repayment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"entry_date" text NOT NULL,
	"amount" double precision NOT NULL,
	"note" text,
	"proof_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_groups" (
	"group_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"icon" text DEFAULT 'Users' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_group_members" (
	"member_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_splits" (
	"split_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"total_amount" double precision NOT NULL,
	"paid_by_person_id" uuid NOT NULL,
	"group_id" uuid,
	"date" text NOT NULL,
	"split_method" text DEFAULT 'equal' NOT NULL,
	"note" text,
	"receipt_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_split_items" (
	"item_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"split_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"amount" double precision NOT NULL,
	"percentage" double precision,
	"is_paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_accounts" ADD CONSTRAINT "expense_accounts_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_budgets" ADD CONSTRAINT "monthly_budgets_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_budgets" ADD CONSTRAINT "monthly_budgets_category_id_expense_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_expense_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("category_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_expense_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."expense_accounts"("account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_people" ADD CONSTRAINT "debt_people_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_entries" ADD CONSTRAINT "debt_entries_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_entries" ADD CONSTRAINT "debt_entries_person_id_debt_people_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."debt_people"("person_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_repayments" ADD CONSTRAINT "debt_repayments_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_repayments" ADD CONSTRAINT "debt_repayments_entry_id_debt_entries_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."debt_entries"("entry_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_groups" ADD CONSTRAINT "expense_groups_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_group_members" ADD CONSTRAINT "expense_group_members_group_id_expense_groups_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."expense_groups"("group_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_group_members" ADD CONSTRAINT "expense_group_members_person_id_debt_people_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."debt_people"("person_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_splits" ADD CONSTRAINT "bill_splits_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_splits" ADD CONSTRAINT "bill_splits_paid_by_person_id_debt_people_person_id_fk" FOREIGN KEY ("paid_by_person_id") REFERENCES "public"."debt_people"("person_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_splits" ADD CONSTRAINT "bill_splits_group_id_expense_groups_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."expense_groups"("group_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_split_items" ADD CONSTRAINT "bill_split_items_split_id_bill_splits_split_id_fk" FOREIGN KEY ("split_id") REFERENCES "public"."bill_splits"("split_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_split_items" ADD CONSTRAINT "bill_split_items_person_id_debt_people_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."debt_people"("person_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_categories_user_idx" ON "expense_categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "expense_categories_type_idx" ON "expense_categories" USING btree ("type");--> statement-breakpoint
CREATE INDEX "expense_accounts_user_idx" ON "expense_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "expense_accounts_type_idx" ON "expense_accounts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "monthly_budgets_user_idx" ON "monthly_budgets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "monthly_budgets_month_idx" ON "monthly_budgets" USING btree ("month");--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_budgets_user_cat_month_idx" ON "monthly_budgets" USING btree ("user_id","category_id","month");--> statement-breakpoint
CREATE INDEX "transactions_user_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transactions_category_idx" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "transactions_account_idx" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "debt_people_user_idx" ON "debt_people" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "debt_people_name_idx" ON "debt_people" USING btree ("name");--> statement-breakpoint
CREATE INDEX "debt_entries_user_idx" ON "debt_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "debt_entries_person_idx" ON "debt_entries" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "debt_entries_type_idx" ON "debt_entries" USING btree ("type");--> statement-breakpoint
CREATE INDEX "debt_entries_settled_idx" ON "debt_entries" USING btree ("is_settled");--> statement-breakpoint
CREATE INDEX "debt_entries_due_date_idx" ON "debt_entries" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "debt_repayments_user_idx" ON "debt_repayments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "debt_repayments_entry_idx" ON "debt_repayments" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "debt_repayments_date_idx" ON "debt_repayments" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX "expense_groups_user_idx" ON "expense_groups" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "expense_group_members_group_idx" ON "expense_group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "expense_group_members_person_idx" ON "expense_group_members" USING btree ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "expense_group_member_unique_idx" ON "expense_group_members" USING btree ("group_id","person_id");--> statement-breakpoint
CREATE INDEX "bill_splits_user_idx" ON "bill_splits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bill_splits_group_idx" ON "bill_splits" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "bill_splits_paid_by_idx" ON "bill_splits" USING btree ("paid_by_person_id");--> statement-breakpoint
CREATE INDEX "bill_splits_date_idx" ON "bill_splits" USING btree ("date");--> statement-breakpoint
CREATE INDEX "bill_split_items_split_idx" ON "bill_split_items" USING btree ("split_id");--> statement-breakpoint
CREATE INDEX "bill_split_items_person_idx" ON "bill_split_items" USING btree ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bill_split_item_unique_idx" ON "bill_split_items" USING btree ("split_id","person_id");