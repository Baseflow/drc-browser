// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await getSession()
  if (session.connection) {
    redirect("/documenten")
  } else {
    redirect("/connect")
  }
}
