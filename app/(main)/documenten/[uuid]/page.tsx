// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { EioDetail } from "@/components/eio-detail"

export default function EioDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  return <EioDetail params={params} />
}
