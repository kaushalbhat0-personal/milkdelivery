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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddressAutocomplete } from "@/components/shared/address-autocomplete"

interface CustomerFormProps {
  initialData?: CustomerRow
}

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export function CustomerForm({ initialData }: CustomerFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = !!initialData

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema) as unknown as Resolver<CreateCustomerInput>,
    defaultValues: {
      name: initialData?.name ?? "",
      phone: initialData?.phone ?? "",
      address: (initialData?.formattedAddress ?? initialData?.address) ?? "",
      placeId: initialData?.placeId ?? undefined,
      formattedAddress: initialData?.formattedAddress ?? undefined,
      landmark: initialData?.landmark ?? "",
      notes: initialData?.notes ?? "",
      latitude: initialData?.latitude ? Number(initialData.latitude) : undefined,
      longitude: initialData?.longitude ? Number(initialData.longitude) : undefined,
      isActive: initialData?.isActive ?? true,
      deliveryType: (initialData?.deliveryType as CreateCustomerInput["deliveryType"]) ?? "DAILY",
      quantity: initialData?.quantity ? Number(initialData.quantity) : 1,
      unit: (initialData?.unit as CreateCustomerInput["unit"]) ?? "LITER",
      deliveryDays: initialData?.deliveryDays
        ? (initialData.deliveryDays as CreateCustomerInput["deliveryDays"])
        : [],
      pauseFrom: initialData?.pauseFrom ?? undefined,
      pauseUntil: initialData?.pauseUntil ?? undefined,
      deliveryStartDate: initialData?.deliveryStartDate ?? undefined,
    },
  })

  const deliveryType = watch("deliveryType")
  const selectedPlaceId = watch("placeId")
  const selectedLat = watch("latitude")
  const selectedLng = watch("longitude")
  const currentAddress = watch("address")
  const hasCoordinates = typeof selectedLat === "number" && typeof selectedLng === "number"
  const hasValidSelection = !!selectedPlaceId || hasCoordinates

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

  const selectedDays = watch("deliveryDays") ?? [];

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
            </div>
          </div>

          <div className="space-y-2">
            <AddressAutocomplete
              id="address"
              label="Address *"
              value={watch("address")}
              onChange={(result) => {
                if (result) {
                  setValue("address", result.formattedAddress, { shouldValidate: true })
                  setValue("formattedAddress", result.formattedAddress)
                  setValue("placeId", result.placeId)
                  setValue("latitude", result.latitude)
                  setValue("longitude", result.longitude)
                } else {
                  setValue("address", "", { shouldValidate: true })
                  setValue("formattedAddress", undefined)
                  setValue("placeId", undefined)
                  setValue("latitude", undefined)
                  setValue("longitude", undefined)
                }
              }}
              onInputChange={(val) => {
                setValue("address", val, { shouldValidate: true })
              }}
              error={
                errors.address?.message
                  ? errors.address.message
                  : (!hasValidSelection && (currentAddress?.length ?? 0) > 0)
                    ? "Please select a valid address from the suggestions"
                    : undefined
              }
            />

            <input type="hidden" {...register("placeId")} />
            <input type="hidden" {...register("formattedAddress")} />
            <input type="hidden" {...register("latitude", { setValueAs: (v) => (v === "" || v === undefined ? undefined : Number(v)) })} />
            <input type="hidden" {...register("longitude", { setValueAs: (v) => (v === "" || v === undefined ? undefined : Number(v)) })} />
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

      <Card>
        <CardHeader>
          <CardTitle>Delivery Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="deliveryType">Delivery Type</Label>
              <Select
                defaultValue={initialData?.deliveryType ?? "DAILY"}
                onValueChange={(value) => {
                  setValue("deliveryType", value as CreateCustomerInput["deliveryType"], { shouldValidate: true });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="ALTERNATE_DAYS">Alternate Days</SelectItem>
                  <SelectItem value="CUSTOM_DAYS">Custom Days</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                </SelectContent>
              </Select>
              {errors.deliveryType && (
                <p className="text-sm text-destructive">{errors.deliveryType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.5"
                min="0.5"
                {...register("quantity", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                defaultValue={initialData?.unit ?? "LITER"}
                onValueChange={(value) => {
                  setValue("unit", value as CreateCustomerInput["unit"], { shouldValidate: true });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LITER">Litre</SelectItem>
                  <SelectItem value="ML">Millilitre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {deliveryType === "CUSTOM_DAYS" && (
            <div className="space-y-2">
              <Label>Delivery Days</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const current = selectedDays;
                      const updated = current.includes(day)
                        ? current.filter((d) => d !== day)
                        : [...current, day];
                      setValue("deliveryDays" as const, updated as CreateCustomerInput["deliveryDays"], { shouldValidate: true });
                    }}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedDays.includes(day)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {errors.deliveryDays && (
                <p className="text-sm text-destructive">
                  {(errors.deliveryDays?.message as string) ?? "Select at least one day"}
                </p>
              )}
            </div>
          )}

          {deliveryType === "ALTERNATE_DAYS" && (
            <div className="space-y-2">
              <Label htmlFor="deliveryStartDate">Delivery Start Date *</Label>
              <Input
                id="deliveryStartDate"
                type="date"
                {...register("deliveryStartDate")}
              />
              {errors.deliveryStartDate && (
                <p className="text-sm text-destructive">{errors.deliveryStartDate.message}</p>
              )}
              {!initialData?.deliveryStartDate && (
                <p className="text-xs text-muted-foreground">
                  Set the date from which alternate-day delivery should start. Defaults to today.
                </p>
              )}
            </div>
          )}

          {deliveryType === "PAUSED" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pauseFrom">Pause From *</Label>
                <Input
                  id="pauseFrom"
                  type="date"
                  {...register("pauseFrom")}
                />
                {errors.pauseFrom && (
                  <p className="text-sm text-destructive">{errors.pauseFrom.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pauseUntil">Pause Until</Label>
                <Input
                  id="pauseUntil"
                  type="date"
                  {...register("pauseUntil")}
                />
              </div>
            </div>
          )}
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
