import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema/customers";
import { routes } from "@/lib/db/schema/routes";
import { routeStops } from "@/lib/db/schema/route-stops";
import { deliveryLogs } from "@/lib/db/schema/delivery-logs";
import { users } from "@/lib/db/schema/auth";
import { tenantActiveFilter, tenantFilter } from "@/lib/tenant";

export type CustomerExportRow = {
  name: string;
  phone: string | null;
  address: string;
  landmark: string | null;
  deliveryType: string;
  quantity: string | null;
  unit: string | null;
  deliveryDays: string;
  pauseFrom: string | null;
  pauseUntil: string | null;
  deliveryStartDate: string | null;
  isActive: boolean;
  createdAt: Date;
};

export type DeliveryLogExportRow = {
  date: string;
  status: string;
  skipReason: string | null;
  notes: string | null;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string;
  driverName: string | null;
  routeName: string | null;
  completedAt: Date | null;
};

export type RouteExportRow = {
  name: string;
  zone: string | null;
  description: string | null;
  driverName: string | null;
  isActive: boolean;
  customerCount: number;
  completedAt: Date | null;
  createdAt: Date;
};

export async function exportCustomersQuery(tenantId: string) {
  return db
    .select({
      name: customers.name,
      phone: customers.phone,
      address: customers.address,
      landmark: customers.landmark,
      deliveryType: customers.deliveryType,
      quantity: customers.quantity,
      unit: customers.unit,
      deliveryDays: sql<string>`COALESCE(array_to_string(${customers.deliveryDays}, ','), '')`,
      pauseFrom: customers.pauseFrom,
      pauseUntil: customers.pauseUntil,
      deliveryStartDate: customers.deliveryStartDate,
      isActive: customers.isActive,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(tenantActiveFilter(customers, tenantId))
    .orderBy(asc(customers.name));
}

export async function exportDeliveryLogsQuery(tenantId: string) {
  return db
    .select({
      date: deliveryLogs.deliveryDate,
      status: deliveryLogs.status,
      skipReason: deliveryLogs.skipReason,
      notes: deliveryLogs.notes,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerAddress: customers.address,
      driverName: users.name,
      routeName: routes.name,
      completedAt: deliveryLogs.completedAt,
    })
    .from(deliveryLogs)
    .innerJoin(routeStops, eq(deliveryLogs.routeStopId, routeStops.id))
    .innerJoin(customers, eq(routeStops.customerId, customers.id))
    .innerJoin(users, eq(deliveryLogs.driverId, users.id))
    .leftJoin(routes, eq(routeStops.routeId, routes.id))
    .where(
      and(
        tenantFilter(deliveryLogs, tenantId),
        isNull(routeStops.deletedAt),
      )
    )
    .orderBy(desc(deliveryLogs.deliveryDate));
}

export async function exportRoutesQuery(tenantId: string) {
  return db
    .select({
      name: routes.name,
      zone: routes.zone,
      description: routes.description,
      driverName: users.name,
      isActive: routes.isActive,
      customerCount: sql<number>`(
        SELECT COUNT(*) FROM ${routeStops}
        WHERE ${eq(routeStops.routeId, routes.id)}
        AND ${isNull(routeStops.deletedAt)}
      )`,
      completedAt: routes.completedAt,
      createdAt: routes.createdAt,
    })
    .from(routes)
    .leftJoin(users, eq(routes.driverId, users.id))
    .where(
      and(
        tenantFilter(routes, tenantId),
        isNull(routes.deletedAt),
      )
    )
    .orderBy(asc(routes.name));
}
