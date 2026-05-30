"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, XCircle, MinusCircle, MapPin, Phone, FileText, Camera } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  completeDeliveryAction,
  skipDeliveryAction,
  markNotRequiredAction,
} from "@/features/driver-route/actions";
import type { DriverRouteStop } from "@/features/driver-route/queries";

type RouteCardProps = {
  stop: DriverRouteStop;
  stopNumber: number;
  totalStops: number;
};

const SKIP_REASONS = [
  "Customer Not Home",
  "No Container Outside",
  "Milk Not Required",
  "Wrong Address",
  "Other",
];

export function RouteCard({ stop, stopNumber, totalStops }: RouteCardProps) {
  const [pending, startTransition] = useTransition();
  const [skipOpen, setSkipOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"DELIVERED" | "NOT_REQUIRED" | null>(null);
  const [noteText, setNoteText] = useState("");

  const isCompleted = stop.deliveryStatus !== "PENDING";

  const statusBadge = () => {
    switch (stop.deliveryStatus) {
      case "DELIVERED":
        return (
          <Badge variant="default" className="shrink-0">
            <CheckCircle2 className="size-3 mr-1" />
            Done
          </Badge>
        );
      case "SKIPPED":
        return (
          <Badge variant="secondary" className="shrink-0">
            <XCircle className="size-3 mr-1" />
            Skipped
          </Badge>
        );
      case "NOT_REQUIRED":
        return (
          <Badge variant="outline" className="shrink-0 border-amber-300 text-amber-700">
            <MinusCircle className="size-3 mr-1" />
            Not Required
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="shrink-0">
            <Circle className="size-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  function handleDeliver() {
    setNoteText("");
    setPendingAction("DELIVERED");
    setNoteOpen(true);
  }

  function handleNotRequired() {
    setNoteText("");
    setPendingAction("NOT_REQUIRED");
    setNoteOpen(true);
  }

  function executeNoteAction() {
    if (!pendingAction) return;
    startTransition(async () => {
      try {
        if (pendingAction === "DELIVERED") {
          await completeDeliveryAction(stop.id, noteText || undefined);
          toast.success(`Delivered to ${stop.customerName}`);
        } else {
          await markNotRequiredAction(stop.id, noteText || undefined);
          toast.success(`Marked as not required`);
        }
        setNoteOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update delivery");
      }
    });
  }

  function executeSkip(reason: string) {
    startTransition(async () => {
      try {
        await skipDeliveryAction(stop.id, reason, noteText || undefined);
        toast.success(`Skipped — ${reason}`);
        setSkipOpen(false);
        setNoteText("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to skip delivery");
      }
    });
  }

  return (
    <>
      <Card
        className={cn(
          "transition-colors",
          stop.deliveryStatus === "DELIVERED" && "border-green-200 bg-green-50/50",
          stop.deliveryStatus === "SKIPPED" && "border-amber-200 bg-amber-50/50",
          stop.deliveryStatus === "NOT_REQUIRED" && "border-muted bg-muted/30",
        )}
      >
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {stopNumber}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{stop.customerName}</p>
                  <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {stop.quantity
                      ? (() => {
                          const q = parseFloat(stop.quantity);
                          return stop.unit === "ML"
                            ? `${q} ML`
                            : q % 1 === 0
                              ? `${q} L`
                              : `${q} L`;
                        })()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{stop.customerAddress}</span>
                </div>
              </div>
            </div>
            {statusBadge()}
          </div>

          {stop.deliveryStatus === "SKIPPED" && stop.deliverySkipReason && (
            <p className="text-xs text-amber-700">
              Reason: {stop.deliverySkipReason}
              {stop.deliveryNotes && ` — ${stop.deliveryNotes}`}
            </p>
          )}

          {stop.deliveryStatus === "NOT_REQUIRED" && stop.deliveryNotes && (
            <p className="text-xs text-muted-foreground">{stop.deliveryNotes}</p>
          )}

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
          <CardFooter className="flex gap-2">
            <Button
              className="flex-1"
              size="sm"
              onClick={handleDeliver}
              disabled={pending}
            >
              <CheckCircle2 className="size-4 mr-1" />
              Deliver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setNoteText(""); setSkipOpen(true); }}
              disabled={pending}
            >
              <XCircle className="size-4 mr-1" />
              Skip
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotRequired}
              disabled={pending}
            >
              <MinusCircle className="size-4 mr-1" />
              Not Required
            </Button>
          </CardFooter>
        )}

        {isCompleted && (
          <CardFooter className="justify-center">
            <p className="text-xs text-muted-foreground">
              Stop {stopNumber} of {totalStops}
            </p>
          </CardFooter>
        )}
      </Card>

      <Dialog open={skipOpen} onOpenChange={(o) => { if (!o) setSkipOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip Delivery</DialogTitle>
            <DialogDescription>
              Why are you skipping {stop.customerName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {SKIP_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                className="flex w-full items-center rounded-lg border p-3 text-left text-sm hover:bg-accent disabled:opacity-50"
                disabled={pending}
                onClick={() => executeSkip(reason)}
              >
                {reason}
              </button>
            ))}
            <div className="space-y-2 pt-2">
              <Label htmlFor="skip-notes">Additional Notes (optional)</Label>
              <Input
                id="skip-notes"
                placeholder="e.g., No container outside"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={(o) => { if (!o) setNoteOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === "DELIVERED" ? "Complete Delivery" : "Mark as Not Required"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === "DELIVERED"
                ? `Confirm delivery to ${stop.customerName}`
                : `${stop.customerName} does not need milk today`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="delivery-notes">Notes (optional)</Label>
              <Input
                id="delivery-notes"
                placeholder={pendingAction === "DELIVERED" ? "e.g., Left at gate" : "e.g., Customer said no milk needed"}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={executeNoteAction} disabled={pending}>
              {pending ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
