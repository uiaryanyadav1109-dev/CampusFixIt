# DATA_MODEL — Prisma schema and rules

Database: PostgreSQL. ORM: Prisma. All ids are UUIDs. All tables have `createdAt` and `updatedAt`. Times are stored in UTC.

If you change this schema: create a migration (`npm run db:migrate`), update `prisma/seed.ts` if needed, and update this file in the same change.

## Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  REPORTER
  STAFF
  ADMIN
  SUPER_ADMIN
}

enum ReportStatus {
  SUBMITTED
  VERIFIED
  ASSIGNED
  IN_PROGRESS
  RESOLVED
  CLOSED
  REJECTED
}

enum Priority {
  CRITICAL
  HIGH
  NORMAL
  LOW
}

enum MediaKind {
  BEFORE
  AFTER
}

model Department {
  id         String     @id @default(uuid())
  name       String     @unique
  isActive   Boolean    @default(true)
  users      User[]
  categories Category[]
  reports    Report[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}

model User {
  id            String      @id @default(uuid())
  name          String
  email         String      @unique
  emailVerified DateTime?
  image         String?
  role          Role        @default(REPORTER)
  departmentId  String?
  department    Department? @relation(fields: [departmentId], references: [id])
  isActive      Boolean     @default(true)

  reportsCreated Report[]       @relation("ReportReporter")
  reportsAssigned Report[]      @relation("ReportAssignee")
  assignmentsMade Assignment[]  @relation("AssignedBy")
  assignments    Assignment[]   @relation("AssignedTo")
  statusChanges  StatusHistory[]
  comments       Comment[]
  auditEntries   AuditLog[]

  accounts Account[]
  sessions Session[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([role])
}

// Auth.js adapter tables
model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Location {
  id        String   @id @default(uuid())
  building  String
  floor     String
  room      String
  qrToken   String   @unique @default(uuid())   // used by v1.1 QR codes
  isActive  Boolean  @default(true)
  reports   Report[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([building, floor, room])
  @@index([building])
}

model Category {
  id                  String      @id @default(uuid())
  name                String      @unique
  defaultPriority     Priority    @default(NORMAL)
  defaultDepartmentId String?
  defaultDepartment   Department? @relation(fields: [defaultDepartmentId], references: [id])
  isActive            Boolean     @default(true)
  reports             Report[]
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
}

model Report {
  id           String       @id @default(uuid())
  ticketNo     String       @unique            // CPD-2026-00042
  reporterId   String
  reporter     User         @relation("ReportReporter", fields: [reporterId], references: [id])
  categoryId   String
  category     Category     @relation(fields: [categoryId], references: [id])
  locationId   String
  location     Location     @relation(fields: [locationId], references: [id])
  departmentId String?                         // copied from category at creation; scopes ADMIN access
  department   Department?  @relation(fields: [departmentId], references: [id])
  description  String
  priority     Priority     @default(NORMAL)
  status       ReportStatus @default(SUBMITTED)
  isAnonymous  Boolean      @default(false)    // v1.1; keep false in MVP
  assigneeId   String?
  assignee     User?        @relation("ReportAssignee", fields: [assigneeId], references: [id])
  dueAt        DateTime?                       // set on ASSIGNED from SLA
  resolvedAt   DateTime?
  closedAt     DateTime?
  duplicateOfId String?
  duplicateOf  Report?      @relation("Duplicates", fields: [duplicateOfId], references: [id])
  duplicates   Report[]     @relation("Duplicates")

  media        ReportMedia[]
  assignments  Assignment[]
  history      StatusHistory[]
  comments     Comment[]
  feedback     Feedback?                       // v1.1

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([reporterId])
  @@index([assigneeId])
  @@index([departmentId, status])
  @@index([locationId, categoryId, createdAt])
  @@index([dueAt])
}

model ReportMedia {
  id        String    @id @default(uuid())
  reportId  String
  report    Report    @relation(fields: [reportId], references: [id], onDelete: Cascade)
  key       String                              // object storage key, NOT a public URL
  kind      MediaKind @default(BEFORE)
  mimeType  String
  sizeBytes Int
  uploadedById String
  createdAt DateTime  @default(now())

  @@index([reportId])
}

model Assignment {
  id           String   @id @default(uuid())
  reportId     String
  report       Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  assigneeId   String
  assignee     User     @relation("AssignedTo", fields: [assigneeId], references: [id])
  assignedById String
  assignedBy   User     @relation("AssignedBy", fields: [assignedById], references: [id])
  dueAt        DateTime
  createdAt    DateTime @default(now())

  @@index([assigneeId])
}

model StatusHistory {
  id          String        @id @default(uuid())
  reportId    String
  report      Report        @relation(fields: [reportId], references: [id], onDelete: Cascade)
  fromStatus  ReportStatus?                       // null for the first entry
  toStatus    ReportStatus
  changedById String?                             // null = system (auto-close)
  changedBy   User?         @relation(fields: [changedById], references: [id])
  note        String?
  createdAt   DateTime      @default(now())

  @@index([reportId, createdAt])
}

model Comment {
  id         String   @id @default(uuid())
  reportId   String
  report     Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  body       String
  isInternal Boolean  @default(false)             // internal = admins and staff only
  createdAt  DateTime @default(now())

  @@index([reportId, createdAt])
}

model Feedback {                                  // v1.1
  id        String   @id @default(uuid())
  reportId  String   @unique
  report    Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  rating    Int                                   // 1 to 5
  comment   String?
  createdAt DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(uuid())
  actorId   String?
  actor     User?    @relation(fields: [actorId], references: [id])
  action    String                                // e.g. "report.status_changed", "user.role_changed"
  entity    String                                // e.g. "Report", "User"
  entityId  String
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([entity, entityId])
  @@index([createdAt])
}

model Holiday {
  id   String   @id @default(uuid())
  date DateTime @unique @db.Date
  name String
}

model TicketCounter {                             // one row per year, incremented in a transaction
  year  Int @id
  value Int @default(0)
}
```

## Rules

- **Ticket numbers**: `CPD-<year>-<5-digit zero-padded counter>`. Increment `TicketCounter` inside the same transaction that creates the report (use `upsert` + `update ... increment`) so numbers never collide.
- **Department scope**: `Report.departmentId` is copied from `Category.defaultDepartmentId` at creation. An ADMIN may access a report only if `report.departmentId === admin.departmentId`. SUPER_ADMIN ignores department.
- **Media**: store the storage `key` only. Generate short-lived signed GET URLs when rendering. Never store or return permanent public URLs.
- **Soft deactivate** users, locations, categories and departments with `isActive = false`. Never hard-delete rows that reports reference.
- **History is append-only**: never update or delete `StatusHistory` or `AuditLog` rows.
- **Anonymous reports** (`isAnonymous`) are v1.1. In MVP always `false`. When enabled, API responses for non-SUPER_ADMIN users must omit `reporter`.
- **Indexes** above support the admin list filters and the staff task list. Add an index only with a reason.
- **Seed** (`prisma/seed.ts`): one SUPER_ADMIN (email from env `SEED_SUPER_ADMIN_EMAIL`), 3 departments, 8 categories (Electrical, Plumbing, Furniture, Civil, Lab equipment, IT and network, Sanitation, Other), and 10 sample locations. Seed must be idempotent.
