// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

"use client"

import { useCallback, useRef, useState } from "react"

export function useColumnResize(initialWidths: Record<string, number>) {
  const [widths, setWidths] = useState(initialWidths)
  const resizing = useRef<{ key: string; startX: number; startWidth: number } | null>(null)

  const onResizeStart = useCallback(
    (key: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const startWidth = widths[key] ?? 150
      resizing.current = { key, startX: e.clientX, startWidth }

      function onMouseMove(ev: MouseEvent) {
        if (!resizing.current) return
        const delta = ev.clientX - resizing.current.startX
        const newWidth = Math.max(48, resizing.current.startWidth + delta)
        setWidths((prev) => ({ ...prev, [resizing.current!.key]: newWidth }))
      }

      function onMouseUp() {
        resizing.current = null
        window.removeEventListener("mousemove", onMouseMove)
        window.removeEventListener("mouseup", onMouseUp)
      }

      window.addEventListener("mousemove", onMouseMove)
      window.addEventListener("mouseup", onMouseUp)
    },
    [widths],
  )

  return { widths, onResizeStart }
}
