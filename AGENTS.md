You are a Principal Full-Stack Engineer, Software Architect, Database Architect, Senior UI/UX Designer, QA Engineer, and DevOps Engineer.

You are working on a newly created Next.js project that will replace an older local project-management prototype.

Your task is to inspect the attached project ZIP and build a complete, production-quality project-management application called:

Orbit Project Manager

Do not return only recommendations, snippets, mockups, or a partial implementation.

Implement the working application, validate it, test it, and return the complete updated project as a ZIP.

============================================================
CONFIRMED TECHNOLOGY STACK
============================================================

Use:

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma ORM
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Zod
- React Hook Form
- TanStack Table
- PptxGenJS
- ExcelJS
- Vitest
- React Testing Library
- Playwright

Use one full-stack Next.js application.

Do not create a separate frontend repository and backend repository.

Use Next.js for:

- Frontend pages and components
- Server Actions or Route Handlers
- Authentication
- Database operations
- Report generation
- File downloads

Database:

- PostgreSQL
- Local database name: project_management
- Local host: localhost
- Default port: 5432
- Database user: postgres

============================================================
ENVIRONMENT AND SECRET MANAGEMENT
============================================================

The project uses one secret environment file only:

.env

Do not create or use:

- .env.local
- .env.development
- .env.production
- Multiple secret environment files

All application secrets and environment-dependent configuration must be read from:

process.env

The user will add the real PostgreSQL password manually after receiving the project.

Do not ask for, generate, guess, expose, log, or hardcode the PostgreSQL password.

Do not overwrite an existing .env file.

If `.env` is absent, create it only with safe placeholders:

DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/project_management?schema=public"

AUTH_SECRET="REPLACE_WITH_A_SECURE_RANDOM_VALUE"

NEXT_PUBLIC_APP_NAME="Orbit Project Manager"

APP_URL="http://localhost:3000"

Also create:

.env.example

The `.env.example` file must contain the same variable names with placeholders only.

Ensure `.env` is included in `.gitignore`.

Never include real secrets in:

- Source code
- Git history
- Test snapshots
- Console output
- Error responses
- Generated reports
- README examples

Add server-side environment validation using Zod.

Create a reusable environment module such as:

src/lib/env.ts

The application must fail early with a clear message when required environment variables are missing.

Do not expose server-only variables to client components.

Only variables beginning with NEXT_PUBLIC_ may be used in browser code.

============================================================
FIRST STEP — REPOSITORY AUDIT
============================================================

Before implementation:

1. Inspect the complete repository.
2. Read:
   - package.json
   - package-lock.json
   - tsconfig.json
   - next.config.*
   - eslint configuration
   - Tailwind configuration
   - src/app
   - src/components
   - public
   - existing environment examples
3. Identify the installed Next.js version.
4. Identify whether Tailwind and shadcn/ui are already configured.
5. Identify whether the project uses src/ or root-level app/.
6. Preserve the project’s valid existing configuration.
7. Do not downgrade packages without evidence.
8. Do not rewrite working configuration unnecessarily.
9. Create a backup folder before major replacement:

backup_before_orbit_implementation/

Do not include:

- node_modules
- .next
- real .env
- generated cache files

in the final ZIP.

============================================================
PRODUCT VISION
============================================================

Orbit is a project command centre that allows management to understand:

- What business capability is being delivered
- Which technical area is responsible
- What stage each item has reached
- What is complete
- What is blocked
- What is due next
- What decisions management must make
- Whether the project is ready for Pilot, UAT, or Production

The application must remain simple enough for management while retaining detailed technical execution data.

============================================================
CORE INFORMATION MODEL
============================================================

The application represents one Project containing:

Business Milestones
├── Milestone-Specific Work Items
└── Shared Technical Capabilities

Technical workstreams:

- Frontend
- Backend
- Database

Delivery stages:

1. Not Started
2. In Development
3. Technical Verification
4. Business UAT
5. Staging
6. Controlled Pilot
7. Production

Release horizons:

- Release 1
- Phase 2

Frontend, Backend, and Database are not separate projects.

They are technical workstreams inside the same project.

