ALTER TABLE "customers" ADD COLUMN "delivery_type" varchar(20) DEFAULT 'DAILY' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "quantity" numeric(5, 2) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "unit" varchar(10) DEFAULT 'LITER' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "delivery_days" text[];--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "pause_from" date;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "pause_until" date;--> statement-breakpoint
CREATE INDEX "customers_delivery_type_idx" ON "customers" USING btree ("tenant_id","delivery_type");