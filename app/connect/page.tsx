// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { ConnectForm } from "@/components/connect-form"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function ConnectPage() {
  const session = await getSession()
  if (session.connection) {
    redirect("/documenten")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">DRC Browser</h1>
          <p className="mt-1 text-sm text-muted-foreground">Verbind met een Documenten API</p>
        </div>
        <ConnectForm />
      </div>
    </div>
  )
}
