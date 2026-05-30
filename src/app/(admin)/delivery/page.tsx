import { getTodayDashboardAction } from "@/features/delivery-dashboard/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, CheckCircle2, XCircle, MinusCircle, Circle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DeliveryDashboardPage() {
  const data = await getTodayDashboardAction();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Today&apos;s Delivery</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Stops</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.metrics.totalStops}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1 text-sm font-medium text-green-700">
              <CheckCircle2 className="size-4" /> Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">{data.metrics.delivered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1 text-sm font-medium text-amber-700">
              <XCircle className="size-4" /> Skipped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-700">{data.metrics.skipped}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <MinusCircle className="size-4" /> Not Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.metrics.notRequired}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1 text-sm font-medium text-blue-700">
              <Circle className="size-4" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{data.metrics.pending}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="size-5" />
              Per Driver
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.drivers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active drivers today</p>
            ) : (
              <div className="space-y-3">
                {data.drivers.map((d) => (
                  <div key={d.driverId} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">{d.driverName}</p>
                      <Badge variant="outline">{d.routeName}</Badge>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="text-green-700">{d.delivered} delivered</span>
                      <span className="text-amber-700">{d.skipped} skipped</span>
                      <span className="text-blue-700">{d.pending} pending</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="size-5" />
              Per Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.routes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active routes today</p>
            ) : (
              <div className="space-y-3">
                {data.routes.map((r) => (
                  <div key={r.routeId} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">{r.routeName}</p>
                      {r.driverName && (
                        <Badge variant="secondary">{r.driverName}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-green-600 transition-all"
                          style={{
                            width: r.totalStops > 0
                              ? `${(r.completedStops / r.totalStops) * 100}%`
                              : "0%",
                          }}
                        />
                      </div>
                      <span>
                        {r.completedStops}/{r.totalStops}
                      </span>
                    </div>
                      {r.pendingStops > 0 && (
                      <p className="mt-1 text-xs text-blue-700">
                        {r.pendingStops} stop{r.pendingStops !== 1 ? "s" : ""} remaining
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
