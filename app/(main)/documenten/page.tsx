// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { EioList } from "@/components/eio-list"

export default function DocumentenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Documenten</h1>
        <p className="text-sm text-muted-foreground">Enkelvoudige Informatie Objecten</p>
      </div>
      <EioList searchParams={searchParams} />
    </div>
  )
}
