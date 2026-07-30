# Orbit database schema

## Scope

Phase 2 defines the normalized PostgreSQL domain model. Phase 3 adds the database-backed session model and user security timestamps without changing the project domain.

The source of truth is `prisma/schema.prisma`. The initial migration is in `prisma/migrations/20260724232849_initial_domain_schema/migration.sql`.

## Aggregate structure

```text
User ──< UserRole >── Role ──< RolePermission >── Permission
User ──< Session
User ──< ProjectMember >── Project

Project
├── Milestone ──< WorkItem
├── SharedCapability
├── Risk
├── Decision
├── PilotScope
├── ReportSnapshot
└── AuditLog

Milestone ──< MilestoneSharedCapability >── SharedCapability
WorkItem ──< WorkItemWorkstream >── Workstream
SharedCapability ──< SharedCapabilityWorkstream >── Workstream
Decision ──< DecisionWorkstream >── Workstream
PilotScope ──< PilotScopeCapability >── SharedCapability
PilotScope ──< PilotTeam ──< PilotTeamMember >── User
PilotScope ──< PilotIssue >── User
```

Every shared capability is stored once per project. `MilestoneSharedCapability` links that canonical record to any number of milestones and uses a compound key to prevent duplicate links. Its `projectId` participates in both foreign keys, so a milestone cannot link a capability from another project. Phase 5 adds an optional `sourceReference` to that relational link alongside dependency notes and criticality; the canonical capability still owns its single progress value, stage, owner, and execution lifecycle.

## Models

### Identity and authorization

- `User`: identity profile, normalized unique email, bcrypt password hash, forced-change state, security timestamps, active and archive state.
- `Session`: expiring and revocable server session. Only the SHA-256 token hash is persisted.
- `Role`: system role definition.
- `Permission`: stable permission code and display metadata.
- `UserRole`: explicit user-role join with assignment actor.
- `RolePermission`: explicit role-permission join.

Authentication behavior is implemented in Phase 3. The additive authentication migration adds `Session`, `lastLoginAt`, and `passwordChangedAt`.

### Project delivery

- `Project`: top-level aggregate, project code, slug, status, dates, and progress.
- `ProjectMember`: project-scoped membership and membership role.
- `Milestone`: business milestone, release horizon, risk, stage, dates, and scope summaries.
- `WorkItem`: milestone-specific work with one required primary workstream.
- `SharedCapability`: canonical project-level technical capability linked to many milestones.
- `MilestoneSharedCapability`: project-safe milestone/capability dependency link.
- `Workstream`: canonical Frontend, Backend, and Database reference data.
- `WorkItemWorkstream`: supporting workstreams for a work item.
- `SharedCapabilityWorkstream`: supporting workstreams for a shared capability.
- `DeliveryStageHistory`: immutable-style transition history for either a work item or shared capability.

`primaryWorkstreamId` is required on every work item and shared capability. Supporting links have compound primary keys. PostgreSQL triggers reject a supporting workstream that duplicates the primary workstream, including when the primary value is later changed.

### Governance and collaboration

- `Risk`: project risk with optional milestone and one optional specific target, scored probability and impact, ownership, mitigation, and status.
- `Decision`: project decision with optional milestone, owner, recommendation, decision text, and lifecycle status.
- `DecisionWorkstream`: affected-workstream links for decisions.
- `Comment`: project-scoped threaded comment with at most one specific domain target.

### Controlled pilot

- `PilotScope`: one pilot workspace per project, owners, limitations, explicit business/technical sign-off outcomes, and final decision.
- `PilotTeam`: named team inside a pilot.
- `PilotTeamMember`: user membership in a pilot team.
- `PilotCriterion`: entry or exit criterion and review evidence.
- `PilotScopeCapability`: included or deferred canonical capability.
- `PilotIssue`: project-scoped Pilot issue or blocker with severity, status, owner, mitigation, and resolution state.

Pilot capability links carry `projectId` in both compound foreign keys, preventing cross-project pilot scope.

