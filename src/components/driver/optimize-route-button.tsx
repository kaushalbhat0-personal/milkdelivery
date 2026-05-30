"use client"

import { useState } from "react"
import { Loader2, Navigation, Route, MapPin, Crosshair } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { optimizeRouteAction } from "@/features/route-optimization/actions"
import type { DriverRouteStop } from "@/features/driver-route/queries"
import type { OptimizeRouteResult } from "@/features/route-optimization/types"

type OptimizeRouteButtonProps = {
  stops: DriverRouteStop[]
}

export function OptimizeRouteButton({ stops }: OptimizeRouteButtonProps) {
  const [result, setResult] = useState<OptimizeRouteResult | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOptimize = async () => {
    setError(null)
    setResult(null)

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    setOptimizing(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const optimized = await optimizeRouteAction({
            driverLatitude: position.coords.latitude,
            driverLongitude: position.coords.longitude,
          })
          setResult(optimized)
        } catch (e) {
          setError(e instanceof Error ? e.message : "Optimization failed")
        } finally {
          setOptimizing(false)
        }
      },
      (err) => {
        setOptimizing(false)
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location permission denied. Enable location access to optimize.")
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Unable to determine your current location.")
        } else {
          setError("Location request timed out. Try again.")
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={handleOptimize}
          disabled={optimizing}
        >
          {optimizing ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Route className="mr-2 size-4" />
          )}
          {optimizing ? "Optimizing..." : "Optimize Route"}
        </Button>
        {result && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <Crosshair className="size-3.5" />
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Route className="size-4" />
                Optimized Route
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Total distance: {result.totalDistance.toFixed(1)} km
                {result.stopsWithoutCoords.length > 0 && (
                  <span className="ml-2 text-amber-600">
                    ({result.stopsWithoutCoords.length} stops without coordinates excluded)
                  </span>
                )}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.optimizedStops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="flex items-start gap-2 rounded-lg border bg-card p-2.5 text-sm"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{stop.customerName}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{stop.customerAddress}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Navigation className="size-3" />
                      {stop.distanceFromPrevious.toFixed(1)} km
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {stops.filter((s) => !s.latitude || !s.longitude).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Unoptimized Stops</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {stops
                  .filter((s) => !s.latitude || !s.longitude)
                  .map((stop) => (
                    <div
                      key={stop.id}
                      className="rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground"
                    >
                      {stop.customerName}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