============================================================
DATABASE DESIGN
============================================================

Create a normalized Prisma schema.

Required models should include, where appropriate:

User
Account
Session
Role
Permission
UserRole
Project
ProjectMember
Milestone
WorkItem
SharedCapability
MilestoneSharedCapability
Workstream
WorkItemWorkstream
DeliveryStage
DeliveryStageHistory
Risk
Decision
Comment
Attachment
PilotScope
PilotTeam
PilotCriterion
ReportSnapshot
AuditLog

Use proper:

- Primary keys
- Foreign keys
- Unique constraints
- Indexes
- Created timestamps
- Updated timestamps
- Soft-delete or archival strategy where appropriate

Use database enums where stable and useful.

Recommended enums:

ProjectStatus
MilestoneStatus
WorkItemStatus
RiskLevel
DeliveryStageCode
WorkstreamCode
ReleaseHorizon
DecisionStatus
MembershipRole

Do not store arrays of IDs in text fields when relational tables are appropriate.

Do not duplicate shared capabilities under multiple milestones.

A Shared Capability must be stored once and linked through a join table.

============================================================
CORE RELATIONSHIPS
============================================================

Project:

- Has many Business Milestones
- Has many members
- Has risks
- Has decisions
- Has Pilot scope
- Has report snapshots

Milestone:

- Belongs to one Project
- Has Milestone-Specific Work Items
- Has Shared Capability links
- Has risk, progress, dates, release horizon, and delivery status

Work Item:

- Belongs to a Milestone
- Has one Primary Workstream
- May have Supporting Workstreams
- Has a Delivery Stage
- Has stage history
- Has owner, dates, progress, status, and notes

Shared Capability:

- Is defined once
- Can be linked to many Milestones
- Has one Primary Workstream
- May have Supporting Workstreams
- Has status, progress, dates, stage, owner, risk, and blockers

============================================================
MIGRATIONS
============================================================

Configure Prisma correctly for PostgreSQL.

Required commands must work:

npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio

Create an initial migration.

Do not execute destructive reset commands against an unknown database.

Do not use:

prisma migrate reset

unless working only against an explicitly disposable test database.

Create a safe seed script.

The seed must be idempotent where practical.

============================================================
AUTHENTICATION AND AUTHORIZATION
============================================================

Implement secure authentication.

Roles:

- Administrator
- Project Manager
- Technical Lead
- Reviewer
- Viewer

Minimum permissions:

Administrator:
- Full system access

Project Manager:
- Create and update projects
- Manage milestones and work items
- Manage risks and decisions
- Export reports

Technical Lead:
- Update assigned technical tasks
- Update progress and delivery stage
- Add technical comments

Reviewer:
- Review milestones
- Record decisions
- Approve or reject Pilot and UAT criteria

Viewer:
- Read-only access

Implement project membership and project-level authorization.

Never rely only on hiding UI buttons.

Every server action and API endpoint must enforce authorization.

============================================================
MAIN APPLICATION AREAS
============================================================

Build these pages:

1. Authentication
2. Workspace / Project List
3. Project Executive Overview
4. Delivery Pipeline
5. Business Milestones
6. Technical Workstreams
7. Shared Capabilities
8. Risks & Decisions
9. Controlled Pilot
10. Reports & Exports
11. Users & Access
12. Settings

============================================================
DESIGN SYSTEM
============================================================

Create a polished SaaS interface inspired by:

- Linear
- Vercel
- Stripe Dashboard
- Notion
- Modern enterprise roadmap tools

Do not copy any brand directly.

Use:

- Dark navy sidebar
- Clean white/light content area
- Soft grey page background
- Consistent cards
- Compact spacing
- Clear hierarchy
- Accessible colours
- Subtle borders and shadows
- Clear status pills
- Responsive layouts

Technical workstream colours:

Frontend:
- Blue

Backend:
- Green

Database:
- Orange

Phase 2:
- Purple

Statuses:

Completed:
- Green

In Progress:
- Blue

At Risk:
- Amber

Blocked:
- Red

Not Started:
- Grey

Do not communicate meaning using colour alone.

Always use text, icon, badge, or label.

