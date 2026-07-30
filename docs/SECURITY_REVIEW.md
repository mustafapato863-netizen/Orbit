# Security Review

Review date: 2026-07-25

## Scope

This review covered authentication, session handling, role and permission
enforcement, project scoping, server-side validation, report downloads, audit
records, secrets, security headers, database migrations, and dependency
advisories.

## Verified controls

- Passwords are validated and bcrypt-hashed; seed credentials are supplied only
  through the server environment and are never embedded in source.
- Session cookies are HttpOnly, SameSite, and production-Secure. Only a SHA-256
  session-token hash is persisted.
- Protected pages, Server Actions, and Route Handlers enforce server-side
  authentication and permissions. Project operations additionally require an
  active project membership unless the actor is an Administrator.
- First-login password change, sign-out, account deactivation, and applicable
  password changes revoke sessions as designed.
- Zod validates environment configuration and mutation inputs on the server.
- Report download POST routes enforce same-origin requests before authorization,
  project scope, generation, snapshot persistence, and audit logging.
- Audit payloads recursively redact password, credential, cookie, token,
  session, secret, authentication, and database-URL shaped fields.
- Report projections use an allowlist, reject active secret values and
  secret-shaped keys, and return `private, no-store` downloads.
- Global responses include a Content Security Policy, clickjacking protection,
  MIME sniffing protection, a restrictive permissions policy, opener isolation,
  and a strict referrer policy.
- `.env` exists, remains Git-ignored, and was not modified. `.env.example`
  contains placeholders only.
- A value-based scan found zero active secret matches outside `.env` across 301
  files. Browser bundles contained neither `DATABASE_URL` nor `AUTH_SECRET`
  names.

## Authorization evidence

Playwright verified:

- unauthenticated workspace requests redirect to sign-in;
- valid sign-in, sign-out, and forced password-change behavior;
- a Viewer cannot open Users & Access;
- an active member can open an authorized project;
- an outsider cannot open that project;
- a Viewer cannot download reports;
- a cross-origin report POST is rejected;
- an Administrator can generate valid PowerPoint and Excel downloads.

Vitest additionally covers policy matrices, technical ownership restrictions,
Reviewer approval boundaries, project relationship validation, and transactional
audit persistence.

## Open findings

### High — release blocking: dependency advisories

`npm audit --omit=dev` reports five high-severity and one moderate-severity
package entries:

- Next.js resolves `sharp` 0.34.5, affected by `GHSA-f88m-g3jw-g9cj`.
- Prisma 7.9.0 resolves affected `@prisma/dev`, `find-my-way`, and `valibot`
  packages. The direct advisory URLs include `GHSA-c96f-x56v-gq3h` and
  `GHSA-5qjj-4xww-7phc`.

At review time, npm reported Next.js 16.2.11, Prisma 7.9.0, and Prisma Client
7.9.0 as the latest stable versions. npm's proposed fixes are breaking
downgrades, so they were not applied without compatibility evidence.

The complete dependency graph reports 14 high and one moderate package entries,
including development tooling. This does not reduce the production blocker.

### Medium — deployment control not yet evidenced

HTTP Strict Transport Security is intentionally not emitted by the application
until HTTPS termination is confirmed. The deployment platform must enforce HTTPS
and add HSTS after validation.

### Low — CSP compatibility constraint

The production Content Security Policy still permits inline script and style
execution because of the current Next.js runtime and styling approach. It
blocks third-party origins, objects, framing, and foreign form targets, but a
nonce/hash-based policy would be stronger.

## Secret rotation

No rotation was required and no existing secret was changed. If a secret is
suspected to have been disclosed, rotate it outside source control, revoke
active sessions as applicable, and rerun the secret scan before release.

## Security decision

Security approval: **Not granted**.

The functional security controls passed their automated checks, but the open
production dependency findings require remediation or documented acceptance by
the accountable security owner.

