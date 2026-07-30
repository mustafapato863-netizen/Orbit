import { describe, expect, it } from "vitest";

import {
  buildExecutiveOverview,
  type ExecutiveOverviewProject,
} from "@/lib/projects/executive-overview";

function execution(
  overrides: Partial<
    ExecutiveOverviewProject["sharedCapabilities"][number]
  > = {},
) {
  return {
    id: "execution-1",
    code: "EXEC-01",
    name: "Canonical execution",
    status: "IN_PROGRESS",
    progress: 50,
    riskLevel: "MEDIUM",
    deliveryStage: "IN_DEVELOPMENT",
    dueDate: new Date("2026-08-20T00:00:00.000Z"),
    blocker: null,
    primaryWorkstream: { code: "BACKEND" as const },
    supportingWorkstreams: [
      { workstream: { code: "DATABASE" as const } },
    ],
    ...overrides,
  };
}

function project(): ExecutiveOverviewProject {
  return {
    status: "ACTIVE",
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    targetDate: new Date("2026-12-31T00:00:00.000Z"),
    milestones: [
      {
        id: "milestone-1",
        code: "M-01",
        name: "Release milestone",
        status: "IN_PROGRESS",
        progress: 40,
        riskLevel: "LOW",
        deliveryStage: "TECHNICAL_VERIFICATION",
        releaseHorizon: "RELEASE_1",
        dueDate: new Date("2026-08-10T00:00:00.000Z"),
        currentBlockers: null,
        workItems: [
          execution({
            id: "work-1",
            code: "WI-01",
            primaryWorkstream: { code: "FRONTEND" },
            supportingWorkstreams: [
              { workstream: { code: "BACKEND" } },
            ],
          }),
        ],
      },
      {
        id: "milestone-2",
        code: "M-02",
        name: "Risk milestone",
        status: "AT_RISK",
        progress: 60,
        riskLevel: "HIGH",
        deliveryStage: "IN_DEVELOPMENT",
        releaseHorizon: "RELEASE_1",
        dueDate: new Date("2026-08-01T00:00:00.000Z"),
        currentBlockers: "Management decision is pending.",
        workItems: [],
      },
      {
        id: "milestone-3",
        code: "M-03",
        name: "Later milestone",
        status: "NOT_STARTED",
        progress: 0,
        riskLevel: "LOW",
        deliveryStage: "NOT_STARTED",
        releaseHorizon: "PHASE_2",
        dueDate: new Date("2026-12-01T00:00:00.000Z"),
        currentBlockers: null,
        workItems: [],
      },
    ],
    sharedCapabilities: [
      execution({
        id: "capability-1",
        code: "SC-01",
        name: "Shared verification",
        status: "BLOCKED",
        blocker: "Verification environment is unavailable.",
      }),
    ],
  };
}

describe("project executive overview derivation", () => {
  it("labels equal-weight milestone progress as a planning derivation", () => {
    const overview = buildExecutiveOverview(
      project(),
      new Date("2026-07-25T00:00:00.000Z"),
    );

    expect(overview.derivedPlanningProgress).toBe(33);
    expect(overview.releaseOne).toMatchObject({
      status: "AT_RISK",
      progress: 50,
      total: 2,
    });
    expect(overview.phaseTwo).toMatchObject({
      status: "NOT_STARTED",
      progress: 0,
      total: 1,
    });
  });

  it("uses the earliest active Release 1 stage as the current gate", () => {
    const overview = buildExecutiveOverview(project());
    expect(overview.currentReleaseGate).toBe("IN_DEVELOPMENT");
    expect(overview.recommendedFirstRelease.label).toBe("Release 1");
  });

  it("counts each canonical Shared Capability once globally", () => {
    const overview = buildExecutiveOverview(project());

    expect(overview.blockedItems).toBe(2);
    expect(overview.blockers.map(({ key }) => key)).toEqual([
      "milestone:milestone-2",
      "Shared Capability:capability-1",
    ]);
    expect(overview.workstreams).toEqual([
      {
        code: "FRONTEND",
        total: 1,
        primary: 1,
        supporting: 0,
        completed: 0,
        active: 1,
        blocked: 0,
        planningProgress: 50,
      },
      {
        code: "BACKEND",
        total: 2,
        primary: 1,
        supporting: 1,
        completed: 0,
        active: 2,
        blocked: 1,
        planningProgress: 50,
      },
      {
        code: "DATABASE",
        total: 1,
        primary: 0,
        supporting: 1,
        completed: 0,
        active: 1,
        blocked: 1,
        planningProgress: 50,
      },
    ]);
  });

  it("orders due items and marks overdue records without listing every item", () => {
    const overview = buildExecutiveOverview(
      project(),
      new Date("2026-08-05T00:00:00.000Z"),
    );

    expect(overview.upcomingDueItems).toHaveLength(5);
    expect(overview.upcomingDueItems[0]).toMatchObject({
      code: "M-02",
      isOverdue: true,
    });
    expect(overview.upcomingDueItems[1]).toMatchObject({
      code: "M-01",
      isOverdue: false,
    });
  });
});
