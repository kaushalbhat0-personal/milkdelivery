import { Card, CardContent, CardFooter } from "@/components/ui/card";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function DriverRouteLoading() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 px-4 pb-4 pt-4">
      <Card>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>

      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3 w-52" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 shrink-0 rounded-md" />
            </div>
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1 rounded-md" />
              <Skeleton className="h-9 w-16 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-3 w-32" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
