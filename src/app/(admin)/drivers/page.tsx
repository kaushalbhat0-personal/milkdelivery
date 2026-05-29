import { Suspense } from "react"
import { DriverTable } from "@/components/admin/driver-table"

export default function DriversPage() {
  return (
    <Suspense fallback={null}>
      <DriverTable />
    </Suspense>
  )
}
