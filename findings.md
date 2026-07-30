# Findings

## Configurable project types and workstreams request (2026-07-30)
- The current Plan screen exposes Frontend, Backend, and Database as if every project were a software/full-stack project.
- The new target is project-agnostic: each project can use a blank setup or an optional starting template, and workstreams are configurable per project.
- Existing records must remain unchanged in meaning; current software workstreams need a compatibility migration rather than deletion or enum repurposing.
- This task requires an additive schema/API/UI/report refactor because presentation-only relabeling cannot provide real project-scoped workstream CRUD.
- `Workstream` is currently global: `code` is a three-value Prisma enum and globally unique, with no `projectId`.
- Work items, shared work, risks, and decisions reference the global workstream IDs; new projects therefore inherit software vocabulary even when they contain no delivery data.
- Execution setup queries all active workstreams globally, which can expose unrelated workstreams across projects and makes server validation project-agnostic.
- Workstream detail routing is hard-coded to `/frontend`, `/backend`, and `/database`.
- Reports and pipeline calculations contain fixed three-code loops and must be converted to derive unique configured workstreams from the selected project.
- Safe target schema: add `Workstream.projectId`, replace enum code with a project-local string code, add a unique project-local slug/name/code, sort order, icon key, and archival state.
- The compatibility migration must duplicate each legacy global workstream once per project that uses it, then rewire primary/supporting work-item, shared-work, risk, and decision relations before removing the global rows/enum constraint.
- Project type should be descriptive and extensible rather than driving permissions or lifecycle. Application templates can create initial workstreams while a blank/custom project creates none.
- The applied migration produced one project-owned Frontend/Backend/Database set for the existing PMS project; the other existing empty projects correctly remain blank.
- Cross-project verification found zero invalid primary Work Item, Shared Work, Risk, or Decision relationships after reassignment.
- Execution and governance validation now scopes accepted workstream IDs to the selected project, preventing cross-project assignment even if a client submits another project's ID.

## User project access and private projects request (2026-07-30)
- Administrators need to choose project visibility while creating or editing a user.
- Project creators need a Private option where only the creator and administrators can discover or open the project.
- Visibility must be enforced server-side for lists, direct routes, actions, and reports; hiding cards is insufficient.
- Existing data must be preserved, so the design should be additive and default existing projects to their current visibility.
- `ProjectMember` already provides the correct canonical user-to-project assignment model; the missing UX is assigning memberships during account creation and removing memberships from the administration screen.
- Current authorization grants project access to system administrators or active project members. Project lists already scope non-administrators by membership.
- Add `Project.isPrivate` with a default of `false` so all existing projects preserve their current behavior.
- Private means Administrator-only. Non-administrator memberships must not override the privacy flag.
- Only system administrators should be allowed to create or change an Administrator-only project; otherwise a non-admin creator could lock themselves out immediately.
- Session context is database-backed on every request. Including project privacy in session membership projections lets the existing synchronous policy enforce private access consistently without trusting the UI.
- The access service should reject assigning a non-administrator to an Administrator-only project, and the UI should label/disable those projects in user membership controls.
- Project create/update actions already centralize permission checks, so the administrator-only visibility rule can be enforced there and repeated in the domain service to protect non-UI callers.
- Existing project creation automatically creates a Project Manager membership for the actor. For an Administrator-only project this record remains useful for ownership/audit, but access still depends on the Administrator system role.
- User creation is transactional, allowing the account, initial system role, and selected project memberships to be created atomically.

## Connected workspace and daily timeline request (2026-07-30)
- The user wants all secondary pages to feel like one connected project workspace.
- The standalone timeline must show dates and status clearly enough to answer “what should I work on each day?”
- `D:\Projects\project_Management` exists with separate `frontend` and `backend` folders and is reference-only.
- The current planning files describe a completed earlier presentation refactor; this task starts a new navigation/timeline phase without undoing that work.
- The reference frontend is a Vite application. Its relevant idea is split between `RoadmapPage`, `RoadmapTimeline`, `ProjectDetailsPage`, and `MilestoneTimeline`: dated milestones are shown as status-coloured chronological entries rather than only month-positioned bars.
- Orbit already has real project-scoped routes for overview, workstreams, capabilities, risks, pilot, reports, members, and project edit, but the sidebar has no explicit standalone Timeline destination and “Milestones” is disabled as `SOON`.
- Orbit's standalone `/projects/[projectId]/pipeline` route exists and currently renders the same full delivery board. The shared sidebar points “Pipeline” to the overview route rather than that standalone route.
- Orbit already has a `Breadcrumbs` component and page headers, but project pages do not share one persistent project sub-navigation component.
- The existing timeline already has month lanes and status presentation mappings. The missing management view is a date-oriented agenda/list showing start date, due date, duration, current status, progress, owner/workstream, and urgency.
- The standalone pipeline page is currently only a redirect to the overview, so implementing a true timeline page does not require a new URL or schema.
- The reference project confirms the useful interaction pattern: sort by due date, group chronologically, show a coloured status badge, and retain a direct link to the owning project/item.
- Orbit's current `TimelineRoadmapPanel` already supports group mode, status filtering, item-type filtering, zoom, phase focus, and inline edit. These behaviours should be retained below the new agenda rather than duplicated.
- The shared sidebar can infer the current `projectId` from the URL. It can therefore link Milestones to the dedicated timeline and Pipeline to the project overview while preserving context.
- Orbit's `PageHeader` and `Breadcrumbs` can provide the top-level page relationship; a reusable project navigation bar is still needed for consistent direct movement between overview, timeline, workstreams, deliverables, resources, risks, pilot, reports, and settings.
- `DeliveryPipelineView.roadmapGroups` contains the milestone ID plus each visible item's start/due dates, status, progress, owner, workstream, and item kind. This is sufficient to derive a daily agenda with correct edit links without adding a query or changing the database.

