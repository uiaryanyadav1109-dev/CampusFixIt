# TASKS — Ordered build checklist

Work top to bottom, one task at a time. Tick the box when the task is done and `npm run lint && npm run typecheck && npm run test` pass. Each task lists what to deliver; the detailed behaviour is in the linked docs.

Phases match the roadmap: Foundation (weeks 1–2) → Reporter flow (3–4) → Admin and staff (5–7) → Insights (8–9) → Pilot (10–12).

---

## Phase 1 — Foundation (weeks 1–2)

- [x] **T-001 Project setup.** Create Next.js (App Router, TypeScript strict), Tailwind, shadcn/ui, ESLint, Prettier. Add the npm scripts listed in `AGENTS.md`. Create folder structure from `ARCHITECTURE.md`. Add `.env.example` and `src/lib/env.ts` (Zod-validated). *(Completed: layout font fixed to system stack, shadcn/ui initialized with core primitives button/card/badge/input, vitest ESM config resolved, lint/typecheck/test/build all passing).*
- [x] **T-002 CI.** GitHub Actions workflow: install, lint, typecheck, test, build on pull requests. Add `npm audit --omit=dev` step. *(Completed: created .github/workflows/ci.yml with Node 20, npm caching, npm ci, npm audit --omit=dev, lint, typecheck, test, and build).*
- [ ] **T-003 Database.** Add Prisma, paste schema from `DATA_MODEL.md`, run first migration. Add `src/lib/db.ts` singleton.
- [ ] **T-004 Seed.** Implement idempotent `prisma/seed.ts` per `DATA_MODEL.md`.
- [ ] **T-005 Auth.** Auth.js with Google and Microsoft, Prisma adapter, domain restriction, default role `REPORTER`, `getSessionUser()` helper, inactive-user block.
- [ ] **T-006 Permissions and API helpers.** `src/lib/permissions.ts` (`can()` covering the full matrix in `PRD.md`), `src/lib/api.ts` (`withAuth()`, standard error shape, pagination helper). Unit tests for `can()`.
- [ ] **T-007 App shell.** Layout with header, role-aware navigation, `/login` page, route protection middleware, 404 page, privacy notice page `/privacy`.
- [ ] **T-008 Master data read API.** `GET /locations`, `GET /categories`, `GET /departments` with tests.
- [ ] **T-009 Deploy skeleton.** Deploy to Vercel with staging database and bucket; health endpoint `/api/health`; Sentry set up.

**Gate: sign-in works on staging; CI green.**

---

## Phase 2 — Reporter flow (weeks 3–4)

- [ ] **T-010 Storage helper.** `src/lib/storage.ts`: signed PUT and GET URLs, key generation, existence check. Mock in tests.
- [ ] **T-011 Upload API.** `POST /uploads/sign` with type and size validation and rate limit. Tests.
- [ ] **T-012 Workflow service.** `src/server/workflow.ts` implementing every transition in `WORKFLOW.md`, transactional, writing `StatusHistory` and `AuditLog`. 100% branch unit tests.
- [ ] **T-013 SLA helpers.** `src/lib/sla.ts` with table, due date, overdue. Unit tests.
- [ ] **T-014 Create report API.** `POST /reports` with ticket number counter, department copy, media key checks, rate limit. Tests incl. concurrent ticket numbers.
- [ ] **T-015 Reporter read APIs.** `GET /reports/mine`, `GET /reports/:id` (scoped, signed photo URLs, history). Tests incl. cross-user denial.
- [ ] **T-016 Report form UI.** 4-step form per `UI_GUIDELINES.md`: category tiles, cascading location selects, photo picker with compression and EXIF strip, review and submit, success screen.
- [ ] **T-017 My reports and detail pages.** `/my-reports`, `/reports/[id]` with `StatusChip`, `Timeline`, `PhotoGallery`; loading, empty, error states.
- [ ] **T-018 Email notifications.** Resend integration, templates, `notifications.ts`; send on create and every transition; failures logged, never block. Mock in tests.
- [ ] **T-019 Reporter e2e + a11y.** Playwright reporter happy path at 360 px; axe on reporter pages.

