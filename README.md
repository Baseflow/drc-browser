# DRC Browser

A lightweight browser UI for the [Documenten API v1.5.0](https://vng-realisatie.github.io/gemma-zaken/standaard/documenten/) (Common Ground / ZGW).

Connect to any compliant DRC (Documentregistratiecomponent) and browse, filter, and inspect EnkelvoudigInformatieObjecten (EIO) and ObjectInformatieObjecten (OIO).

**License:** EUPL-1.2 — Copyright (C) 2026 Baseflow

---

## Features

- Connect via ZGW JWT (client ID + secret) or a raw Bearer token
- Browse and filter EIOs with sortable, resizable, configurable columns
- Inspect EIO detail including version history and per-version downloads
- Browse OIO (object–document relations) with object URL lookup
- Saved connection history (baseUrl + clientId only — secrets are never stored)
- Column visibility persisted in localStorage
- Dark / light theme

## Tech stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Framework  | Next.js 16 (App Router)        |
| Language   | TypeScript                     |
| UI         | shadcn/ui + Tailwind CSS v4    |
| Auth       | ZGW JWT (HS256) via `jose`     |
| Session    | `iron-session` encrypted cookie |
| State      | React hooks + localStorage      |

## Getting started

### Prerequisites

- Node.js 20+
- A running Documenten API instance

### Install & run

```bash
cp .env.local.example .env.local
# Edit .env.local — set SESSION_SECRET to a random 32+ char string

npm install
npm run dev        # starts on http://localhost:3010
```

### Environment variables

| Variable         | Required | Description                                      |
|------------------|----------|--------------------------------------------------|
| `SESSION_SECRET` | yes      | 32+ character random string for session encryption |

### Production build

```bash
npm run build
npm start
```

The build uses `output: "standalone"` — the `.next/standalone` directory contains everything needed to run the app without `node_modules`.

### Docker

```bash
docker build -t drc-browser .
docker run -e SESSION_SECRET=<your-secret> -p 3000:3000 drc-browser
```

## Architecture

```
app/
  connect/           # Connection form (ZGW / Bearer)
  (main)/
    documenten/      # EIO list + detail pages
    koppelingen/     # OIO list page
  api/
    drc/[...path]/   # Server-side proxy — forwards all DRC calls with auth header
    session/         # Read/clear session endpoint
components/          # UI components
hooks/               # useColumnConfig, useSavedRepos, useColumnResize
lib/
  zgw-jwt.ts         # ZGW JWT generation (HS256, signed server-side)
  session.ts         # iron-session config
  local-storage.ts   # Typed localStorage helpers
types/drc.ts         # Documenten API TypeScript types
```

All DRC API calls are proxied through `/api/drc/[...path]`. The proxy reads the `ConnectionConfig` from the encrypted session cookie and injects the `Authorization` header server-side. Client-side code never handles credentials directly.

## Security notes

- Client secrets and bearer tokens are stored only in the server-side encrypted session cookie (`iron-session`), never in localStorage or client state.
- `SESSION_SECRET` must be kept secret and rotated if compromised.
- The proxy route (`/api/drc/`) forwards requests to whatever `baseUrl` is stored in the session — ensure the deployment environment restricts which hosts are reachable if needed.

## Limitations & future work

Currently, users must supply DRC connection credentials (endpoint URL + client secret or bearer token) themselves via the connect form. This is intentional for a PoC but unsuitable for broader deployment: credentials should not be distributed to end users.

The recommended extension is to add OIDC-based login so that the application authenticates users against an identity provider (e.g. Keycloak) and obtains DRC credentials server-side — users then only see the document browser, never the underlying API credentials.

## Known API limitations

See [`docs/api-limitations.md`](docs/api-limitations.md) for documented constraints of the Documenten API as it relates to this browser (sortable fields, filterable fields, trefwoorden behavior, etc.).
