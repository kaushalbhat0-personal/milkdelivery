import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { routes } from "@/lib/db/schema/routes";
import { routeStops } from "@/lib/db/schema/route-stops";
import { deliveryLogs } from "@/lib/db/schema/delivery-logs";
import { customers } from "@/lib/db/schema/customers";
import { tenantFilter } from "@/lib/tenant";

export type DriverRoute = {
  route: typeof routes.$inferSelect;
  stops: DriverRouteStop[];
  completedStopIds: Set<string>;
};

export type DriverRouteStop = {
  id: string;
  sortOrder: number;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string;
  landmark: string | null;
  notes: string | null;
  housePhotoUrl: string | null;
};

export async function getDriverRouteQuery(driverId: string, tenantId: string): Promise<DriverRoute | null> {
  const [route] = await db
    .select()
    .from(routes)
    .where(
      and(
        eq(routes.driverId, driverId),
        tenantFilter(routes, tenantId),
        eq(routes.isActive, true),
        isNull(routes.deletedAt),
      )
    )
    .limit(1);

  if (!route) return null;

  const stops = await db
    .select({
      id: routeStops.id,
      sortOrder: routeStops.sortOrder,
      customerId: routeStops.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerAddress: customers.address,
      landmark: customers.landmark,
      notes: customers.notes,
      housePhotoUrl: customers.housePhotoUrl,
    })
    .from(routeStops)
    .innerJoin(customers, eq(routeStops.customerId, customers.id))
    .where(
      and(
        eq(routeStops.routeId, route.id),
        tenantFilter(routeStops, tenantId),
        isNull(routeStops.deletedAt),
      )
    )
    .orderBy(asc(routeStops.sortOrder));

  const stopIds = stops.map((s) => s.id);
  const today = sql`CURRENT_DATE`;

  const completedLogs = stopIds.length
    ? await db
        .select({ routeStopId: deliveryLogs.routeStopId })
        .from(deliveryLogs)
        .where(
          and(
            inArray(deliveryLogs.routeStopId, stopIds),
            eq(deliveryLogs.deliveryDate, today),
            tenantFilter(deliveryLogs, tenantId),
          )
        )
    : [];

  return {
    route,
    stops,
    completedStopIds: new Set(completedLogs.map((l) => l.routeStopId)),
  };
}

export async function createDeliveryLogQuery(data: typeof deliveryLogs.$inferInsert) {
  const [row] = await db.insert(deliveryLogs).values(data).returning();
  return row;
}

export async function getStopByIdQuery(stopId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: routeStops.id,
      routeId: routeStops.routeId,
      tenantId: routeStops.tenantId,
    })
    .from(routeStops)
    .where(and(eq(routeStops.id, stopId), tenantFilter(routeStops, tenantId)))
    .limit(1);

  return row ?? null;
}

export async function getRouteByIdQuery(id: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(routes)
    .where(and(eq(routes.id, id), tenantFilter(routes, tenantId)))
    .limit(1);

  return row ?? null;
}

export async function hasCompletedTodayQuery(stopId: string, tenantId: string) {
  const today = sql`CURRENT_DATE`;
  const [row] = await db
    .select({ id: deliveryLogs.id })
    .from(deliveryLogs)
    .where(
      and(
        eq(deliveryLogs.routeStopId, stopId),
        eq(deliveryLogs.deliveryDate, today),
        tenantFilter(deliveryLogs, tenantId),
      )
    )
    .limit(1);

  return !!row;
}
