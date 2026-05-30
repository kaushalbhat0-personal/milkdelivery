import { requireDriver } from "@/lib/auth-guards";
import type { Session } from "@/lib/auth-guards";
import { getAssignedRouteQuery } from "@/features/driver-route/queries";
import type { OptimizeRouteInput, OptimizedStop, OptimizeRouteResult } from "./types";

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function optimizeRoute(
  session: Session,
  input: OptimizeRouteInput
): Promise<OptimizeRouteResult> {
  const user = requireDriver(session);
  const data = await getAssignedRouteQuery(user.id, user.tenantId);

  if (!data) {
    throw new Error("No route assigned");
  }

  const { driverLatitude, driverLongitude } = input;

  if (
    typeof driverLatitude !== "number" ||
    typeof driverLongitude !== "number" ||
    !isFinite(driverLatitude) ||
    !isFinite(driverLongitude)
  ) {
    throw new Error("Invalid driver location coordinates");
  }

  const stopsWithCoords: { stop: typeof data.stops[number]; lat: number; lng: number }[] = [];
  const stopsWithoutCoords: { id: string; name: string }[] = [];

  for (const stop of data.stops) {
    const hasLat = stop.latitude !== null && stop.latitude !== undefined && stop.latitude !== "";
    const hasLng = stop.longitude !== null && stop.longitude !== undefined && stop.longitude !== "";
    const lat = hasLat ? parseFloat(stop.latitude!) : NaN;
    const lng = hasLng ? parseFloat(stop.longitude!) : NaN;
    if (!isNaN(lat) && !isNaN(lng)) {
      stopsWithCoords.push({ stop, lat, lng });
    } else {
      stopsWithoutCoords.push({ id: stop.id, name: stop.customerName });
    }
  }

  if (stopsWithCoords.length === 0) {
    throw new Error("No stops have valid coordinates for optimization");
  }

  const unvisited = [...stopsWithCoords];
  const optimizedStops: OptimizedStop[] = [];

  let currentLat = driverLatitude;
  let currentLng = driverLongitude;
  let totalDistance = 0;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = haversineDistance(
      currentLat,
      currentLng,
      unvisited[0].lat,
      unvisited[0].lng
    );

    for (let i = 1; i < unvisited.length; i++) {
      const dist = haversineDistance(
        currentLat,
        currentLng,
        unvisited[i].lat,
        unvisited[i].lng
      );
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = i;
      }
    }

    const chosen = unvisited[nearestIndex];
    totalDistance += nearestDistance;

    optimizedStops.push({
      id: chosen.stop.id,
      customerName: chosen.stop.customerName,
      customerAddress: chosen.stop.customerAddress,
      latitude: chosen.lat,
      longitude: chosen.lng,
      distanceFromPrevious: Math.round(nearestDistance * 100) / 100,
    });

    currentLat = chosen.lat;
    currentLng = chosen.lng;
    unvisited.splice(nearestIndex, 1);
  }

  return {
    optimizedStops,
    totalDistance: Math.round(totalDistance * 100) / 100,
    stopsWithoutCoords,
  };
}
