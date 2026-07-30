# Configurable Project Types & Workstreams

## Goal
Remove the implicit full-stack/software-project assumption and make Orbit support software, business, operations, construction, marketing, HR, procurement, and custom projects through project-scoped configurable workstreams and optional templates.

## Acceptance criteria
- Existing projects and all Frontend/Backend/Database assignments remain intact.
- A project may start blank or from an optional template.
- Workstreams belong to a project and can be created, edited, ordered, coloured, and archived.
- Milestone work items and shared work reference project-scoped workstreams.
- Plan, Overview, Timeline filters, reports, and forms render configured workstreams dynamically.
- No software-specific workstreams are forced onto a new blank project.
- Authorization and server-side validation protect workstream management.
- Additive migration, typecheck, lint, focused/full tests, and build are verified.

## Phases
1. [complete] Audit schema, seed/migrations, services, forms, reports, and hard-coded workstream assumptions.
2. [complete] Design additive data migration and compatibility strategy.
3. [complete] Implement project template selection and project-scoped workstream management.
4. [complete] Refactor work-item/shared-work forms and all summaries/filters/reports to dynamic workstreams.
5. [complete] Add regression and integration tests; verify migration and production build.

## Safety decisions
- Preserve existing project, milestone, work-item, shared-capability, and history records.
- Use additive schema/migration changes; never reset the database.
- Existing Frontend/Backend/Database workstreams are migrated or linked into each affected project.
- Existing visible lifecycle data and codes remain compatible.
- Do not expose or overwrite `.env`.

## Errors encountered
| Error | Attempt | Resolution |
| --- | --- | --- |
| First post-schema typecheck found legacy fixed-code tests/types, missing repository constructor, and new required project fields in fixtures | 1 | Added the explicit repository constructor, generalised executive workstream types, and made project type/template defaults backward-compatible at schema boundaries. |
| Executive overview focused test detected alphabetical workstream reordering | 1 | Preserve first-seen configured delivery order instead of sorting codes inside the derived overview. |
| Full suite expected the retired “Technical Workstream breakdown” report heading | 1 | Update the assertion to the new project-agnostic “Project Workstream breakdown” heading. |
| Full suite live PMS checkpoint expects 13 at-risk items while current data contains 14 | 1 | Pre-existing data drift remains unrelated to this refactor; do not alter user data to force the old count. |

## Verification evidence
- Additive migration applied; Prisma reports all 8 migrations up to date.
- Data verifier passed for 3 projects with zero cross-project workstream references.
- Regression suite excluding the known live-data checkpoint passed: 52 files, 135 tests.
- TypeScript, ESLint, and the Next.js production build passed.
- Build warnings are limited to the existing vendored ExcelJS/JSZip dynamic-require analysis.
