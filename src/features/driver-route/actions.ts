"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { Session } from "@/lib/auth-guards";
import type { AppRole } from "@/config/roles";
import * as service from "./service";

async function getSession(): Promise<Session> {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return null;
  const role = result.user.role as AppRole;
  return { user: { ...result.user, role } };
}

export async function getAssignedRouteAction() {
  const session = await getSession();
  return service.getAssignedRoute(session);
}
