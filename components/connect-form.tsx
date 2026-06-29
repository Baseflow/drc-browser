"use client"

// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSavedRepos } from "@/hooks/use-saved-repos"
import type { SavedRepository } from "@/lib/local-storage"
import type { AuthType } from "@/types/drc"
import { Clock, Loader2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"

export function ConnectForm() {
  const router = useRouter()
  const [authType, setAuthType] = useState<AuthType>("zgw")
  const [baseUrl, setBaseUrl] = useState("")
  const [clientId, setClientId] = useState("")
  const [loading, setLoading] = useState(false)
  const secretRef = useRef<HTMLInputElement>(null)
  const tokenRef = useRef<HTMLInputElement>(null)
  const { repos, save, remove } = useSavedRepos()

  function prefill(repo: SavedRepository) {
    setBaseUrl(repo.baseUrl)
    setAuthType(repo.authType)
    setClientId(repo.clientId ?? "")
    setTimeout(() => {
      const ref = repo.authType === "zgw" ? secretRef : tokenRef
      ref.current?.focus()
    }, 0)
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const url = (form.get("baseUrl") as string).trim().replace(/\/$/, "")

    const body =
      authType === "zgw"
        ? {
            baseUrl: url,
            authType: "zgw" as const,
            clientId: form.get("clientId") as string,
            clientSecret: form.get("clientSecret") as string,
          }
        : {
            baseUrl: url,
            authType: "token" as const,
            token: form.get("token") as string,
          }

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Opslaan mislukt")

      const probe = await fetch("/api/drc/enkelvoudiginformatieobjecten?page_size=1")
      if (probe.status === 401 || probe.status === 403) {
        await fetch("/api/session", { method: "DELETE" })
        toast.error("Verbinding mislukt: ongeldige credentials")
        setLoading(false)
        return
      }

      save({
        baseUrl: url,
        authType,
        clientId: authType === "zgw" ? (form.get("clientId") as string) : undefined,
      })

      router.push("/documenten")
      router.refresh()
    } catch {
      toast.error("Kon geen verbinding maken")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {repos.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Recent gebruikt
          </p>
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium" title={repo.baseUrl}>
                  {repo.baseUrl}
                </p>
                {repo.clientId && (
                  <p className="text-xs text-muted-foreground">{repo.clientId}</p>
                )}
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">
                {repo.authType === "zgw" ? "ZGW" : "Token"}
              </Badge>
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => prefill(repo)}>
                Verbinden
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => remove(repo.baseUrl)}
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {repos.length > 0 ? "Nieuwe verbinding" : "Verbinding instellen"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                name="baseUrl"
                type="url"
                placeholder="https://drc.example.nl/documenten/api/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="authType">Authenticatie</Label>
              <Select value={authType} onValueChange={(v) => setAuthType(v as AuthType)}>
                <SelectTrigger id="authType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zgw">ZGW (client ID + secret)</SelectItem>
                  <SelectItem value="token">Bearer token</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {authType === "zgw" ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    name="clientId"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    name="clientSecret"
                    ref={secretRef}
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder={baseUrl ? "Vul client secret in" : undefined}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="token">Bearer token</Label>
                <Input
                  id="token"
                  name="token"
                  ref={tokenRef}
                  type="password"
                  required
                  placeholder={baseUrl ? "Vul bearer token in" : undefined}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verbinden
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
