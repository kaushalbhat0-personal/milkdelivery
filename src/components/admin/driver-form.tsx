"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { createDriverSchema } from "@/features/drivers/schemas"
import type { CreateDriverInput } from "@/features/drivers/schemas"
import { createDriverAction, updateDriverAction } from "@/features/drivers/actions"
import type { DriverRow } from "@/features/drivers/queries"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface DriverFormProps {
  initialData?: DriverRow
}

export function DriverForm({ initialData }: DriverFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = !!initialData

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDriverInput>({
    resolver: zodResolver(createDriverSchema) as unknown as Resolver<CreateDriverInput>,
    defaultValues: {
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
    },
  })

  async function onSubmit(data: CreateDriverInput) {
    startTransition(async () => {
      try {
        if (isEdit && initialData) {
          await updateDriverAction(initialData.id, data)
          toast.success("Driver updated successfully")
          router.push("/drivers")
        } else {
          const result = await createDriverAction(data)
          router.push(
            `/drivers?created=${encodeURIComponent(result.email)}&password=${encodeURIComponent(result.tempPassword)}`
          )
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save driver")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-4">
          {!isEdit && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              A temporary password will be generated automatically. The driver can log in immediately with their email
              and this password.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              disabled={isEdit}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            {isEdit && (
              <p className="text-xs text-muted-foreground">Email cannot be changed after creation.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/drivers")}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {isEdit ? "Save Changes" : "Create Driver"}
        </Button>
      </div>
    </form>
  )
}
