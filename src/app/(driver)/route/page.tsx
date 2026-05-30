import { getAssignedRouteAction } from "@/features/driver-route/actions";
import { RouteHeader } from "@/components/driver/route-header";
import { RouteStopList } from "@/components/driver/route-stop-list";
import { OptimizeRouteButton } from "@/components/driver/optimize-route-button";
import { TruckIcon, ShieldCheck } from "lucide-react";

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

  return (
    <>
      <RouteHeader data={data} />
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3 px-4 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-green-600" />
          <span className="text-xs text-muted-foreground">
            Saved Route ({data.stops.length} stops)
          </span>
        </div>
      </div>
      <RouteStopList stops={data.stops} />
      <div className="mx-auto w-full max-w-lg px-4 pb-4">
        <OptimizeRouteButton stops={data.stops} />
      </div>
    </>
  );
}
