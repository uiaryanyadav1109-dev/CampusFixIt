# TESTING — Strategy and requirements

## Tools

| Type | Tool | Location | Run with |
| --- | --- | --- | --- |
| Unit | Vitest | `tests/unit/` | `npm run test` |
| API integration | Vitest + test database | `tests/api/` | `npm run test` |
| End-to-end | Playwright | `tests/e2e/` | `npm run test:e2e` |
| Accessibility | axe-core inside Playwright | `tests/e2e/a11y.spec.ts` | `npm run test:e2e` |

CI runs lint, typecheck, test and build on every pull request. A pull request does not merge unless all pass.

## Test database

- API tests run against a separate Postgres database (`DATABASE_URL_TEST`), migrated with `prisma migrate deploy` before the suite.
- Each test file resets data it needs (truncate in `beforeEach` or use transactions). Tests must not depend on order.
- Use factory helpers in `tests/helpers/` (`makeUser(role)`, `makeReport(overrides)`, `signedInAs(user)`).
- External services (storage, email, SSO) are mocked. Never call real services in tests.

## What must be tested

### Unit tests (fast, no database)

- `workflow.transition` rules: every legal transition passes; every illegal one throws `INVALID_TRANSITION`.
- Required fields per transition: reject needs a note; assign needs an active staff assignee; resolve needs an after-photo; reopen needs a note.
- `permissions.can()` for every role and action in the matrix from `PRD.md`.
- SLA helpers: due date by priority, working-day maths, overdue calculation.
- Zod schemas: valid and invalid inputs for report creation, status change, uploads, master data.
- Ticket number formatting.

### API integration tests

For **every endpoint** in `API_SPEC.md`:

1. Success with an allowed role.
2. Denied role returns `403` or `404`.
3. Signed out returns `401`.
4. Invalid input returns `400` with the standard error shape.

Plus these scope tests (critical):

- A reporter cannot read, comment on or change another reporter's report.
- An ADMIN cannot list, read or change reports of another department.
- STAFF `GET /staff/tasks` returns only their assigned reports.
- Internal comments are never returned to reporters.
- Each transition writes `StatusHistory` and `AuditLog`, and a failed transition writes nothing (transaction rollback).
- Upload signing rejects wrong MIME type and oversize files; attaching media rejects keys from another user.
- Rate limits return `429` after the limit.
- Ticket numbers stay unique under 20 concurrent creations.

### End-to-end tests (Playwright)

Use a test auth bypass (`AUTH_TEST_MODE=true`, never enabled in production) to sign in as each role.

| Journey | Steps |
| --- | --- |
| Reporter happy path | Open `/report/new` on a 360 px viewport → choose category, location → add a photo → submit → see ticket number → see it in `/my-reports` |
| Admin triage | Admin opens `/admin/reports` → filters → verifies a report → assigns it to staff |
| Staff resolution | Staff opens `/staff/tasks` → starts work → uploads after-photo → marks resolved |
| Reporter confirm and reopen | Reporter sees `RESOLVED` → reopens with a note → status returns to `IN_PROGRESS` |
| Super admin settings | Add a location and a category; deactivate one; confirm it disappears from the report form |
| Access control | Reporter visiting `/admin` gets a 404 page; signed-out visitor is redirected to `/login` |

### Accessibility

- Run axe on: `/login`, `/report/new` (each step), `/my-reports`, `/reports/[id]`, `/staff/tasks`, `/admin`, `/admin/reports`, `/admin/analytics`, `/admin/settings`.
- Fail on any `serious` or `critical` violation.
- Manual check before each release: keyboard-only walk through the report form; screen reader pass on the report form and detail page.

### Manual checks before launch

- Real phone test (low-end Android, slow 3G throttle): submit a report with 3 photos.
- Email rendering in Gmail and Outlook.
- Upload of a 12 MP photo succeeds after compression and is under 5 MB.
- Time zone display shows IST correctly.

## Coverage expectations

- `src/server/workflow.ts`, `src/lib/permissions.ts`, `src/lib/sla.ts`: 100% branch coverage.
- `src/server/*` overall: 85% or higher.
- Do not chase coverage numbers elsewhere; test behaviour that matters.

## Rules for agents

- Write the tests in the same task as the code, not later.
- Never weaken, skip (`.skip`) or delete a test to get a green run. If a test is wrong, fix it and explain why in the summary.
- A bug fix starts with a failing test that reproduces it.
- Keep tests readable: one behaviour per test, names like `"admin from another department cannot read the report"`.
