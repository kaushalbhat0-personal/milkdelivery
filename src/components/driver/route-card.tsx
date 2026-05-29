"use client";

import { useTransition } from "react";
import { CheckCircle2, Circle, MapPin, Phone, FileText, Camera } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { completeDeliveryAction } from "@/features/routes/driver-actions";
import type { DriverRouteStop } from "@/features/routes/driver-queries";

type RouteCardProps = {
  stop: DriverRouteStop;
  isCompleted: boolean;
  stopNumber: number;
  totalStops: number;
};

export function RouteCard({ stop, isCompleted, stopNumber, totalStops }: RouteCardProps) {
  const [pending, startTransition] = useTransition();

  function handleComplete() {
    startTransition(async () => {
      try {
        await completeDeliveryAction(stop.id);
        toast.success(`Delivered to ${stop.customerName}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to mark delivery");
      }
    });
  }

  return (
    <Card
      data-slot="card"
      className={cn(
        "transition-colors",
        isCompleted && "border-green-200 bg-green-50/50"
      )}
    >
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
          <Badge variant={isCompleted ? "default" : "outline"} className="shrink-0">
            {isCompleted ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                Done
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Circle className="size-3" />
                Pending
              </span>
            )}
          </Badge>
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

      {!isCompleted && (
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleComplete}
            disabled={pending}
          >
            {pending ? "Marking..." : "Complete Delivery"}
          </Button>
        </CardFooter>
      )}

      {isCompleted && (
        <CardFooter className="justify-center">
          <p className="text-xs text-green-600">
            Completed — Stop {stopNumber} of {totalStops}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
