import { describe, expect, it } from "vitest";

import { buildWorkstreamView } from "@/lib/workstreams/workstreams";

function item(id: string, primary: "FRONTEND" | "BACKEND" | "DATABASE", supports: Array<"FRONTEND" | "BACKEND" | "DATABASE"> = []) {
  return {
    id,
    code: id,
    name: id,
    description: null,
    status: "IN_PROGRESS" as const,
    progress: 40,
    riskLevel: "LOW" as const,
    deliveryStage: "IN_DEVELOPMENT" as const,
    nextGate: null,
    startDate: null,
    dueDate: new Date("2026-08-01"),
    blocker: null,
    notes: null,
    acceptanceCriteria: null,
    primaryWorkstream: { id: primary, code: primary, name: primary },
    supportingWorkstreams: supports.map((code) => ({
      workstream: { id: code, code, name: code },
    })),
    owner: null,
    deliveryStageHistory: [],
    comments: [],
  };
}

describe("buildWorkstreamView", () => {
  it("counts canonical items once and preserves Primary versus Supporting", () => {
    const shared = item("shared", "BACKEND", ["FRONTEND"]);
    const project = {
      id: "project",
      code: "PMS",
      name: "PMS",
      description: null,
      startDate: null,
      targetDate: null,
      milestones: [
        {
          id: "m1",
          code: "M1",
          name: "One",
          status: "IN_PROGRESS" as const,
          progress: 20,
          riskLevel: "LOW" as const,
          deliveryStage: "IN_DEVELOPMENT" as const,
          releaseHorizon: "RELEASE_1" as const,
          startDate: null,
          dueDate: null,
          workItems: [item("specific", "FRONTEND")],
          sharedCapabilityLinks: [
            { sourceReference: null, dependencyNotes: null, isCritical: false, sharedCapability: shared },
          ],
        },
        {
          id: "m2",
          code: "M2",
          name: "Two",
          status: "NOT_STARTED" as const,
          progress: 0,
          riskLevel: "LOW" as const,
          deliveryStage: "NOT_STARTED" as const,
          releaseHorizon: "RELEASE_1" as const,
          startDate: null,
          dueDate: null,
          workItems: [],
          sharedCapabilityLinks: [
            { sourceReference: null, dependencyNotes: null, isCritical: false, sharedCapability: shared },
          ],
        },
      ],
      sharedCapabilities: [shared],
    };

    const result = buildWorkstreamView(project, {
      id: "FRONTEND",
      code: "FRONTEND",
      slug: "frontend",
      name: "Frontend",
    });
    expect(result.metrics).toMatchObject({
      unique: 2,
      primary: 1,
      supporting: 1,
      averageProgress: 40,
    });
    expect(result.items.filter(({ id }) => id === "shared")).toHaveLength(1);
    expect(result.relatedMilestones).toEqual(["One", "Two"]);
  });
});
