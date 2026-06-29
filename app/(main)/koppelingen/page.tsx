// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { OioList } from "@/components/oio-list"

export default function KoppelingenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Koppelingen</h1>
        <p className="text-sm text-muted-foreground">Object Informatie Objecten</p>
      </div>
      <OioList searchParams={searchParams} />
    </div>
  )
}
