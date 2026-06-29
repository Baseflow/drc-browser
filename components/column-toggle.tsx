"use client"

// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { COLUMN_ORDER, type ColumnKey } from "@/lib/local-storage"
import { Columns3 } from "lucide-react"

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

interface ColumnToggleProps {
  visible: Set<ColumnKey>
  toggle: (key: ColumnKey) => void
}

export function ColumnToggle({ visible, toggle }: ColumnToggleProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Columns3 className="h-3.5 w-3.5" />
          Kolommen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Zichtbare kolommen</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {COLUMN_ORDER.map((key) => (
          <DropdownMenuCheckboxItem
            key={key}
            checked={visible.has(key)}
            onCheckedChange={() => toggle(key)}
            onSelect={(e) => e.preventDefault()}
          >
            {COLUMN_LABELS[key]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
