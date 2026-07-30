# Projects and Business Milestones

## Phase boundary

Phase 4 implements Projects, project membership, and Business Milestones. At that checkpoint, the project landing page showed ordered milestone summaries and expandable business scope only. Phase 5 retained those summaries and added collapsed technical execution details. Phase 6 places a concise executive overview first and moves all Main Milestone and technical details behind a closed disclosure. The detailed Delivery Pipeline remains outside these phases.

## Routes

| Route | Purpose |
| --- | --- |
| `/projects` | Workspace list filtered to active authorized projects |
| `/projects/new` | Create a project |
| `/projects/[projectId]` | Project summary, ordered milestone summaries, and activity |
| `/projects/[projectId]/edit` | Edit or archive a project |
| `/projects/[projectId]/members` | Add, update, or archive project membership |
| `/projects/[projectId]/milestones/new` | Create a Business Milestone |
| `/projects/[projectId]/milestones/[milestoneId]/edit` | Edit or archive a milestone |

The root authenticated route redirects to `/projects`.

## Authorization

Every page and Server Action independently enforces authorization:

- Project creation requires `project.create`.
- Project list/view requires `project.view`; non-Administrators see only active `ProjectMember` projects.
- Project edit/archive requires `project.update` plus active membership.
- Membership changes require `project.manage_members` plus active membership.
- Milestone create/edit/archive/order requires `milestone.manage` plus active membership.
- `system.manage` is the explicit Administrator override.

Client-side button visibility is only presentation and is not used as the security decision.

Creating a project atomically creates a `PROJECT_MANAGER` membership for the actor. Membership changes cannot demote or archive the last active Project Manager.

## Project data

Projects support:

- Code and stable internal slug
- Name and description
- Status and progress from 0–100
- Start and target dates
- Active membership
- Soft archival
- Project-scoped activity

Project codes and slugs are unique. Date ranges and progress are validated by Zod on the server.

## Business Milestones

Milestones support:

- Project-unique code and name
- Business purpose
- Release 1 or Phase 2 classification
- Status, progress, and risk
- Start and due dates
- Delivered scope and remaining scope
- Current blockers
- Next action
- First-release impact
- Persisted project-local ordering
- Soft archival

The additive `milestone_ordering` migration assigns deterministic positions to any existing milestones. New milestones append to the project order; up/down changes normalize active positions inside one transaction.

## Activity and transactions

Project, milestone, order, and membership commands follow:

```text
Server Action -> ProjectService -> ProjectRepository -> Prisma/PostgreSQL
```

Services own transaction boundaries. Each mutation and its audit entry succeed or roll back together. Audit entries record safe business state and actor identity without secrets or session material.

## Tests

The Phase 4 suite covers:

- Project and milestone Zod validation
- Release classification and date ordering
- Viewer, Project Manager, and Administrator access boundaries
- Project create/update/archive
- Automatic Project Manager membership
- Milestone create/update/archive and ordering
- Membership last-manager protection
- Audit creation
- Full transaction rollback with exact pre/post count restoration
