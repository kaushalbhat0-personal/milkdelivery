import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import * as queries from "@/features/routes/queries"
import { RouteForm } from "@/components/admin/route-form"
import { RouteStopList } from "@/components/admin/route-stop-list"

interface EditRoutePageProps {
  params: Promise<{ routeId: string }>
}

export default async function EditRoutePage({ params }: EditRoutePageProps) {
  const { routeId } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== "admin") redirect("/login")

  const route = await queries.getRouteByIdQuery(routeId, session.user.tenantId)
  if (!route) notFound()

  const stops = await queries.getRouteStopsQuery(routeId, session.user.tenantId)

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-2xl">
        <RouteForm initialData={route} />
      </div>
      <div className="mx-auto max-w-2xl">
        <RouteStopList routeId={routeId} initialStops={stops} />
      </div>
    </div>
  )
}
