"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTransition, useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { createRouteSchema } from "@/features/routes/schemas"
import type { CreateRouteInput } from "@/features/routes/schemas"
import { createRouteAction, updateRouteAction } from "@/features/routes/actions"
import type { RouteWithDetails } from "@/features/routes/queries"
import { getDriversAction } from "@/features/drivers/actions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface RouteFormProps {
  initialData?: RouteWithDetails
}

type DriverOption = {
  id: string
  name: string
  email: string
}

export function RouteForm({ initialData }: RouteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [drivers, setDrivers] = useState<DriverOption[]>([])
  const isEdit = !!initialData

  useEffect(() => {
    getDriversAction({ page: 1, pageSize: 100 })
      .then((result) => setDrivers(result.rows.map((d) => ({ id: d.id, name: d.name, email: d.email }))))
      .catch(() => toast.error("Failed to load drivers"))
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateRouteInput>({
    resolver: zodResolver(createRouteSchema) as unknown as Resolver<CreateRouteInput>,
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      zone: initialData?.zone ?? "",
      driverId: initialData?.driverId ?? "",
    },
  })

  async function onSubmit(data: CreateRouteInput) {
    startTransition(async () => {
      try {
        if (isEdit && initialData) {
          await updateRouteAction(initialData.id, data)
          toast.success("Route updated")
        } else {
          await createRouteAction(data)
          toast.success("Route created")
        }
        router.push("/routes")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save route")
      }
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Route Name *</Label>
            <Input id="name" {...register("name")} placeholder="e.g., Morning Route - Zone A" />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              placeholder="Optional route description"
              rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zone">Zone</Label>
            <Input id="zone" {...register("zone")} placeholder="e.g., North Zone" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driverId">Assigned Driver</Label>
            <Select
              defaultValue={initialData?.driverId ?? ""}
              onValueChange={(value) => {
                setValue("driverId", value === "" ? null : value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a driver (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No driver</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name} ({driver.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update Route" : "Create Route"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/routes")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
