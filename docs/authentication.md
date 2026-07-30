# Authentication and authorization

## Boundary

Phase 3 implements identity, sessions, roles, permissions, project membership, and access administration. It does not create projects or implement project CRUD, milestone/work management, the delivery pipeline, or later product pages.

## Sign-in and sessions

1. The server normalizes the email and checks recent failed attempts using a non-reversible SHA-256 identity fingerprint in the audit log.
2. Password comparison uses bcrypt at cost 12. A dummy hash is compared when an identity does not exist so the response does not disclose account existence.
3. Successful sign-in creates 32 random bytes and sends the base64url value only in an HttpOnly cookie.
4. PostgreSQL stores only the SHA-256 hash of that token. Sessions expire after seven days and may be revoked.
5. Every protected request reloads the active user, current roles and permissions, and active project memberships. Role and membership changes therefore apply without trusting stale client state.

The cookie uses `SameSite=Lax` and `Path=/`. Production uses `Secure` and the `__Host-orbit_session` name; local development uses `orbit_session`.

Five unsuccessful sign-ins within 15 minutes throttle that normalized identity. Successful authentication starts a fresh failure window. Responses remain generic.

## Passwords

- Minimum 12 characters
- Uppercase, lowercase, number, and symbol required
- Maximum 128 characters and 72 UTF-8 bytes
- bcrypt cost 12
- Password values are never logged or included in audit state

Accounts created by an Administrator and optional local seed accounts set `mustChangePassword`. The workspace layout redirects those sessions to `/change-password`. A successful change clears the requirement, records `passwordChangedAt`, audits the event, and revokes the user’s other sessions.

Administrator password resets also revoke all active sessions and require another password change.

## Roles and permissions

| Role | Permission scope |
| --- | --- |
| Administrator | `system.manage`, which authorizes every permission and bypasses project membership scope |
| Project Manager | Create/update/view projects; manage project membership, milestones, all work items and stages, risks, decisions, Controlled Pilot configuration, reports, and authorized audit history |
| Technical Lead | View member projects and update only work assigned to that user, including its delivery stage |
| Reviewer | View member projects and review decisions, Pilot criteria, Pilot sign-offs and final Pilot decisions, and UAT criteria |
| Viewer | View member projects only |

Role permissions are normalized through `RolePermission`. A user may hold more than one system role through `UserRole`. Duplicate grants are prevented by composite primary keys.

Project-level operations use two gates:

1. The required stable permission code.
2. An active `ProjectMember` relationship for that project.

`system.manage` is the explicit Administrator override. Technical Lead work updates add a third gate: `WorkItem.ownerId` must equal the authenticated user.

## Server enforcement

- `(workspace)/layout.tsx` protects the workspace and redirects unauthenticated sessions to `/sign-in`.
- Page-level administration uses `requirePagePermission`.
- Server Actions call `requirePermission` before their service layer and treat input as untrusted Zod data.
- Protected Route Handlers return `401 Unauthorized` or `403 Forbidden` JSON.
- `/api/session` returns only the current user’s safe identity and session expiry.
- `/api/access/users` requires `system.manage` and returns no password or session material.
- `/unauthorized` and `/forbidden` provide explicit user-facing states.

Hiding or disabling a button is only presentation. It is never the authorization decision.

## Access administration and audit

The Users & Access page requires `system.manage`. Its operations are transactional:

- Create user and initial role
- Add a system role
- Create or update a project membership
- Activate or deactivate an account
- Issue a temporary password and revoke active sessions

The current Administrator cannot deactivate their own account, and the last active Administrator cannot be deactivated.

Audited actions include successful, failed, and throttled sign-in; sign-out; password change; user creation; role assignment; project membership change; account status change; and password reset. Audit state is deliberately limited to safe identifiers and status metadata.

## Local development accounts

The seed contains identities but no password. Set a temporary value manually in the ignored root `.env`:

```text
SEED_LOCAL_PASSWORD="YOUR_OWN_TEMPORARY_PASSWORD"
```

The password must meet the policy above. Run:

```bash
npm run prisma:seed
```

This optionally creates:

- `admin@orbit.local`
- `manager@orbit.local`
- `lead@orbit.local`
- `reviewer@orbit.local`
- `viewer@orbit.local`

Each account receives its corresponding system role and must change the temporary password on first sign-in. Existing passwords are not overwritten by subsequent seed runs. Clear `SEED_LOCAL_PASSWORD` after bootstrapping.
