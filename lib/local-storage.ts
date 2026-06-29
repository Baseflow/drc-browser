// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import type { AuthType } from "@/types/drc"

export type ColumnKey =
  | "titel"
  | "bestandsnaam"
  | "bronorganisatie"
  | "aangemaakt"
  | "grootte"
  | "vertrouwelijkheid"
  | "identificatie"
  | "auteur"
  | "status"
  | "formaat"
  | "taal"
  | "versie"
  | "beginRegistratie"
  | "beschrijving"
  | "ontvangstdatum"
  | "verzenddatum"
  | "indicatieGebruiksrecht"
  | "informatieobjecttype"
  | "locked"

export const COLUMN_ORDER: ColumnKey[] = [
  "titel",
  "identificatie",
  "bestandsnaam",
  "bronorganisatie",
  "auteur",
  "aangemaakt",
  "beginRegistratie",
  "ontvangstdatum",
  "verzenddatum",
  "grootte",
  "formaat",
  "taal",
  "versie",
  "status",
  "vertrouwelijkheid",
  "indicatieGebruiksrecht",
  "informatieobjecttype",
  "locked",
  "beschrijving",
]

export const DEFAULT_COLUMNS: ColumnKey[] = ["titel", "bestandsnaam", "aangemaakt", "grootte", "vertrouwelijkheid"]

const COLUMN_KEY = "drc-browser:columns"
const REPOS_KEY = "drc-browser:repositories"
const MAX_REPOS = 10

export function readColumnConfig(): Set<ColumnKey> {
  try {
    const raw = localStorage.getItem(COLUMN_KEY)
    if (!raw) return new Set(DEFAULT_COLUMNS)
    return new Set(JSON.parse(raw) as ColumnKey[])
  } catch {
    return new Set(DEFAULT_COLUMNS)
  }
}

export function writeColumnConfig(visible: Set<ColumnKey>): void {
  localStorage.setItem(COLUMN_KEY, JSON.stringify([...visible]))
}

export interface SavedRepository {
  id: string
  baseUrl: string
  authType: AuthType
  clientId?: string
  lastUsed: string
}

export function readSavedRepos(): SavedRepository[] {
  try {
    const raw = localStorage.getItem(REPOS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedRepository[]
  } catch {
    return []
  }
}

export function writeSavedRepos(repos: SavedRepository[]): void {
  localStorage.setItem(REPOS_KEY, JSON.stringify(repos))
}

export function upsertSavedRepo(repo: { baseUrl: string; authType: AuthType; clientId?: string }): SavedRepository[] {
  const repos = readSavedRepos()
  const idx = repos.findIndex((r) => r.baseUrl === repo.baseUrl)
  const entry: SavedRepository = {
    id: idx >= 0 ? repos[idx].id : crypto.randomUUID(),
    baseUrl: repo.baseUrl,
    authType: repo.authType,
    clientId: repo.clientId,
    lastUsed: new Date().toISOString(),
  }
  if (idx >= 0) {
    repos[idx] = entry
  } else {
    repos.unshift(entry)
  }
  const trimmed = repos.sort((a, b) => b.lastUsed.localeCompare(a.lastUsed)).slice(0, MAX_REPOS)
  writeSavedRepos(trimmed)
  return trimmed
}

export function removeSavedRepo(baseUrl: string): SavedRepository[] {
  const repos = readSavedRepos().filter((r) => r.baseUrl !== baseUrl)
  writeSavedRepos(repos)
  return repos
}
