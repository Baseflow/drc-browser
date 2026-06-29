// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { getSession } from "@/lib/session"
import { signZgwJwt } from "@/lib/zgw-jwt"
import { NextResponse } from "next/server"

type Params = { path: string[] }

async function buildAuthHeader(connection: NonNullable<Awaited<ReturnType<typeof getSession>>["connection"]>): Promise<string> {
  if (connection.authType === "zgw") {
    const token = await signZgwJwt(connection.clientId!, connection.clientSecret!)
    return `Bearer ${token}`
  }
  return `Bearer ${connection.token}`
}

async function proxy(request: Request, { params }: { params: Promise<Params> }, method: string) {
  const session = await getSession()
  if (!session.connection) {
    return NextResponse.json({ error: "No active connection" }, { status: 401 })
  }

  const { path } = await params
  const url = new URL(request.url)
  const drcUrl = `${session.connection.baseUrl.replace(/\/$/, "")}/${path.join("/")}${url.search}`

  const authorization = await buildAuthHeader(session.connection)

  const init: RequestInit = {
    method,
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }

  if (method !== "GET" && method !== "HEAD" && method !== "DELETE") {
    init.body = await request.text()
  }

  const upstream = await fetch(drcUrl, init)
  const contentType = upstream.headers.get("content-type") ?? "application/json"

  if (method === "DELETE" && upstream.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  const body = await upstream.text()
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "content-type": contentType },
  })
}

export async function GET(request: Request, ctx: { params: Promise<Params> }) {
  return proxy(request, ctx, "GET")
}

export async function POST(request: Request, ctx: { params: Promise<Params> }) {
  return proxy(request, ctx, "POST")
}

export async function PATCH(request: Request, ctx: { params: Promise<Params> }) {
  return proxy(request, ctx, "PATCH")
}

export async function PUT(request: Request, ctx: { params: Promise<Params> }) {
  return proxy(request, ctx, "PUT")
}

export async function DELETE(request: Request, ctx: { params: Promise<Params> }) {
  return proxy(request, ctx, "DELETE")
}
