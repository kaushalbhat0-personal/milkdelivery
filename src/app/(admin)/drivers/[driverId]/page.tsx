import { notFound } from "next/navigation"
import { getDriverAction } from "@/features/drivers/actions"
import { DriverForm } from "@/components/admin/driver-form"

interface EditDriverPageProps {
  params: Promise<{ driverId: string }>
}

export default async function EditDriverPage({ params }: EditDriverPageProps) {
  const { driverId } = await params

  let driver
  try {
    driver = await getDriverAction(driverId)
  } catch {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <DriverForm initialData={driver} />
    </div>
  )
}