**Gate: end-to-end demo on staging — submit, see ticket, see timeline.**

---

## Phase 3 — Admin and staff (weeks 5–7)

- [ ] **T-020 Admin list API.** `GET /reports` with all filters, sorting, pagination, department scope, overdue filter. Tests.
- [ ] **T-021 Status API.** `PATCH /reports/:id/status` using `workflow.transition()`; `PATCH /reports/:id` for priority. Tests for every transition and role.
- [ ] **T-022 Staff list for assignment.** `GET /users?role=STAFF&departmentId=` (admin scoped). Tests.
- [ ] **T-023 Admin dashboard and reports table.** `/admin` summary tiles and `/admin/reports` table with filters, pagination, bulk assign, row detail.
- [ ] **T-024 Detail page actions.** Role- and status-aware action buttons: verify, reject (reason dialog), assign, reassign, start, resolve (after-photo), reopen, confirm and close.
- [ ] **T-025 Staff tasks.** `GET /staff/tasks` and `/staff/tasks` page with one-tap actions and after-photo upload (`POST /reports/:id/media`).
- [ ] **T-026 Comments.** `POST /reports/:id/comments` with internal flag; UI on detail page. Tests that internal comments never reach reporters.
- [ ] **T-027 Master data admin.** Create, edit, deactivate for users, departments, locations, categories; `/admin/settings` tabs; role change audit; last-super-admin protection. Tests.
- [ ] **T-028 Auto-close cron.** `POST /api/cron/auto-close` secured by `CRON_SECRET`; Vercel cron config. Tests.
- [ ] **T-029 Admin and staff e2e + a11y.** Playwright journeys from `TESTING.md`; axe on admin and staff pages.

**Gate: all MVP user stories (US-1 to US-6) pass their acceptance criteria.**

---

## Phase 4 — Insights (weeks 8–9)

- [ ] **T-030 Analytics API.** `GET /analytics/summary` and `GET /reports/export.csv`, scoped by role. Tests.
- [ ] **T-031 Analytics page.** `/admin/analytics` with Recharts charts, period selector, CSV export button, accessible chart descriptions.
- [ ] **T-032 Overdue indicators.** Overdue badge and filter across admin and staff views.
- [ ] **T-033 Rate limiting.** `src/lib/rate-limit.ts` applied to endpoints listed in `SECURITY.md`; tests for `429`.
- [ ] **T-034 Security headers and hardening.** CSP and headers in `next.config.js`; review against the checklist in `SECURITY.md`.

**Gate: US-7 passes; all MVP stories pass; security checklist items implemented.**

---

## Phase 5 — Hardening and pilot (weeks 10–12)

- [ ] **T-035 Performance pass.** Lighthouse mobile 85+ on `/report/new`; lazy-load images; verify pagination everywhere.
- [ ] **T-036 Full accessibility pass.** Fix all axe findings; manual keyboard and screen reader checks.
- [ ] **T-037 Error and empty states review.** Every list and form handles loading, empty, error, offline.
- [ ] **T-038 Backups and restore.** Document and test database backup restore. Add to `docs/RUNBOOK.md`.
- [ ] **T-039 Seed real data.** Import real buildings, floors, rooms, categories, departments, and staff accounts (from the human's files).
- [ ] **T-040 Pilot release.** Production deploy; enable in two buildings; QR or poster text for the report URL; collect feedback list in `docs/PILOT_NOTES.md`.
- [ ] **T-041 Pilot fixes.** Work through pilot feedback; no open critical or high bugs.
- [ ] **T-042 Go-live review.** Confirm criteria: no critical or high bugs, 90% of pilot reports acknowledged within 24 hours, head of maintenance sign-off.

**Gate: go-live criteria met.**

---

## Backlog — do NOT start until MVP is accepted by the human

- v1.1: QR code per room · duplicate detection · reporter rating · SLA escalation emails · anonymous reports
- v2: cost tracking and heatmaps · weekly summary emails · extra languages and PWA · WhatsApp or SMS
