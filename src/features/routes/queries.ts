import { and, asc, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { routes } from "@/lib/db/schema/routes";
import { routeStops } from "@/lib/db/schema/route-stops";
import { customers } from "@/lib/db/schema/customers";
import { users } from "@/lib/db/schema/auth";
import { tenantFilter } from "@/lib/tenant";

export type RouteRow = typeof routes.$inferSelect;

export type RouteWithDetails = RouteRow & {
  driverName: string | null;
  driverEmail: string | null;
  customerCount: number;
};

export type RouteStopWithCustomer = typeof routeStops.$inferSelect & {
  customerName: string;
  customerPhone: string | null;
  customerAddress: string;
  deliveryType: string;
  quantity: string | null;
  unit: string | null;
  deliveryDays: string[] | null;
  pauseFrom: string | null;
  pauseUntil: string | null;
  deliveryStartDate: string | null;
  customerCreatedAt: Date;
};

function routeScope(tenantId: string) {
  return and(
    tenantFilter(routes, tenantId),
    isNull(routes.deletedAt),
  )!;
}

export async function getRoutesQuery(
  tenantId: string,
  options: { search?: string; page: number; pageSize: number }
) {
  const { search, page, pageSize } = options;
  const offset = (page - 1) * pageSize;

  const conditions = [routeScope(tenantId)];

  if (search) {
    conditions.push(
      or(
        ilike(routes.name, `%${search}%`),
        ilike(routes.zone, `%${search}%`),
      )!
    );
  }

  const where = and(...conditions);

  const [total] = await db
    .select({ total: count() })
    .from(routes)
    .where(where);

  const rows = await db
    .select({
      id: routes.id,
      tenantId: routes.tenantId,
      name: routes.name,
      description: routes.description,
      zone: routes.zone,
      driverId: routes.driverId,
      isActive: routes.isActive,
      completedAt: routes.completedAt,
      completedBy: routes.completedBy,
      createdBy: routes.createdBy,
      updatedBy: routes.updatedBy,
      createdAt: routes.createdAt,
      updatedAt: routes.updatedAt,
      deletedAt: routes.deletedAt,
      driverName: users.name,
      driverEmail: users.email,
      customerCount: sql<number>`(
        SELECT COUNT(*) FROM ${routeStops}
        WHERE ${eq(routeStops.routeId, routes.id)}
        AND ${isNull(routeStops.deletedAt)}
      )`,
    })
    .from(routes)
    .leftJoin(users, eq(routes.driverId, users.id))
    .where(where)
    .orderBy(asc(routes.name))
    .limit(pageSize)
    .offset(offset);

  return { rows, total: total.total };
}

export async function getRouteByIdQuery(id: string, tenantId: string) {
  const [row] = await db
    .select({
      id: routes.id,
      tenantId: routes.tenantId,
      name: routes.name,
      description: routes.description,
      zone: routes.zone,
      driverId: routes.driverId,
      isActive: routes.isActive,
      completedAt: routes.completedAt,
      completedBy: routes.completedBy,
      createdBy: routes.createdBy,
      updatedBy: routes.updatedBy,
      createdAt: routes.createdAt,
      updatedAt: routes.updatedAt,
      deletedAt: routes.deletedAt,
      driverName: users.name,
      driverEmail: users.email,
      customerCount: sql<number>`(
        SELECT COUNT(*) FROM ${routeStops}
        WHERE ${eq(routeStops.routeId, routes.id)}
        AND ${isNull(routeStops.deletedAt)}
      )`,
    })
    .from(routes)
    .leftJoin(users, eq(routes.driverId, users.id))
    .where(
      and(
        eq(routes.id, id),
        routeScope(tenantId)
      )
    )
    .limit(1);

  return row ?? null;
}

const routeStopsStmt = db
  .select({
    id: routeStops.id,
    tenantId: routeStops.tenantId,
    routeId: routeStops.routeId,
    customerId: routeStops.customerId,
    sortOrder: routeStops.sortOrder,
    createdAt: routeStops.createdAt,
    updatedAt: routeStops.updatedAt,
    deletedAt: routeStops.deletedAt,
    customerName: customers.name,
    customerPhone: customers.phone,
    customerAddress: customers.address,
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
      eq(routeStops.routeId, sql.placeholder("routeId")),
      eq(routeStops.tenantId, sql.placeholder("tenantId")),
      isNull(routeStops.deletedAt),
    )
  )
  .orderBy(asc(routeStops.sortOrder))
  .prepare("route_stops_with_customers");

export async function getRouteStopsQuery(routeId: string, tenantId: string) {
  return routeStopsStmt.execute({ routeId, tenantId });
}

export async function createRouteQuery(data: typeof routes.$inferInsert) {
  const [row] = await db.insert(routes).values(data).returning();
  return row;
}

export async function updateRouteQuery(
  id: string,
  tenantId: string,
  data: Partial<typeof routes.$inferInsert>
) {
  const [row] = await db
    .update(routes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(routes.id, id), routeScope(tenantId)))
    .returning();

  return row ?? null;
}

export async function softDeleteRouteQuery(id: string, tenantId: string) {
  const [row] = await db
    .update(routes)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(routes.id, id), routeScope(tenantId)))
    .returning();

  return row ?? null;
}

export async function getMaxSortOrderQuery(routeId: string) {
  const [row] = await db
    .select({ max: sql<number>`COALESCE(MAX(${routeStops.sortOrder}), 0)` })
    .from(routeStops)
    .where(
      and(
        eq(routeStops.routeId, routeId),
        isNull(routeStops.deletedAt),
      )
    );

  return row?.max ?? 0;
}

export async function addStopQuery(data: typeof routeStops.$inferInsert) {
  const [row] = await db.insert(routeStops).values(data).returning();
  return row;
}

export async function removeStopQuery(stopId: string, routeId: string, tenantId: string) {
  const [row] = await db
    .delete(routeStops)
    .where(
      and(
        eq(routeStops.id, stopId),
        eq(routeStops.routeId, routeId),
        tenantFilter(routeStops, tenantId),
      )
    )
    .returning();

  return row ?? null;
}

export async function updateStopSortOrderQuery(
  stopId: string,
  routeId: string,
  sortOrder: number
) {
  const [row] = await db
    .update(routeStops)
    .set({ sortOrder, updatedAt: new Date() })
    .where(
      and(
        eq(routeStops.id, stopId),
        eq(routeStops.routeId, routeId),
        isNull(routeStops.deletedAt),
      )
    )
    .returning();

  return row ?? null;
}

export async function checkStopExistsInRouteQuery(customerId: string, routeId: string) {
  const [row] = await db
    .select({ id: routeStops.id })
    .from(routeStops)
    .where(
      and(
        eq(routeStops.customerId, customerId),
        eq(routeStops.routeId, routeId),
        isNull(routeStops.deletedAt),
      )
    )
    .limit(1);

  return !!row;
}

export async function hasDeliveryLogsQuery(routeId: string) {
  const { deliveryLogs } = await import("@/lib/db/schema/delivery-logs");
  const [row] = await db
    .select({ count: count() })
    .from(deliveryLogs)
    .where(
      sql`${deliveryLogs.routeStopId} IN (
        SELECT ${routeStops.id} FROM ${routeStops}
        WHERE ${eq(routeStops.routeId, routeId)}
      )`
    );

  return (row?.count ?? 0) > 0;
}
