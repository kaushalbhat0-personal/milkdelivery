import { and, asc, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { routes } from "@/lib/db/schema/routes";
import { routeStops } from "@/lib/db/schema/route-stops";
import { customers } from "@/lib/db/schema/customers";
import { deliveryLogs } from "@/lib/db/schema/delivery-logs";
import { users } from "@/lib/db/schema/auth";
import { tenantFilter } from "@/lib/tenant";
import { ROLES } from "@/config/roles";

export type StopWithPlan = {
  stopId: string;
  routeId: string;
  driverId: string | null;
  routeName: string;
  deliveryType: string;
  quantity: string | null;
  unit: string | null;
  deliveryDays: string[] | null;
  pauseFrom: string | null;
  pauseUntil: string | null;
  deliveryStartDate: string | null;
};

export type TodayMetrics = {
  totalStops: number;
  delivered: number;
  skipped: number;
  notRequired: number;
  pending: number;
};

export type DriverTodaySummary = {
  driverId: string;
  driverName: string;
  routeName: string;
  assignedStops: number;
  delivered: number;
  skipped: number;
  pending: number;
};

export type RouteTodaySummary = {
  routeId: string;
  routeName: string;
  driverName: string | null;
  totalStops: number;
  completedStops: number;
  pendingStops: number;
};

const activeStopsWithPlansStmt = db
  .select({
    stopId: routeStops.id,
    routeId: routeStops.routeId,
    driverId: routes.driverId,
    routeName: routes.name,
    deliveryType: customers.deliveryType,
    quantity: customers.quantity,
    unit: customers.unit,
    deliveryDays: customers.deliveryDays,
    pauseFrom: customers.pauseFrom,
    pauseUntil: customers.pauseUntil,
    deliveryStartDate: customers.deliveryStartDate,
  })
  .from(routeStops)
  .innerJoin(routes, eq(routeStops.routeId, routes.id))
  .innerJoin(customers, eq(routeStops.customerId, customers.id))
  .where(
    and(
      eq(routeStops.tenantId, sql.placeholder("tenantId")),
      eq(routes.isActive, true),
      isNull(routes.deletedAt),
      isNull(routeStops.deletedAt),
    )
  )
  .orderBy(asc(routeStops.sortOrder))
  .prepare("dd_active_stops_with_plans");

export async function getActiveStopsWithPlansQuery(tenantId: string): Promise<StopWithPlan[]> {
  return activeStopsWithPlansStmt.execute({ tenantId });
}

export async function getLogStatusesForStopsQuery(
  stopIds: string[],
  tenantId: string
): Promise<{ routeStopId: string; status: string }[]> {
  if (stopIds.length === 0) return [];
  const today = sql`CURRENT_DATE`;

  return db
    .select({
      routeStopId: deliveryLogs.routeStopId,
      status: deliveryLogs.status,
    })
    .from(deliveryLogs)
    .where(
      and(
        inArray(deliveryLogs.routeStopId, stopIds),
        eq(deliveryLogs.deliveryDate, today),
        tenantFilter(deliveryLogs, tenantId),
      )
    );
}

const todayDeliveryLogsStmt = db
  .select({
    routeStopId: deliveryLogs.routeStopId,
    status: deliveryLogs.status,
  })
  .from(deliveryLogs)
  .where(
    and(
      eq(deliveryLogs.deliveryDate, sql.raw("CURRENT_DATE")),
      eq(deliveryLogs.tenantId, sql.placeholder("tenantId")),
    )
  )
  .prepare("dd_today_delivery_logs");

export async function getTodayDeliveryLogsQuery(
  tenantId: string
): Promise<{ routeStopId: string; status: string }[]> {
  return todayDeliveryLogsStmt.execute({ tenantId });
}

export async function getDriversByIdsQuery(
  driverIds: string[],
  tenantId: string
): Promise<{ id: string; name: string }[]> {
  if (driverIds.length === 0) return [];
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(
      and(
        inArray(users.id, driverIds),
        eq(users.tenantId, tenantId),
        eq(users.role, ROLES.DRIVER),
        isNull(users.deletedAt),
      )
    );
}

export async function getTodayMetricsQuery(tenantId: string): Promise<TodayMetrics> {
  const today = sql`CURRENT_DATE`;

  const activeRoutes = db
    .select({ id: routes.id })
    .from(routes)
    .where(
      and(
        tenantFilter(routes, tenantId),
        eq(routes.isActive, true),
        isNull(routes.deletedAt),
      )
    );

  const totalStopsQuery = db
    .select({ total: count() })
    .from(routeStops)
    .where(
      and(
        tenantFilter(routeStops, tenantId),
        inArray(routeStops.routeId, activeRoutes),
        isNull(routeStops.deletedAt),
      )
    );

  const deliveredQuery = db
    .select({ total: count() })
    .from(deliveryLogs)
    .where(
      and(
        tenantFilter(deliveryLogs, tenantId),
        eq(deliveryLogs.deliveryDate, today),
        eq(deliveryLogs.status, "DELIVERED"),
      )
    );

  const skippedQuery = db
    .select({ total: count() })
    .from(deliveryLogs)
    .where(
      and(
        tenantFilter(deliveryLogs, tenantId),
        eq(deliveryLogs.deliveryDate, today),
        eq(deliveryLogs.status, "SKIPPED"),
      )
    );

  const notRequiredQuery = db
    .select({ total: count() })
    .from(deliveryLogs)
    .where(
      and(
        tenantFilter(deliveryLogs, tenantId),
        eq(deliveryLogs.deliveryDate, today),
        eq(deliveryLogs.status, "NOT_REQUIRED"),
      )
    );

  const [[{ total: totalStops }], [{ total: delivered }], [{ total: skipped }], [{ total: notRequired }]] =
    await Promise.all([totalStopsQuery, deliveredQuery, skippedQuery, notRequiredQuery]);

  return {
    totalStops,
    delivered,
    skipped,
    notRequired,
    pending: totalStops - delivered - skipped - notRequired,
  };
}

export async function getDriversTodaySummaryQuery(tenantId: string): Promise<DriverTodaySummary[]> {
  const today = sql`CURRENT_DATE`;

  const driverRoutes = await db
    .select({
      routeId: routes.id,
      routeName: routes.name,
      driverId: routes.driverId,
    })
    .from(routes)
    .where(
      and(
        tenantFilter(routes, tenantId),
        eq(routes.isActive, true),
        sql`${routes.driverId} IS NOT NULL`,
        isNull(routes.deletedAt),
      )
    );

  if (!driverRoutes.length) return [];

  const driverIds = [...new Set(driverRoutes.map((r) => r.driverId!))];
  const routeIds = driverRoutes.map((r) => r.routeId);

  const [drivers, stopsByRoute, logsToday] = await Promise.all([
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(
        and(
          inArray(users.id, driverIds),
          eq(users.role, ROLES.DRIVER),
          isNull(users.deletedAt),
        )
      ),

    db
      .select({
        routeId: routeStops.routeId,
        stopId: routeStops.id,
      })
      .from(routeStops)
      .where(
        and(
          inArray(routeStops.routeId, routeIds),
          tenantFilter(routeStops, tenantId),
          isNull(routeStops.deletedAt),
        )
      ),

    db
      .select({
        routeStopId: deliveryLogs.routeStopId,
        status: deliveryLogs.status,
      })
      .from(deliveryLogs)
      .where(
        and(
          eq(deliveryLogs.deliveryDate, today),
          tenantFilter(deliveryLogs, tenantId),
        )
      ),
  ]);

  const driverNameMap = new Map(drivers.map((d) => [d.id, d.name]));

  const stopsPerRoute = new Map<string, string[]>();
  for (const s of stopsByRoute) {
    const arr = stopsPerRoute.get(s.routeId) ?? [];
    arr.push(s.stopId);
    stopsPerRoute.set(s.routeId, arr);
  }

  const statusPerStop = new Map(logsToday.map((l) => [l.routeStopId, l.status]));

  return driverRoutes.map((r) => {
    const stopIds = stopsPerRoute.get(r.routeId) ?? [];
    const assignedStops = stopIds.length;
    let delivered = 0;
    let skipped = 0;
    for (const sid of stopIds) {
      const status = statusPerStop.get(sid);
      if (status === "DELIVERED") delivered++;
      else if (status === "SKIPPED" || status === "NOT_REQUIRED") skipped++;
    }
    return {
      driverId: r.driverId!,
      driverName: driverNameMap.get(r.driverId!) ?? "Unknown",
      routeName: r.routeName,
      assignedStops,
      delivered,
      skipped,
      pending: assignedStops - delivered - skipped,
    };
  });
}

export async function getRoutesTodaySummaryQuery(tenantId: string): Promise<RouteTodaySummary[]> {
  const today = sql`CURRENT_DATE`;

  const allRoutes = await db
    .select({
      routeId: routes.id,
      routeName: routes.name,
      driverId: routes.driverId,
    })
    .from(routes)
    .where(
      and(
        tenantFilter(routes, tenantId),
        eq(routes.isActive, true),
        isNull(routes.deletedAt),
      )
    );

  if (!allRoutes.length) return [];

  const routeIds = allRoutes.map((r) => r.routeId);
  const driverIds = allRoutes.map((r) => r.driverId).filter(Boolean) as string[];

  const [drivers, stopsByRoute, logsToday] = await Promise.all([
    driverIds.length
      ? db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(
            and(
              inArray(users.id, driverIds),
              eq(users.role, ROLES.DRIVER),
              isNull(users.deletedAt),
            )
          )
      : Promise.resolve([]),

    db
      .select({
        routeId: routeStops.routeId,
        stopId: routeStops.id,
      })
      .from(routeStops)
      .where(
        and(
          inArray(routeStops.routeId, routeIds),
          tenantFilter(routeStops, tenantId),
          isNull(routeStops.deletedAt),
        )
      ),

    db
      .select({
        routeStopId: deliveryLogs.routeStopId,
        status: deliveryLogs.status,
      })
      .from(deliveryLogs)
      .where(
        and(
          eq(deliveryLogs.deliveryDate, today),
          tenantFilter(deliveryLogs, tenantId),
        )
      ),
  ]);

  const driverNameMap = new Map(drivers.map((d) => [d.id, d.name]));

  const stopsPerRoute = new Map<string, string[]>();
  for (const s of stopsByRoute) {
    const arr = stopsPerRoute.get(s.routeId) ?? [];
    arr.push(s.stopId);
    stopsPerRoute.set(s.routeId, arr);
  }

  const statusPerStop = new Map(logsToday.map((l) => [l.routeStopId, l.status]));

  return allRoutes.map((r) => {
    const stopIds = stopsPerRoute.get(r.routeId) ?? [];
    const totalStops = stopIds.length;
    let completed = 0;
    for (const sid of stopIds) {
      const status = statusPerStop.get(sid);
      if (status && status !== "PENDING") completed++;
    }
    return {
      routeId: r.routeId,
      routeName: r.routeName,
      driverName: r.driverId ? driverNameMap.get(r.driverId) ?? null : null,
      totalStops,
      completedStops: completed,
      pendingStops: totalStops - completed,
    };
  });
}
