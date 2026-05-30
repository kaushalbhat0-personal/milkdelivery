import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { routes } from "@/lib/db/schema/routes";
import { requireDriver } from "@/lib/auth-guards";
import type { Session } from "@/lib/auth-guards";
import * as queries from "./queries";
import type { DriverRouteData, DriverRouteStop } from "./queries";
import { isEligible, normalizeQuantityToLiters } from "@/features/delivery-schedule/service";

function buildDriverRouteData(raw: NonNullable<Awaited<ReturnType<typeof queries.getAssignedRouteQuery>>>): DriverRouteData {
  const eligibleStops: DriverRouteStop[] = [];
  let totalQuantityLiters = 0;

  for (const stop of raw.rawStops) {
    const result = isEligible({
      deliveryType: stop.deliveryType,
      quantity: stop.quantity,
      unit: stop.unit,
      deliveryDays: stop.deliveryDays,
      pauseFrom: stop.pauseFrom,
      pauseUntil: stop.pauseUntil,
      deliveryStartDate: stop.deliveryStartDate,
    });

    if (result.eligible) {
      eligibleStops.push(stop);
      totalQuantityLiters += normalizeQuantityToLiters(stop.quantity, stop.unit);
    }
  }

  const allStopsHaveStatus = eligibleStops.every((s) => s.deliveryStatus !== "PENDING");

  return {
    route: raw.route,
    driver: raw.driver,
    stops: eligibleStops,
    allStopsHaveStatus,
    totalStops: eligibleStops.length,
    totalQuantity: Math.round(totalQuantityLiters * 100) / 100,
  };
}

export async function getAssignedRoute(session: Session): Promise<DriverRouteData | null> {
  const user = requireDriver(session);
  const raw = await queries.getAssignedRouteQuery(user.id, user.tenantId);
  if (!raw) return null;
  return buildDriverRouteData(raw);
}

export async function completeDelivery(
  session: Session,
  routeStopId: string,
  notes?: string
) {
  const user = requireDriver(session);
  const tenantId = user.tenantId;

  const stop = await queries.getStopByIdQuery(routeStopId, tenantId);
  if (!stop) {
    throw new Error("Stop not found");
  }

  const route = await queries.getRouteByIdQueryDriver(stop.routeId, tenantId);
  if (!route || route.driverId !== user.id) {
    throw new Error("Stop does not belong to your assigned route");
  }

  const today = new Date().toISOString().split("T")[0];

  const existing = await queries.getDeliveryLogQuery(routeStopId, tenantId, today);
  if (existing) {
    await queries.updateDeliveryLogQuery(existing.id, {
      status: "DELIVERED",
      notes: notes ?? existing.notes,
    });
    return existing;
  }

  return queries.createDeliveryLogQuery({
    tenantId,
    routeStopId,
    driverId: user.id,
    deliveryDate: today,
    status: "DELIVERED",
    notes: notes ?? null,
  });
}

export async function skipDelivery(
  session: Session,
  routeStopId: string,
  skipReason: string,
  notes?: string
) {
  const user = requireDriver(session);
  const tenantId = user.tenantId;

  const stop = await queries.getStopByIdQuery(routeStopId, tenantId);
  if (!stop) {
    throw new Error("Stop not found");
  }

  const route = await queries.getRouteByIdQueryDriver(stop.routeId, tenantId);
  if (!route || route.driverId !== user.id) {
    throw new Error("Stop does not belong to your assigned route");
  }

  const today = new Date().toISOString().split("T")[0];

  const existing = await queries.getDeliveryLogQuery(routeStopId, tenantId, today);
  if (existing) {
    await queries.updateDeliveryLogQuery(existing.id, {
      status: "SKIPPED" as const,
      skipReason,
      notes: notes ?? existing.notes,
    });
    return existing;
  }

  return queries.createDeliveryLogQuery({
    tenantId,
    routeStopId,
    driverId: user.id,
    deliveryDate: today,
    status: "SKIPPED" as const,
    skipReason,
    notes: notes ?? null,
  });
}

export async function markNotRequired(
  session: Session,
  routeStopId: string,
  notes?: string
) {
  const user = requireDriver(session);
  const tenantId = user.tenantId;

  const stop = await queries.getStopByIdQuery(routeStopId, tenantId);
  if (!stop) {
    throw new Error("Stop not found");
  }

  const route = await queries.getRouteByIdQueryDriver(stop.routeId, tenantId);
  if (!route || route.driverId !== user.id) {
    throw new Error("Stop does not belong to your assigned route");
  }

  const today = new Date().toISOString().split("T")[0];

  const existing = await queries.getDeliveryLogQuery(routeStopId, tenantId, today);
  if (existing) {
    await queries.updateDeliveryLogQuery(existing.id, {
      status: "NOT_REQUIRED" as const,
      notes: notes ?? existing.notes,
    });
    return existing;
  }

  return queries.createDeliveryLogQuery({
    tenantId,
    routeStopId,
    driverId: user.id,
    deliveryDate: today,
    status: "NOT_REQUIRED" as const,
    notes: notes ?? null,
  });
}

export async function finishRoute(session: Session) {
  const user = requireDriver(session);
  const tenantId = user.tenantId;

  const raw = await queries.getAssignedRouteQuery(user.id, tenantId);
  if (!raw) {
    throw new Error("No route assigned");
  }

  const [updated] = await db
    .update(routes)
    .set({
      completedAt: new Date(),
      completedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(routes.id, raw.route.id))
    .returning();

  return updated;
}
