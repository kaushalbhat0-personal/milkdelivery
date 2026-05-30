import { eq, and, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { routeStops } from "@/lib/db/schema/route-stops";
import { routes } from "@/lib/db/schema/routes";
import { users } from "@/lib/db/schema/auth";
import { customers } from "@/lib/db/schema/customers";
import { getTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import type { Session } from "@/lib/auth-guards";
import { ROLES } from "@/config/roles";
import * as queries from "./queries";
import {
  createRouteSchema,
  updateRouteSchema,
  assignDriverSchema,
  addCustomerToRouteSchema,
  removeCustomerFromRouteSchema,
  reorderStopsSchema,
  routeSearchSchema,
  type CreateRouteInput,
  type UpdateRouteInput,
  type AssignDriverInput,
  type AddCustomerToRouteInput,
  type RemoveCustomerFromRouteInput,
  type ReorderStopsInput,
  type RouteSearchInput,
} from "./schemas";

async function assertDriverNotAssigned(
  tenantId: string,
  driverId: string,
  excludeRouteId?: string
) {
  const conditions = [
    eq(routes.driverId, driverId),
    eq(routes.tenantId, tenantId),
    eq(routes.isActive, true),
    isNull(routes.deletedAt),
  ];
  if (excludeRouteId) {
    conditions.push(ne(routes.id, excludeRouteId));
  }

  const [existing] = await db
    .select({ id: routes.id, name: routes.name })
    .from(routes)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    throw new Error(
      "Driver is already assigned to another active route"
    );
  }
}

export async function getRoutes(session: Session, input: RouteSearchInput) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const params = routeSearchSchema.parse(input);

  return queries.getRoutesQuery(tenantId, params);
}

export async function getRoute(session: Session, id: string) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const route = await queries.getRouteByIdQuery(id, tenantId);
  if (!route) {
    throw new Error("Route not found");
  }

  const stops = await queries.getRouteStopsQuery(id, tenantId);

  return { ...route, stops };
}

export async function createRoute(session: Session, input: CreateRouteInput) {
  const user = requireAdmin(session);
  const tenantId = user.tenantId;

  const data = createRouteSchema.parse(input);

  if (data.driverId) {
    const driver = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, data.driverId),
          eq(users.tenantId, tenantId),
          eq(users.role, ROLES.DRIVER),
          isNull(users.deletedAt),
        )
      )
      .limit(1);

    if (!driver.length) {
      throw new Error("Driver not found or is inactive");
    }

    await assertDriverNotAssigned(tenantId, data.driverId);
  }

  return queries.createRouteQuery({
    name: data.name,
    description: data.description ?? null,
    zone: data.zone ?? null,
    driverId: data.driverId ?? null,
    tenantId,
    createdBy: user.id,
    updatedBy: user.id,
  });
}

export async function updateRoute(session: Session, id: string, input: UpdateRouteInput) {
  const user = requireAdmin(session);
  const tenantId = user.tenantId;

  const existing = await queries.getRouteByIdQuery(id, tenantId);
  if (!existing) {
    throw new Error("Route not found");
  }

  const data = updateRouteSchema.parse(input);

  if (data.driverId) {
    const driver = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, data.driverId),
          eq(users.tenantId, tenantId),
          eq(users.role, ROLES.DRIVER),
          isNull(users.deletedAt),
        )
      )
      .limit(1);

    if (!driver.length) {
      throw new Error("Driver not found or is inactive");
    }

    await assertDriverNotAssigned(tenantId, data.driverId, id);
  }

  const updateData: Record<string, unknown> = { updatedBy: user.id };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description ?? null;
  if (data.zone !== undefined) updateData.zone = data.zone ?? null;
  if (data.driverId !== undefined) updateData.driverId = data.driverId ?? null;

  const updated = await queries.updateRouteQuery(id, tenantId, updateData);
  if (!updated) {
    throw new Error("Failed to update route");
  }

  return updated;
}

export async function deleteRoute(session: Session, id: string) {
  const user = requireAdmin(session);
  const tenantId = user.tenantId;

  const existing = await queries.getRouteByIdQuery(id, tenantId);
  if (!existing) {
    throw new Error("Route not found");
  }

  const hasLogs = await queries.hasDeliveryLogsQuery(id);
  if (hasLogs) {
    throw new Error("Cannot delete route with delivery history");
  }

  const deleted = await queries.softDeleteRouteQuery(id, tenantId);
  if (!deleted) {
    throw new Error("Failed to delete route");
  }

  return deleted;
}

