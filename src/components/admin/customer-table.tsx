"use client"

import { useState, useCallback, useEffect, useTransition } from "react"
import Link from "next/link"
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react"
import { toast } from "sonner"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"

import { getCustomersAction, deleteCustomerAction } from "@/features/customers/actions"
import type { CustomerRow } from "@/features/customers/queries"
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

export function CustomerTable() {
  const [data, setData] = useState<CustomerRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [isLoading, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null)
  const [isDeleting, startDelete] = useTransition()

  const fetchData = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await getCustomersAction({ search: search || undefined, page, pageSize })
        setData(result.rows)
        setTotal(result.total)
      } catch {
        toast.error("Failed to load customers")
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
        await deleteCustomerAction(deleteTarget.id)
        toast.success("Customer deleted")
        setDeleteTarget(null)
        fetchData()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete customer")
      }
    })
  }, [deleteTarget, fetchData])

  const columns: ColumnDef<CustomerRow>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <Link
          href={`/customers/${row.original.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      header: "Phone",
      accessorKey: "phone",
      cell: ({ getValue }) => getValue<string>() || "—",
    },
    {
      header: "Address",
      accessorKey: "address",
      cell: ({ getValue }) => {
        const address = getValue<string>()
        return (
          <span className="line-clamp-1 max-w-[200px]" title={address}>
            {address}
          </span>
        )
      },
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: ({ getValue }) => {
        const isActive = getValue<boolean>()
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/customers/${row.original.id}`}>
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Link href="/customers/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium">No customers found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? "Try a different search term" : "Get started by adding your first customer"}
            </p>
            {!search && (
              <Link href="/customers/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4" />
                  Add Customer
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
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

            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {total} customer{total !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
