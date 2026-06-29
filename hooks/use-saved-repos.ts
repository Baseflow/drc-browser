// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

"use client"

import { type SavedRepository, readSavedRepos, removeSavedRepo, upsertSavedRepo } from "@/lib/local-storage"
import type { AuthType } from "@/types/drc"
import { useCallback, useEffect, useState } from "react"

export function useSavedRepos() {
  const [repos, setRepos] = useState<SavedRepository[]>([])

  useEffect(() => {
    setRepos(readSavedRepos())
  }, [])

  const save = useCallback((repo: { baseUrl: string; authType: AuthType; clientId?: string }) => {
    setRepos(upsertSavedRepo(repo))
  }, [])

  const remove = useCallback((baseUrl: string) => {
    setRepos(removeSavedRepo(baseUrl))
  }, [])

  return { repos, save, remove }
}
