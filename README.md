# Orbit Project Manager

Orbit Project Manager is a full-stack Next.js application for project delivery governance. The repository currently includes the application foundation, normalized PostgreSQL schema, authentication and authorization, Projects and Business Milestones, the Technical Execution Model, Project Executive Overview, Delivery Pipeline, Technical Workstreams, Risks, Decisions, the Controlled Pilot workspace, and management Reports & Exports.

## Implemented

- Focused, light-only workspace shell with a compact project switcher and responsive shared UI primitives
- PostgreSQL domain schema, Prisma Client singleton, additive migrations, transaction conventions, and idempotent reference seed
- Secure email/password sign-in and sign-out with bcrypt password hashing
- Opaque database-backed sessions; only SHA-256 token hashes are stored
- HttpOnly, SameSite cookies with production-only Secure and `__Host-` protections
- Forced first-login password change and revocation of other sessions after a password change
- Five system roles with stable permission grants and project membership scoping
- Protected workspace routes, Server Action checks, Route Handler checks, and explicit unauthorized/forbidden states
- Users & Access administration for creating accounts, assigning roles, setting project memberships, activating/deactivating accounts, and issuing temporary passwords
- Audit records for authentication events and sensitive access administration
- Optional safe local development accounts, created only when the developer supplies a password
- Authorized workspace project list with project create, view, edit, and archive workflows
- Project-scoped membership management with last-Project-Manager protection
- Ordered Business Milestones classified as Release 1 or Phase 2
- Milestone status, progress, risk, dates, purpose, scope, blockers, next action, and first-release impact
- Project and milestone activity history backed by sanitized audit records
- Milestone-specific Work Items with one Primary Workstream, optional Supporting Workstreams, ownership, execution status, progress, stage, dates, risk, blockers, notes, and acceptance criteria
- Canonical Shared Capabilities stored once per project and linked relationally to multiple Business Milestones with source and dependency references
- Project-level canonical capability list and compact milestone dependency references without duplicate global counts
- Assigned Technical Lead execution updates with server-side ownership enforcement
- PMS Dashboard sample data with the approved 13 Business Milestones, 13 representative Work Items, 11 canonical Shared Capabilities, project-scoped Risk and Decision examples, and the proposed Inbound, Outbound, and Pre-Approvals IP Offshore Pilot teams
- Single project Roadmap Overview matching the management sketch: stage totals, at-risk count, overall distribution, nearest delivery gates, and the delivery timeline in one screen
- Equal-weight Main Milestone planning calculations explicitly labelled as planning indicators rather than earned value
- Canonical Shared Capabilities counted once in executive and Workstream projections regardless of how many Milestones reference them
- Minimal primary navigation; the former Pipeline destination redirects to the canonical project Roadmap Overview instead of duplicating the same delivery data
- Canonical Delivery Pipeline covering all seven stages from Not Started through Production
- Global stage totals, at-risk totals, distribution, and next delivery dates calculated from unique Work Items plus canonical Shared Capabilities
- Single-open Business Milestone roadmap with collapsed management summaries, milestone-specific work, compact Shared Dependencies, clear journey lines, and Work Item detail drawers
- Sticky stage/month headers and task-name column on desktop and tablet, with a vertical delivery journey on mobile
- Dedicated Frontend, Backend, and Database Workstream pages with unique, Primary, Supporting, status, progress, due-item, milestone, and blocker projections
- Project Risk register with Probability, Impact, server-derived Severity, scoped technical relationships, ownership, mitigation, due dates, and status
- Decision log with affected Workstreams, recommendations, accountable ownership, server-authorized Reviewer outcomes, comments, and audited history
- Transactional audit records for Risk and Decision creation, changes, reviews, comments, and archival
- Controlled Pilot workspace with proposed teams, unique Pilot users, canonical capability scope, known limitations, Entry and Exit criteria, accountable support/rollback owners, normalized issues, sign-offs, approval readiness, and final decision
- Reviewer/Administrator-only Pilot approvals and rejections with transactional audit history and server-enforced readiness gates
- Project-scoped PowerPoint reports generated with PptxGenJS and six-sheet Excel Management Review Packs generated with ExcelJS
- One canonical report dataset with Work Item coverage assertions, Shared Capability de-duplication, explicit Primary/Supporting relationships, and `Owner Not Assigned` fallbacks
- Authorized report downloads with versioned `ReportSnapshot` persistence, `report.generated` audit records, pagination, print setup, and server-only secret rejection
- Phase 11 release hardening with global security headers, same-origin report protection, recursive audit redaction, accessible loading/error states, Playwright browser coverage, and repeatable seed verification

Phase 8 conventions are documented in
[`docs/technical-workstreams-risks-decisions.md`](docs/technical-workstreams-risks-decisions.md).

Controlled Pilot conventions are documented in
[`docs/controlled-pilot.md`](docs/controlled-pilot.md).

Reports and export conventions are documented in
[`docs/reports-and-exports.md`](docs/reports-and-exports.md).

