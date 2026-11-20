# UI_GUIDELINES — Pages, components, design and accessibility

## Principles

- **Mobile first.** Most reporters use a phone. Design at 360 px wide first, then scale up. The report form must be usable one-handed.
- **Calm and plain.** One accent colour, lots of white space, no decoration. Use shadcn/ui components on Tailwind CSS; do not hand-roll components that shadcn/ui provides.
- **Fast.** The report form is the most important screen. Keep it to four short steps with large tap targets.
- **Clear status.** A report's status and next step must be obvious on every screen that shows it.

## Pages

| Route | Who | Content |
| --- | --- | --- |
| `/login` | Everyone | "Sign in with Google" and "Sign in with Microsoft" buttons, one line explaining campus email is required, link to privacy notice |
| `/report/new` | Signed in | 4-step form (below) |
| `/my-reports` | Signed in | Cards on mobile, table on desktop. Status filter. Empty state: "You have not reported anything yet" with a button |
| `/reports/[id]` | Participants | Header (ticket no, status chip, priority), photos, details, timeline, comments; action buttons depend on role and status |
| `/staff/tasks` | STAFF | Task cards sorted by due date, overdue first; one-tap "Start work" and "Mark resolved" |
| `/admin` | ADMIN, SUPER_ADMIN | Summary tiles: New, Overdue, In progress, Resolved this week; recent reports list |
| `/admin/reports` | ADMIN, SUPER_ADMIN | Filterable table, pagination, row click opens detail, bulk assign |
| `/admin/analytics` | ADMIN, SUPER_ADMIN | Charts by status, category, building; median resolution time; period selector; CSV export |
| `/admin/settings` | SUPER_ADMIN | Tabs: Users, Departments, Locations, Categories |

Route protection: middleware redirects signed-out users to `/login`, and role-restricted pages return `404` for users without access.

## Report form (`/report/new`)

| Step | Fields | Notes |
| --- | --- | --- |
| 1. What | Category (large selectable tiles with icons) | One tap to choose |
| 2. Where | Building → Floor → Room (cascading selects with search) | Remember last used building in `localStorage` |
| 3. Details | Photos (camera or gallery, up to 5), description (10 to 1000 chars), urgency (Normal, Urgent) | Show thumbnails with remove button; show upload progress; compress to about 1 MB in the browser |
| 4. Review | Summary of all inputs, Submit button | Disable submit while uploading; show success screen with ticket number |

Rules: progress indicator ("Step 2 of 4"); Back never loses input; validation messages appear next to the field, in plain words; on network failure show a retry button and keep the form data.

## Status chips

| Status | Label | Colour token |
| --- | --- | --- |
| `SUBMITTED` | Submitted | neutral grey |
| `VERIFIED` | Verified | blue |
| `ASSIGNED` | Assigned | indigo |
| `IN_PROGRESS` | In progress | amber |
| `RESOLVED` | Resolved | green |
| `CLOSED` | Closed | dark grey |
| `REJECTED` | Rejected | red |

Always show the text label and an icon with the colour. Never rely on colour alone. Priority uses a separate small badge: Critical (red), High (orange), Normal (grey), Low (light grey).

## Component rules

- One shared `StatusChip`, `PriorityBadge`, `Timeline`, `PhotoGallery`, `ReportCard`, `EmptyState`, `ErrorState`, `PageHeader` in `src/components/`.
- Every data view has **loading** (skeletons), **empty** and **error** states.
- Buttons: one primary action per screen; destructive actions (reject, deactivate) ask for confirmation with a dialog.
- Forms use React Hook Form with the shared Zod schema; show inline errors; disable the submit button while submitting.
- Tables on desktop become cards on screens under 640 px.
- Toasts for success ("Report submitted"), inline alerts for errors that need action.
- Dates: relative ("2 hours ago") with the full date on hover or in a tooltip; timezone `Asia/Kolkata`.

## Visual style

- Font: Inter (or system UI font stack). Body text 16 px minimum. Headings: 24, 20, 18.
- Spacing: Tailwind scale (4, 8, 12, 16, 24, 32). Cards: `rounded-lg`, 1 px border, no heavy shadows.
- Colours: define as CSS variables in `globals.css`; light theme required, dark theme optional later. One accent (blue by default), semantic colours for status.
- Icons: lucide-react, 20 px, always with text labels on primary actions.

## Accessibility (WCAG 2.1 AA — required)

- All interactive elements reachable and operable by keyboard, with a visible focus ring.
- Tap targets at least 44 × 44 px.
- Text contrast at least 4.5:1 (3:1 for large text and UI components).
- Every form field has a visible `<label>`; errors are linked with `aria-describedby`; required fields are marked in text.
- Photos have meaningful `alt` text (for uploaded damage photos use "Photo 1 of 3 attached to report CPD-...").
- Status changes announced to screen readers (`aria-live="polite"`).
- Respect `prefers-reduced-motion`.
- Run axe in Playwright on every page; zero serious or critical violations.

## Content and tone

- Plain English, short sentences, no jargon. Buttons are verbs: "Submit report", "Assign", "Mark resolved".
- Error messages say what happened and what to do: "We could not upload that photo. Check your connection and try again."
- Email and UI use the same status labels as the table above.

## Performance

- Use `next/image` for images and lazy-load galleries.
- Paginate all lists (25 per page). No unbounded queries.
- Target Lighthouse mobile performance 85 or higher on `/report/new`.
