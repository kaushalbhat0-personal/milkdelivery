import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
console.log("DB host:", url ? url.match(/@([^\/]+)/)?.[1] : "NOT SET");

const sql = neon(url);

const [result] = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'impersonated_by'`;
console.log("impersonated_by exists:", !!result);
