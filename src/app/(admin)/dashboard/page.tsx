import Link from "next/link"
import { Users, Truck, Route, Plus } from "lucide-react"

import { getDashboardCountsAction } from "@/features/dashboard/actions"
import { getRoutesAction } from "@/features/routes/actions"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const [counts, recentRoutes] = await Promise.all([
    getDashboardCountsAction(),
    getRoutesAction({ page: 1, pageSize: 5 }).then((r) => r.rows).catch(() => []),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.customerCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.driverCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.routeCount}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/customers/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create Customer
            </Button>
          </Link>
          <Link href="/drivers/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create Driver
            </Button>
          </Link>
          <Link href="/routes/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create Route
            </Button>
          </Link>
        </div>
      </div>

      {recentRoutes.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Recent Routes</h2>
          <div className="space-y-2">
            {recentRoutes.map((route) => (
              <Link key={route.id} href={`/routes/${route.id}`}>
                <Card className="transition-colors hover:bg-accent">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{route.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {route.zone || "No zone"}
                        {route.driverName && ` · ${route.driverName}`}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {route.customerCount} stop{route.customerCount !== 1 ? "s" : ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
