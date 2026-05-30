import { getAssignedRouteAction } from "@/features/driver-route/actions";
import { RouteHeader } from "@/components/driver/route-header";
import { RouteStopList } from "@/components/driver/route-stop-list";
import { OptimizeRouteButton } from "@/components/driver/optimize-route-button";
import { FinishRouteButton } from "@/components/driver/finish-route-button";
import { TruckIcon } from "lucide-react";

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

  if (data.route.completedAt) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <TruckIcon className="size-12 text-green-600" />
        <h2 className="text-xl font-semibold">Route Completed</h2>
        <p className="max-w-sm text-muted-foreground">
          You have finished this route. Thank you!
        </p>
      </div>
    );
  }

  return (
    <>
      <RouteHeader data={data} />
      <RouteStopList stops={data.stops} />
      <div className="mx-auto w-full max-w-lg space-y-4 px-4 pb-4">
        <OptimizeRouteButton />
        <FinishRouteButton allStopsDone={data.allStopsHaveStatus} />
      </div>
    </>
  );
}
