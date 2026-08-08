import { describe, expect, it } from "vitest";

import {
  createMilestonePlanSchema,
  createMilestoneSchema,
  createProjectSchema,
} from "@/lib/projects/project.schemas";
import {
  calculateDurationDays,
  calculateEndDateFromDuration,
  slugifyProject,
} from "@/lib/projects/project.utils";

describe("project and milestone validation", () => {
  it("accepts a valid project without asking for a code", () => {
    expect(
      createProjectSchema.safeParse({
        name: "Orbit Delivery",
        description: "",
        status: "PLANNING",
        progress: 0,
        isPrivate: false,
        startDate: "2026-08-01",
        targetDate: "2026-12-31",
      }).success,
    ).toBe(true);
    expect(slugifyProject("Orbit Delivery", "ORB-01")).toBe(
      "orbit-delivery-orb-01",
    );
  });

  it("rejects invalid progress and project date ordering", () => {
    const result = createProjectSchema.safeParse({
      name: "Orbit",
      description: "",
      status: "ACTIVE",
      progress: 101,
      isPrivate: false,
      startDate: "2026-09-02",
      targetDate: "2026-09-01",
    });

    expect(result.success).toBe(false);
  });

  it("keeps project visibility explicit", () => {
    const result = createProjectSchema.safeParse({
      name: "Confidential initiative",
      description: "",
      status: "PLANNING",
      progress: 0,
      isPrivate: true,
      startDate: "",
      targetDate: "",
    });

    expect(result.success && result.data.isPrivate).toBe(true);
  });

  it("validates milestone release horizon and due date ordering", () => {
    const base = {
      projectId: "2f0f1fc4-7e6a-43df-a32b-f3a44dbb6dd1",
      name: "Business launch",
      businessPurpose: "Enable launch readiness.",
      status: "IN_PROGRESS",
      progress: 50,
      riskLevel: "MEDIUM",
      releaseHorizon: "RELEASE_1",
      startDate: "2026-08-10",
      dueDate: "2026-08-01",
      deliveredScope: "",
      remainingScope: "",
      currentBlockers: "",
      nextAction: "",
      firstReleaseImpact: "",
    };

    expect(createMilestoneSchema.safeParse(base).success).toBe(false);
    expect(
      createMilestoneSchema.safeParse({
        ...base,
        startDate: "2026-08-01",
        dueDate: "2026-08-10",
      }).success,
    ).toBe(true);
  });

  it("validates a concise milestone plan with ordered sub-milestones", () => {
    const result = createMilestonePlanSchema.safeParse({
      projectId: "2f0f1fc4-7e6a-43df-a32b-f3a44dbb6dd1",
      name: "Project foundation",
      subMilestones: [
        {
          name: "Confirm scope",
          startDate: "2026-08-01",
          dueDate: "2026-08-03",
        },
        {
          name: "Approve baseline",
          startDate: "2026-08-04",
          dueDate: "2026-08-06",
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(
      createMilestonePlanSchema.safeParse({
        projectId: "2f0f1fc4-7e6a-43df-a32b-f3a44dbb6dd1",
        name: "Project foundation",
        subMilestones: [],
      }).success,
    ).toBe(false);
  });

  it("calculates duration in days and end dates correctly", () => {
    expect(calculateDurationDays("2026-08-01", "2026-08-10")).toBe(9);
    expect(calculateDurationDays("2026-08-01", "")).toBe("");
    expect(calculateEndDateFromDuration("2026-08-01", 9)).toBe("2026-08-10");
    expect(calculateEndDateFromDuration("2026-08-01", 30)).toBe("2026-08-31");
  });
});
