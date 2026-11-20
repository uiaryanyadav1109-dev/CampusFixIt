# WORKFLOW — Statuses, transitions, SLAs, notifications

This is the single source of truth for the report lifecycle. All status changes go through `src/server/workflow.ts`, which enforces this file.

## Statuses (enum `ReportStatus`)

`SUBMITTED`, `VERIFIED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED`

`CLOSED` and `REJECTED` are final. Nothing leaves them.

## Legal transitions

| From | To | Who may do it | Rules |
| --- | --- | --- | --- |
| (new) | `SUBMITTED` | Any signed-in user | Created by `POST /reports` |
| `SUBMITTED` | `VERIFIED` | ADMIN (own dept), SUPER_ADMIN | Priority must be set (default from category) |
| `SUBMITTED` | `REJECTED` | ADMIN (own dept), SUPER_ADMIN | `note` (reason) required |
| `VERIFIED` | `ASSIGNED` | ADMIN (own dept), SUPER_ADMIN | Needs `assigneeId` of an active STAFF user; sets `dueAt` from SLA |
| `ASSIGNED` | `ASSIGNED` | ADMIN, SUPER_ADMIN | Reassign: new `assigneeId`, logged in history |
| `ASSIGNED` | `IN_PROGRESS` | Assignee, ADMIN, SUPER_ADMIN | |
| `IN_PROGRESS` | `RESOLVED` | Assignee, ADMIN, SUPER_ADMIN | At least one `AFTER` photo required; sets `resolvedAt` |
| `RESOLVED` | `CLOSED` | Reporter (confirm), or system | System auto-closes 7 days after `resolvedAt` if not reopened |
| `RESOLVED` | `IN_PROGRESS` | Reporter (own report), ADMIN, SUPER_ADMIN | Reopen; `note` required; clears `resolvedAt` |

Any other transition returns `409 INVALID_TRANSITION`.

Each transition, in ONE database transaction:
1. Validates actor role, scope and the rules above.
2. Updates `Report` (status, assignment, timestamps).
3. Inserts a `StatusHistory` row (`fromStatus`, `toStatus`, `changedById`, `note`).
4. Inserts an `AuditLog` row.
5. After the transaction commits, queues the notification email. Email failure must never roll back or block the transition.

## Priority (enum `Priority`) and SLA defaults

Suggested defaults — confirm with the head of maintenance. Store in `src/lib/sla.ts` as one constant table so they are easy to change.

| Priority | Examples | First response (VERIFIED or REJECTED) | Target resolution (RESOLVED) |
| --- | --- | --- | --- |
| `CRITICAL` | Exposed wiring, gas smell, broken stair rail | 2 hours | 24 hours |
| `HIGH` | No water, broken door lock, flooding | 1 working day | 3 working days |
| `NORMAL` | Broken bench, cracked tile, faulty fan | 1 working day | 5 working days |
| `LOW` | Peeling paint, cosmetic damage | 3 working days | 10 working days |

- Working days: Monday to Saturday excluding holidays in the `Holiday` table (v1: Monday to Friday is acceptable if the table is empty; note this in the task summary).
- `dueAt` = assignment time + target resolution.
- A report is **overdue** when `dueAt < now` and status is not `RESOLVED`, `CLOSED` or `REJECTED`. Overdue is computed in queries, not stored.
- Priority is suggested from the category's `defaultPriority` and can be changed by an admin until the report is `RESOLVED`.

## Notifications (MVP)

| Event | Recipient | Channel |
| --- | --- | --- |
| Report submitted | Reporter (confirmation), admins of the department | Email |
| `VERIFIED`, `REJECTED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` | Reporter | Email |
| `ASSIGNED` | Assignee (new task), Reporter | Email |
| Reopened | Assignee and admins of the department | Email |

Email content: ticket ID, new status, short note if any, link to `/reports/[id]`. Plain, short, no images. Templates live in `src/lib/email/templates/`.

v1.1 adds SLA breach escalation to admins and rating requests after `RESOLVED`.

## Scheduled jobs (cron endpoints, secured with `CRON_SECRET`)

- `POST /api/cron/auto-close` (daily): close `RESOLVED` reports older than 7 days (actor = system).
- v1.1: `POST /api/cron/sla` (hourly): notify admins of reports about to breach or already overdue.

## Duplicate handling (v1.1)

Same `locationId` and `categoryId` within 7 days and not final → show "already reported" with a link and a "follow" option instead of creating a new report. Admins can also mark a report as duplicate by rejecting with a reason and setting `duplicateOfId`.
