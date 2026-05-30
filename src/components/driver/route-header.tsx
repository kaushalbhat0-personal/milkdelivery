import { Truck, MapPin, User } from "lucide-react";
import type { DriverRouteData } from "@/features/driver-route/queries";

type RouteHeaderProps = {
  data: DriverRouteData;
};

export function RouteHeader({ data }: RouteHeaderProps) {
  const { route, driver, stops } = data;

  return (
    <div className="border-b bg-background px-4 py-4">
      <div className="mx-auto flex max-w-lg flex-col gap-1">
        <div className="flex items-center gap-2">
          <Truck className="size-5 shrink-0 text-primary" />
          <h2 className="text-lg font-bold truncate">{route.name}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {route.zone && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {route.zone}
            </span>
          )}
          {driver?.name && (
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5" />
              {driver.name}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {stops.length} {stops.length === 1 ? "stop" : "stops"}
        </p>
      </div>
    </div>
  );
}
