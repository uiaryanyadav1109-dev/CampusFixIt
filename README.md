# CampusFixIt

Campus Property Damage Reporting and Tracking System. A responsive website where students, staff and faculty report damaged campus property in under a minute. Admins triage and assign reports, maintenance staff fix them, and everyone can track progress. Next.js, TypeScript, PostgreSQL, Prisma.

## Tech Stack

- **Framework:** Next.js (App Router), TypeScript (strict mode)
- **UI:** Tailwind CSS, shadcn/ui, lucide-react icons
- **Forms & Validation:** React Hook Form, Zod
- **Auth:** Auth.js (NextAuth) with Google and Microsoft SSO
- **Database:** PostgreSQL with Prisma ORM
- **Object Storage:** Cloudflare R2 / AWS S3 (signed URLs)
- **Email:** Resend
- **Testing:** Vitest, Playwright, axe-core

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env` and fill in the required variables:

```bash
cp .env.example .env
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Available Commands

```bash
npm run dev          # local dev server on http://localhost:3000
npm run lint         # ESLint check
npm run typecheck    # TypeScript compiler check
npm run test         # Vitest unit & API integration tests
npm run test:e2e     # Playwright end-to-end tests
npm run build        # Production build
npm run db:migrate   # Prisma migrate dev
npm run db:seed      # Seed initial data
npm run db:studio    # Prisma Studio GUI
```

## Continuous Integration

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request to `main`, and can also be triggered manually (`workflow_dispatch`). It executes:
1. **Dependency Installation:** Reproducible `npm ci` with Node 20 LTS and npm caching.
2. **Security Audit:** `npm audit --omit=dev` to verify zero production vulnerabilities.
3. **Linting:** `npm run lint` (ESLint).
4. **Type Checking:** `npm run typecheck` (`tsc --noEmit`).
5. **Testing:** `npm run test` (Vitest).
6. **Production Build:** `npm run build` (`next build`).

## Documentation

Full project specifications are maintained in the `docs/` directory:
- [PRD](docs/PRD.md)
- [Workflow & Statuses](docs/WORKFLOW.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data Model](docs/DATA_MODEL.md)
- [API Specification](docs/API_SPEC.md)
- [UI Guidelines](docs/UI_GUIDELINES.md)
- [Security & Privacy](docs/SECURITY.md)
- [Testing Strategy](docs/TESTING.md)
- [Build Tasks](docs/TASKS.md)

## License

[MIT](LICENSE)
