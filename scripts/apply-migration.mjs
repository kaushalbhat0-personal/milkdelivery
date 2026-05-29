import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const url = process.env.DATABASE_URL;
const sql = neon(url);

console.log("Applying migration 0004 SQL directly...");

try {
  await sql`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`;
  console.log("1/5: role default set");
} catch (e) {
  console.log("1/5: skipped or error:", e.message);
}

try {
  await sql`ALTER TABLE "sessions" ADD COLUMN "impersonated_by" text`;
  console.log("2/5: impersonated_by added to sessions");
} catch (e) {
  console.log("2/5: skipped or error:", e.message);
}

try {
  await sql`ALTER TABLE "users" ADD COLUMN "banned" boolean DEFAULT false NOT NULL`;
  console.log("3/5: banned added to users");
} catch (e) {
  console.log("3/5: skipped or error:", e.message);
}

try {
  await sql`ALTER TABLE "users" ADD COLUMN "ban_reason" text`;
  console.log("4/5: ban_reason added to users");
} catch (e) {
  console.log("4/5: skipped or error:", e.message);
}

try {
  await sql`ALTER TABLE "users" ADD COLUMN "ban_expires" timestamp`;
  console.log("5/5: ban_expires added to users");
} catch (e) {
  console.log("5/5: skipped or error:", e.message);
}

// Verify
const sessionsCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'sessions'`;
console.log("\nSessions columns:", sessionsCols.map(c => c.column_name).join(", "));
const usersCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`;
console.log("Users columns:", usersCols.map(c => c.column_name).join(", "));
