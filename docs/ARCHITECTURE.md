# ARCHITECTURE

## Stack (fixed — do not swap without asking the human)

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router), TypeScript strict |
| UI | Tailwind CSS, shadcn/ui, lucide-react icons |
| Forms and validation | React Hook Form, Zod (shared schemas) |
| Auth | Auth.js (NextAuth) with Google and Microsoft providers, database sessions |
| Database | PostgreSQL, Prisma ORM |
| File storage | Cloudflare R2 or AWS S3 (S3-compatible API), private bucket |
| Email | Resend |
| Charts | Recharts |
| Tests | Vitest (unit, API), Playwright (e2e), axe for accessibility |
| Hosting | Vercel (app), Neon (Postgres) |
| CI | GitHub Actions: lint, typecheck, test, build on every pull request |

## System overview

```
Browser (mobile-first web UI)
   │ HTTPS
   ▼
Next.js app
   ├─ Pages (React, Tailwind)
   ├─ API route handlers  /api/v1/*
   ├─ Services (auth, RBAC, workflow)
   └─ Cron endpoints (auto-close, later SLA)
   │            │              │              │
   ▼            ▼              ▼              ▼
PostgreSQL   Campus SSO    Email (Resend)   Object storage
(Prisma)     (Google/MS)                    (signed URLs)
```

The browser uploads photos directly to object storage using a short-lived signed URL issued by the API. The browser never sees storage credentials.

## Folder structure

```
src/
  app/                    routes
    (public)/login/
    (app)/report/new/
    (app)/my-reports/
    (app)/reports/[id]/
    (app)/staff/tasks/
    (app)/admin/            dashboard, reports, settings, analytics
    api/v1/                 REST handlers (thin: parse, authorize, call service, respond)
    api/cron/               secured cron endpoints
  components/
    ui/                     shadcn/ui primitives
    reports/                report form, status chip, timeline, photo gallery
    admin/                  tables, filters, charts
  lib/
    auth.ts                 Auth.js config, getSessionUser()
    db.ts                   Prisma client singleton
    permissions.ts          can(user, action, resource) — the ONLY place roles are checked
    storage.ts              signed upload/download URLs
    email/                  send(), templates/
    sla.ts                  SLA table and due-date helpers
    api.ts                  withAuth(), error helpers, response helpers
  server/
    reports.ts              create, list, get (scoped by role)
    workflow.ts             transition() — the ONLY place status changes
    assignments.ts
    analytics.ts
    notifications.ts
  schemas/                  Zod schemas (report, status, user, location, category)
prisma/
  schema.prisma
  migrations/
  seed.ts
tests/
  unit/  api/  e2e/
docs/                       these files
```

## Layering rules

1. **Route handler** (`src/app/api/v1/**/route.ts`): parse input with a Zod schema → `withAuth()` → call one service function → return JSON. No business logic.
2. **Service** (`src/server/*.ts`): business logic and Prisma queries. Always receives the acting `user` and enforces scope via `permissions.ts`.
3. **Components** never import Prisma or anything from `src/server/`. They call the API (or server actions that call services) and use types from `src/schemas/`.
4. **Permissions**: one function `can(user, action, resource)` in `src/lib/permissions.ts`. Every endpoint and service uses it. Never write `if (user.role === ...)` elsewhere.
5. **Status changes**: only `workflow.transition()`. See `WORKFLOW.md`.

## Conventions

- TypeScript strict. No `any` without a comment. Derive types from Zod with `z.infer`.
- IDs are UUIDs (`@default(uuid())`). Timestamps are UTC (`DateTime`), shown in `Asia/Kolkata`.
- Dates in API payloads are ISO 8601 strings.
- Pagination: `?page=1&pageSize=25` (max 100). Responses include `total`.
- Errors: one JSON shape (see `API_SPEC.md`). Never leak stack traces or SQL errors.
- Logging: structured logs with request id; never log tokens, emails in bulk, or photo URLs.
- Config: read env vars only in `src/lib/env.ts` (validated with Zod at startup).
- No global mutable state. No business logic in React components.
- Prefer server components for data display; client components only for interactivity (forms, filters).

## Environment variables (`.env.example` must list all)

```
DATABASE_URL=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_MICROSOFT_ENTRA_ID_ID=
AUTH_MICROSOFT_ENTRA_ID_SECRET=
ALLOWED_EMAIL_DOMAIN=            # e.g. college.edu
STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
RESEND_API_KEY=
EMAIL_FROM=
CRON_SECRET=
APP_URL=http://localhost:3000
```

## Environments

Local (docker Postgres or Neon branch) → Staging (preview deployment + staging DB and bucket) → Production. Each has separate secrets, database and bucket. Migrations run in CI/CD with `prisma migrate deploy`.
