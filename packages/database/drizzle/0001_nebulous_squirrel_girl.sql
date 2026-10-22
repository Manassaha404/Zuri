ALTER TABLE "auths" ADD COLUMN "access_token" varchar(255);--> statement-breakpoint
ALTER TABLE "auths" ADD COLUMN "refresh_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "access_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "refresh_token" varchar(255);