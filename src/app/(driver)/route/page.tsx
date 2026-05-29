import { getDriverRouteAction } from "@/features/routes/driver-actions";
import { RouteCard } from "@/components/driver/route-card";
import { TruckIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DriverRoutePage() {
  const data = await getDriverRouteAction();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <TruckIcon className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Route Assigned</h2>
        <p className="max-w-sm text-muted-foreground">
          You don&apos;t have an active route assigned for today. Contact your
          administrator.
        </p>
      </div>
    );
  }

  const { route, stops, completedStopIds } = data;
  const totalStops = stops.length;
  const completedCount = stops.filter((s) => completedStopIds.has(s.id)).length;
  const progress = totalStops > 0 ? Math.round((completedCount / totalStops) * 100) : 0;

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">{route.name}</h2>
        <p className="text-sm text-muted-foreground">
          {completedCount} of {totalStops} stops completed
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {stops.map((stop, index) => (
          <RouteCard
            key={stop.id}
            stop={stop}
            isCompleted={completedStopIds.has(stop.id)}
            stopNumber={index + 1}
            totalStops={totalStops}
          />
        ))}
      </div>
    </div>
  );
}
