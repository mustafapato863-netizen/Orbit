import { describe, expect, it } from "vitest";

import { createDecisionSchema, createRiskSchema } from "@/lib/governance/governance.schemas";

describe("governance validation", () => {
  it("requires a target ID for a typed Risk target", () => {
    const result = createRiskSchema.safeParse({
      projectId: "3d594650-3436-4caa-a832-5c53a913b072",
      title: "Risk",
      description: "Description",
      probability: 3,
      impact: 4,
      milestoneId: "",
      targetType: "WORK_ITEM",
      targetId: "",
      primaryWorkstreamId: "",
      ownerId: "",
      mitigation: "",
      dueDate: "",
      status: "OPEN",
    });
    expect(result.success).toBe(false);
  });

  it("prevents duplicate affected Workstreams", () => {
    const id = "3d594650-3436-4caa-a832-5c53a913b072";
    const result = createDecisionSchema.safeParse({
      projectId: id,
      title: "Required decision",
      description: "Description",
      milestoneId: "",
      affectedWorkstreamIds: [id, id],
      requiredBy: "",
      recommendedDirection: "",
      ownerId: "",
      status: "PENDING",
      decisionText: "",
    });
    expect(result.success).toBe(false);
  });
});
