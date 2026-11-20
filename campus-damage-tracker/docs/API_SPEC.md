# API_SPEC — REST API under `/api/v1`

All endpoints return JSON. All require a signed-in user unless stated. Role checks use `can()` from `src/lib/permissions.ts`. Input is validated with Zod schemas from `src/schemas/`.

## Conventions

- Dates: ISO 8601 UTC strings.
- Pagination: `?page=1&pageSize=25` (max 100). List responses: `{ "items": [...], "page": 1, "pageSize": 25, "total": 134 }`.
- IDs: UUID strings. Reports are also addressable by `ticketNo` in the UI, but the API uses `id`.
- Success: `200` (read/update), `201` (create), `204` (no body).

### Error format (every error uses this shape)

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Human readable summary", "details": [{ "path": "description", "message": "Must be at least 10 characters" }] } }
```

| HTTP | `code` | When |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Zod validation failed |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Role or scope does not allow it |
| 404 | `NOT_FOUND` | Missing, or not visible to this user (use 404 rather than 403 to avoid leaking existence) |
| 409 | `INVALID_TRANSITION` | Status change not allowed by `WORKFLOW.md` |
| 409 | `CONFLICT` | Other state conflict (e.g. duplicate unique value) |
| 413 | `FILE_TOO_LARGE` | Upload over 5 MB |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Not JPEG, PNG or WebP |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected; log with request id, return generic message |

## Reports

### POST `/reports`  — roles: any signed-in user

Body:
```json
{
  "categoryId": "uuid",
  "locationId": "uuid",
  "description": "string, 10 to 1000 chars",
  "priority": "NORMAL",
  "mediaKeys": ["storage-key-1", "storage-key-2"]
}
```
- `priority` optional; default from category. Reporters may only suggest `NORMAL` or `HIGH`; admins can change it later.
- `mediaKeys` (0 to 5) are keys previously uploaded via `/uploads/sign`. Verify each key belongs to this user's upload prefix.
- Rate limit: 10 reports per user per day.
- Returns `201` with the report (see Report shape).

### GET `/reports/mine`  — any signed-in user
Query: `status`, `page`, `pageSize`. Returns own reports, newest first.

### GET `/reports`  — roles: ADMIN (own dept), SUPER_ADMIN
Query: `status`, `categoryId`, `building`, `priority`, `assigneeId`, `from`, `to`, `overdue=true`, `q` (ticket no or text), `sort` (`createdAt`, `dueAt`, `priority`), `order`, `page`, `pageSize`.

### GET `/reports/:id`  — owner, assignee, ADMIN (own dept), SUPER_ADMIN
Returns the report with `media` (signed GET URLs, 10 minute expiry), `history`, `comments` (internal comments only for STAFF/ADMIN/SUPER_ADMIN), `assignee`.

### PATCH `/reports/:id/status`  — see `WORKFLOW.md` for who may do each transition
Body: `{ "toStatus": "VERIFIED", "note": "optional unless required", "assigneeId": "uuid (only for ASSIGNED)", "priority": "optional (only for VERIFIED)" }`.
Calls `workflow.transition()`. Returns the updated report.

### PATCH `/reports/:id`  — roles: ADMIN (own dept), SUPER_ADMIN
Body: `{ "priority": "HIGH" }`. Only allowed while status is not `RESOLVED`, `CLOSED` or `REJECTED`. Writes an `AuditLog` row.

### POST `/reports/:id/media`  — owner (BEFORE), assignee/ADMIN/SUPER_ADMIN (AFTER)
Body: `{ "key": "storage-key", "kind": "AFTER" }`. Attaches an already-uploaded file.

### POST `/reports/:id/comments`  — participants (owner, assignee, ADMIN own dept, SUPER_ADMIN)
Body: `{ "body": "1 to 1000 chars", "isInternal": false }`. Only STAFF, ADMIN, SUPER_ADMIN may set `isInternal: true`.

### POST `/reports/:id/feedback`  — v1.1, reporter of a `RESOLVED` or `CLOSED` report
Body: `{ "rating": 1-5, "comment": "optional" }`.

## Uploads

### POST `/uploads/sign`  — any signed-in user
Body: `{ "filename": "photo.jpg", "mimeType": "image/jpeg", "sizeBytes": 812345 }`.
Validates type (JPEG, PNG, WebP) and size (max 5 MB). Returns `{ "key": "reports/<userId>/<uuid>.jpg", "uploadUrl": "https://...", "expiresIn": 300 }`. The browser then `PUT`s the file to `uploadUrl`.
Rate limit: 30 signatures per user per hour.

## Staff

### GET `/staff/tasks`  — roles: STAFF
Reports where `assigneeId` is the user and status is `ASSIGNED` or `IN_PROGRESS`, ordered by `dueAt`.

## Master data (super admin only unless noted)

| Method and path | Purpose | Roles |
| --- | --- | --- |
| GET `/locations` | List active locations (supports `building` filter) | Any signed-in user |
| GET `/categories` | List active categories | Any signed-in user |
| POST, PATCH `/locations`, `/locations/:id` | Create, edit, deactivate | SUPER_ADMIN |
| POST, PATCH `/categories`, `/categories/:id` | Create, edit, deactivate | SUPER_ADMIN |
| GET `/users` | List and search users | ADMIN (own dept), SUPER_ADMIN |
| PATCH `/users/:id` | Change `role`, `departmentId`, `isActive` | SUPER_ADMIN |
| GET `/departments`, POST, PATCH | Departments | SUPER_ADMIN (GET: any signed-in user) |

Changing a user's role writes an `AuditLog` row (`user.role_changed`, with old and new role). A SUPER_ADMIN cannot demote themselves if they are the last SUPER_ADMIN.

## Analytics — roles: ADMIN (own dept), SUPER_ADMIN

### GET `/analytics/summary`
Query: `days` (7, 30 or 90). Returns:
```json
{
  "byStatus": [{ "status": "SUBMITTED", "count": 12 }],
  "byCategory": [{ "categoryId": "uuid", "name": "Electrical", "count": 20 }],
  "byBuilding": [{ "building": "Main Block", "count": 31 }],
  "overdueCount": 4,
  "medianResolutionHours": 61.5,
  "acknowledgedWithin24hPct": 92.3
}
```

### GET `/reports/export.csv`
Same filters as `GET /reports`. Streams CSV. Never includes reporter email for anonymous reports.

## Cron — secured by header `Authorization: Bearer <CRON_SECRET>`

- POST `/api/cron/auto-close` — closes `RESOLVED` reports older than 7 days.

## Report shape (response)

```json
{
  "id": "uuid",
  "ticketNo": "CPD-2026-00042",
  "status": "ASSIGNED",
  "priority": "HIGH",
  "description": "Ceiling fan sparks when switched on",
  "category": { "id": "uuid", "name": "Electrical" },
  "location": { "id": "uuid", "building": "Main Block", "floor": "2", "room": "204" },
  "reporter": { "id": "uuid", "name": "A. Student" },
  "assignee": { "id": "uuid", "name": "R. Kumar" },
  "dueAt": "2026-11-23T09:00:00.000Z",
  "isOverdue": false,
  "media": [{ "id": "uuid", "kind": "BEFORE", "url": "https://signed-url" }],
  "createdAt": "2026-11-20T04:12:00.000Z",
  "updatedAt": "2026-11-20T05:00:00.000Z"
}
```

`isOverdue` is computed. `reporter` is omitted when the report is anonymous and the viewer is not SUPER_ADMIN.

## Testing requirement

Every endpoint above needs API tests for: success with an allowed role, `403` or `404` with a denied role, `401` when signed out, and `400` for invalid input. See `TESTING.md`.
