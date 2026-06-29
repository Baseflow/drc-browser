// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { getIronSession, type IronSession, type SessionOptions } from "iron-session"
import { cookies } from "next/headers"
import type { ConnectionConfig } from "@/types/drc"

export interface SessionData {
  connection?: ConnectionConfig
}

const sessionOptions: SessionOptions = {
  cookieName: "drc-browser-session",
  password: process.env.SESSION_SECRET ?? "drc-browser-dev-secret-min-32-chars!!",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}