============================================================
RESPONSIVE BEHAVIOUR
============================================================

Desktop:

- Permanent sidebar
- Full executive dashboard
- Expandable roadmap
- Full tables

Tablet:

- Collapsed sidebar
- Two-column summary cards
- Horizontally scrollable timeline within its own container
- Sticky task-name column

Mobile:

- Drawer navigation
- Cards instead of wide tables
- Vertical delivery journey
- One expanded milestone at a time
- No page-level horizontal overflow

============================================================
PROJECT EXECUTIVE OVERVIEW
============================================================

The default project page must be concise.

Show:

- Project name
- Description
- Overall status
- Overall progress
- Project start and target dates
- Release 1 status
- Phase 2 status
- Total milestones
- High-risk items
- Blocked items
- Current release gate
- Recommended next release
- Upcoming due items
- Main blockers
- Workstream summary

Do not display all Work Items on the initial page.

Use:

Overview first.
Details on demand.

============================================================
DELIVERY PIPELINE
============================================================

Create a roadmap similar in clarity to a modern product-delivery pipeline.

Stages:

Not Started
→ In Development
→ Technical Verification
→ Business UAT
→ Staging
→ Controlled Pilot
→ Production

At the top show:

- Total Work Packages
- Not Started
- In Development
- Under Technical Verification
- Under UAT
- In Staging
- In Controlled Pilot
- In Production
- At Risk

Add:

- Stage distribution bar
- Next Start
- Next Development Complete
- Next Verification Complete
- Next UAT Approval
- Next Staging Release
- Next Pilot Gate
- Next Production Release

============================================================
PIPELINE SIMPLIFICATION
============================================================

Do not render all tasks expanded.

Initial state:

- Show the Business Milestones only.
- Collapse all milestones by default.
- Allow only one expanded milestone at a time.

Each collapsed milestone row shows:

- Milestone name
- Progress
- Risk
- Current Delivery Stage
- Next Gate
- Due date
- Specific Work Item count
- Shared Dependency count
- Dominant Workstream
- Frontend, Backend, and Database counts

When expanded, show:

A. Milestone-Specific Work  
B. Shared Dependencies

Do not repeat full Shared Capability details under every Milestone.

Use compact references for shared dependencies.

============================================================
WORK-ITEM DELIVERY JOURNEY
============================================================

Each Work Item must show one clear stage journey.

Show:

- Completed stages
- Current stage
- Next gate
- Future stages

Avoid scattered and repetitive badges.

A row should prioritise:

1. Work Item name
2. Current Stage
3. Progress
4. Next Gate
5. Due date
6. Primary Workstream
7. Risk or blocker

Move secondary details into an expandable drawer:

- Supporting Workstreams
- Full notes
- Owner
- Start date
- Stage history
- Comments
- Acceptance criteria

============================================================
SHARED CAPABILITIES
============================================================

Create canonical Shared Capabilities such as:

- Authentication & Session Security
- RBAC & Scope Enforcement
- Period & Configuration Resolution
- Frontend Release Packaging
- Shared Export Framework
- Common UI States & Responsive Design
- Audit & Historical Records
- Database Versioning & Migration Integrity
- Release Verification Suite
- Security & Environment Controls
- Monitoring, Backup & Recovery
- File and Attachment Management
- Notification Framework

A Shared Capability:

- Is stored once
- May affect several Milestones
- Is counted once globally
- Is shown as a dependency under linked Milestones
- Keeps one progress value and one stage
- Has one canonical edit page

Do not merge tasks merely because their names are similar.

Only consolidate tasks when they share:

- The same technical objective
- The same implementation output
- The same lifecycle
- Compatible acceptance criteria
- The same primary technical ownership

============================================================
BUSINESS MILESTONES
============================================================

Each Business Milestone page or expanded panel must show:

- Business purpose
- Status
- Progress
- Risk
- Start date
- Due date
- Current stage
- Next gate
- Dominant Workstream
- Specific Work
- Shared Dependencies
- Delivered scope
- Remaining scope
- Current blockers
- Next action
- First-release impact
- Comments
- Activity history

============================================================
TECHNICAL WORKSTREAMS
============================================================

