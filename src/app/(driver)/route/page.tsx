import { getAssignedRouteAction } from "@/features/driver-route/actions";
import { RouteHeader } from "@/components/driver/route-header";
import { RouteStopList } from "@/components/driver/route-stop-list";
import { TruckIcon } from "lucide-react";
import { useState } from "react";
import { optimizeRouteAction } from "@/features/route-optimization/actions";
import { useGeolocation } from "@/features/route-optimization/hooks/use-geolocation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DriverRoutePage() {
  const data = await getAssignedRouteAction();

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

  // Client‑side state for optimization
  const [optimizedStops, setOptimizedStops] = useState<string[] | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimError, setOptimError] = useState<string | null>(null);

  const { latitude, longitude, error: geoError, loading: geoLoading } = useGeolocation();

  const handleOptimize = async () => {
    if (!latitude || !longitude) {
      setOptimError("Unable to obtain current location");
      return;
    }
    setOptimizing(true);
    setOptimError(null);
    try {
      const result = await optimizeRouteAction(data.id, {
        latitude,
        longitude
      });
      setOptimizedStops(result.orderedStopIds);
    } catch (e: any) {
      setOptimError(e.message ?? "Optimization failed");
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <>
      <RouteHeader data={data} />
      <div className="flex items-center justify-between px-4 py-2">
        <Button
          variant="outline"
          onClick={handleOptimize}
          disabled={optimizing || geoLoading || !!geoError}
        >
          {optimizing ? <Loader2 className="animate-spin mr-2" /> : null}
          Optimize Route
        </Button>
        {geoError && (
          <p className="text-sm text-red-500 ml-4">{geoError}</p>
        )}
      </div>
      <RouteStopList stops={data.stops} />

      {optimError && (
        <div className="px-4 py-2 text-red-600">
          {optimError}
        </div>
      )}

      {optimizedStops && (
        <div className="px-4 py-4">
          <h3 className="text-lg font-semibold mb-2">Optimized Route Order</h3>
          <ol className="list-decimal pl-6 space-y-1">
            {optimizedStops.map((stopId, idx) => {
              const stop = data.stops.find((s) => s.id === stopId);
              return (
                <li key={stopId} className="text-sm">
                  {idx + 1}. {stop?.name ?? `Stop ${stopId}`}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </>
  );
}
