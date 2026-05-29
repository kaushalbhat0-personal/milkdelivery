import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const url = process.env.DATABASE_URL;
console.log("Local DATABASE_URL (masked):", url ? url.replace(/\/\/.*@/, "//***:***@").replace(/\/.*\?/, "/***?") : "NOT SET");

const sql = neon(url);

const sessionsCols = await sql`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'sessions' ORDER BY ordinal_position`;
console.log("\nSessions table columns:");
sessionsCols.forEach((c) => console.log(" ", c.column_name, "|", c.data_type, "| nullable:", c.is_nullable, "| default:", c.column_default || "none"));

const usersCols = await sql`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`;
console.log("\nUsers table columns:");
usersCols.forEach((c) => console.log(" ", c.column_name, "|", c.data_type, "| nullable:", c.is_nullable, "| default:", c.column_default || "none"));

const hasImpersonatedBy = sessionsCols.some((c) => c.column_name === "impersonated_by");
console.log("\nimpersonated_by exists in sessions:", hasImpersonatedBy);

const hasBanned = usersCols.some((c) => c.column_name === "banned");
console.log("banned exists in users:", hasBanned);
