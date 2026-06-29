// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

"use client"

import { type ColumnKey, DEFAULT_COLUMNS, readColumnConfig, writeColumnConfig } from "@/lib/local-storage"
import { useCallback, useEffect, useState } from "react"

export function useColumnConfig() {
  const [visible, setVisible] = useState<Set<ColumnKey>>(new Set(DEFAULT_COLUMNS))

  useEffect(() => {
    setVisible(readColumnConfig())
  }, [])

  const toggle = useCallback((key: ColumnKey) => {
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size <= 1) return prev
        next.delete(key)
      } else {
        next.add(key)
      }
      writeColumnConfig(next)
      return next
    })
  }, [])

  return { visible, toggle }
}
