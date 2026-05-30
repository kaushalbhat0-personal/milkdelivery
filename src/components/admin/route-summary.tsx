import { Package, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type RouteSummaryData = {
  eligibleCount: number;
  totalQuantity: number;
  breakdown: { quantity: string; unit: string; count: number }[];
};

type RouteSummaryProps = {
  summary: RouteSummaryData;
};

export function RouteSummary({ summary }: RouteSummaryProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4 text-lg font-semibold">Today&apos;s Delivery Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <Users className="size-8 shrink-0 text-primary" />
            <div>
              <p className="text-2xl font-bold">{summary.eligibleCount}</p>
              <p className="text-sm text-muted-foreground">Customers Today</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <Package className="size-8 shrink-0 text-primary" />
            <div>
              <p className="text-2xl font-bold">{summary.totalQuantity} L</p>
              <p className="text-sm text-muted-foreground">Total Quantity</p>
            </div>
          </div>
        </div>
        {summary.breakdown.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Breakdown by quantity</p>
            <div className="space-y-1">
              {summary.breakdown.map((b) => (
                <div
                  key={`${b.quantity}-${b.unit}`}
                  className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
                >
                  <span>
                    {parseFloat(b.quantity) % 1 === 0
                      ? `${parseFloat(b.quantity)}`
                      : b.quantity}{" "}
                    {b.unit === "ML" ? "ML" : "L"}
                  </span>
                  <span className="font-medium">{b.count} customer{b.count !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
