# DRC Browser — Claude Code Instructions

## Overview

Next.js 16 (App Router) frontend for browsing a Documenten API v1.5.0 instance.

**License:** EUPL-1.2 — Copyright (C) 2026 Baseflow

## Tech stack

| Layer      | Technology                       |
|------------|----------------------------------|
| Framework  | Next.js 16, App Router           |
| Language   | TypeScript (strict)              |
| UI         | shadcn/ui, Tailwind CSS v4       |
| Auth       | ZGW JWT (HS256) via `jose`       |
| Session    | `iron-session` encrypted cookie  |
| Testing    | Vitest + Testing Library         |

## Essential commands

```bash
npm run dev          # dev server on :3010
npm run build        # production build (standalone output)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format       # prettier
npm test             # vitest run
```

Always run `npm run typecheck` after changes to catch type errors.

## Directory structure

```
app/
  connect/              # /connect — connection form
  (main)/
    layout.tsx          # shared shell (sidebar, header)
    documenten/
      page.tsx          # /documenten — EIO list
      [uuid]/page.tsx   # /documenten/:uuid — EIO detail
    koppelingen/
      page.tsx          # /koppelingen — OIO list
  api/
    drc/[...path]/      # server-side proxy for all DRC calls
    session/            # GET (read) / DELETE (clear) session
  layout.tsx            # root layout (ThemeProvider, Toaster)
  globals.css

components/
  connect-form.tsx      # connection form with saved history
  eio-list.tsx          # EIO list table (filters, sort, column toggle)
  eio-detail.tsx        # EIO detail + version history
  oio-list.tsx          # OIO list table
  column-toggle.tsx     # column visibility dropdown
  app-header.tsx        # top bar
  add-oio-dialog.tsx    # create OIO dialog
  delete-confirm-dialog.tsx
  ui/                   # shadcn/ui primitives (generated — don't hand-edit)

hooks/
  use-column-config.ts  # column visibility (localStorage)
  use-saved-repos.ts    # saved connection history (localStorage)
  use-column-resize.ts  # drag-to-resize column widths

lib/
  zgw-jwt.ts            # ZGW JWT generation, signed server-side only
  session.ts            # iron-session config + ConnectionConfig type
  local-storage.ts      # typed localStorage helpers (columns + repos)
  utils.ts              # cn() helper
  file-type-icon.tsx    # MIME type → Lucide icon

types/drc.ts            # Documenten API types (EIO, OIO, filters, etc.)
```

## Security constraints — read carefully

- **Client secrets and bearer tokens are NEVER stored in localStorage.** Only `baseUrl`, `authType`, and `clientId` go in localStorage.
- Full `ConnectionConfig` (including secret/token) lives exclusively in the `iron-session` encrypted cookie.
- JWT signing happens in `/api/drc/[...path]/route.ts` (server-side). Never call `generateZgwJwt` from client components.
- The proxy injects `Authorization` headers — client code never touches credentials.

## Key patterns

### Adding a shadcn component

```bash
npx shadcn add <component>
```

Never hand-edit files under `components/ui/`.

### API proxy

All DRC calls go through `/api/drc/[...path]`. The proxy reads `ConnectionConfig` from the session and forwards the request with the correct `Authorization` header. Client components call `/api/drc/enkelvoudiginformatieobjecten/...` — never the backend directly.

### Column config

`useColumnConfig()` is lifted to `EioList` and passed as `{ visible, toggle }` props to `ColumnToggle`. Do NOT call the hook inside `ColumnToggle` — each hook call creates an independent state instance.

### localStorage keys

- `drc-browser:columns` — `ColumnKey[]` of visible columns
- `drc-browser:repositories` — `SavedRepository[]` (max 10, sorted by lastUsed)

### EIO versioning

- `?versie=N` on detail and download endpoints selects a specific version.
- The detail page tracks `latestVersie` separately from `currentVersie` (the API returns the versie of the requested version, not the total count).
- Version history fetches all versions in parallel via `AbortController` to handle React Strict Mode double-invocation.

## Environment variables

| Variable         | Required | Description                              |
|------------------|----------|------------------------------------------|
| `SESSION_SECRET` | yes      | 32+ char random string, encrypts session |

## Known API limitations

See `docs/api-limitations.md`.
