"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Session } from "@/lib/auth-guards";
import type { AppRole } from "@/config/roles";
import * as service from "./service";
import type { CreateRouteInput, UpdateRouteInput, AssignDriverInput, AddCustomerToRouteInput, RemoveCustomerFromRouteInput, ReorderStopsInput, RouteSearchInput } from "./schemas";

async function getSession(): Promise<Session> {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return null;
  const role = result.user.role as AppRole;
  return { user: { ...result.user, role } };
}

export async function getRoutesAction(input: RouteSearchInput) {
  const session = await getSession();
  return service.getRoutes(session, input);
}

export async function getRouteAction(id: string) {
  const session = await getSession();
  return service.getRoute(session, id);
}

export async function createRouteAction(input: CreateRouteInput) {
  const session = await getSession();
  const result = await service.createRoute(session, input);
  revalidatePath("/routes");
  return result;
}

export async function updateRouteAction(id: string, input: UpdateRouteInput) {
  const session = await getSession();
  const result = await service.updateRoute(session, id, input);
  revalidatePath("/routes");
  return result;
}

export async function deleteRouteAction(id: string) {
  const session = await getSession();
  const result = await service.deleteRoute(session, id);
  revalidatePath("/routes");
  return result;
}

export async function assignDriverAction(routeId: string, input: AssignDriverInput) {
  const session = await getSession();
  const result = await service.assignDriver(session, routeId, input);
  revalidatePath("/routes");
  return result;
}

export async function unassignDriverAction(routeId: string) {
  const session = await getSession();
  const result = await service.unassignDriver(session, routeId);
  revalidatePath("/routes");
  return result;
}

export async function addCustomerAction(routeId: string, input: AddCustomerToRouteInput) {
  const session = await getSession();
  const result = await service.addCustomerToRoute(session, routeId, input);
  revalidatePath("/routes");
  return result;
}

export async function removeCustomerAction(routeId: string, input: RemoveCustomerFromRouteInput) {
  const session = await getSession();
  const result = await service.removeCustomerFromRoute(session, routeId, input);
  revalidatePath("/routes");
  return result;
}

export async function reorderStopsAction(routeId: string, input: ReorderStopsInput) {
  const session = await getSession();
  const result = await service.reorderStops(session, routeId, input);
  revalidatePath(`/routes/${routeId}`);
  return result;
}
