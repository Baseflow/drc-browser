"use client"

// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { AddOioDialog } from "@/components/add-oio-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatBytes } from "@/lib/utils"
import type { EnkelvoudigInformatieObject, ObjectInformatieObject, PaginatedResponse } from "@/types/drc"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Link2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { use, useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

const OIO_PAGE_SIZE = 25

interface EioDetailProps {
  params: Promise<{ uuid: string }>
}

export function EioDetail({ params: paramsPromise }: EioDetailProps) {
  const { uuid } = use(paramsPromise)
  const router = useRouter()
  const searchParams = useSearchParams()
  const versieParam = searchParams.get("versie")

  const [eio, setEio] = useState<EnkelvoudigInformatieObject | null>(null)
  // latestVersie tracks the max version of this document, fetched without ?versie param
  const [latestVersie, setLatestVersie] = useState<number | null>(null)
  const [oioData, setOioData] = useState<PaginatedResponse<ObjectInformatieObject> | null>(null)
  const [oioPage, setOioPage] = useState(1)
  const [loadingEio, setLoadingEio] = useState(true)
  const [loadingOio, setLoadingOio] = useState(false)
  const [showOio, setShowOio] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [versions, setVersions] = useState<EnkelvoudigInformatieObject[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  const fetchEio = useCallback(async () => {
    setLoadingEio(true)
    try {
      const qs = versieParam ? `?versie=${versieParam}` : ""
      const res = await fetch(`/api/drc/enkelvoudiginformatieobjecten/${uuid}${qs}`)
      if (res.status === 404) {
        toast.error("Document niet gevonden")
        router.push("/documenten")
        return
      }
      if (!res.ok) throw new Error(await res.text())
      const data: EnkelvoudigInformatieObject = await res.json()
      setEio(data)
      // When viewing the latest (no versie param), record the max versie
      if (!versieParam) setLatestVersie(data.versie)
    } catch (e) {
      toast.error(`Fout: ${e instanceof Error ? e.message : "Onbekend"}`)
    } finally {
      setLoadingEio(false)
    }
  }, [uuid, router, versieParam])

  const fetchOio = useCallback(
    async (page: number) => {
      if (!eio) return
      setLoadingOio(true)
      const params = new URLSearchParams({
        informatieobject: eio.url,
        page: String(page),
        page_size: String(OIO_PAGE_SIZE),
      })
      try {
        const res = await fetch(`/api/drc/objectinformatieobjecten?${params}`)
        if (!res.ok) throw new Error(await res.text())
        setOioData(await res.json())
      } catch (e) {
        toast.error(`Fout bij ophalen koppelingen: ${e instanceof Error ? e.message : "Onbekend"}`)
      } finally {
        setLoadingOio(false)
      }
    },
    [eio],
  )

  const fetchVersions = useCallback(async (signal: AbortSignal) => {
    // Resolve the true max versie: prefer latestVersie (from unparameterized fetch),
    // fall back to fetching the latest now if we only have an older version loaded.
    let maxVersie = latestVersie
    if (!maxVersie) {
      const res = await fetch(`/api/drc/enkelvoudiginformatieobjecten/${uuid}`, { signal })
      if (!res.ok) return
      const latest: EnkelvoudigInformatieObject = await res.json()
      maxVersie = latest.versie
      setLatestVersie(maxVersie)
    }
    if (maxVersie <= 1) return

    setLoadingVersions(true)
    setVersions([])
    try {
      const fetches = Array.from({ length: maxVersie }, (_, i) =>
        fetch(`/api/drc/enkelvoudiginformatieobjecten/${uuid}?versie=${i + 1}`, { signal }).then(
          (r) => r.json() as Promise<EnkelvoudigInformatieObject>,
        ),
      )
      const results = await Promise.all(fetches)
      if (!signal.aborted) setVersions(results.sort((a, b) => b.versie - a.versie))
    } catch (e) {
      if (!signal.aborted) toast.error(`Fout bij ophalen versies: ${e instanceof Error ? e.message : "Onbekend"}`)
    } finally {
      if (!signal.aborted) setLoadingVersions(false)
    }
  }, [uuid, latestVersie])

  useEffect(() => {
    fetchEio()
  }, [fetchEio])

  useEffect(() => {
    if (showOio && eio) fetchOio(oioPage)
  }, [showOio, oioPage, eio, fetchOio])

  useEffect(() => {
    if (!showVersions || !eio) return
    const controller = new AbortController()
    fetchVersions(controller.signal)
    return () => controller.abort()
  }, [showVersions, eio, fetchVersions])

  async function deleteEio() {
    const res = await fetch(`/api/drc/enkelvoudiginformatieobjecten/${uuid}`, { method: "DELETE" })
    if (res.ok || res.status === 204) {
      toast.success("Document verwijderd")
      router.push("/documenten")
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      toast.error(`Verwijderen mislukt: ${body.detail ?? res.statusText}`)
    }
  }

  async function deleteOio(oioUrl: string) {
    const id = oioUrl.split("/").filter(Boolean).pop()!
    const res = await fetch(`/api/drc/objectinformatieobjecten/${id}`, { method: "DELETE" })
    if (res.ok || res.status === 204) {
      toast.success("Koppeling verwijderd")
      fetchOio(oioPage)
    } else {
      toast.error("Verwijderen mislukt")
    }
  }

  function navigateToVersion(v: number) {
    const latestVersie = eio?.versie
    if (v === latestVersie && !versieParam) return
    if (v === latestVersie) {
      router.push(`/documenten/${uuid}`)
    } else {
      router.push(`/documenten/${uuid}?versie=${v}`)
    }
  }

  if (loadingEio) {
    return (
      <div className="container mx-auto flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!eio) return null

  const currentVersie = eio.versie
  const knownMaxVersie = latestVersie ?? currentVersie
  const isViewingOldVersion = !!versieParam
  const hasMultipleVersions = knownMaxVersie > 1
  const downloadUrl = `/api/drc/enkelvoudiginformatieobjecten/${uuid}/download?versie=${currentVersie}`

  const oioCount = oioData?.count ?? null
  const oioTotalPages = oioData ? Math.ceil(oioData.count / OIO_PAGE_SIZE) : 0

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/documenten" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-3.5 w-3.5" />
            Documenten
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">{eio.titel || eio.bestandsnaam || uuid}</h1>
            {hasMultipleVersions && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  disabled={currentVersie <= 1}
                  onClick={() => navigateToVersion(currentVersie - 1)}
                  title="Vorige versie"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Badge variant={isViewingOldVersion ? "secondary" : "outline"} className="text-xs tabular-nums">
                  v{currentVersie}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  disabled={currentVersie >= knownMaxVersie}
                  onClick={() => navigateToVersion(currentVersie + 1)}
                  title="Volgende versie"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                {isViewingOldVersion && (
                  <Link href={`/documenten/${uuid}`} className="text-xs text-primary hover:underline">
                    Naar laatste versie
                  </Link>
                )}
              </div>
            )}
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{eio.identificatie}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {eio.inhoud && (
            <Button variant="outline" size="sm" asChild>
              <a href={downloadUrl} download={eio.bestandsnaam}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download
              </a>
            </Button>
          )}
          <DeleteConfirmDialog
            title="Document verwijderen"
            description={`Weet je zeker dat je "${eio.titel || eio.bestandsnaam}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
            onConfirm={deleteEio}
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Verwijderen
              </Button>
            }
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <dl className="divide-y">
          {[
            ["Bronorganisatie", eio.bronorganisatie],
            ["Creatiedatum", eio.creatiedatum],
            ["Vertrouwelijkheid", eio.vertrouwelijkheidaanduiding],
            ["Auteur", eio.auteur],
            ["Status", eio.status],
            ["Formaat", eio.formaat],
            ["Taal", eio.taal],
            ["Bestandsnaam", eio.bestandsnaam],
            ["Bestandsomvang", eio.bestandsomvang != null ? formatBytes(eio.bestandsomvang) : null],
            ["Versie", eio.versie],
            ["Begin registratie", eio.beginRegistratie],
            ["Beschrijving", eio.beschrijving || null],
            ["Ontvangstdatum", eio.ontvangstdatum],
            ["Verzenddatum", eio.verzenddatum],
            ["Indicatie gebruiksrecht", eio.indicatieGebruiksrecht != null ? String(eio.indicatieGebruiksrecht) : null],
            ["Informatieobjecttype", eio.informatieobjecttype],
          ]
            .filter(([, v]) => v != null && v !== "")
            .map(([label, value]) => (
              <div key={String(label)} className="grid grid-cols-3 px-4 py-2.5 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="col-span-2 break-all">
                  {String(label) === "Informatieobjecttype" ? (
                    <a href={String(value)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <span className="truncate">{String(value)}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    String(value)
                  )}
                </dd>
              </div>
            ))}
        </dl>
      </div>

      <Separator />

      {/* Versions section */}
      {hasMultipleVersions && (
        <>
          <div className="space-y-3">
            <button
              className="flex items-center gap-2 text-sm font-medium hover:text-primary"
              onClick={() => setShowVersions((v) => !v)}
            >
              <Clock className="h-4 w-4" />
              Versiegeschiedenis
              <Badge variant="secondary" className="text-xs">{knownMaxVersie} versies</Badge>
            </button>

            {showVersions && (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Versie</TableHead>
                      <TableHead>Begin registratie</TableHead>
                      <TableHead>Auteur</TableHead>
                      <TableHead>Grootte</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingVersions ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center">
                          <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : versions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                          Geen versies geladen
                        </TableCell>
                      </TableRow>
                    ) : (
                      versions.map((v) => {
                        const isCurrent = v.versie === currentVersie
                        return (
                          <TableRow key={v.versie} className={isCurrent ? "bg-muted/40" : undefined}>
                            <TableCell>
                              <Badge variant={isCurrent ? "default" : "outline"} className="text-xs tabular-nums">
                                v{v.versie}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {v.beginRegistratie ? v.beginRegistratie.replace("T", " ").slice(0, 16) : "-"}
                            </TableCell>
                            <TableCell className="text-sm">{v.auteur || "-"}</TableCell>
                            <TableCell className="text-sm">
                              {v.bestandsomvang != null ? formatBytes(v.bestandsomvang) : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {v.inhoud && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild title={`Download v${v.versie}`}>
                                    <a
                                      href={`/api/drc/enkelvoudiginformatieobjecten/${uuid}/download?versie=${v.versie}`}
                                      download={v.bestandsnaam}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </a>
                                  </Button>
                                )}
                                {!isCurrent && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => navigateToVersion(v.versie)}
                                  >
                                    Bekijken
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <Separator />
        </>
      )}

      {/* OIO section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-2 text-sm font-medium hover:text-primary"
            onClick={() => setShowOio((v) => !v)}
          >
            <Link2 className="h-4 w-4" />
            Koppelingen
            {oioCount != null && (
              <Badge variant="secondary" className="text-xs">
                {oioCount}
              </Badge>
            )}
          </button>
          {showOio && eio && (
            <AddOioDialog
              informatieobjectUrl={eio.url}
              onAdded={() => fetchOio(oioPage)}
              trigger={
                <Button variant="outline" size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Toevoegen
                </Button>
              }
            />
          )}
        </div>

        {showOio && (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Object type</TableHead>
                  <TableHead>Object URL</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOio ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center">
                      <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : !oioData || oioData.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      Geen koppelingen
                    </TableCell>
                  </TableRow>
                ) : (
                  oioData.results.map((oio) => (
                    <TableRow key={oio.url}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{oio.objectType}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground break-all">{oio.object}</TableCell>
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
            {oioTotalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-2">
                <span className="text-xs text-muted-foreground">
                  Pagina {oioPage} van {oioTotalPages} ({oioData?.count} koppelingen)
                </span>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={oioPage <= 1} onClick={() => setOioPage((p) => p - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={oioPage >= oioTotalPages} onClick={() => setOioPage((p) => p + 1)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
