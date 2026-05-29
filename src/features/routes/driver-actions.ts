"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Session } from "@/lib/auth-guards";
import type { AppRole } from "@/config/roles";
import * as driverService from "./driver-service";

async function getSession(): Promise<Session> {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return null;
  const role = result.user.role as AppRole;
  return { user: { ...result.user, role } };
}

export async function getDriverRouteAction() {
  const session = await getSession();
  return driverService.getDriverRoute(session);
}

export async function completeDeliveryAction(
  routeStopId: string,
  notes?: string
) {
  const session = await getSession();
  const result = await driverService.completeDelivery(session, routeStopId, notes);
  revalidatePath("/route");
  return result;
}
