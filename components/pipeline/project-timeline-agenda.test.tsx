import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProjectTimelineAgenda } from "@/components/pipeline/project-timeline-agenda";
import type { DeliveryPipelineView } from "@/lib/pipeline/pipeline";

function item(
  id: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    itemKind: "specific",
    name: `Item ${id}`,
    status: "IN_PROGRESS",
    riskLevel: "MEDIUM",
    progress: 60,
    deliveryStage: "IN_DEVELOPMENT",
    startDate: new Date("2026-07-25T00:00:00.000Z"),
    dueDate: new Date("2026-08-05T00:00:00.000Z"),
    primaryWorkstream: { code: "BACKEND", name: "Backend" },
    supportingWorkstreams: [],
    ...overrides,
  };
}

describe("ProjectTimelineAgenda", () => {
  it("shows active work with start, due, progress, and editable project links", () => {
    const pipeline = {
      asOfDate: new Date("2026-07-30T00:00:00.000Z"),
      roadmapGroups: [
        {
          id: "phase-1",
          code: "PH-01",
          name: "Foundation",
          items: [
            item("active", { name: "Active API delivery" }),
            item("risk", {
              name: "Risk review",
              status: "AT_RISK",
              progress: 35,
              dueDate: new Date("2026-07-29T00:00:00.000Z"),
            }),
            item("future", {
              name: "Future dashboard",
              status: "NOT_STARTED",
              progress: 0,
              deliveryStage: "NOT_STARTED",
              startDate: new Date("2026-08-02T00:00:00.000Z"),
              dueDate: new Date("2026-08-10T00:00:00.000Z"),
            }),
          ],
        },
      ],
    } as unknown as DeliveryPipelineView;

    const markup = renderToStaticMarkup(
      <ProjectTimelineAgenda pipeline={pipeline} projectId="project-1" />,
    );

    expect(markup).toContain("Today&#x27;s focus");
    expect(markup).toContain("Active API delivery");
    expect(markup).toContain("25 Jul 2026");
    expect(markup).toContain("5 Aug 2026");
    expect(markup).toContain("60%");
    expect(markup).toContain("Dated agenda");
    expect(markup).toContain("Risk review");
    expect(markup).toContain("Future dashboard");
    expect(markup).toContain("At Risk");
    expect(markup).toContain(
      'href="/projects/project-1/milestones/phase-1/work-items/active/edit"',
    );
  });
});
