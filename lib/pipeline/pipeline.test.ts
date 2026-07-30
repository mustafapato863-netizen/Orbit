import { describe, expect, it } from "vitest";

import type { DeliveryPipelineProject } from "@/lib/repositories/delivery-pipeline.repository";
import {
  OVERVIEW_STAGES,
  buildDeliveryPipeline,
  buildOverviewJourney,
  nextExpandedMilestone,
  overviewStageFor,
} from "@/lib/pipeline/pipeline";

function execution(
  id: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    code: id.toUpperCase(),
    name: `Package ${id}`,
    description: null,
    status: "IN_PROGRESS",
    progress: 50,
    riskLevel: "MEDIUM",
    deliveryStage: "IN_DEVELOPMENT",
    nextGate: "Technical Verification",
    startDate: new Date("2026-02-01T00:00:00.000Z"),
    dueDate: new Date("2026-04-01T00:00:00.000Z"),
    blocker: null,
    notes: null,
    acceptanceCriteria: null,
    primaryWorkstream: {
      id: "backend",
      code: "BACKEND",
      name: "Backend",
    },
    supportingWorkstreams: [],
    owner: null,
    deliveryStageHistory: [],
    comments: [],
    ...overrides,
  };
}

function projectFixture() {
  const capability = execution("shared", {
    riskLevel: "HIGH",
    primaryWorkstream: {
      id: "database",
      code: "DATABASE",
      name: "Database",
    },
    supportingWorkstreams: [
      {
        workstream: {
          id: "backend",
          code: "BACKEND",
          name: "Backend",
        },
      },
    ],
  });
  const hiddenCapability = execution("hidden", {
    status: "ARCHIVED",
  });
  return {
    id: "project",
    code: "PIPE",
    name: "Pipeline verification",
    description: null,
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    targetDate: new Date("2026-07-31T00:00:00.000Z"),
    milestones: [
      {
        id: "milestone-1",
        code: "M-01",
        name: "First milestone",
        status: "IN_PROGRESS",
        progress: 50,
        riskLevel: "MEDIUM",
        deliveryStage: "IN_DEVELOPMENT",
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        dueDate: new Date("2026-05-01T00:00:00.000Z"),
        workItems: [
          execution("work-1", {
            status: "AT_RISK",
            primaryWorkstream: {
              id: "frontend",
              code: "FRONTEND",
              name: "Frontend",
            },
            supportingWorkstreams: [
              {
                workstream: {
                  id: "backend",
                  code: "BACKEND",
                  name: "Backend",
                },
              },
            ],
          }),
        ],
        sharedCapabilityLinks: [
          {
            sourceReference: "M-01",
            dependencyNotes: null,
            isCritical: true,
            sharedCapability: capability,
          },
        ],
      },
      {
        id: "milestone-2",
        code: "M-02",
        name: "Second milestone",
        status: "NOT_STARTED",
        progress: 0,
        riskLevel: "LOW",
        deliveryStage: "NOT_STARTED",
        startDate: new Date("2026-06-01T00:00:00.000Z"),
        dueDate: new Date("2026-07-01T00:00:00.000Z"),
        workItems: [
          execution("work-2", {
            status: "NOT_STARTED",
            progress: 0,
            deliveryStage: "NOT_STARTED",
            startDate: new Date("2026-06-01T00:00:00.000Z"),
            dueDate: new Date("2026-07-01T00:00:00.000Z"),
          }),
        ],
        sharedCapabilityLinks: [
          {
            sourceReference: "M-02",
            dependencyNotes: null,
            isCritical: false,
            sharedCapability: capability,
          },
        ],
      },
    ],
    sharedCapabilities: [capability, hiddenCapability],
  } as unknown as DeliveryPipelineProject;
}

