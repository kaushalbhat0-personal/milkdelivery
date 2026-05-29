import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index";

function getDbUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
      "Ensure you have a .env file with DATABASE_URL=postgresql://..."
    );
  }
  return url;
}

const sql = neon(getDbUrl());

export const db = drizzle({ client: sql, schema, logger: process.env.NODE_ENV === "development" });
