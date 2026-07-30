# Handover

## Current decision

Release status: **NO-GO**.

Application and test gates pass, but production dependency advisories and
deployment-specific operational controls remain open. See
[RELEASE_READINESS.md](RELEASE_READINESS.md).

## Local setup

1. Install dependencies with `npm install` for development or `npm ci` for an
   exact locked install.
2. Enter the real PostgreSQL password only in the root `.env` file, inside
   `DATABASE_URL`. Never place it in `.env.example`, documentation, reports, or
   command output.
3. Ensure `AUTH_SECRET` and any optional bootstrap password contain approved
   values.
4. Run:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

If `SEED_LOCAL_PASSWORD` is used to create local accounts, remove it from `.env`
after the seed. Seeded accounts must change that temporary password at first
login.

## Release-candidate verification

```bash
npm run prisma:generate
npx prisma migrate status
npm run verify:seed
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run reports:samples
npm run build
npm audit --omit=dev
```

Use a dedicated verification database for mutable QA. Do not run
`prisma migrate reset` against an unknown or retained database.

## Deployment checklist

- Close or formally accept every production dependency advisory.
- Back up the target database and prove a restore.
- Apply checked-in migrations through the approved release process.
- Configure HTTPS, HSTS, trusted proxy headers, secure cookies, monitoring, and
  alerting.
- Confirm the application origin used by `APP_URL`.
- Run a post-deployment health check at `/api/health`.
- Verify sign-in, role assignment, project scoping, report downloads, and audit
  records with non-production test identities.
- Record release-owner, security-owner, business-owner, and rollback-owner
  approvals.

## Rollback

Application rollback should redeploy the previous immutable build. Database
rollback depends on the exact additive migration and must be reviewed before
release; never improvise a destructive reset. Preserve `AuditLog` and
`ReportSnapshot` history.

## Evidence map

- Release decision: [RELEASE_READINESS.md](RELEASE_READINESS.md)
- Security findings: [SECURITY_REVIEW.md](SECURITY_REVIEW.md)
- Commands and results: [TEST_EVIDENCE.md](TEST_EVIDENCE.md)
- Open constraints: [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md)
- Authentication model: [authentication.md](authentication.md)
- Database model: [database-schema.md](database-schema.md)
- Report model: [reports-and-exports.md](reports-and-exports.md)

