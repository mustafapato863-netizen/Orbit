# Phase 5 technical execution model

## Scope and boundary

Phase 5 implements milestone-specific Work Items and canonical Shared Capabilities. Business Milestones remain the initial project-page summaries. Their technical details are collapsed by default and rendered only on demand.

This phase does not implement the full Delivery Pipeline page, risks and decisions workflows, pilot workflows, or reporting.

## Milestone-specific Work Items

A Work Item belongs to exactly one Business Milestone and records:

- code, name, description, notes, and acceptance criteria;
- one required Primary Workstream and zero or more distinct Supporting Workstreams;
- status, progress, risk, delivery stage, next gate, blocker, and dates;
- an optional owner who must be an active project member.

The relational `WorkItemWorkstream` table prevents duplicate Supporting Workstreams. Validation and database triggers both prevent the Primary Workstream from being repeated as Supporting.

Project Managers and Administrators may create, edit, reassign, and archive Work Items. Technical Leads with `work_item.update_assigned` may update only the execution fields of Work Items currently assigned to them. The service rechecks ownership inside the transaction.

## Canonical Shared Capabilities

A Shared Capability is a project-level canonical record. It owns one name, progress value, status, delivery stage, owner, risk, blocker, notes, acceptance criteria, Primary Workstream, and set of Supporting Workstreams.

`MilestoneSharedCapability` references that record from multiple Business Milestones and records:

- the milestone and canonical capability;
- an optional source reference;
- dependency notes;
- whether the dependency is critical.

The compound key `(milestoneId, sharedCapabilityId)` prevents a duplicate relationship. Compound project-aware foreign keys prevent cross-project links. Project metrics count `SharedCapability` records directly, never the number of milestone links.

The project page renders capability links as compact dependencies under each expanded milestone. The canonical list at `/projects/[projectId]/capabilities` is the authoritative project-level view and edit entry point.

## Transactions, stage history, and audit

Server Actions validate with Zod, authenticate the session, verify the global permission, and enforce active project membership before calling the service. Services own serializable transactions. Repositories own scoped persistence and do not commit.

Creating or changing a delivery stage writes `DeliveryStageHistory`. Create, update, assigned execution update, and archive operations write sanitized project-scoped `AuditLog` entries. Audit state excludes secrets and large free-text fields.

## PMS Dashboard seed

`npm run prisma:seed` safely upserts:

- the PMS Dashboard project;
- the approved 13 ordered Business Milestones, with milestones 1-12 in Release 1 and milestone 13 in Phase 2;
- one representative milestone-specific Work Item per milestone;
- the 11 approved canonical Shared Capabilities and their multi-milestone dependency links.

The seed is idempotent. It uses natural project-scoped keys, recreates deterministic join rows, and does not run reset, truncate, or drop commands. Local account ownership and membership are applied only when the optional local accounts exist.

## Verification coverage

Phase 5 tests cover:

- field and date validation;
- Primary versus Supporting Workstream separation;
- duplicate milestone-link rejection;
- Work Item and Shared Capability create, update, assigned update, stage history, archive, and audit behavior;
- assigned-owner rejection;
- canonical capability counts and multi-milestone links;
- full database count restoration after rollback;
- exact PMS milestone and capability definitions.
