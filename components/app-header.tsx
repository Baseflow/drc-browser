"use client"

// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DatabaseZap, FileText, Link2, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

interface AppHeaderProps {
  connection: { baseUrl: string; authType: string }
}

export function AppHeader({ connection }: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function disconnect() {
    await fetch("/api/session", { method: "DELETE" })
    toast.success("Verbinding verbroken")
    router.push("/connect")
    router.refresh()
  }

  const navItems = [
    { href: "/documenten", label: "Documenten", icon: FileText },
    { href: "/koppelingen", label: "Koppelingen", icon: Link2 },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="container mx-auto flex h-14 items-center gap-4">
        <div className="flex items-center gap-2">
          <DatabaseZap className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">DRC Browser</span>
        </div>
        <Separator orientation="vertical" className="h-5" />
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted ${
                pathname.startsWith(href) ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Badge variant="outline" className="hidden font-mono text-xs sm:flex max-w-xs truncate">
            {connection.baseUrl}
          </Badge>
          <Button variant="ghost" size="sm" onClick={disconnect} className="gap-1.5 text-muted-foreground hover:text-destructive">
            <LogOut className="h-3.5 w-3.5" />
            Verbreken
          </Button>
        </div>
      </div>
    </header>
  )
}
