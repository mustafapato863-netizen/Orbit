# Controlled Pilot workspace

Phase 9 adds a project-scoped Controlled Pilot workspace at
`/projects/{projectId}/pilot`.

## Scope and ownership

Project Managers configure the Pilot overview, support owner, rollback owner,
known limitations, Pilot teams and users, included/deferred canonical
capabilities, Entry and Exit criteria, and the Pilot issue log.

Pilot users are active project members connected through `PilotTeamMember`.
Capabilities remain canonical `SharedCapability` records and are classified
through `PilotScopeCapability`; they are never copied into the Pilot.

## Readiness

Entry and Exit gate status is derived from required criteria:

- `Ready`: every required criterion is Met or Waived;
- `Blocked`: at least one required criterion is Not Met;
- `Pending`: required criteria remain unreviewed.

Final approval readiness additionally requires support and rollback owners, at
least one team, at least one included capability, both sign-offs approved, and
no open blocking Pilot issues.

## Authorization and audit

`pilot.manage` permits project-scoped configuration but does not permit
approval. `pilot.review` permits criterion review, business and technical
sign-off, and final approval, rejection, or deferral. The Reviewer role and
Administrator role receive this approval authority.

Every Met, Not Met, Waived, Approved, Rejected, or Deferred outcome creates a
sanitized `AuditLog` entry in the same transaction as the state change. Final
approval is also rejected by the server until the derived readiness rules pass.
