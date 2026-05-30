"use client"

import { useState, useTransition, useCallback, useEffect } from "react"
import { GripVertical, X, Loader2, MapPin, Plus, Search } from "lucide-react"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { addCustomerAction, removeCustomerAction, reorderStopsAction } from "@/features/routes/actions"
import { getCustomersAction } from "@/features/customers/actions"
import type { RouteStopWithCustomer } from "@/features/routes/queries"
import type { CustomerRow } from "@/features/customers/queries"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface RouteStopListProps {
  routeId: string
  initialStops: RouteStopWithCustomer[]
}

function SortableStop({
  stop,
  index,
  onRemove,
}: {
  stop: RouteStopWithCustomer
  index: number
  onRemove: (stopId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-card p-3"
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <Badge variant="outline" className="shrink-0 w-7 h-7 flex items-center justify-center p-0">
        {index + 1}
      </Badge>
      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{stop.customerName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {stop.customerAddress}
          {stop.customerPhone && ` · ${stop.customerPhone}`}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(stop.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function RouteStopList({ routeId, initialStops }: RouteStopListProps) {
  const [stops, setStops] = useState<RouteStopWithCustomer[]>(initialStops)
  const [isReordering, startReordering] = useTransition()
  const [isRemoving, startRemoving] = useTransition()
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = stops.findIndex((s) => s.id === active.id)
      const newIndex = stops.findIndex((s) => s.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const newStops = [...stops]
      const [moved] = newStops.splice(oldIndex, 1)
      newStops.splice(newIndex, 0, moved)
      setStops(newStops)

      startReordering(async () => {
        try {
          const updated = await reorderStopsAction(routeId, {
            stopIds: newStops.map((s) => s.id),
          })
          setStops(updated)
        } catch (error) {
          setStops(stops)
          toast.error(error instanceof Error ? error.message : "Failed to reorder stops")
        }
      })
    },
    [stops, routeId]
  )

  const handleRemove = useCallback(
    (stopId: string) => {
      startRemoving(async () => {
        try {
          await removeCustomerAction(routeId, { stopId })
          setStops((prev) => prev.filter((s) => s.id !== stopId))
          setRemoveTarget(null)
          toast.success("Customer removed from route")
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to remove customer")
        }
      })
    },
    [routeId]
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Route Stops</CardTitle>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </CardHeader>
      <CardContent>
        {stops.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No customers assigned to this route yet.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stops.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {stops.map((stop, index) => (
                  <SortableStop
                    key={stop.id}
                    stop={stop}
                    index={index}
                    onRemove={(id) => setRemoveTarget(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {isReordering && (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving order...
          </div>
        )}
      </CardContent>

      <AddCustomerDialog
        routeId={routeId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdded={(stop) => {
          setStops((prev) => [...prev, stop])
          setShowAddDialog(false)
          toast.success("Customer added to route")
        }}
      />

      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this customer from the route?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isRemoving}
              onClick={() => removeTarget && handleRemove(removeTarget)}
            >
              {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function AddCustomerDialog({
  routeId,
  open,
  onOpenChange,
  onAdded,
}: {
  routeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: (stop: RouteStopWithCustomer) => void
}) {
  const [search, setSearch] = useState("")
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [isSearching, startSearch] = useTransition()
  const [isAdding, startAdd] = useTransition()

  const handleSearch = useCallback(() => {
    startSearch(async () => {
      try {
        const result = await getCustomersAction({
          search: search || undefined,
          page: 1,
          pageSize: 20,
        })
        setCustomers(result.rows)
      } catch {
        toast.error("Failed to search customers")
      }
    })
  }, [search])

  useEffect(() => {
    if (open) {
      handleSearch()
    }
  }, [open, handleSearch])

  const handleAdd = useCallback(
    (customerId: string, customer: CustomerRow) => {
      startAdd(async () => {
        try {
          await addCustomerAction(routeId, { customerId })
          const newStop: RouteStopWithCustomer = {
            id: "temp",
            tenantId: customer.tenantId,
            routeId,
            customerId: customer.id,
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            customerName: customer.name,
            customerPhone: customer.phone,
            customerAddress: customer.address,
            deliveryType: customer.deliveryType,
            quantity: customer.quantity,
            unit: customer.unit,
            deliveryDays: customer.deliveryDays,
            pauseFrom: customer.pauseFrom,
            pauseUntil: customer.pauseUntil,
            deliveryStartDate: customer.deliveryStartDate ?? null,
            customerCreatedAt: customer.createdAt,
          }
          onAdded(newStop)
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to add customer")
        }
      })
    },
    [routeId, onAdded]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Customer to Route</DialogTitle>
          <DialogDescription>
            Search and select an active customer to add to this route.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCustomers([])
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {isSearching ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {search ? "No customers found" : "Search to find customers"}
            </p>
          ) : (
            customers.map((customer) => (
              <button
                key={customer.id}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent disabled:opacity-50"
                disabled={isAdding}
                onClick={() => handleAdd(customer.id, customer)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{customer.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {customer.address}
                    {customer.phone && ` · ${customer.phone}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isAdding}
                >
                  {isAdding && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Add
                </Button>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
