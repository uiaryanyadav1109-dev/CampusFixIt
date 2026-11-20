# PRD — Campus Property Damage Reporting and Tracking System

## 1. Problem

Damage on campus is reported by phone, WhatsApp or word of mouth. Reports get lost or duplicated, nobody owns them, and nobody can see how long repairs take.

## 2. Goals

- A reporter submits a report in under 60 seconds on a phone browser.
- Every report has a ticket ID, an owner and a full status history.
- Admins see backlog, overdue items and repeat-damage hotspots.

### Success metrics (measured 90 days after launch)

| Metric | Target |
| --- | --- |
| Median time to submit a report | under 60 seconds |
| Reports acknowledged within 24 hours | 90% |
| Median time to resolve (normal priority) | under 5 working days |
| Reporter satisfaction on resolved tickets | 4.0 of 5 or higher |
| Reports rejected as duplicate or invalid | under 10% |

## 3. Scope

Website only (responsive, mobile first). One web app plus REST API.

### Out of scope for v1

Payments or chargebacks, inventory and procurement, native mobile apps, IoT sensors, vendor invoicing.

## 4. Roles

| Role (enum) | Who | Main needs |
| --- | --- | --- |
| `REPORTER` | Student, staff, faculty | Submit reports, track own reports, get notified |
| `STAFF` | Maintenance staff | See assigned tasks, update status, upload after-photo |
| `ADMIN` | Department or hostel admin | Verify, reject, prioritise, assign, see department reports and analytics |
| `SUPER_ADMIN` | IT or estates head | Everything, plus users, roles, locations, categories |

### Permission matrix

| Capability | REPORTER | STAFF | ADMIN | SUPER_ADMIN |
| --- | --- | --- | --- | --- |
| Submit a report | Yes | Yes | Yes | Yes |
| View own reports | Yes | Yes | Yes | Yes |
| View all reports | No | Assigned only | Own department | All |
| Verify, reject, prioritise | No | No | Yes | Yes |
| Assign to staff | No | No | Yes | Yes |
| Update status, upload after-photo | No | Assigned only | Yes | Yes |
| Reopen a resolved report | Own only | No | Yes | Yes |
| Manage locations, categories, users | No | No | No | Yes |
| Analytics and CSV export | No | No | Department | All |

Sign-in is campus email through Google or Microsoft SSO, restricted to the college domain (`ALLOWED_EMAIL_DOMAIN`). Admin, staff and super-admin roles are granted by a super admin. New sign-ins default to `REPORTER`.

## 5. Features and user stories

### MVP (v1.0) — build this first

- **US-1** As a reporter, I submit a report with category, description, 1 to 5 photos, location (building, floor, room) and urgency, so maintenance knows what and where.
- **US-2** As a reporter, I get a ticket ID and see a status timeline, so I know someone is on it.
- **US-3** As a reporter, I get an email on every status change.
- **US-4** As an admin, I filter, verify, reject, prioritise and assign reports from a dashboard.
- **US-5** As maintenance staff, I see my assigned tasks, change status and upload an after-photo.
- **US-6** As a super admin, I manage users, roles, categories and the building-floor-room list.
- **US-7** As an admin, I see counts by status, category and building, and average resolution time.

### v1.1 (do not build until MVP is accepted)

QR code per room that pre-fills location · duplicate detection (same room and category in last 7 days) · reporter rating after resolution · SLA timers with escalation · anonymous reporting.

### v2 (do not build)

Repair cost tracking and hotspot heatmaps · weekly summary emails · Hindi and a regional language, PWA offline drafts · WhatsApp or SMS notifications.

## 6. Acceptance criteria (MVP)

**US-1 Submit report**
- Form has 4 steps: category, location, photos and description, review and submit.
- Category, location and description are required. Description is 10 to 1000 characters. Photos: 0 to 5 (at least 1 is strongly encouraged, not required in v1).
- Photos accepted: JPEG, PNG, WebP, max 5 MB each; compressed in the browser to about 1 MB before upload; EXIF location data stripped.
- On success the user lands on the report detail page showing ticket ID `CPD-YYYY-NNNNN` and status `SUBMITTED`.
- Works at 360 px width, one-handed.

**US-2 Track**
- `/my-reports` lists only the user's own reports with status chips; filter by status.
- Detail page shows photos, description, location, priority and a timeline from `StatusHistory`.

**US-3 Email**
- An email is sent on every status change, containing ticket ID, new status and a link. Failures are logged and do not block the status change.

**US-4 Admin triage**
- Table filters: status, category, building, priority, date range, overdue.
- Admin can verify, reject (reason required), set priority, assign to one staff member, and reassign.
- ADMIN sees only reports of their own department; SUPER_ADMIN sees all.

**US-5 Staff tasks**
- `/staff/tasks` lists only reports assigned to the signed-in staff member.
- Staff can move `ASSIGNED` → `IN_PROGRESS` → `RESOLVED`. Resolving requires at least one after-photo.

**US-6 Master data**
- Super admin can create, edit and deactivate users (role, department), locations, categories. Deactivated items stay on old reports but cannot be chosen for new ones.

**US-7 Analytics**
- Dashboard shows counts by status, category and building, overdue count, and median resolution time for a selectable period (last 7, 30, 90 days). CSV export of the filtered list.

## 7. Non-functional requirements

- Performance: report form interactive in under 3 seconds on a mid-range phone on 4G; list pages paginate (25 per page).
- Accessibility: WCAG 2.1 AA (see `UI_GUIDELINES.md`).
- Security and privacy: see `SECURITY.md`.
- Browsers: last 2 versions of Chrome, Edge, Safari, Firefox; Android Chrome and iOS Safari.
- Time zone: store UTC, display in `Asia/Kolkata`.

## 8. Open questions for the human (do not guess)

- Which college email domain(s) are allowed?
- Final list of departments, buildings, floors, rooms, categories?
- SLA values in `WORKFLOW.md` are suggested defaults — confirm with the head of maintenance.
- Is any category sensitive enough to hide photos from reporters other than the owner?
