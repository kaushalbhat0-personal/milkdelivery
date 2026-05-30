"use server";

import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/session";
import * as service from "./service";
import { DRIVER_ROUTE_TAG } from "@/lib/cache-tags";

export async function getAssignedRouteAction() {
  const session = await getSession();
  return service.getAssignedRoute(session);
}

export async function completeDeliveryAction(routeStopId: string, notes?: string) {
  const session = await getSession();
  const result = await service.completeDelivery(session, routeStopId, notes);
  revalidateTag(DRIVER_ROUTE_TAG, "max");
  return result;
}

export async function skipDeliveryAction(routeStopId: string, skipReason: string, notes?: string) {
  const session = await getSession();
  const result = await service.skipDelivery(session, routeStopId, skipReason, notes);
  revalidateTag(DRIVER_ROUTE_TAG, "max");
  return result;
}

export async function markNotRequiredAction(routeStopId: string, notes?: string) {
  const session = await getSession();
  const result = await service.markNotRequired(session, routeStopId, notes);
  revalidateTag(DRIVER_ROUTE_TAG, "max");
  return result;
}

export async function finishRouteAction() {
  const session = await getSession();
  const result = await service.finishRoute(session);
  revalidateTag(DRIVER_ROUTE_TAG, "max");
  return result;
}
