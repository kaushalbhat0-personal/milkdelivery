import { notFound } from "next/navigation"
import { getCustomerAction } from "@/features/customers/actions"
import { CustomerForm } from "@/components/admin/customer-form"

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

  return (
    <div className="mx-auto max-w-2xl">
      <CustomerForm initialData={customer} />
    </div>
  )
}
