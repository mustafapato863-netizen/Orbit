import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  assignedExecutionSchema,
  createSharedCapabilitySchema,
  createWorkItemSchema,
} from "@/lib/execution/execution.schemas";

const projectId = randomUUID();
const milestoneId = randomUUID();
const primaryWorkstreamId = randomUUID();
const supportingWorkstreamId = randomUUID();

const workItem = {
  projectId,
  milestoneId,
  code: "WI-01",
  name: "Technical Work Item",
  description: "Milestone-specific work.",
  primaryWorkstreamId,
  supportingWorkstreamIds: [supportingWorkstreamId],
  status: "IN_PROGRESS",
  progress: 45,
  deliveryStage: "IN_DEVELOPMENT",
  nextGate: "Technical verification",
  startDate: "2026-08-01",
  dueDate: "2026-09-01",
  ownerId: "",
  riskLevel: "MEDIUM",
  blocker: "",
  notes: "Implementation notes.",
  acceptanceCriteria: "Representative behavior is verified.",
} as const;

describe("technical execution validation", () => {
  it("accepts a complete milestone-specific Work Item", () => {
    expect(createWorkItemSchema.safeParse(workItem).success).toBe(true);
  });

  it("accepts In Progress items with progress above 10%", () => {
    expect(
      createWorkItemSchema.safeParse({
        ...workItem,
        progress: 90,
      }).success,
    ).toBe(true);
    expect(
      assignedExecutionSchema.safeParse({
        workItemId: randomUUID(),
        status: "IN_PROGRESS",
        progress: 90,
        deliveryStage: "IN_DEVELOPMENT",
        nextGate: "Technical verification",
        riskLevel: "MEDIUM",
        blocker: "",
        notes: "",
      }).success,
    ).toBe(true);
  });

  it("rejects In Progress items at 10% or below", () => {
    const result = createWorkItemSchema.safeParse({
      ...workItem,
      progress: 10,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.progress?.[0]).toContain(
        "above 10%",
      );
    }
  });

  it("rejects Primary Workstream duplication and invalid dates", () => {
    expect(
      createWorkItemSchema.safeParse({
        ...workItem,
        supportingWorkstreamIds: [primaryWorkstreamId],
        startDate: "2026-09-02",
        dueDate: "2026-09-01",
      }).success,
    ).toBe(false);
  });

  it("requires unique Shared Capability milestone links", () => {
    const capability = {
      ...workItem,
      code: "SC-AUTH",
      name: "Authentication & Session Security",
      milestoneLinks: [
        {
          milestoneId,
          sourceReference: "PMS-11 access dependency",
          dependencyNotes: "Consumes canonical session enforcement.",
          isCritical: true,
        },
        {
          milestoneId,
          sourceReference: "Duplicate",
          dependencyNotes: "",
          isCritical: false,
        },
      ],
    };
    expect(createSharedCapabilitySchema.safeParse(capability).success).toBe(
      false,
    );
    expect(
      createSharedCapabilitySchema.safeParse({
        ...capability,
        milestoneLinks: [
          capability.milestoneLinks[0],
          {
            ...capability.milestoneLinks[1],
            milestoneId: randomUUID(),
          },
        ],
      }).success,
    ).toBe(true);
  });
});