Create three workstream views:

Frontend
Backend
Database

Each workstream view shows:

- Related unique tasks
- Primary tasks
- Supporting tasks
- Completed
- In progress
- Blocked
- Pending
- Average progress
- Upcoming due items
- Current blockers
- Related Business Milestones

Do not double-count tasks in global project totals.

A multi-workstream item counts:

- Once globally
- Once as Primary in its Primary Workstream
- As Supporting in other related Workstreams

============================================================
RISKS AND DECISIONS
============================================================

Risk fields:

- Title
- Description
- Related Project
- Related Milestone
- Related Work Item or Shared Capability
- Primary Workstream
- Probability
- Impact
- Severity
- Owner
- Mitigation
- Due date
- Status
- Comments

Decision fields:

- Title
- Description
- Related Milestone
- Affected Workstreams
- Required by date
- Recommended direction
- Decision owner
- Status
- Decision text
- Comment
- Decision history

============================================================
CONTROLLED PILOT
============================================================

Create a Controlled Pilot workspace.

Include:

- Pilot teams
- Included capabilities
- Deferred capabilities
- Known limitations
- Pilot users
- Support owner
- Rollback owner
- Entry criteria
- Exit criteria
- Business sign-off
- Technical sign-off
- Issue log
- Final Pilot decision

============================================================
REPORTS AND EXPORTS
============================================================

Implement:

PowerPoint export:
- Executive management presentation
- Business Milestone view
- Technical Workstream view
- Delivery Pipeline
- Risks
- Pilot scope
- Management decisions
- Final recommendation

Excel export:
- Executive Summary
- Milestone Review
- Workstream Review
- Risks & Decisions
- Pilot Scope Review
- Final Feedback and Sign-off

Use:

PptxGenJS
ExcelJS

Do not manually build PPTX using raw XML unless absolutely required.

Generated files must contain no secrets.

============================================================
AUDIT LOGGING
============================================================

Record important changes:

- Project creation and updates
- Milestone changes
- Work Item changes
- Shared Capability links
- Delivery Stage changes
- Risk changes
- Decision changes
- Pilot approvals
- User and role changes
- Report generation

Audit entries should include:

- Actor
- Action
- Entity type
- Entity ID
- Before state where appropriate
- After state where appropriate
- Timestamp

Never log:

- Passwords
- Session tokens
- DATABASE_URL
- AUTH_SECRET

============================================================
SEED DATA
============================================================

Create realistic seed data.

Seed:

- One Administrator user
- One Project Manager user
- One Reviewer user
- One Viewer user
- One sample PMS Dashboard project

The PMS sample project must contain these 13 Business Milestones:

1. Core PMS Scoring Engine
2. Team Onboarding & KPI Configuration
3. Upload & Data Operations
4. Employee Performance Workspace
5. Team Performance Dashboard
6. Management Overview & Strategic Performance
7. Trend Analytics & Period Comparisons
8. Insights, Classification & Planning
9. Corrective Actions & Follow-up
10. Reporting, Export & Report Builder
11. Admin, Users & Access Control
12. Testing, Security, Pilot & Production Release
13. AI Insights & Recommendations

Milestones 1–12 belong to Release 1.

Milestone 13 belongs to Phase 2.

Use realistic Frontend, Backend, Database, Shared Capability, status, risk, progress, and date data.

Do not include any real user secrets.

For seeded login credentials, use documented local-development placeholders and force password change where practical.

============================================================
FORMS AND VALIDATION
============================================================

Use:

- React Hook Form
- Zod

Validate on:

- Client for user experience
- Server for security and correctness

Do not trust client validation alone.

Show friendly validation messages.

Protect against:

- Invalid dates
- Progress outside 0–100
- Duplicate IDs
- Invalid relationships
- Unsupported Workstream
- Unsupported Delivery Stage
- Start date after due date
- Empty required names
- Unauthorised updates

============================================================
STATE AND DATA FETCHING
============================================================

Use Server Components where practical.

Use Server Actions or Route Handlers for mutations.

Use TanStack Query only where client-side caching or optimistic updates meaningfully improves the experience.

Do not store permanent project data in:

