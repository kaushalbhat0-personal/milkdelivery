import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { routes } from "@/lib/db/schema/routes";
import { routeStops } from "@/lib/db/schema/route-stops";
import { routeStops as routeStopsTable } from "@/lib/db/schema/route-stops";
import { customers } from "@/lib/db/schema/customers";
import { users } from "@/lib/db/schema/auth";
import { deliveryLogs } from "@/lib/db/schema/delivery-logs";
import { tenantFilter } from "@/lib/tenant";

export type DeliveryStatus = "PENDING" | "DELIVERED" | "SKIPPED" | "NOT_REQUIRED";

export type RawDriverRouteStop = {
  id: string;
  sortOrder: number;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string;
  landmark: string | null;
  notes: string | null;
  housePhotoUrl: string | null;
  latitude: string | null;
  longitude: string | null;
  deliveryType: string;
  quantity: string | null;
  unit: string | null;
  deliveryDays: string[] | null;
  pauseFrom: string | null;
  pauseUntil: string | null;
  deliveryStartDate: string | null;
  customerCreatedAt: Date;
};

export type DriverRouteStop = RawDriverRouteStop & {
  deliveryStatus: DeliveryStatus;
  deliveryNotes: string | null;
  deliverySkipReason: string | null;
};

export type DriverRouteData = {
  route: typeof routes.$inferSelect;
  driver: { name: string | null; email: string | null } | null;
  stops: DriverRouteStop[];
  allStopsHaveStatus: boolean;
  totalStops: number;
  totalQuantity: number;
};

export async function getAssignedRouteQuery(
  driverId: string,
  tenantId: string
) {
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

  const [driver] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, driverId))
    .limit(1);

  const rawStops = await db
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
      latitude: customers.latitude,
      longitude: customers.longitude,
      deliveryType: customers.deliveryType,
      quantity: customers.quantity,
      unit: customers.unit,
      deliveryDays: customers.deliveryDays,
      pauseFrom: customers.pauseFrom,
      pauseUntil: customers.pauseUntil,
      deliveryStartDate: customers.deliveryStartDate,
      customerCreatedAt: customers.createdAt,
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

  const stopIds = rawStops.map((s) => s.id);
  const today = sql`CURRENT_DATE`;

  const todayLogs = stopIds.length
    ? await db
        .select({
          routeStopId: deliveryLogs.routeStopId,
          status: deliveryLogs.status,
          notes: deliveryLogs.notes,
          skipReason: deliveryLogs.skipReason,
        })
        .from(deliveryLogs)
        .where(
          and(
            inArray(deliveryLogs.routeStopId, stopIds),
            eq(deliveryLogs.deliveryDate, today),
            tenantFilter(deliveryLogs, tenantId),
          )
        )
    : [];

  const logMap = new Map(todayLogs.map((l) => [l.routeStopId, l]));

  const stopsWithStatus: (RawDriverRouteStop & { deliveryStatus: DeliveryStatus; deliveryNotes: string | null; deliverySkipReason: string | null })[] = rawStops.map((s) => {
    const log = logMap.get(s.id);
    return {
      ...s,
      deliveryStatus: log ? (log.status as DeliveryStatus) : "PENDING",
      deliveryNotes: log?.notes ?? null,
      deliverySkipReason: log?.skipReason ?? null,
    };
  });

  return {
    route,
    driver,
    rawStops: stopsWithStatus,
  };
}

export async function getRouteByIdQueryDriver(id: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(routes)
    .where(and(eq(routes.id, id), tenantFilter(routes, tenantId)))
    .limit(1);

  return row ?? null;
}

export async function getStopByIdQuery(stopId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: routeStopsTable.id,
      routeId: routeStopsTable.routeId,
      tenantId: routeStopsTable.tenantId,
    })
    .from(routeStopsTable)
    .where(and(eq(routeStopsTable.id, stopId), tenantFilter(routeStopsTable, tenantId)))
    .limit(1);

  return row ?? null;
}

export async function getDeliveryLogQuery(routeStopId: string, tenantId: string, deliveryDate: string) {
  const [row] = await db
    .select()
    .from(deliveryLogs)
    .where(
      and(
        eq(deliveryLogs.routeStopId, routeStopId),
        eq(deliveryLogs.deliveryDate, deliveryDate),
        tenantFilter(deliveryLogs, tenantId),
      )
    )
    .limit(1);

  return row ?? null;
}

export async function createDeliveryLogQuery(data: typeof deliveryLogs.$inferInsert) {
  const [row] = await db.insert(deliveryLogs).values(data).returning();
  return row;
}

export async function updateDeliveryLogQuery(
  id: string,
  data: Partial<typeof deliveryLogs.$inferInsert>
) {
  const [row] = await db
    .update(deliveryLogs)
    .set(data)
    .where(eq(deliveryLogs.id, id))
    .returning();

  return row;
}
