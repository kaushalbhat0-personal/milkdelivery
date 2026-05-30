ALTER TABLE "customers" ADD COLUMN "delivery_start_date" date;

--> statement-breakpoint
UPDATE "customers" SET "delivery_start_date" = "created_at"::date WHERE "delivery_type" = 'ALTERNATE_DAYS' AND "delivery_start_date" IS NULL;