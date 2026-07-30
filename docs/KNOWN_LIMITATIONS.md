# Known Limitations

Review date: 2026-07-25

## Release blockers

1. The locked production dependency graph contains five high-severity and one
   moderate-severity npm vulnerability entries. Current stable Next.js and
   Prisma releases do not provide a non-breaking remediation.
2. Target-environment HTTPS, HSTS, backup/restore, monitoring, alerting, and
   rollback rehearsals are not represented by local application tests.

## Build and tooling

- Next.js Turbopack emits four static-analysis warnings for dynamic CommonJS
  `require` calls in vendored minified ExcelJS and JSZip bundles. The build and
  runtime export tests pass.
- The Playwright-managed Chromium download could not validate the environment's
  certificate chain. End-to-end tests use installed Chrome through
  `channel: "chrome"`.
- The optional interactive browser integration was unavailable during this
  review. The seven automated Playwright flows passed independently.
- PostgreSQL's Node driver emits a deprecation warning when a client query is
  scheduled while another query is executing. Tests pass, but this should be
  revisited before upgrading to pg 9.

## Security posture

- The Content Security Policy allows inline scripts and styles for framework
  compatibility. It otherwise restricts content to the application origin and
  blocks framing and objects.
- HSTS must be supplied only after the release environment proves permanent
  HTTPS.
- Authentication is local email/password with database sessions. MFA, external
  identity providers, email-based recovery, and account self-service are not
  implemented.
- Sign-in throttling is application/database based; a production edge
  rate-limit and abuse-monitoring policy is still recommended.

## Product and operations

- Dates and management metrics are planning indicators, not earned-value
  accounting.
- Report generation is synchronous. Very large future datasets may require a
  queued job model, object storage, and download expiry.
- The seed is intended for bootstrap and sample data. Production user
  provisioning should occur through approved administrative workflows.
- Browser checks cover representative critical surfaces, not an exhaustive
  visual comparison of every route at every viewport.

