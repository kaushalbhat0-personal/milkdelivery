import { RouteCard } from "./route-card";
import type { DriverRouteStop } from "@/features/driver-route/queries";

type RouteStopListProps = {
  stops: DriverRouteStop[];
};

export function RouteStopList({ stops }: RouteStopListProps) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3 px-4 py-4">
      {stops.map((stop, index) => (
        <RouteCard
          key={stop.id}
          stop={stop}
          stopNumber={index + 1}
          totalStops={stops.length}
        />
      ))}
    </div>
  );
}
