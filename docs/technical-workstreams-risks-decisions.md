# Technical Workstreams, Risks and Decisions

Phase 8 adds project-scoped technical execution views and governance registers.

## Workstream counting

The Frontend, Backend and Database views are read projections over canonical
Work Items and Shared Capabilities:

- a Work Item is counted once in the project and once in any related Workstream;
- a Shared Capability remains one canonical record even when linked to several
  Business Milestones;
- an item is Primary only in its `primaryWorkstream`;
- join-table relationships make it Supporting in the other Workstreams;
- average progress is a derived planning mean across the unique related items.

The pages are available at
`/projects/{projectId}/workstreams/{frontend|backend|database}`.

## Risk rules

Risk Probability and Impact use integer values from 1 to 5. Severity is
calculated on the server from their product:

- 1–4: Low
- 5–9: Medium
- 10–16: High
- 17–25: Critical

A Risk may reference one Work Item or one Shared Capability, never both.
Every Milestone, technical target, owner and Workstream is validated against
the active project before the transaction writes anything.

## Decision rules

Decisions preserve affected Workstreams through `DecisionWorkstream`
relationships. Project Managers manage the decision definition; Reviewers can
approve, reject or defer without receiving general edit permission. Viewers can
read the register and history.

Decision comments are stored as project-scoped `Comment` records. Creation,
updates, review outcomes, comments and archival operations also create
sanitized `AuditLog` entries in the same database transaction. The detail page
combines these immutable audit entries with the comment history.

## Authorization

All pages require `project.view` and active project membership. Mutations also
enforce their permission on the server:

- `risk.manage`
- `decision.manage`
- `decision.review`

UI visibility is only a convenience and is not an authorization boundary.
