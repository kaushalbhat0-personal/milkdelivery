"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { createCustomerSchema } from "@/features/customers/schemas"
import type { CreateCustomerInput } from "@/features/customers/schemas"
import { createCustomerAction, updateCustomerAction } from "@/features/customers/actions"
import type { CustomerRow } from "@/features/customers/queries"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface CustomerFormProps {
  initialData?: CustomerRow
}

export function CustomerForm({ initialData }: CustomerFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = !!initialData

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema) as unknown as Resolver<CreateCustomerInput>,
    defaultValues: {
      name: initialData?.name ?? "",
      phone: initialData?.phone ?? "",
      address: initialData?.address ?? "",
      landmark: initialData?.landmark ?? "",
      notes: initialData?.notes ?? "",
      latitude: initialData?.latitude ? Number(initialData.latitude) : undefined,
      longitude: initialData?.longitude ? Number(initialData.longitude) : undefined,
      isActive: initialData?.isActive ?? true,
    },
  })

  async function onSubmit(data: CreateCustomerInput) {
    startTransition(async () => {
      try {
        if (isEdit && initialData) {
          await updateCustomerAction(initialData.id, data)
          toast.success("Customer updated successfully")
        } else {
          await createCustomerAction(data)
          toast.success("Customer created successfully")
        }
        router.push("/customers")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save customer")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <textarea
              id="address"
              rows={2}
              className="flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
              {...register("address")}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="landmark">Landmark</Label>
              <Input id="landmark" {...register("landmark")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                rows={2}
                className="flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                {...register("notes")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                {...register("latitude", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.latitude && (
                <p className="text-sm text-destructive">{errors.latitude.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                {...register("longitude", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.longitude && (
                <p className="text-sm text-destructive">{errors.longitude.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              {...register("isActive")}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/customers")}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {isEdit ? "Save Changes" : "Create Customer"}
        </Button>
      </div>
    </form>
  )
}
