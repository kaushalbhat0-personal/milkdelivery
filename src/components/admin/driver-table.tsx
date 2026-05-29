"use client"

import { useState, useCallback, useEffect, useTransition } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, Users, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"

import { getDriversAction, deleteDriverAction } from "@/features/drivers/actions"
import type { DriverRow } from "@/features/drivers/queries"
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

export function DriverTable() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<DriverRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [isLoading, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<DriverRow | null>(null)
  const [isDeleting, startDelete] = useTransition()

  const createdEmail = searchParams.get("created")
  const tempPassword = searchParams.get("password")
  const [copied, setCopied] = useState(false)

  const fetchData = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await getDriversAction({ search: search || undefined, page, pageSize })
        setData(result.rows)
        setTotal(result.total)
      } catch {
        toast.error("Failed to load drivers")
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
        await deleteDriverAction(deleteTarget.id)
        toast.success("Driver deactivated")
        setDeleteTarget(null)
        fetchData()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to deactivate driver")
      }
    })
  }, [deleteTarget, fetchData])

  const handleCopyPassword = useCallback(async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [tempPassword])

  const columns: ColumnDef<DriverRow>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <Link
          href={`/drivers/${row.original.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Phone",
      accessorKey: "phone",
      cell: ({ getValue }) => getValue<string>() || "—",
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.deletedAt ? "secondary" : "default"}>
          {row.original.deletedAt ? "Inactive" : "Active"}
        </Badge>
      ),
    },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/drivers/${row.original.id}`}>
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
            <span className="sr-only">Deactivate</span>
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
      {createdEmail && tempPassword && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
          <p className="mb-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Driver created successfully
          </p>
          <div className="space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
            <p>
              <strong>Email:</strong> {createdEmail}
            </p>
            <div className="flex items-center gap-2">
              <strong>Password:</strong>
              <code className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
                {tempPassword}
              </code>
              <Button variant="ghost" size="icon-xs" onClick={handleCopyPassword}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search drivers..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Link href="/drivers/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Driver
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
            <p className="text-lg font-medium">No drivers found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? "Try a different search term" : "Get started by adding your first driver"}
            </p>
            {!search && (
              <Link href="/drivers/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4" />
                  Add Driver
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
                {total} driver{total !== 1 ? "s" : ""}
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
            <DialogTitle>Deactivate Driver</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate <strong>{deleteTarget?.name}</strong>? They will no longer be able
              to log in. This action can be reversed by an admin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting && <Loader2 className="animate-spin" />}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
