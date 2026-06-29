// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { AppHeader } from "@/components/app-header"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session.connection) {
    redirect("/connect")
  }

  const { clientSecret: _, ...safeConnection } = session.connection as { clientSecret?: string; baseUrl: string; authType: string }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader connection={safeConnection} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
