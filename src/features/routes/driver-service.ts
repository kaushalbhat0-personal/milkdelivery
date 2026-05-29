import { requireDriver } from "@/lib/auth-guards";
import type { Session } from "@/lib/auth-guards";
import * as driverQueries from "./driver-queries";

export async function getDriverRoute(session: Session) {
  const user = requireDriver(session);
  const tenantId = user.tenantId;

  const result = await driverQueries.getDriverRouteQuery(user.id, tenantId);
  if (!result) {
    return null;
  }

  return result;
}

export async function completeDelivery(
  session: Session,
  routeStopId: string,
  notes?: string
) {
  const user = requireDriver(session);
  const tenantId = user.tenantId;

  const stop = await driverQueries.getStopByIdQuery(routeStopId, tenantId);
  if (!stop) {
    throw new Error("Stop not found");
  }

  const route = await driverQueries.getRouteByIdQuery(stop.routeId, tenantId);
  if (!route || route.driverId !== user.id) {
    throw new Error("Stop does not belong to your assigned route");
  }

  const alreadyCompleted = await driverQueries.hasCompletedTodayQuery(routeStopId, tenantId);
  if (alreadyCompleted) {
    throw new Error("This stop has already been completed today");
  }

  const today = new Date().toISOString().split("T")[0];

  return driverQueries.createDeliveryLogQuery({
    tenantId,
    routeStopId,
    driverId: user.id,
    deliveryDate: today,
    notes: notes ?? null,
  });
}
