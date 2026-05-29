"use client"

import { useState, useCallback, useEffect, useTransition } from "react"
import Link from "next/link"
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, Route } from "lucide-react"
import { toast } from "sonner"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"

import { getRoutesAction, deleteRouteAction } from "@/features/routes/actions"
import type { RouteWithDetails } from "@/features/routes/queries"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function RouteTable() {
  const [data, setData] = useState<RouteWithDetails[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [isLoading, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<RouteWithDetails | null>(null)
  const [isDeleting, startDelete] = useTransition()

  const fetchData = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await getRoutesAction({ search: search || undefined, page, pageSize })
        setData(result.rows)
        setTotal(result.total)
      } catch {
        toast.error("Failed to load routes")
      }
    })
  }, [search, page, pageSize])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalPages = Math.ceil(total / pageSize)

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return
    startDelete(async () => {
      try {
        await deleteRouteAction(deleteTarget.id)
        toast.success("Route deleted")
        setDeleteTarget(null)
        fetchData()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete route")
      }
    })
  }, [deleteTarget, fetchData])

  const columns: ColumnDef<RouteWithDetails>[] = [
    {
      header: "Route Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <Link
          href={`/routes/${row.original.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      header: "Zone",
      accessorKey: "zone",
      cell: ({ getValue }) => getValue<string>() || "—",
    },
    {
      header: "Driver",
      accessorKey: "driverName",
      cell: ({ row }) => row.original.driverName || "—",
    },
    {
      header: "Customers",
      accessorKey: "customerCount",
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Link href={`/routes/${row.original.id}`}>
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Routes</h1>
        <Link href="/routes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Route
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search routes..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="max-w-sm pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Route className="h-12 w-12" />
          <p className="text-lg font-medium">No routes found</p>
          <p className="text-sm">
            {search ? "Try a different search term" : "Create your first route to get started"}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Route</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
