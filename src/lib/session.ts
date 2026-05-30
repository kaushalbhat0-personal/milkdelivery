import { cache } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { Session } from "@/lib/auth-guards";
import type { AppRole } from "@/config/roles";

export const getSession = cache(async (): Promise<Session> => {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return null;
  const role = result.user.role as AppRole;
  return { user: { ...result.user, role } };
});
