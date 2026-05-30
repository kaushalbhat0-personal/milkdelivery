"use client"

import { MapPin, Phone, FileText, Camera, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DriverRouteStop } from "@/features/driver-route/queries";

type RouteStopCardProps = {
  stop: DriverRouteStop;
  stopNumber: number;
};

function getGoogleMapsUrl(lat: string, lng: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function getGoogleMapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function RouteStopCard({ stop, stopNumber }: RouteStopCardProps) {
  const lat = stop.latitude;
  const lng = stop.longitude;
  const hasCoords = typeof lat === "string" && typeof lng === "string" && lat.length > 0 && lng.length > 0;
  const navUrl = hasCoords
    ? getGoogleMapsUrl(lat, lng)
    : getGoogleMapsSearchUrl(stop.customerAddress);

  return (
    <Card size="sm" className="group/card">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {stopNumber}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{stop.customerName}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">{stop.customerAddress}</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => window.open(navUrl, "_blank", "noopener,noreferrer")}
          >
            <Navigation className="size-3.5" />
            <span className="hidden sm:inline">Navigate</span>
          </Button>
        </div>

        {stop.customerPhone && (
          <a
            href={`tel:${stop.customerPhone}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Phone className="size-3.5 shrink-0" />
            {stop.customerPhone}
          </a>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {stop.landmark && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <MapPin className="size-3" />
              {stop.landmark}
            </span>
          )}
          {stop.notes && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <FileText className="size-3" />
              {stop.notes}
            </span>
          )}
          {stop.housePhotoUrl && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <Camera className="size-3" />
              <a
                href={stop.housePhotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Photo
              </a>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