### Reporting and history

- `ReportSnapshot`: versioned JSON report snapshot with generator and parameters.
- `AuditLog`: actor, action, entity identity, project scope, and before/after JSON state.

Audit records use `SET NULL` for removed actors or projects so historical entries survive hard administrative cleanup.

## Enums

The schema defines the requested stable enums:

- `ProjectStatus`
- `MilestoneStatus`
- `WorkItemStatus`
- `RiskLevel`
- `DeliveryStageCode`
- `WorkstreamCode`
- `ReleaseHorizon`
- `DecisionStatus`
- `MembershipRole`

Additional stable enums cover risk lifecycle and controlled-pilot behavior: `RiskStatus`, `PilotCapabilityDisposition`, `PilotCriterionType`, `PilotCriterionStatus`, `PilotSignOffStatus`, and `PilotIssueStatus`.

## Integrity rules

Prisma unique constraints and compound primary keys prevent duplicate memberships and links. The customized PostgreSQL migration adds checks that Prisma cannot express:

- progress is between 0 and 100;
- start dates do not follow due or target dates;
- normalized email is lowercase;
- probability and impact are between 1 and 5;
- a risk cannot target both a work item and shared capability;
- stage history targets exactly one supported entity and cannot repeat the same stage;
- a comment has at most one specific target;
- pilot sign-off actor and timestamp are set together;
- report versions are positive;
- primary and supporting workstreams cannot duplicate.

## Index strategy

Indexes support the expected access paths:

- project status, dates, and archive filters;
- milestone horizon, status, stage, and due dates;
- work-item and capability status by owner, workstream, stage, and date;
- risk and decision governance queues;
- reverse lookup from every join table;
- recent comments, stage transitions, reports, and audit activity;
- archived-record filtering.

Unique constraints automatically create indexes for natural keys such as normalized email, role name, permission code, project code/slug, workstream code, and project-scoped entity codes.

## Archival and deletion

Business records use nullable `archivedAt` fields. Application reads should exclude archived records by default. Hard deletion is reserved for explicit administrative cleanup.

Aggregate-owned records use cascading foreign keys where their parent has no independent meaning. Actor, owner, and historical references generally use `SET NULL`. Workstreams use `RESTRICT` while referenced.

## Transactions and repositories

The server singleton is `lib/prisma.ts`. `lib/prisma-client.ts` owns the reusable adapter factory. Application services own transaction boundaries through `lib/database/transaction.ts`.

Repositories follow `lib/repositories/README.md`:

- receive a transaction-compatible client;
- require project scope;
- contain persistence only;
- do not create transactions or disconnect clients;
- apply archive filtering unless history is requested.

## Idempotent reference seed

`npm run prisma:seed` executes `prisma/seed.ts` through the Prisma configuration. It upserts:

- Frontend, Backend, and Database workstreams;
- five system roles;
- stable permission codes;
- role-permission links.

The seed runs in one transaction and may be executed repeatedly without creating duplicate relationships. It creates local development users only when `SEED_LOCAL_PASSWORD` is supplied manually; no credential is embedded in source.

Phase 5 also idempotently upserts the PMS Dashboard sample project with:

- the approved 13 ordered Business Milestones;
- 13 representative milestone-specific Work Items;
- 11 canonical Shared Capabilities;
- supporting Workstream relations and project-safe milestone dependency links.

Seeded Shared Capabilities are never copied into milestone-owned rows. Re-running the seed replaces only the seeded records' supporting and dependency joins, so their canonical relationships remain deterministic without deleting unrelated project data.

## Migration workflow

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Use `prisma migrate deploy` in non-development deployment workflows. Never use `prisma migrate reset` against an unknown or non-disposable database.

Phase 4 adds `Milestone.sortOrder` through an additive migration. Existing rows are backfilled by project, creation time, and ID before the project/order index is created.

Phase 5 adds `MilestoneSharedCapability.sourceReference` through the additive `20260725071228_shared_capability_source_references` migration. It does not drop or rewrite existing rows.
