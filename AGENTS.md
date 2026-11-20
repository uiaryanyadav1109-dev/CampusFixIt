# AGENTS.md — Campus Property Damage Reporting and Tracking System (website)

Read this file first. It is the entry point for every coding agent working in this repository.

## What we are building

A responsive website where students, staff and faculty report damaged campus property (broken benches, leaking taps, faulty lights, damaged lab equipment) in under a minute. Admins triage and assign reports. Maintenance staff fix them and update status. Everyone can track a report from submission to closure.

- Website only. No native mobile app. The site must work well on a phone browser (mobile first).
- One Next.js (TypeScript) app serves both the pages and the REST API under `/api/v1`.
- Database: PostgreSQL via Prisma. Photos: private object storage with signed URLs. Email: Resend.

## Read these before coding (in this order)

1. `docs/PRD.md` — what to build, roles, user stories, acceptance criteria
2. `docs/WORKFLOW.md` — report statuses, legal transitions, SLAs, notifications
3. `docs/ARCHITECTURE.md` — stack, folder structure, coding conventions
4. `docs/DATA_MODEL.md` — Prisma schema and rules
5. `docs/API_SPEC.md` — endpoints, payloads, error format, permissions
6. `docs/UI_GUIDELINES.md` — pages, components, design and accessibility
7. `docs/SECURITY.md` — security and privacy requirements
8. `docs/TESTING.md` — what to test and how
9. `docs/TASKS.md` — the ordered build checklist; work from here

If two files disagree, `docs/PRD.md` wins for scope and `docs/WORKFLOW.md` wins for statuses and transitions. Tell the human about the conflict instead of guessing.

## Commands

These scripts are created in task T-001. Use exactly these names.

```
npm run dev          # local dev server on http://localhost:3000
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest (unit + API integration)
npm run test:e2e     # Playwright
npm run build        # production build
npm run db:migrate   # prisma migrate dev
npm run db:seed      # seed roles, categories, sample locations
npm run db:studio    # prisma studio
```

## How to work

1. Take ONE unticked task from `docs/TASKS.md`, in order. Do not start the next task until the current one is done.
2. Before writing code, state in two or three lines what you will change and which files.
3. Make the smallest change that satisfies the task and its acceptance criteria.
4. Run `npm run lint && npm run typecheck && npm run test`. Fix failures. Do not report done while any fail.
5. Tick the task in `docs/TASKS.md`. If you changed behaviour, update the matching file in `docs/` in the same change.
6. Finish with a short summary: what changed, what you tested, anything left open.

## Hard rules

- Every API endpoint checks authentication and role on the server. Hiding a button in the UI is never access control.
- Validate all input with the Zod schemas in `src/schemas/`. The same schema is used on the client and the server.
- Status changes go ONLY through `src/server/workflow.ts`. Never update `Report.status` directly anywhere else.
- Every status change, assignment and role change writes a row to `StatusHistory` or `AuditLog`.
- Use Prisma for all database access. No raw SQL built from user input.
- Never commit secrets. Use `.env` (git-ignored) and keep `.env.example` current.
- Do not store photos in the database or on local disk. Use the storage helper in `src/lib/storage.ts`.
- Do not add a dependency without a one-line reason in the task summary. Prefer what is already in the stack.
- Do not build anything listed under "Out of scope" in `docs/PRD.md`.
- Do not change the Prisma schema without creating a migration and updating `docs/DATA_MODEL.md`.
- Do not weaken or delete a test to make it pass. Fix the code or ask.

## Definition of done

A task is done only when all of these are true:

- The acceptance criteria in `docs/TASKS.md` and `docs/PRD.md` for that task are met.
- `npm run lint`, `npm run typecheck` and `npm run test` all pass.
- New endpoints have tests for an allowed role and a denied role.
- New pages have loading, empty and error states, work at 360 px width, and have no accessibility violations from axe.
- Docs are updated if behaviour or the data model changed.

## When to stop and ask the human

- A requirement is unclear or two docs conflict.
- The task needs a new external service, paid plan, or credential.
- A change would alter roles, permissions, statuses or the data model beyond what the docs describe.
- You are about to delete data, a migration, or a test.

## Code style (short version; details in `docs/ARCHITECTURE.md`)

- TypeScript strict mode. No `any` without a comment explaining why.
- Server code lives in `src/server/` and `src/lib/`. Components never import Prisma.
- File names: `kebab-case.ts`; React components `PascalCase.tsx`; one component per file.
- Small functions, early returns, clear names. Comments explain why, not what.
