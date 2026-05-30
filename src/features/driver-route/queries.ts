import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { routes } from "@/lib/db/schema/routes";
import { routeStops } from "@/lib/db/schema/route-stops";
import { customers } from "@/lib/db/schema/customers";
import { users } from "@/lib/db/schema/auth";
import { tenantFilter } from "@/lib/tenant";

export type DriverRouteData = {
  route: typeof routes.$inferSelect;
  driver: { name: string | null; email: string | null } | null;
  stops: DriverRouteStop[];
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
  latitude: string | null;
  longitude: string | null;
};

export async function getAssignedRouteQuery(
  driverId: string,
  tenantId: string
): Promise<DriverRouteData | null> {
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
      latitude: customers.latitude,
      longitude: customers.longitude,
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

  return {
    route,
    driver,
    stops,
  };
}