describe("Delivery Pipeline derivation", () => {
  it("counts canonical packages and Shared Capabilities only once", () => {
    const pipeline = buildDeliveryPipeline(projectFixture());

    expect(pipeline.totalCanonicalPackages).toBe(4);
    expect(pipeline.shownCanonicalPackages).toBe(3);
    expect(pipeline.hiddenCanonicalPackages).toBe(1);
    expect(pipeline.atRiskCount).toBe(2);
    expect(Object.keys(pipeline.overviewStageCounts)).toEqual(
      OVERVIEW_STAGES,
    );
    expect(pipeline.stageDistribution.map(({ stage }) => stage)).toEqual(
      OVERVIEW_STAGES,
    );
    expect(
      pipeline.stageDistribution.reduce(
        (total, stage) => total + stage.count,
        0,
      ),
    ).toBe(4);
  });

  it("groups real cards by Business Milestone while canonical totals stay unique", () => {
    const pipeline = buildDeliveryPipeline(projectFixture());
    expect(
      pipeline.roadmapGroups.map(({ code, id, label, items }) => ({
        code,
        id,
        label,
        cards: items.map(({ id, itemKind }) => ({ id, itemKind })),
      })),
    ).toEqual([
      {
        code: "M-01",
        id: "milestone-1",
        label: "M-01 First milestone",
        cards: [
          { id: "work-1", itemKind: "specific" },
          { id: "shared", itemKind: "shared" },
        ],
      },
      {
        code: "M-02",
        id: "milestone-2",
        label: "M-02 Second milestone",
        cards: [
          { id: "work-2", itemKind: "specific" },
          { id: "shared", itemKind: "shared" },
        ],
      },
    ]);
    expect(pipeline.totalCanonicalPackages).toBe(4);
    expect(
      pipeline.roadmapGroups.flatMap(({ items }) => items).filter(
        ({ id }) => id === "shared",
      ),
    ).toHaveLength(2);
  });

  it("preserves milestone-specific and shared dependency counts", () => {
    const [first, second] = buildDeliveryPipeline(
      projectFixture(),
    ).milestones;

    expect(first).toMatchObject({
      specificWorkCount: 1,
      sharedDependencyCount: 1,
      dominantWorkstream: "BACKEND",
      workstreamCounts: {
        FRONTEND: 1,
        BACKEND: 2,
        DATABASE: 1,
      },
      nextGate: "Under Review",
    });
    expect(second).toMatchObject({
      specificWorkCount: 1,
      sharedDependencyCount: 1,
    });
  });

  it("derives only real upcoming management checkpoints", () => {
    const asOfDate = new Date("2026-03-01T00:00:00.000Z");
    const pipeline = buildDeliveryPipeline(
      projectFixture(),
      asOfDate,
    );
    expect(pipeline.asOfDate).toEqual(asOfDate);
    expect(pipeline.nextEvents.map(({ label }) => label)).toEqual([
      "Next Start",
      "Next Review",
    ]);
    expect(pipeline.nextEvents[0]).toMatchObject({
      date: new Date("2026-06-01T00:00:00.000Z"),
      packageCode: "WORK-2",
      isOverdue: false,
    });
    expect(pipeline.nextEvents[1]).toMatchObject({
      date: new Date("2026-04-01T00:00:00.000Z"),
    });
    expect(
      pipeline.nextEvents.some(({ packageCode }) => packageCode === "HIDDEN"),
    ).toBe(false);
    expect(pipeline.timeline.months).toHaveLength(7);
    expect(pipeline.timeline.start).toEqual(
      new Date("2026-01-01T00:00:00.000Z"),
    );
    expect(pipeline.timeline.end).toEqual(
      new Date("2026-08-01T00:00:00.000Z"),
    );
  });

  it("maps canonical delivery state into exactly five overview stages", () => {
    expect(OVERVIEW_STAGES).toEqual([
      "NOT_STARTED",
      "IN_PROGRESS",
      "READY_FOR_CHECK",
      "READY_FOR_PRODUCTION",
      "LIVE",
    ]);
    expect(
      [
        "NOT_STARTED",
        "IN_DEVELOPMENT",
        "TECHNICAL_VERIFICATION",
        "BUSINESS_UAT",
        "STAGING",
        "CONTROLLED_PILOT",
        "PRODUCTION",
      ].map(overviewStageFor),
    ).toEqual([
      "NOT_STARTED",
      "IN_PROGRESS",
      "READY_FOR_CHECK",
      "READY_FOR_CHECK",
      "READY_FOR_PRODUCTION",
      "READY_FOR_PRODUCTION",
      "LIVE",
    ]);
  });

  it("builds the five-step journey from actual and planned checkpoints", () => {
    const journey = buildOverviewJourney({
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      dueDate: new Date("2026-04-01T00:00:00.000Z"),
      deliveryStage: "IN_DEVELOPMENT",
      nextGate: "Ready for check",
      deliveryStageHistory: [],
      actualStartDate: new Date("2026-01-12T00:00:00.000Z"),
      plannedStartDate: new Date("2026-01-10T00:00:00.000Z"),
      plannedCheckDate: new Date("2026-02-01T00:00:00.000Z"),
      plannedProductionReadyDate: new Date("2026-03-01T00:00:00.000Z"),
      plannedGoLiveDate: new Date("2026-04-01T00:00:00.000Z"),
    });

    expect(journey.currentStage).toBe("IN_PROGRESS");
    expect(journey.markers).toEqual([
      {
        code: "GO",
        stage: "IN_PROGRESS",
        date: new Date("2026-01-12T00:00:00.000Z"),
        actual: true,
      },
      {
        code: "REV",
        stage: "READY_FOR_CHECK",
        date: new Date("2026-02-01T00:00:00.000Z"),
        actual: false,
      },
      {
        code: "APR",
        stage: "READY_FOR_PRODUCTION",
        date: new Date("2026-03-01T00:00:00.000Z"),
        actual: false,
      },
      {
        code: "DONE",
        stage: "LIVE",
        date: new Date("2026-04-01T00:00:00.000Z"),
        actual: false,
      },
    ]);
  });

  it("uses the due date as the LIVE endpoint for completed work without a live checkpoint", () => {
    const journey = buildOverviewJourney({
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      dueDate: new Date("2026-06-10T00:00:00.000Z"),
      deliveryStage: "PRODUCTION",
      lifecycleStage: "LIVE",
      nextGate: null,
      deliveryStageHistory: [],
    });

    expect(journey.currentStage).toBe("LIVE");
    expect(journey.markers).toEqual([
      {
        code: "GO",
        stage: "IN_PROGRESS",
        date: new Date("2026-06-01T00:00:00.000Z"),
        actual: false,
      },
      {
        code: "DONE",
        stage: "LIVE",
        date: new Date("2026-06-10T00:00:00.000Z"),
        actual: false,
      },
    ]);
  });

  it("allows at most one expanded milestone", () => {
    expect(nextExpandedMilestone(null, "milestone-1")).toBe("milestone-1");
    expect(
      nextExpandedMilestone("milestone-1", "milestone-2"),
    ).toBe("milestone-2");
    expect(
      nextExpandedMilestone("milestone-2", "milestone-2"),
    ).toBeNull();
  });
});