## Request
Generalise Orbit from a software/full-stack-oriented tracker into a configurable project-management experience while preserving all existing data.

## UI/UX architecture refresh request (2026-07-30)
- User feels the product is not coherent end-to-end and requested a structural UI/UX improvement, not another isolated cosmetic adjustment.
- Current project navigation has already been reduced to Overview, Timeline, Plan, Risks, Pilot, Reports, and Settings; the next audit must confirm each destination has a distinct job and page content does not repeat it.
- The overview currently stacks executive snapshot, pipeline summary, workstream summary, then full delivery board. This is rich but risks presenting executive context and detailed execution in one long page.
- The reusable visual language is light SaaS: white panels, soft grey canvas, dark navy sidebar, purple active state, status colours, compact information density. The redesign should preserve this rather than introduce a new theme.
- UI guidance selected: clear interaction affordances, visible focus, non-colour status labels, 44px interactive targets, short transitions, responsive containers, and a stable page hierarchy.
- UI design-system search had a Windows console encoding failure after returning its stack guidance. This is a tooling-output issue only; do not repeat the exact console rendering command.
- Timeline was still embedding `PhaseSummaryTable` above its roadmap panel, which duplicates the phase summary retained on Overview. Timeline should be an execution surface only: daily agenda, filters, roadmap, and inline updates.
- The desktop sidebar duplicated the same project sections already present in the sticky project navigation. The correct hierarchy is global navigation in the sidebar and project-local navigation in the project tabs.

## Non-destructive strategy
- Keep existing database IDs, enum values, relations, phase codes, and historical checkpoints.
- Introduce generic presentation labels and derived summaries before considering schema expansion.
- Avoid migrations unless the current schema cannot represent the requested behaviour safely.

## Audit findings
- The app is Next.js 16 App Router with React 19, Prisma 7, PostgreSQL, Tailwind, Vitest, and Playwright.
- Current schema preserves a strong project/milestone/work-item model but hard-codes only three global `WorkstreamCode` values: `FRONTEND`, `BACKEND`, and `DATABASE`.
- Delivery stage storage is also software-oriented (`TECHNICAL_VERIFICATION`, `BUSINESS_UAT`, `STAGING`, `CONTROLLED_PILOT`, `PRODUCTION`), while milestone/work-item statuses already provide generic values such as `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, and `COMPLETED`.
- Existing `Workstream` rows have editable names and colours, but their enum codes are global and not project-scoped. Making arbitrary user-defined project workstreams requires a future additive migration; it should not be simulated by deleting or repurposing existing rows.
- The current project page already composes an overview, technical workstream summary, pipeline summary, phase summary, and timeline. This makes a backward-compatible presentation refactor feasible without touching stored records.
- The pipeline already derives a five-step overview journey (`NS`, `IP`, `CHK`, `RPR`, `LIVE`) from legacy lifecycle values, so generic labels can be applied without changing historical codes.
- `TechnicalWorkstreamsSummary` is hard-coded to exactly three code/name/icon definitions even though the rendered counts are derived dynamically from live roadmap items.
- `PhaseSummaryTable` explicitly splits `PH-*` and `BPH-*` into two side-by-side “Technical” and “Business” tables; it can be replaced by one phase delivery summary without changing phase records.
- `PipelineSummary` already renders exactly six cards (total plus five derived lifecycle groups), so the direct safe change is generic presentation text: Ready for Check → Under Review, Ready for Production → Approved, Live → Completed.
- The project page header is PMS-specific (`PMS / Dashboard`, “Roadmap”, “release health”) and can be made generic from fields already selected: project name, code, description, start date, and target date.
- The current page navigation mixes overview actions with destinations. The safe immediate improvement is to expose existing destinations as general project sections; Deliverables and Resources require real routes/data before being added.
- The phase board owns the Technical/Business/Overall state. This can be generalised to “By Phase / By Workstream / All Phases” while retaining the same existing `PH-*` and `BPH-*` grouping filters internally.
- The pipeline repository currently selects no project status/member owner/risk collection. A richer snapshot would require additive repository selection (no schema change) or a separate overview query.

## Backward-compatible implementation boundary
- Implement the proposal as a presentation and derived-summary refactor against current live project data.
- Keep persisted `WorkstreamCode`, `DeliveryStageCode`, lifecycle codes, phase codes, and all relational records unchanged.
- Add a generic six-card executive snapshot and derived project-health panel from the existing pipeline projection.
- Render workstream cards from the names and assignments present in live items rather than fixed Frontend/Backend/Database card copy.
- Replace the dual Technical/Business phase summary with one general `Phase Delivery Summary` supporting derived views by phase, workstream, owner, and status.
- Generalise lifecycle display labels while preserving their stored legacy codes for history and API compatibility.
- Do not add empty Deliverables/Resources modules or pretend that arbitrary project-scoped workstream/status configuration exists. Those require additive schema, CRUD, permissions, and migration work in a separate phase.
