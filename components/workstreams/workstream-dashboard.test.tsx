import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WorkstreamDashboard } from "@/components/workstreams/workstream-dashboard";
import type { WorkstreamView } from "@/lib/workstreams/workstreams";

describe("WorkstreamDashboard", () => {
  it("renders Primary and Supporting items without duplicating the unique count", () => {
    const base = {
      code: "ITEM",
      status: "IN_PROGRESS",
      progress: 50,
      dueDate: new Date("2026-08-01"),
      blocker: null,
      riskLevel: "LOW",
      deliveryStage: "IN_DEVELOPMENT",
      milestoneNames: ["Business Milestone"],
    };
    const view = {
      project: { id: "project-1", code: "PMS", name: "PMS Dashboard" },
      workstream: { id: "frontend", code: "FRONTEND", slug: "frontend", name: "Frontend" },
      items: [
        { ...base, key: "work-item:1", id: "1", kind: "Work Item", name: "Primary item", assignment: "Primary" },
        { ...base, key: "shared-capability:2", id: "2", kind: "Shared Capability", name: "Supporting capability", assignment: "Supporting" },
      ],
      metrics: {
        unique: 2,
        primary: 1,
        supporting: 1,
        completed: 0,
        inProgress: 2,
        blocked: 0,
        pending: 0,
        averageProgress: 50,
      },
      upcomingDueItems: [],
      relatedMilestones: ["Business Milestone"],
      blockers: [],
    } as WorkstreamView;

    const markup = renderToStaticMarkup(<WorkstreamDashboard view={view} />);
    expect(markup).toContain("Unique related items");
    expect(markup).toContain("Primary item");
    expect(markup).toContain("Supporting capability");
    expect(markup).toContain("Average derived progress");
  });
});
