"use client"

// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useColumnResize } from "@/hooks/use-column-resize"
import { uuidFromUrl } from "@/lib/utils"
import type { ObjectInformatieObject, OioFilters, PaginatedResponse } from "@/types/drc"
import { ChevronLeft, ChevronRight, ExternalLink, Filter, Loader2, Trash2, X } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { use, useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

const PAGE_SIZE = 25

interface OioListProps {
  searchParams: Promise<Record<string, string>>
}

export function OioList({ searchParams: searchParamsPromise }: OioListProps) {
  const resolvedParams = use(searchParamsPromise)
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = parseInt(resolvedParams.page ?? "1", 10)
  const pageSize = parseInt(resolvedParams.page_size ?? String(PAGE_SIZE), 10)

  const [data, setData] = useState<PaginatedResponse<ObjectInformatieObject> | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const filters: OioFilters = {
    informatieobject: resolvedParams.informatieobject,
    object: resolvedParams.object,
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  const { widths, onResizeStart } = useColumnResize({
    type: 100,
    object: 320,
    document: 200,
    actions: 44,
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("page_size", String(pageSize))
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    try {
      const res = await fetch(`/api/drc/objectinformatieobjecten?${params}`)
      if (!res.ok) throw new Error(await res.text())
      setData(await res.json())
    } catch (e) {
      toast.error(`Fout: ${e instanceof Error ? e.message : "Onbekend"}`)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function updateParams(updates: Record<string, string | undefined>) {
    const p = new URLSearchParams(searchParams.toString())
    p.delete("page")
    Object.entries(updates).forEach(([k, v]) => {
      if (v) p.set(k, v)
      else p.delete(k)
    })
    router.push(`?${p}`)
  }

  async function deleteOio(oioUrl: string) {
    const id = uuidFromUrl(oioUrl)
    const res = await fetch(`/api/drc/objectinformatieobjecten/${id}`, { method: "DELETE" })
    if (res.ok || res.status === 204) {
      toast.success("Koppeling verwijderd")
      fetchData()
    } else {
      toast.error("Verwijderen mislukt")
    }
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)} className="gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              actief
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={() => router.push("/koppelingen")} className="gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Wissen
          </Button>
        )}
        {data && (
          <span className="ml-auto text-sm text-muted-foreground">
            {data.count.toLocaleString("nl")} koppelingen
          </span>
        )}
      </div>

      {showFilters && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Informatieobject URL</Label>
              <Input
                value={filters.informatieobject ?? ""}
                onChange={(e) => updateParams({ informatieobject: e.target.value || undefined })}
                className="h-8 text-sm"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Object URL</Label>
              <Input
                value={filters.object ?? ""}
                onChange={(e) => updateParams({ object: e.target.value || undefined })}
                className="h-8 text-sm"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border overflow-x-auto">
        <Table className="table-fixed w-full" style={{ minWidth: Object.values(widths).reduce((a, b) => a + b, 0) }}>
          <colgroup>
            <col style={{ width: widths.type }} />
            <col style={{ width: widths.object }} />
            <col style={{ width: widths.document }} />
            <col style={{ width: widths.actions }} />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="relative select-none overflow-hidden">
                <span className="block truncate pr-3">Type</span>
                <div className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 active:bg-primary/60" onMouseDown={(e) => onResizeStart("type", e)} />
              </TableHead>
              <TableHead className="relative select-none overflow-hidden">
                <span className="block truncate pr-3">Object URL</span>
                <div className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 active:bg-primary/60" onMouseDown={(e) => onResizeStart("object", e)} />
              </TableHead>
              <TableHead className="relative select-none overflow-hidden">
                <span className="block truncate pr-3">Document</span>
                <div className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 active:bg-primary/60" onMouseDown={(e) => onResizeStart("document", e)} />
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : !data || data.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                  Geen koppelingen gevonden
                </TableCell>
              </TableRow>
            ) : (
              data.results.map((oio) => (
                <TableRow key={oio.url}>
                  <TableCell className="overflow-hidden">
                    <Badge variant="outline" className="text-xs max-w-full truncate">{oio.objectType}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground overflow-hidden">
                    <a
                      href={oio.object}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-foreground min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="truncate">{oio.object}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell className="overflow-hidden">
                    <Link
                      href={`/documenten/${uuidFromUrl(oio.informatieobject)}`}
                      className="flex items-center gap-1 text-xs text-primary hover:underline min-w-0"
                    >
                      <span className="font-mono truncate">{uuidFromUrl(oio.informatieobject)}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <DeleteConfirmDialog
                      title="Koppeling verwijderen"
                      description="Weet je zeker dat je deze koppeling wilt verwijderen?"
                      onConfirm={() => deleteOio(oio.url)}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Pagina {page} van {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) })}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
