# Phase 6 Project Executive Overview

## Scope and boundary

Phase 6 replaces the initial project landing composition with a concise, read-only management projection. It does not add new database fields or migrations. At the Phase 6 checkpoint it did not implement the Pipeline, Workstreams, Risks, Pilot, or Reports modules; Phase 7 subsequently implements only the Delivery Pipeline.

The project-section navigation displays unavailable destinations as disabled links marked `Soon`. Pipeline becomes available in Phase 7; no placeholder route or partial implementation is created for the remaining modules.

## Management view

The overview presents:

- project code, name, description, overall status, membership count, and dates;
- derived planning progress;
- Release 1 and Phase 2 planning status;
- total Main Milestones and high-risk Main Milestones;
- unique blocked records;
- the current Release 1 gate and recommended first release;
- the next six outstanding due records, including overdue dates;
- the six highest-priority recorded blockers;
- Frontend, Backend, and Database responsibility summaries;
- the six most recent project audit entries.

All Main Milestone summaries are behind a closed `details` disclosure. Work Items remain nested within an individual Main Milestone's technical-execution disclosure, so the initial executive view never renders a visible task inventory.

## Derived planning progress

Project planning progress is the rounded, equal-weight arithmetic mean of active Main Milestone `progress` values:

```text
sum(Main Milestone progress) / number of active Main Milestones
```

It deliberately ignores the manually stored project progress field and is labelled `derived planning progress`. It is a planning indicator, not earned value and not a cost or schedule performance calculation.

Release 1 and Phase 2 progress use the same rule within each release horizon.

## Release status and current gate

Release-horizon status is derived conservatively:

1. all milestones completed -> Completed;
2. any milestone blocked -> Blocked;
3. any milestone at risk or High/Critical risk -> At risk;
4. any started or partially progressed milestone -> In progress;
5. otherwise -> Not started.

The current release gate is the earliest delivery stage among active, incomplete Release 1 milestones. If no Release 1 milestone has started, it is `Not Started`; if all are complete, it is `Production`.

The recommended first release remains Release 1 while Release 1 scope exists. The supporting recommendation calls out blocker/risk clearance, final confirmation, or continued Phase 2 deferral as appropriate.

## Canonical counting rules

The overview query loads Shared Capabilities once from `Project.sharedCapabilities`. It does not calculate global metrics from `MilestoneSharedCapability` links.

The unique technical collection is:

```text
all active milestone-specific Work Items
+ all active canonical Shared Capabilities
```

Each record contributes once to global blocker and due-date calculations. Within a Workstream it contributes once as Primary or once as Supporting, preserving responsibility semantics. A capability linked to several Main Milestones is never multiplied by those dependency links.

## Responsive and theme behavior

Cards use the shared application theme, semantic border/background tokens, and dark-mode variants. Layouts collapse from three or four columns to one column on narrow screens. Project navigation scrolls inside its own bounded container, preventing page-level horizontal overflow.

Status and risk meaning is always communicated with text and badges, never color alone.
