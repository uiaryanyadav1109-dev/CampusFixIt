# SECURITY — Security and privacy requirements

These are requirements, not suggestions. Review this file before building any endpoint, upload, email or admin screen.

## Authentication

- Sign-in only through Google or Microsoft SSO via Auth.js. No passwords stored.
- Reject sign-ins whose email domain is not `ALLOWED_EMAIL_DOMAIN`.
- New users get role `REPORTER`. Only a SUPER_ADMIN can change roles.
- Sessions: database sessions, httpOnly, secure, sameSite=lax cookies; 8 hour idle expiry.
- Inactive users (`isActive = false`) cannot sign in or use the API.

## Authorization

- Every route handler and server action calls `withAuth()` and `can(user, action, resource)`.
- Scope is enforced in the query, not after it: ADMIN queries always include `departmentId = admin.departmentId`; STAFF task queries always include `assigneeId = user.id`; reporters always see only `reporterId = user.id`.
- Return `404` instead of `403` when the existence of a report should not be revealed.
- Never trust IDs from the client for ownership: check them against the session user.

## Input validation

- Validate every request body, query string and path parameter with Zod. Reject unknown fields (`.strict()`).
- Trim strings. Enforce max lengths. Escape on output (React does this by default; never use `dangerouslySetInnerHTML` with user content).
- Use Prisma for all queries. No string-built SQL.

## File uploads

- Allowed types: JPEG, PNG, WebP. Verify by MIME type and magic bytes on the server when issuing or confirming uploads. Max 5 MB each, max 5 per report.
- Browser uploads directly to a **private** bucket using a short-lived signed PUT URL (5 minutes). Object keys are random UUIDs under `reports/<userId>/`.
- Strip EXIF metadata (including GPS) in the browser before upload; strip again server-side if a processing step exists.
- Serving: signed GET URLs with 10 minute expiry. Never make the bucket public.
- On attach (`mediaKeys`), verify each key starts with the acting user's prefix and exists in storage.

## Transport and headers

- HTTPS only; HSTS enabled in production.
- Security headers via `next.config.js`: `Content-Security-Policy` (self, plus storage host for images), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` (camera allowed for self only).
- CSRF: rely on Auth.js and sameSite cookies; state-changing routes accept only `POST`, `PATCH`, `DELETE` with JSON content type.
- CORS: same-origin only; no wildcard.

## Rate limiting

| Endpoint | Limit |
| --- | --- |
| `POST /reports` | 10 per user per day |
| `POST /uploads/sign` | 30 per user per hour |
| `POST /reports/:id/comments` | 30 per user per hour |
| Any endpoint, per IP | 120 requests per minute |

Use a small rate-limit helper in `src/lib/rate-limit.ts` (Upstash Redis in production; in-memory acceptable locally).

## Secrets and configuration

- Secrets only in environment variables. `.env` is git-ignored; `.env.example` lists names without values.
- Validate env vars at startup in `src/lib/env.ts`; fail fast if missing.
- Cron endpoints require `Authorization: Bearer <CRON_SECRET>`.
- Never log tokens, signed URLs, session cookies or full request bodies.

## Privacy

- Collect only: name, campus email, department, and report content (text, photos, location).
- Publish a short privacy notice (`/privacy`) linked from `/login`: what is collected, who can see it, retention, contact.
- Retention: keep reports for 2 years after closure, then anonymise reporter (set reporter display to "Former user") — implement as a documented script, not in MVP code.
- Photos may show people. Add a note on the upload step: "Do not photograph people."
- Reporter email is shown only to ADMIN (own dept) and SUPER_ADMIN, never to other reporters or to STAFF unless needed for the task.
- **Anonymous reports (v1.1):** hide reporter identity from everyone except SUPER_ADMIN; each SUPER_ADMIN view of an anonymous reporter writes an `AuditLog` row (`report.anonymous_reporter_viewed`). Notification emails still go to the reporter but never reveal them to staff.
- CSV export respects the same visibility rules.

## Audit logging

Write an `AuditLog` row for: status changes, assignments, priority changes, role changes, user deactivation, master-data changes, exports, and anonymous-reporter views. Rows are append-only.

## Dependencies and supply chain

- Commit the lockfile. Run `npm audit --omit=dev` in CI and fail on high or critical findings.
- Do not add dependencies for things the stack already covers. Prefer well-maintained packages.

## Pre-launch security checklist

- [ ] Every endpoint has role and scope tests (allowed and denied).
- [ ] Reporter cannot read another reporter's report by guessing an ID.
- [ ] ADMIN cannot read or change another department's reports.
- [ ] Upload rejects wrong type, oversize, and keys from another user.
- [ ] Signed-out requests get `401` on every API route.
- [ ] Security headers present (check with a header scanner).
- [ ] No secrets in the repo history; `.env.example` is complete.
- [ ] Rate limits verified.
- [ ] Privacy notice published and linked.
- [ ] Backups configured and a restore tested once.
