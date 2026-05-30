import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

  const sql = neon(url);

  const stmts = [
    `ALTER TABLE "delivery_logs" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'PENDING' NOT NULL`,
    `ALTER TABLE "delivery_logs" ADD COLUMN IF NOT EXISTS "skip_reason" text`,
    `ALTER TABLE "routes" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone`,
    `ALTER TABLE "routes" ADD COLUMN IF NOT EXISTS "completed_by" text`,
    `CREATE INDEX IF NOT EXISTS "logs_status_date_idx" ON "delivery_logs" ("status", "delivery_date")`,
  ];

  for (const stmt of stmts) {
    console.log(`Executing: ${stmt.substring(0, 80)}...`);
    await sql.query(stmt);
    console.log("  OK");
  }

  const [row] = await sql`SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'routes_completed_by_users_id_fk') as exists`;
  if (!row.exists) {
    console.log("Adding FK constraint routes_completed_by_users_id_fk...");
    await sql`ALTER TABLE "routes" ADD CONSTRAINT "routes_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id")`;
    console.log("  OK");
  } else {
    console.log("FK constraint already exists, skipping");
  }

  const newStmts = [
    `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "delivery_type" varchar(20) DEFAULT 'DAILY' NOT NULL`,
    `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "quantity" numeric(5, 2) DEFAULT '1' NOT NULL`,
    `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "unit" varchar(10) DEFAULT 'LITER' NOT NULL`,
    `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "delivery_days" text[]`,
    `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "pause_from" date`,
    `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "pause_until" date`,
    `CREATE INDEX IF NOT EXISTS "customers_delivery_type_idx" ON "customers" ("tenant_id", "delivery_type")`,
  ];

  for (const stmt of newStmts) {
    console.log(`Executing: ${stmt.substring(0, 80)}...`);
    await sql.query(stmt);
    console.log("  OK");
  }

  const migration9Stmts = [
    `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "delivery_start_date" date`,
    `UPDATE "customers" SET "delivery_start_date" = "created_at"::date WHERE "delivery_type" = 'ALTERNATE_DAYS' AND "delivery_start_date" IS NULL`,
  ];

  for (const stmt of migration9Stmts) {
    console.log(`Executing: ${stmt.substring(0, 80)}...`);
    await sql.query(stmt);
    console.log("  OK");
  }

  const migration10Stmts = [
    `CREATE INDEX IF NOT EXISTS "users_tenant_role_deleted_idx" ON "users" ("tenant_id", "role", "deleted_at")`,
  ];

  for (const stmt of migration10Stmts) {
    console.log(`Executing: ${stmt.substring(0, 80)}...`);
    await sql.query(stmt);
    console.log("  OK");
  }

  console.log("Migration complete");
}

main();
