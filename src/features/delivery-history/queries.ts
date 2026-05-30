import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { deliveryLogs } from "@/lib/db/schema/delivery-logs";
import { routeStops } from "@/lib/db/schema/route-stops";
import { users } from "@/lib/db/schema/auth";
import { customers } from "@/lib/db/schema/customers";
import { routes } from "@/lib/db/schema/routes";
import { tenantFilter } from "@/lib/tenant";

export type DeliveryHistoryRow = {
  id: string;
  deliveryDate: string;
  status: string;
  skipReason: string | null;
  notes: string | null;
  completedAt: Date;
  driverName: string | null;
  routeName: string | null;
  routeStopId: string;
};

export async function getCustomerDeliveryHistoryQuery(
  customerId: string,
  tenantId: string,
  options: { limit?: number; offset?: number }
) {
  const { limit = 50, offset = 0 } = options;

  const rows = await db
    .select({
      id: deliveryLogs.id,
      deliveryDate: deliveryLogs.deliveryDate,
      status: deliveryLogs.status,
      skipReason: deliveryLogs.skipReason,
      notes: deliveryLogs.notes,
      completedAt: deliveryLogs.completedAt,
      driverName: users.name,
      routeName: routes.name,
      routeStopId: deliveryLogs.routeStopId,
    })
    .from(deliveryLogs)
    .innerJoin(routeStops, eq(deliveryLogs.routeStopId, routeStops.id))
    .innerJoin(users, eq(deliveryLogs.driverId, users.id))
    .innerJoin(customers, eq(routeStops.customerId, customers.id))
    .leftJoin(routes, eq(routeStops.routeId, routes.id))
    .where(
      and(
        eq(customers.id, customerId),
        tenantFilter(deliveryLogs, tenantId),
        isNull(routeStops.deletedAt),
      )
    )
    .orderBy(desc(deliveryLogs.deliveryDate))
    .limit(limit)
    .offset(offset);

  return rows;
}
