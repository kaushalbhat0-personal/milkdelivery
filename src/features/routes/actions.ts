"use server";

import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/session";
import * as service from "./service";
import type { CreateRouteInput, UpdateRouteInput, AssignDriverInput, AddCustomerToRouteInput, RemoveCustomerFromRouteInput, ReorderStopsInput, RouteSearchInput } from "./schemas";
import { ROUTE_TAG } from "@/lib/cache-tags";

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
  revalidateTag(ROUTE_TAG, "max");
  return result;
}

export async function updateRouteAction(id: string, input: UpdateRouteInput) {
  const session = await getSession();
  const result = await service.updateRoute(session, id, input);
  revalidateTag(ROUTE_TAG, "max");
  return result;
}

export async function deleteRouteAction(id: string) {
  const session = await getSession();
  const result = await service.deleteRoute(session, id);
  revalidateTag(ROUTE_TAG, "max");
  return result;
}

export async function assignDriverAction(routeId: string, input: AssignDriverInput) {
  const session = await getSession();
  const result = await service.assignDriver(session, routeId, input);
  revalidateTag(ROUTE_TAG, "max");
  return result;
}

export async function unassignDriverAction(routeId: string) {
  const session = await getSession();
  const result = await service.unassignDriver(session, routeId);
  revalidateTag(ROUTE_TAG, "max");
  return result;
}

export async function addCustomerAction(routeId: string, input: AddCustomerToRouteInput) {
  const session = await getSession();
  const result = await service.addCustomerToRoute(session, routeId, input);
  revalidateTag(ROUTE_TAG, "max");
  return result;
}

export async function removeCustomerAction(routeId: string, input: RemoveCustomerFromRouteInput) {
  const session = await getSession();
  const result = await service.removeCustomerFromRoute(session, routeId, input);
  revalidateTag(ROUTE_TAG, "max");
  return result;
}

export async function reorderStopsAction(routeId: string, input: ReorderStopsInput) {
  const session = await getSession();
  const result = await service.reorderStops(session, routeId, input);
  revalidateTag(ROUTE_TAG, "max");
  return result;
}
