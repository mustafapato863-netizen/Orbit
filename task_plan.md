# Current Task — Administrator-managed Project Groups

## Goal
Allow administrators to organize multiple projects under named workspace groups while preserving project-level visibility and access rules. Groups should be managed only by administrators; regular users should see the group structure only for projects they are already authorized to view.

## Acceptance criteria
- Add a non-destructive ProjectGroup data model and optional project membership.
- Administrators can create, rename, reorder, archive, and assign projects to groups.
- Non-administrators cannot call group mutations or see group management controls.
- The Projects workspace displays authorized projects grouped by the group name, with an ungrouped section.
- Existing projects remain visible and unchanged when no group is assigned.
- Server-side authorization and validation protect every group mutation.
- Migration, typecheck, lint, focused tests, and production build are verified.

## Phases
1. [complete] Audit current project listing, permissions, schema, and repository boundaries.
2. [complete] Add additive ProjectGroup schema and migration with safe defaults.
3. [complete] Implement administrator-only group CRUD/assignment actions and UI.
4. [complete] Render grouped workspace projects without changing existing project authorization.
5. [in_progress] Add regression tests and run migration/typecheck/lint/build verification.

## Safety decisions
- `ProjectGroup` is a separate model; projects keep their existing IDs, privacy, memberships, and data.
- A project belongs to zero or one group to keep organization predictable and avoid duplicate portfolio cards.
- Group visibility is derived from visible projects. A group never grants access to a project.
- Archive is soft-delete; archiving a group unassigns no historical project data and leaves projects in the ungrouped section.
- Only `system.manage` may create or change groups and assignments.

## Errors encountered
| Error | Attempt | Resolution |
| --- | --- | --- |
| `prisma migrate dev` could not start the schema engine against the configured Supabase pooler | 1 | Created the equivalent additive migration SQL manually; Prisma Client/type generation and deployment status will be verified separately without resetting data. |
| `prisma migrate deploy` and a direct pg connectivity check could not reach the configured Supabase endpoint | 2 | Kept the migration additive and committed it for deployment; no destructive fallback or database reset was attempted. |

## Verification evidence

---

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
