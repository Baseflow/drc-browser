// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"
import type { ConnectionConfig } from "@/types/drc"

export async function GET() {
  const session = await getSession()
  if (!session.connection) {
    return NextResponse.json(null)
  }
  const { clientSecret: _, ...safe } = session.connection as ConnectionConfig & { clientSecret?: string }
  return NextResponse.json(safe)
}

export async function POST(request: Request) {
  const body = (await request.json()) as ConnectionConfig
  const session = await getSession()
  session.connection = body
  await session.save()
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getSession()
  session.destroy()
  return NextResponse.json({ ok: true })
}
