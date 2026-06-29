"use client"

// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { ColumnToggle } from "@/components/column-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useColumnConfig } from "@/hooks/use-column-config"
import { useColumnResize } from "@/hooks/use-column-resize"
import { FileTypeIcon } from "@/lib/file-type-icon"
import { COLUMN_ORDER, type ColumnKey } from "@/lib/local-storage"
import { formatBytes, uuidFromUrl } from "@/lib/utils"
import type { EioFilters, EnkelvoudigInformatieObject, PaginatedResponse } from "@/types/drc"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Loader2, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { use, useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

const PAGE_SIZE = 25

const VERTROUWELIJKHEID_OPTIONS = [
  "openbaar",
  "beperkt_openbaar",
  "intern",
  "zaakvertrouwelijk",
  "vertrouwelijk",
  "confidentieel",
  "geheim",
  "zeer_geheim",
]

const COLUMN_LABELS: Record<ColumnKey, string> = {
  titel: "Titel",
  identificatie: "Identificatie",
  bestandsnaam: "Bestandsnaam",
  bronorganisatie: "Bronorganisatie",
  auteur: "Auteur",
  aangemaakt: "Aangemaakt",
  beginRegistratie: "Begin registratie",
  ontvangstdatum: "Ontvangstdatum",
  verzenddatum: "Verzenddatum",
  grootte: "Grootte",
  formaat: "Formaat",
  taal: "Taal",
  versie: "Versie",
  status: "Status",
  vertrouwelijkheid: "Vertrouwelijkheid",
  indicatieGebruiksrecht: "Gebruiksrecht",
  informatieobjecttype: "Informatieobjecttype",
  locked: "Vergrendeld",
  beschrijving: "Beschrijving",
}

// Fields the API supports for ordering (from OAS spec)
const SORTABLE_COLUMNS: Partial<Record<ColumnKey, string>> = {
  titel: "titel",
  auteur: "auteur",
  aangemaakt: "creatiedatum",
  grootte: "bestandsomvang",
  formaat: "formaat",
  status: "status",
  vertrouwelijkheid: "vertrouwelijkheidaanduiding",
}

const DEFAULT_WIDTHS: Record<ColumnKey, number> = {
  titel: 200,
  identificatie: 160,
  bestandsnaam: 220,
  bronorganisatie: 140,
  auteur: 130,
  aangemaakt: 110,
  beginRegistratie: 140,
  ontvangstdatum: 130,
  verzenddatum: 120,
  grootte: 90,
  formaat: 160,
  taal: 60,
  versie: 70,
  status: 100,
  vertrouwelijkheid: 150,
  indicatieGebruiksrecht: 110,
  informatieobjecttype: 220,
  locked: 100,
  beschrijving: 220,
}

interface EioListProps {
  searchParams: Promise<Record<string, string>>
}

export function EioList({ searchParams: searchParamsPromise }: EioListProps) {
  const resolvedParams = use(searchParamsPromise)
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = parseInt(resolvedParams.page ?? "1", 10)
  const pageSize = parseInt(resolvedParams.page_size ?? String(PAGE_SIZE), 10)

  const [data, setData] = useState<PaginatedResponse<EnkelvoudigInformatieObject> | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const { visible, toggle } = useColumnConfig()
  const visibleColumns = COLUMN_ORDER.filter((k) => visible.has(k))

  function getSortState(key: ColumnKey): "asc" | "desc" | null {
    const field = SORTABLE_COLUMNS[key]
    if (!field) return null
    if (filters.ordering === field) return "asc"
    if (filters.ordering === `-${field}`) return "desc"
    return null
  }

  function handleSort(key: ColumnKey) {
    const field = SORTABLE_COLUMNS[key]
    if (!field) return
    const state = getSortState(key)
    const next = state === null ? field : state === "asc" ? `-${field}` : undefined
    updateParams({ ordering: next })
  }

  const filters: EioFilters = {
    bronorganisatie: resolvedParams.bronorganisatie,
    titel: resolvedParams.titel,
    beschrijving: resolvedParams.beschrijving,
    identificatie: resolvedParams.identificatie,
    creatiedatum__gte: resolvedParams.creatiedatum__gte,
    creatiedatum__lte: resolvedParams.creatiedatum__lte,
    vertrouwelijkheidaanduiding: resolvedParams.vertrouwelijkheidaanduiding,
    auteur: resolvedParams.auteur,
    bestandsnaam: resolvedParams.bestandsnaam,
    informatieobjecttype: resolvedParams.informatieobjecttype,
    trefwoorden: resolvedParams.trefwoorden,
    locked: resolvedParams.locked,
    objectinformatieobjecten__object: resolvedParams.objectinformatieobjecten__object,
    objectinformatieobjecten__objectType: resolvedParams.objectinformatieobjecten__objectType,
    ordering: resolvedParams.ordering,
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  const { widths, onResizeStart } = useColumnResize(DEFAULT_WIDTHS)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("page_size", String(pageSize))
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })

    try {
      const res = await fetch(`/api/drc/enkelvoudiginformatieobjecten?${params}`)
      if (res.status === 401 || res.status === 403) {
        toast.error("Sessie verlopen of onvoldoende rechten", {
          action: { label: "Verbreken", onClick: () => router.push("/connect") },
        })
        return
      }
      if (!res.ok) throw new Error(await res.text())
      setData(await res.json())
    } catch (e) {
      toast.error(`Fout bij ophalen: ${e instanceof Error ? e.message : "Onbekende fout"}`)
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

  function clearFilters() {
    router.push("/documenten")
  }

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0
  const totalCols = 1 + visibleColumns.length

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
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Wissen
          </Button>
        )}
        <ColumnToggle visible={visible} toggle={toggle} />
        {data && (
          <span className="ml-auto text-sm text-muted-foreground">
            {data.count.toLocaleString("nl")} resultaten
          </span>
        )}
      </div>

      {showFilters && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FilterField label="Bronorganisatie (RSIN)" param="bronorganisatie" filters={filters} onUpdate={updateParams} />
            <FilterField label="Identificatie" param="identificatie" filters={filters} onUpdate={updateParams} />
            <FilterField label="Titel" param="titel" filters={filters} onUpdate={updateParams} />
            <FilterField label="Beschrijving" param="beschrijving" filters={filters} onUpdate={updateParams} />
            <FilterField label="Bestandsnaam" param="bestandsnaam" filters={filters} onUpdate={updateParams} />
            <FilterField label="Auteur" param="auteur" filters={filters} onUpdate={updateParams} />
            <FilterField label="Aangemaakt vanaf" param="creatiedatum__gte" filters={filters} onUpdate={updateParams} type="date" />
            <FilterField label="Aangemaakt tot" param="creatiedatum__lte" filters={filters} onUpdate={updateParams} type="date" />
            <div className="space-y-1.5">
              <Label className="text-xs">Vertrouwelijkheid</Label>
              <Select
                value={filters.vertrouwelijkheidaanduiding ?? ""}
                onValueChange={(v) => updateParams({ vertrouwelijkheidaanduiding: v || undefined })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle</SelectItem>
                  {VERTROUWELIJKHEID_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FilterField label="Informatieobjecttype (URL)" param="informatieobjecttype" filters={filters} onUpdate={updateParams} />
            <FilterField label="Trefwoorden" param="trefwoorden" filters={filters} onUpdate={updateParams} placeholder="komma-gescheiden" />
            <div className="space-y-1.5">
              <Label className="text-xs">Vergrendeld</Label>
              <Select
                value={filters.locked ?? ""}
                onValueChange={(v) => updateParams({ locked: v || undefined })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle</SelectItem>
                  <SelectItem value="true">Vergrendeld</SelectItem>
                  <SelectItem value="false">Niet vergrendeld</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">Filteren op gekoppeld object (experimenteel)</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FilterField label="Object URL" param="objectinformatieobjecten__object" filters={filters} onUpdate={updateParams} placeholder="https://..." />
              <div className="space-y-1.5">
                <Label className="text-xs">Object type</Label>
                <Select
                  value={filters.objectinformatieobjecten__objectType ?? ""}
                  onValueChange={(v) => updateParams({ objectinformatieobjecten__objectType: v || undefined })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle</SelectItem>
                    <SelectItem value="besluit">besluit</SelectItem>
                    <SelectItem value="zaak">zaak</SelectItem>
                    <SelectItem value="overige">overige</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border overflow-x-auto">
        <Table
          className="table-fixed w-full"
          style={{ minWidth: 36 + visibleColumns.reduce((a, k) => a + widths[k], 0) }}
        >
          <colgroup>
            <col style={{ width: 36 }} />
            {visibleColumns.map((k) => (
              <col key={k} style={{ width: widths[k] }} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="w-9 px-2"></TableHead>
              {visibleColumns.map((key, i, arr) => {
                const sortField = SORTABLE_COLUMNS[key]
                const sortState = getSortState(key)
                return (
                  <TableHead
                    key={key}
                    className={`relative select-none overflow-hidden${sortField ? " cursor-pointer hover:bg-muted/50" : ""}`}
                    onClick={() => handleSort(key)}
                  >
                    <span className="flex items-center gap-1 pr-3">
                      <span className="truncate">{COLUMN_LABELS[key]}</span>
                      {sortField && (
                        sortState === "asc" ? <ArrowUp className="h-3 w-3 shrink-0" />
                        : sortState === "desc" ? <ArrowDown className="h-3 w-3 shrink-0" />
                        : <ArrowUpDown className="h-3 w-3 shrink-0 opacity-30" />
                      )}
                    </span>
                    {i < arr.length - 1 && (
                      <div
                        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 active:bg-primary/60"
                        onMouseDown={(e) => onResizeStart(key, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={totalCols} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : !data || data.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalCols} className="py-12 text-center text-muted-foreground text-sm">
                  Geen documenten gevonden
                </TableCell>
              </TableRow>
            ) : (
              data.results.map((eio) => (
                <TableRow
                  key={eio.url}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/documenten/${uuidFromUrl(eio.url)}`)}
                >
                  <TableCell className="w-9 px-2 text-center">
                    <FileTypeIcon filename={eio.bestandsnaam || ""} className="h-4 w-4 mx-auto shrink-0" />
                  </TableCell>
                  {visible.has("titel") && (
                    <TableCell className="font-medium overflow-hidden">
                      <span className="block truncate" title={eio.titel}>{eio.titel || "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("identificatie") && (
                    <TableCell className="font-mono text-xs text-muted-foreground overflow-hidden">
                      <span className="block truncate" title={eio.identificatie}>{eio.identificatie || "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("bestandsnaam") && (
                    <TableCell className="font-mono text-xs text-muted-foreground overflow-hidden">
                      <span className="block truncate" title={eio.bestandsnaam}>{eio.bestandsnaam || "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("bronorganisatie") && (
                    <TableCell className="overflow-hidden">
                      <span className="block truncate">{eio.bronorganisatie || "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("auteur") && (
                    <TableCell className="overflow-hidden">
                      <span className="block truncate" title={eio.auteur}>{eio.auteur || "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("aangemaakt") && (
                    <TableCell className="overflow-hidden">
                      <span className="block truncate">{eio.creatiedatum || "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("beginRegistratie") && (
                    <TableCell className="overflow-hidden">
                      <span className="block truncate">{eio.beginRegistratie ? eio.beginRegistratie.replace("T", " ").slice(0, 16) : "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("ontvangstdatum") && (
                    <TableCell className="overflow-hidden">
                      <span className="block truncate">{eio.ontvangstdatum || "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("verzenddatum") && (
                    <TableCell className="overflow-hidden">
                      <span className="block truncate">{eio.verzenddatum || "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("grootte") && (
                    <TableCell className="overflow-hidden">
                      <span className="block truncate">{eio.bestandsomvang != null ? formatBytes(eio.bestandsomvang) : "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("formaat") && (
                    <TableCell className="font-mono text-xs text-muted-foreground overflow-hidden">
                      <span className="block truncate" title={eio.formaat}>{eio.formaat || "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("taal") && (
                    <TableCell className="overflow-hidden">
                      <span className="block truncate">{eio.taal || "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("versie") && (
                    <TableCell className="overflow-hidden">
                      <span className="block truncate">{eio.versie ?? "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("status") && (
                    <TableCell className="overflow-hidden">
                      <span className="block truncate">{eio.status || "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("vertrouwelijkheid") && (
                    <TableCell className="overflow-hidden">
                      <VertrouwelijkheidBadge value={eio.vertrouwelijkheidaanduiding} />
                    </TableCell>
                  )}
                  {visible.has("indicatieGebruiksrecht") && (
                    <TableCell className="overflow-hidden">
                      <span className="block truncate">
                        {eio.indicatieGebruiksrecht == null ? "-" : eio.indicatieGebruiksrecht ? "Ja" : "Nee"}
                      </span>
                    </TableCell>
                  )}
                  {visible.has("informatieobjecttype") && (
                    <TableCell className="font-mono text-xs text-muted-foreground overflow-hidden">
                      <span className="block truncate" title={eio.informatieobjecttype}>{eio.informatieobjecttype || "-"}</span>
                    </TableCell>
                  )}
                  {visible.has("locked") && (
                    <TableCell className="overflow-hidden">
                      <span className="block truncate">{eio.locked ? "Vergrendeld" : "Nee"}</span>
                    </TableCell>
                  )}
                  {visible.has("beschrijving") && (
                    <TableCell className="overflow-hidden">
                      <span className="block truncate" title={eio.beschrijving}>{eio.beschrijving || "-"}</span>
                    </TableCell>
                  )}
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
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterField({
  label,
  param,
  filters,
  onUpdate,
  type = "text",
  placeholder,
}: {
  label: string
  param: keyof EioFilters
  filters: EioFilters
  onUpdate: (u: Record<string, string | undefined>) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={filters[param] ?? ""}
        onChange={(e) => onUpdate({ [param]: e.target.value || undefined })}
        className="h-8 text-sm"
        placeholder={placeholder}
      />
    </div>
  )
}

function VertrouwelijkheidBadge({ value }: { value: string }) {
  const danger = ["geheim", "zeer_geheim", "confidentieel", "vertrouwelijk"]
  const warn = ["intern", "zaakvertrouwelijk"]
  const variant = danger.includes(value) ? "destructive" : warn.includes(value) ? "secondary" : "outline"
  return <Badge variant={variant} className="text-xs">{value || "-"}</Badge>
}
