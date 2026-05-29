import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { createAccessControl } from "better-auth/plugins/access";
import { db } from "./db";
import * as schema from "./db/schema";

function getBaseURL(): string {
  const url = process.env.BETTER_AUTH_URL;
  if (!url) {
    throw new Error(
      "BETTER_AUTH_URL environment variable is not set. " +
      "Set it to your app's base URL (e.g., http://localhost:3000)."
    );
  }
  return url;
}

const ac = createAccessControl({
  user: ["create", "list", "get", "update", "delete", "set-role", "set-password"],
  session: ["list", "revoke", "delete"],
});

export const auth = betterAuth({
  baseURL: getBaseURL(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      tenantId: {
        type: "string",
        required: true,
      },
      role: {
        type: "string",
        required: true,
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },
  plugins: [
    nextCookies(),
    admin({
      roles: {
        admin: ac.newRole({
          user: ["create", "list", "get", "update", "delete", "set-role", "set-password"],
          session: ["list", "revoke", "delete"],
        }),
        driver: ac.newRole({
          user: [],
          session: [],
        }),
      },
    }),
  ],
});
