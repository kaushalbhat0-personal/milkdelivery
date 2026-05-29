import { notFound } from "next/navigation"
import { getRouteAction } from "@/features/routes/actions"
import { RouteForm } from "@/components/admin/route-form"
import { RouteStopList } from "@/components/admin/route-stop-list"

interface EditRoutePageProps {
  params: Promise<{ routeId: string }>
}

export default async function EditRoutePage({ params }: EditRoutePageProps) {
  const { routeId } = await params

  let route
  try {
    route = await getRouteAction(routeId)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-2xl">
        <RouteForm initialData={route} />
      </div>
      <div className="mx-auto max-w-2xl">
        <RouteStopList routeId={routeId} initialStops={route.stops} />
      </div>
    </div>
  )
}
