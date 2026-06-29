// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { SignJWT } from "jose"

export async function signZgwJwt(clientId: string, clientSecret: string): Promise<string> {
  const secret = new TextEncoder().encode(clientSecret)
  const now = Math.floor(Date.now() / 1000)

  return new SignJWT({
    iss: clientId,
    iat: now,
    client_id: clientId,
    aud: "account",
    user_id: "drc-browser@example.com",
    user_representation: "DRC Browser",
    roles: ["dmf-admin"],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .sign(secret)
}
