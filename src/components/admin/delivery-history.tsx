"use client"

import { useState } from "react"
import { Clock, CheckCircle2, XCircle, MinusCircle, Circle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DeliveryHistoryRow } from "@/features/delivery-history/queries"

type DeliveryHistoryProps = {
  customerId: string
  initialHistory: DeliveryHistoryRow[]
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  DELIVERED: <CheckCircle2 className="size-3.5" />,
  SKIPPED: <XCircle className="size-3.5" />,
  NOT_REQUIRED: <MinusCircle className="size-3.5" />,
  PENDING: <Circle className="size-3.5" />,
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DELIVERED: "default",
  SKIPPED: "secondary",
  NOT_REQUIRED: "outline",
  PENDING: "outline",
}

export function DeliveryHistory({ initialHistory }: DeliveryHistoryProps) {
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? initialHistory : initialHistory.slice(0, 10)

  if (initialHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="size-5" />
            Delivery History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-4">
            No delivery history found for this customer.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="size-5" />
          Delivery History
          <span className="text-sm font-normal text-muted-foreground">
            ({initialHistory.length} entries)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayed.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant={STATUS_VARIANTS[entry.status] ?? "outline"} className="shrink-0">
                  <span className="flex items-center gap-1">
                    {STATUS_ICONS[entry.status] ?? null}
                    {entry.status === "NOT_REQUIRED" ? "Not Required" : entry.status.charAt(0) + entry.status.slice(1).toLowerCase()}
                  </span>
                </Badge>
                <div className="min-w-0">
                  <p className="font-medium">{entry.deliveryDate}</p>
                  {entry.driverName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.driverName}{entry.routeName ? ` · ${entry.routeName}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                {entry.skipReason && (
                  <p className="text-xs text-muted-foreground">Reason: {entry.skipReason}</p>
                )}
                {entry.notes && (
                  <p className="text-xs text-muted-foreground">{entry.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {initialHistory.length > 10 && !showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground py-2"
          >
            Show all {initialHistory.length} entries
          </button>
        )}
      </CardContent>
    </Card>
  )
}
