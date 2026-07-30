import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProjectExecutiveSnapshot } from "@/components/projects/project-executive-snapshot";
import type { DeliveryPipelineView } from "@/lib/pipeline/pipeline";

describe("ProjectExecutiveSnapshot", () => {
  it("derives six management cards and project health from live pipeline data", () => {
    const pipeline = {
      asOfDate: new Date("2026-07-30T00:00:00.000Z"),
      roadmapGroups: [
        {
          code: "PH-01",
          name: "Planning",
          progress: 60,
          riskLevel: "HIGH",
          dueDate: new Date("2026-08-10T00:00:00.000Z"),
          items: [
            {
              id: "item-1",
              itemKind: "specific",
              name: "Campaign brief",
              status: "IN_PROGRESS",
              progress: 60,
              riskLevel: "HIGH",
              blocker: null,
              dueDate: new Date("2026-07-20T00:00:00.000Z"),
              owner: { id: "owner-1", displayName: "Project Owner" },
            },
          ],
        },
      ],
    } as unknown as DeliveryPipelineView;

    const markup = renderToStaticMarkup(
      <ProjectExecutiveSnapshot pipeline={pipeline} />,
    );

    expect(markup.match(/<article\b/g) ?? []).toHaveLength(6);
    for (const label of [
      "Overall Progress",
      "Current Phase",
      "Upcoming Milestone",
      "Overdue Items",
      "Active Risks",
      "Team Capacity",
    ]) {
      expect(markup).toContain(label);
    }
    expect(markup).toContain("Project health");
    expect(markup).toContain("Schedule needs attention");
  });
});