The current release decision and evidence are documented in
[`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md). The reviewed build is
**NO-GO** until its production dependency advisories and deployment-specific
operational gates are closed or formally accepted.

## Technology

- Next.js App Router, React 19, and TypeScript
- Tailwind CSS 4 and shadcn/ui conventions
- PostgreSQL and Prisma ORM
- Zod and React Hook Form
- bcryptjs
- PptxGenJS and ExcelJS
- Vitest
- Playwright and axe-core

## Requirements

- Node.js 20.9 or newer
- npm
- PostgreSQL

The expected local database is `project_management` on `localhost:5432` using the `postgres` user.

## Local setup

```bash
npm install
```

Keep one root secret file only: `.env`. If it does not exist, copy `.env.example`; never overwrite an existing `.env`.

The user must enter the PostgreSQL password manually in the root `.env` file:

```text
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/project_management?schema=public"
```

Replace only `YOUR_PASSWORD`. The complete value is server-only and must never be committed or pasted into logs.

Then run:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Local login accounts

No password is embedded in source or seed data. To create the five development accounts, choose a temporary password meeting the application policy and set it manually in `.env`:

```text
SEED_LOCAL_PASSWORD="YOUR_OWN_TEMPORARY_PASSWORD"
```

Run `npm run prisma:seed`, then clear `SEED_LOCAL_PASSWORD` from `.env`. The seed creates these local-only identities:

| Email | Role |
| --- | --- |
| `admin@orbit.local` | Administrator |
| `manager@orbit.local` | Project Manager |
| `lead@orbit.local` | Technical Lead |
| `reviewer@orbit.local` | Reviewer |
| `viewer@orbit.local` | Viewer |

All use the developer-supplied temporary password and must change it before workspace access. Re-running the seed does not overwrite a previously changed password.

See [Authentication and authorization](docs/authentication.md) for the complete security model and role matrix.

## Environment variables

| Variable | Behavior |
| --- | --- |
| `DATABASE_URL` | Required server-only PostgreSQL connection URL |
| `AUTH_SECRET` | Optional and reserved; opaque database sessions do not depend on it |
| `SEED_LOCAL_PASSWORD` | Optional server-only bootstrap value for local development accounts |
| `NEXT_PUBLIC_APP_NAME` | Optional public name; defaults to `Orbit Project Manager` |
| `APP_URL` | Optional server application URL; defaults to `http://localhost:3000` |

Environment validation reports field names without echoing values. Only `NEXT_PUBLIC_` variables may be referenced in browser code.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run lint
npm run test
npm run test:watch
npm run test:e2e
npm run reports:samples
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run verify:seed
npm run prisma:studio
```

`prisma:migrate` applies checked-in migrations in development. `prisma:seed` reconciles stable roles, permissions, the PMS Dashboard sample project, its 13 milestones, milestone-specific Work Items, and canonical Shared Capabilities. It may be run repeatedly without duplicating those records or relationships.

`test:e2e` uses installed Chrome by default. `verify:seed` performs two
non-destructive seed passes and fails if any of 16 tracked entity or relationship
counts changes on the second pass.

## Architecture

```text
app/
  (auth)/             Sign-in and password-change flows
  (workspace)/        Protected project, milestone, and access pages
  api/                Public health and protected session/access handlers
components/
  auth/               React Hook Form authentication forms
  access/             Access administration interface
  projects/           Project forms, membership, milestones, and history
  execution/          Work Item and Shared Capability forms and controls
  layout/             Compact header, brand mark, and focused workspace shell
  ui/                 Shared shadcn-style primitives
lib/
  auth/               Validation, sessions, password, policy, and services
  projects/           Project/milestone validation and transactional services
                      plus read-only executive overview derivations
  execution/          Technical execution validation and transactional services
  pipeline/           Read-only canonical delivery derivations
  reports/            Canonical report projection, exporters, authorization, snapshots, and audit orchestration
  audit/              Sanitized audit writer
  repositories/       Scoped persistence for access, projects, and milestones
  env.ts              Server-only validated environment
  prisma.ts           Server-only Prisma Client singleton
prisma/
  schema.prisma       Normalized domain and session schema
  migrations/         Domain, authentication, and milestone-order migrations
  seed.ts             Idempotent reference, PMS sample, and optional-user seed
docs/
  authentication.md   Session, role, permission, and local-login design
  database-schema.md  Relationships, constraints, and indexes
  projects-and-milestones.md Phase 4 behavior and authorization
  technical-execution-model.md Phase 5 relationships, workflows, and boundary
  project-executive-overview.md Phase 6 metrics, derivation rules, and boundary
  delivery-pipeline.md Phase 7 canonical counting, gates, roadmap, and boundary
  reports-and-exports.md Phase 10 formats, counting, authorization, and security
```

Server Components protect page access. Every Server Action and protected Route Handler independently authenticates and authorizes the request; client-side visibility is never treated as a security boundary.

## Security notes

- `.env` is ignored and `.env.example` contains placeholders only.
- Passwords are bcrypt-hashed at cost 12 and capped at bcrypt's safe 72-byte boundary.
- Session cookies contain a random 256-bit token; the database stores only its SHA-256 hash.
- Sign-in returns a generic invalid-credentials response and throttles repeated failures.
- Deactivation, password reset, and password change revoke applicable sessions.
- The last active Administrator and the current Administrator's own active account are protected from accidental deactivation.
- Audit payloads contain no passwords, session tokens, `DATABASE_URL`, or `AUTH_SECRET`.
- Project permission helpers require both the permission and an active membership, except for full-system Administrators.
- Project, milestone, Work Item, and Shared Capability mutations are server-validated, transactional, scoped, and audited.
- Technical Leads can update execution fields only for records assigned to them; ownership is rechecked inside the database transaction.
- Archival uses `archivedAt` and preserves historical records.
- Report exports are generated server-side from an allowlisted projection, reject secret values, require project-scoped `report.export`, and persist sanitized snapshots and audit metadata only after successful file generation.

## Troubleshooting

- If Prisma reports `DATABASE_URL` is missing, confirm the root `.env` exists and compare variable names with `.env.example` without revealing values.
- If no local account can sign in, set `SEED_LOCAL_PASSWORD`, run `npm run prisma:seed`, and sign in with one of the documented `@orbit.local` accounts.
- If an account is redirected to `/change-password`, the temporary-password requirement is working as designed.
- If access is forbidden, confirm both the user's system role and active project membership.
