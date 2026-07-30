# Phase 7 Delivery Pipeline

## Scope and boundary

Phase 7 implements the read-only project Delivery Pipeline at:

```text
/projects/[projectId]/pipeline
```

It does not implement the separate Workstreams, Risks, Pilot, or Reports modules and does not add database fields or migrations.

## Canonical Work Package counting

The global pipeline source is:

```text
active milestone-specific Work Items
+ active project-level Shared Capabilities
```

Each Work Item belongs to one Main Milestone and enters once. Each Shared Capability enters once from `Project.sharedCapabilities`; global metrics never aggregate `MilestoneSharedCapability` links. The PMS seed therefore resolves to 24 canonical Work Packages: 13 Work Items plus 11 Shared Capabilities, even though those capabilities have 58 milestone dependency links.

Stage counts and the distribution bar use these 24 unique records. At-risk totals count packages with `AT_RISK` status or `HIGH`/`CRITICAL` risk.

## Delivery stages

The ordered journey is:

1. Not Started
2. In Development
3. Technical Verification
4. Business UAT
5. Staging
6. Controlled Pilot
7. Production

Journey lines show completed stages, one current stage, and future stages. Stage meaning is communicated by position, text, and state—not color alone.

## Next delivery dates

The current schema has package start and due dates but does not have a separate planned date for every stage transition. Phase 7 therefore derives the top dates without inventing data:

- `Next Start` uses the earliest start date for an active Not Started package.
- Every other event uses the earliest due date for an active package currently in the corresponding stage.
- Missing evidence is displayed as `Not scheduled`.

These dates are scheduling proxies, not recorded stage commitments. Stage history remains the source for completed transitions.

## Milestone roadmap

Only Business Milestones render initially. All are collapsed, and client state holds either one expanded milestone ID or `null`; requesting another milestone replaces the current ID.

Each collapsed milestone presents:

- name, progress, risk, current stage, derived next gate, and due date;
- milestone-specific Work Item and Shared Dependency counts;
- dominant Workstream;
- unique Frontend, Backend, and Database involvement counts.

Workstream counts include each milestone-specific item and each linked canonical dependency once within the milestone. Primary and Supporting relationships both establish involvement. Dominance uses the highest unique count, then Primary ownership to resolve ties.

Expanded milestones contain:

1. Milestone-Specific Work
2. Shared Dependencies

Shared Dependencies are compact references to their canonical capability record and are not copied into milestone-owned data.

## Work Item detail drawer

The journey row prioritizes the Work Item name, Primary Workstream, current stage, progress, next gate, due date, and blocker indicator. The side drawer contains:

- Supporting Workstreams;
- owner;
- full notes;
- start date;
- acceptance criteria;
- stage history;
- comments.

Stage history and comments are loaded through the scoped pipeline repository with archived comments excluded.

## Responsive behavior

- Desktop uses the wider roadmap density. Tablet uses a narrower task column and compact roadmap width inside the same bounded two-direction scroll pattern. Stage and month headers remain sticky at the top, and the task-name column remains sticky on the left.
- Mobile uses milestone cards and a vertical seven-stage journey with no page-level horizontal overflow.
- Work Items are conditionally rendered only for the single expanded milestone, so the initial page does not render a visible or hidden expanded task inventory.

Shared theme tokens, dark-mode variants, textual risk labels, and accessible disclosure state are used throughout.
