# Reports and Exports

Phase 10 adds project-scoped management exports at `/projects/[projectId]/reports`.
It does not implement later application modules or change the domain schema.

## Canonical report snapshot

Both file formats use the same allowlisted, immutable `ReportDataset` projection. The projection contains active Business Milestones, every active Milestone-Specific Work Item, canonical Shared Capabilities, technical ownership, Delivery Pipeline position, Risks, Decisions, Controlled Pilot scope, upcoming commitments, and the final release recommendation.

A Work Item has one canonical key and belongs to one Milestone. A Shared Capability has one canonical key regardless of the number of Milestone links. Global counts use these canonical keys. Milestone dependency lists are references only and do not increment the global Shared Capability total.

Missing ownership is always rendered as `Owner Not Assigned`.

## PowerPoint report

PptxGenJS generates a responsive widescreen management deck with:

- Executive summary
- How to read the report
- Paginated Business Milestone roadmap with every Work Item
- Paginated Frontend, Backend, and Database ownership breakdowns
- Canonical Delivery Pipeline register and stage distribution
- Controlled Pilot scope, teams, criteria, and limitations
- Risks and blockers
- Management decisions
- Upcoming delivery
- Final release recommendation

Long tables are split across continuation slides. Primary and Supporting Workstream relationships are explicitly labelled.

## Excel Management Review Pack

ExcelJS generates exactly six worksheets:

1. Executive Summary
2. Milestone Review
3. Workstream Review
4. Risks & Decisions
5. Pilot Scope Review
6. Final Feedback and Sign-off

The workbook uses typed dates, numeric percentages, filters, frozen panes, print areas, repeated print headers, manual page breaks on long sheets, and controlled sign-off decision validation. The Milestone Review contains every Work Item and one canonical row per Shared Capability. The Workstream Review contains one explicitly labelled row per package–workstream relationship.

## Authorization and persistence

The two download Route Handlers accept `POST` only. They require `report.export` and active project access before the report service is invoked. Administrator and Project Manager roles receive this permission from the stable seed; other roles do not.

A successful generation creates:

- A versioned `ReportSnapshot` with the exact safe dataset, format, checksum, and file metadata
- A `report.generated` `AuditLog` entry with counts and the snapshot identifier

The database transaction runs only after the file has generated successfully. Serializable retries prevent duplicate version races.

## Secret safety

The dataset is an allowlist and excludes environment configuration, passwords, emails, session data, and tokens. Before generation, the service rejects secret-shaped keys and values equal to the active server-only `DATABASE_URL` or `AUTH_SECRET`. Errors never echo those values. Downloads use `private, no-store` and `nosniff` response headers.

## Samples and verification

Seeded PMS samples are stored in `samples/reports/`. Regenerate them after seeding with:

```bash
npm run reports:samples
```

Tests reopen both OOXML archives, assert the required slides/sheets, confirm every Work Item is serialized, verify canonical Shared Capability rows, exercise Primary/Supporting relationships, test unauthorized download denial, validate secret rejection, and roll snapshot/audit persistence back to its original database counts.