- Zustand
- localStorage
- Static JSON files

PostgreSQL must be the source of truth.

Local storage may only store UI preferences such as:

- Dark mode
- Active view
- Expanded Milestone
- Timeline zoom
- Selected filters

============================================================
TESTING
============================================================

Add and run tests.

Unit tests:

- Progress calculations
- Workstream counts
- Shared Capability counting
- Delivery Stage transitions
- Risk severity
- Due-date calculations
- Permission checks
- Environment validation

Component tests:

- Milestone collapse and expansion
- Stage filters
- Workstream filters
- Forms
- Tables
- Mobile cards

Integration tests:

- Project creation
- Milestone creation
- Work Item creation
- Shared Capability linking
- Stage transition
- Risk creation
- Decision approval
- Export generation

Playwright end-to-end tests:

- Login
- Create Project
- Open Project
- Expand Milestone
- Update Work Item stage
- Add Risk
- Add Decision
- Configure Pilot
- Export PowerPoint
- Export Excel
- Verify mobile layout
- Verify access restrictions

============================================================
QUALITY COMMANDS
============================================================

Add npm scripts for:

npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio

Before delivery, run:

npm install
npm run prisma:generate
npm run typecheck
npm run lint
npm run test
npm run build

Run Playwright tests when the environment supports them.

Report any command that cannot run and explain why.

============================================================
README
============================================================

Create a complete README containing:

1. Project overview
2. Technology stack
3. Architecture
4. Requirements
5. Installation
6. `.env` configuration
7. PostgreSQL setup
8. Prisma migration
9. Seed data
10. Development server
11. Test commands
12. Production build
13. Report generation
14. User roles
15. Security notes
16. Troubleshooting

Use this setup sequence:

npm install

# Add the real values to .env

npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev

Clearly state:

The user must add their PostgreSQL password manually to `.env`.

Do not include the password in the README.

============================================================
FINAL SECURITY REQUIREMENTS
============================================================

Before final delivery verify:

- `.env` is ignored by Git.
- `.env.example` contains placeholders only.
- No secret is hardcoded.
- No secret is sent to the client.
- No DATABASE_URL appears in browser bundles.
- Error messages do not expose connection strings.
- Logs do not expose tokens or passwords.
- API actions enforce permissions.
- Inputs are server validated.
- Database operations are scoped to authorised Projects.
- Exported files contain no secrets.

============================================================
FINAL OUTPUT
============================================================

Return:

1. Complete updated project ZIP
2. Prisma schema
3. Initial migration
4. Seed data
5. `.env.example`
6. README
7. Implementation summary
8. Database model summary
9. Test results
10. Security verification summary
11. Desktop screenshots
12. Mobile screenshots
13. Sample PowerPoint export
14. Sample Excel review workbook

Do not include:

- node_modules
- .next
- Real `.env`
- Real credentials
- Git history containing secrets

============================================================
FINAL RESPONSE
============================================================

Summarise:

- Architecture implemented
- Files created or changed
- Database models
- Total pages
- Authentication and roles
- Delivery Pipeline implementation
- Shared Capability implementation
- Report exports
- Tests passed
- Build result
- Remaining limitations
- Commands the user must run
- Exact place where the user must enter the PostgreSQL password

Do not return only a plan.

Implement the complete working application.
## Environment and Secret Handling

This project uses one environment file only:

- `.env`

At the beginning of any task that needs configuration:

1. Check whether `.env` exists.
2. Read the required environment variables directly from `.env`.
3. Use existing values without asking the user to provide them again.
4. Never display, echo, print, log, quote, or include secret values in the response.
5. Never copy real secrets into:
   - `.env.example`
   - README files
   - source code
   - tests
   - generated reports
   - Git commits
6. Never replace an existing valid secret unless it is explicitly required.

The `.env` file is intentionally ignored by Git and must remain ignored.

### AUTH_SECRET

If `AUTH_SECRET` is:

- Missing
- Empty
- Equal to a placeholder such as `REPLACE_WITH_A_SECURE_RANDOM_VALUE`

generate a secure value automatically using Node.js:

```bash
node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64url'))"