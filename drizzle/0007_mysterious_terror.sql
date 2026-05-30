ALTER TABLE "delivery_logs" ADD COLUMN "status" text DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_logs" ADD COLUMN "skip_reason" text;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "completed_by" text;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "logs_status_date_idx" ON "delivery_logs" USING btree ("status","delivery_date");