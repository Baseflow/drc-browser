"use client"

// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { type ReactNode, useState } from "react"
import { toast } from "sonner"

const OBJECT_TYPES = ["besluit", "zaak", "overige"]

interface AddOioDialogProps {
  informatieobjectUrl: string
  onAdded: () => void
  trigger: ReactNode
}

export function AddOioDialog({ informatieobjectUrl, onAdded, trigger }: AddOioDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [objectType, setObjectType] = useState("zaak")
  const [objectUrl, setObjectUrl] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/drc/objectinformatieobjecten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          informatieobject: informatieobjectUrl,
          object: objectUrl,
          objectType,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? body.object ?? JSON.stringify(body))
      }
      toast.success("Koppeling toegevoegd")
      setOpen(false)
      setObjectUrl("")
      onAdded()
    } catch (e) {
      toast.error(`Mislukt: ${e instanceof Error ? e.message : "Onbekende fout"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Koppeling toevoegen</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="objectType">Object type</Label>
            <Select value={objectType} onValueChange={setObjectType}>
              <SelectTrigger id="objectType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OBJECT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="objectUrl">Object URL</Label>
            <Input
              id="objectUrl"
              type="url"
              value={objectUrl}
              onChange={(e) => setObjectUrl(e.target.value)}
              placeholder="https://..."
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Toevoegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
