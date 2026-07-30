# Test Evidence

Evidence date: 2026-07-25

Environment: Windows, Node.js 24.15.0, npm 11.12.1, PostgreSQL
`project_management`, system Chrome 150.0.7871.186.

No secret values are included in this document.

## Required commands

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run prisma:generate` | Pass | Prisma Client 7.9.0 generated |
| `npm run typecheck` | Pass | Route types generated; TypeScript emitted no errors |
| `npm run lint` | Pass | ESLint emitted no findings |
| `npm run test` | Pass | 41 test files; 102 tests |
| `npm run build` | Pass | Optimized Next.js production build completed |

The build emits four non-fatal Turbopack `TP1002` warnings while statically
examining vendored minified ExcelJS and JSZip CommonJS bundles. The report routes
compiled and were exercised successfully at runtime.

## Browser tests

`npm run test:e2e`: **Pass — 7 tests**

Covered flows:

- protected-route redirect;
- sign-in and sign-out;
- first-login password change;
- Users & Access restriction;
- project membership and outsider denial;
- report permission and cross-origin rejection;
- actual authorized PPTX/XLSX generation and snapshot visibility;
- mobile pipeline expansion behavior and document overflow;
- dark-mode activation and mobile navigation;
- serious/critical axe checks on representative public and protected surfaces.

The Playwright-managed Chromium download was unavailable because the local
certificate chain could not be validated. The configured suite used installed
Chrome instead and completed successfully. The optional interactive browser
surface was unavailable; automated browser evidence is unaffected.

## Database evidence

- `npx prisma migrate status`: five migrations found; database schema up to date.
- `npm run verify:seed`: two consecutive seed passes preserved all 16 tracked
  entity and relationship counts.
- Integration suites execute mutable scenarios inside forced-rollback
  transactions and compare pre/post counts. Project/milestone, execution,
  governance, Pilot, and report-snapshot integration tests passed.
- No destructive reset command was used.

## Report evidence

- `npm run reports:samples`: 1 file, 1 test passed.
- Unit tests reopen PPTX/XLSX OOXML, assert valid ZIP signatures, required
  sections/sheets, pagination, every Work Item, canonical Shared Capability
  treatment, Primary/Supporting Workstreams, owner fallback, and secret absence.
- Playwright downloaded both real formats from authorized routes and verified
  media types, no-store behavior, and file signatures.
- Generated samples:
  - `samples/reports/pms-dashboard-management-report.pptx`
  - `samples/reports/pms-dashboard-management-review.xlsx`

## Security and dependency checks

| Check | Result |
| --- | --- |
| `.env` ignored | Pass |
| Placeholder-only `.env.example` | Pass |
| Active secret values outside `.env` | 0 matches across 301 files |
| Server environment names in `.next/static` | 0 files |
| `npm audit --omit=dev` | **Fail: 5 high, 1 moderate** |
| Full `npm audit` | **Fail: 14 high, 1 moderate** |

## Regression statement

No exact frozen node-ID checkpoint was present for comparison. The complete
available Vitest suite and Playwright suite passed. No failing test is being
classified as pre-existing.

