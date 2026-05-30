import { requireAdmin } from "@/lib/auth-guards";
import type { Session } from "@/lib/auth-guards";
import { isEligible } from "@/features/delivery-schedule/service";
import * as queries from "./queries";
import type { DriverTodaySummary, RouteTodaySummary } from "./queries";

export async function getTodayDashboard(session: Session) {
  const user = requireAdmin(session);
  const tenantId = user.tenantId;

  const allStops = await queries.getActiveStopsWithPlansQuery(tenantId);

  const driverIds = [...new Set(allStops.map((s) => s.driverId).filter(Boolean) as string[])];

  const [logsToday, drivers] = await Promise.all([
    queries.getTodayDeliveryLogsQuery(tenantId),
    queries.getDriversByIdsQuery(driverIds, tenantId),
  ]);

  const driverNameMap = new Map(drivers.map((d) => [d.id, d.name]));
  const statusPerStop = new Map(logsToday.map((l) => [l.routeStopId, l.status]));

  const eligibleStopIds = new Set<string>();
  const stopIdToRoute = new Map<string, string>();
  const stopIdToDriver = new Map<string, string>();
  const eligibleStopsByRoute = new Map<string, number>();
  const eligibleStopsByDriver = new Map<string, number>();
  const routeInfo = new Map<string, { routeName: string; driverId: string | null }>();
  const driverRouteMap = new Map<string, string>();

  for (const stop of allStops) {
    const result = isEligible({
      deliveryType: stop.deliveryType,
      quantity: stop.quantity,
      unit: stop.unit,
      deliveryDays: stop.deliveryDays,
      pauseFrom: stop.pauseFrom,
      pauseUntil: stop.pauseUntil,
      deliveryStartDate: stop.deliveryStartDate,
    });

    if (!result.eligible) continue;
    eligibleStopIds.add(stop.stopId);
    stopIdToRoute.set(stop.stopId, stop.routeId);
    eligibleStopsByRoute.set(stop.routeId, (eligibleStopsByRoute.get(stop.routeId) ?? 0) + 1);

    if (!routeInfo.has(stop.routeId)) {
      routeInfo.set(stop.routeId, { routeName: stop.routeName, driverId: stop.driverId });
    }

    if (stop.driverId) {
      stopIdToDriver.set(stop.stopId, stop.driverId);
      eligibleStopsByDriver.set(stop.driverId, (eligibleStopsByDriver.get(stop.driverId) ?? 0) + 1);
      if (!driverRouteMap.has(stop.driverId)) {
        driverRouteMap.set(stop.driverId, stop.routeId);
      }
    }
  }

  let delivered = 0;
  let skipped = 0;
  let notRequired = 0;
  const deliveredByDriver = new Map<string, number>();
  const skippedByDriver = new Map<string, number>();
  const completedByRoute = new Map<string, number>();

  for (const stopId of eligibleStopIds) {
    const status = statusPerStop.get(stopId);
    if (!status || status === "PENDING") continue;

    if (status === "DELIVERED") {
      delivered++;
    } else if (status === "SKIPPED") {
      skipped++;
    } else if (status === "NOT_REQUIRED") {
      notRequired++;
    }

    const driverId = stopIdToDriver.get(stopId);
    if (driverId) {
      if (status === "DELIVERED") {
        deliveredByDriver.set(driverId, (deliveredByDriver.get(driverId) ?? 0) + 1);
      } else {
        skippedByDriver.set(driverId, (skippedByDriver.get(driverId) ?? 0) + 1);
      }
    }

    const routeId = stopIdToRoute.get(stopId);
    if (routeId) {
      completedByRoute.set(routeId, (completedByRoute.get(routeId) ?? 0) + 1);
    }
  }

  const totalEligible = eligibleStopIds.size;
  const pending = totalEligible - delivered - skipped - notRequired;

  const eligibleDrivers: DriverTodaySummary[] = [];
  for (const [driverId, assigned] of eligibleStopsByDriver) {
    const dDelivered = deliveredByDriver.get(driverId) ?? 0;
    const dSkipped = skippedByDriver.get(driverId) ?? 0;
    const routeId = driverRouteMap.get(driverId);
    const routeName = routeId ? (routeInfo.get(routeId)?.routeName ?? "") : "";
    eligibleDrivers.push({
      driverId,
      driverName: driverNameMap.get(driverId) ?? "Unknown",
      routeName,
      assignedStops: assigned,
      delivered: dDelivered,
      skipped: dSkipped,
      pending: assigned - dDelivered - dSkipped,
    });
  }

  const eligibleRoutes: RouteTodaySummary[] = [];
  for (const [routeId, { routeName, driverId }] of routeInfo) {
    const total = eligibleStopsByRoute.get(routeId) ?? 0;
    const completed = completedByRoute.get(routeId) ?? 0;
    eligibleRoutes.push({
      routeId,
      routeName,
      driverName: driverId ? (driverNameMap.get(driverId) ?? null) : null,
      totalStops: total,
      completedStops: completed,
      pendingStops: total - completed,
    });
  }

  return {
    metrics: { totalStops: totalEligible, delivered, skipped, notRequired, pending },
    drivers: eligibleDrivers,
    routes: eligibleRoutes,
  };
}