export async function assignDriver(session: Session, routeId: string, input: AssignDriverInput) {
  const user = requireAdmin(session);
  const tenantId = user.tenantId;

  const route = await queries.getRouteByIdQuery(routeId, tenantId);
  if (!route) {
    throw new Error("Route not found");
  }

  const { driverId } = assignDriverSchema.parse(input);

  const driver = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, driverId),
        eq(users.tenantId, tenantId),
        eq(users.role, ROLES.DRIVER),
        isNull(users.deletedAt),
      )
    )
    .limit(1);

  if (!driver.length) {
    throw new Error("Driver not found or is inactive");
  }

  await assertDriverNotAssigned(tenantId, driverId, routeId);

  const updated = await queries.updateRouteQuery(routeId, tenantId, {
    driverId,
    updatedBy: user.id,
  });

  if (!updated) {
    throw new Error("Failed to assign driver");
  }

  return updated;
}

export async function unassignDriver(session: Session, routeId: string) {
  const user = requireAdmin(session);
  const tenantId = user.tenantId;

  const route = await queries.getRouteByIdQuery(routeId, tenantId);
  if (!route) {
    throw new Error("Route not found");
  }

  const updated = await queries.updateRouteQuery(routeId, tenantId, {
    driverId: null,
    updatedBy: user.id,
  });

  if (!updated) {
    throw new Error("Failed to unassign driver");
  }

  return updated;
}

export async function addCustomerToRoute(session: Session, routeId: string, input: AddCustomerToRouteInput) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const route = await queries.getRouteByIdQuery(routeId, tenantId);
  if (!route) {
    throw new Error("Route not found");
  }

  const { customerId } = addCustomerToRouteSchema.parse(input);

  const customer = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.tenantId, tenantId),
        eq(customers.isActive, true),
        isNull(customers.deletedAt),
      )
    )
    .limit(1);

  if (!customer.length) {
    throw new Error("Customer not found or is inactive");
  }

  const alreadyExists = await queries.checkStopExistsInRouteQuery(customerId, routeId);
  if (alreadyExists) {
    throw new Error("Customer is already assigned to this route");
  }

  const maxSort = await queries.getMaxSortOrderQuery(routeId);

  const stop = await queries.addStopQuery({
    routeId,
    customerId,
    tenantId,
    sortOrder: maxSort + 1,
  });

  return stop;
}

export async function removeCustomerFromRoute(session: Session, routeId: string, input: RemoveCustomerFromRouteInput) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const route = await queries.getRouteByIdQuery(routeId, tenantId);
  if (!route) {
    throw new Error("Route not found");
  }

  const { stopId } = removeCustomerFromRouteSchema.parse(input);

  const removed = await queries.removeStopQuery(stopId, routeId, tenantId);
  if (!removed) {
    throw new Error("Stop not found");
  }

  return removed;
}

export async function reorderStops(session: Session, routeId: string, input: ReorderStopsInput) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const route = await queries.getRouteByIdQuery(routeId, tenantId);
  if (!route) {
    throw new Error("Route not found");
  }

  const { stopIds } = reorderStopsSchema.parse(input);

  const existingStops = await queries.getRouteStopsQuery(routeId, tenantId);
  const existingIds = new Set(existingStops.map((s) => s.id));

  for (const stopId of stopIds) {
    if (!existingIds.has(stopId)) {
      throw new Error(`Stop ${stopId} does not belong to this route`);
    }
  }

  if (stopIds.length !== existingStops.length) {
    throw new Error("All stops must be included in reorder");
  }

  const now = new Date();

  for (let i = 0; i < stopIds.length; i++) {
    await db
      .update(routeStops)
      .set({ sortOrder: -(i + 1), updatedAt: now })
      .where(
        and(
          eq(routeStops.id, stopIds[i]),
          eq(routeStops.routeId, routeId),
          isNull(routeStops.deletedAt),
        )
      );
  }

  for (let i = 0; i < stopIds.length; i++) {
    await db
      .update(routeStops)
      .set({ sortOrder: i + 1, updatedAt: now })
      .where(
        and(
          eq(routeStops.id, stopIds[i]),
          eq(routeStops.routeId, routeId),
          isNull(routeStops.deletedAt),
        )
      );
  }

  return queries.getRouteStopsQuery(routeId, tenantId);
}
