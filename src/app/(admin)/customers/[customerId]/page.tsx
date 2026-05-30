import { notFound } from "next/navigation"
import { getCustomerAction } from "@/features/customers/actions"
import { getCustomerDeliveryHistoryAction } from "@/features/delivery-history/actions"
import type { DeliveryHistoryRow } from "@/features/delivery-history/queries"
import { CustomerForm } from "@/components/admin/customer-form"
import { DeliveryHistory } from "@/components/admin/delivery-history"

interface EditCustomerPageProps {
  params: Promise<{ customerId: string }>
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { customerId } = await params

  let customer
  try {
    customer = await getCustomerAction(customerId)
  } catch {
    notFound()
  }

  let history: DeliveryHistoryRow[] = []
  try {
    history = await getCustomerDeliveryHistoryAction(customerId)
  } catch {
    history = []
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <CustomerForm initialData={customer} />
      <DeliveryHistory customerId={customerId} initialHistory={history} />
    </div>
  )
}
