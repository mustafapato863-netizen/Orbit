import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MilestoneList } from "@/components/projects/milestone-list";

describe("MilestoneList", () => {
  it("renders a dynamic sub-milestone timeline table from live work items", () => {
    const markup = renderToStaticMarkup(
      <MilestoneList
        projectId="project-1"
        milestones={[
          {
            id: "milestone-1",
            code: "BPH-01",
            name: "Foundation & Architecture",
            businessPurpose: null,
            status: "IN_PROGRESS",
            progress: 50,
            riskLevel: "LOW",
            releaseHorizon: "RELEASE_1",
            startDate: new Date("2026-06-01T00:00:00.000Z"),
            dueDate: new Date("2026-06-20T00:00:00.000Z"),
            deliveredScope: null,
            remainingScope: null,
            currentBlockers: null,
            nextAction: null,
            firstReleaseImpact: null,
            workItems: [
              {
                id: "work-1",
                code: "BPH-01.1",
                name: "Repository audit & implementation baseline",
                status: "COMPLETED",
                progress: 100,
                riskLevel: "LOW",
                deliveryStage: "PRODUCTION",
                nextGate: null,
                startDate: new Date("2026-06-01T00:00:00.000Z"),
                dueDate: new Date("2026-06-03T00:00:00.000Z"),
                blocker: null,
                owner: null,
                primaryWorkstream: {
                  id: "frontend",
                  code: "FRONTEND",
                  name: "Frontend",
                },
              },
              {
                id: "work-2",
                code: "BPH-01.2",
                name: "Application shell & responsive navigation",
                status: "IN_PROGRESS",
                progress: 80,
                riskLevel: "LOW",
                deliveryStage: "IN_DEVELOPMENT",
                nextGate: null,
                startDate: new Date("2026-06-05T00:00:00.000Z"),
                dueDate: new Date("2026-06-10T00:00:00.000Z"),
                blocker: null,
                owner: null,
                primaryWorkstream: {
                  id: "frontend",
                  code: "FRONTEND",
                  name: "Frontend",
                },
              },
            ],
            sharedCapabilityLinks: [],
          },
        ]}
        canManage={false}
        canManageWorkItems={false}
        canUpdateAssignedWork={false}
        canManageCapabilities={false}
        canUpdateAssignedCapabilities={false}
        currentUserId="user-1"
      />,
    );

    expect(markup).toContain("Sub-milestone timeline");
    expect(markup).toContain("Repository audit &amp; implementation baseline");
    expect(markup).toContain("Application shell &amp; responsive navigation");
    expect(markup).toContain("01 Jun 2026");
    expect(markup).toContain("10 Jun 2026");
    expect(markup).toContain("BPH-01.1");
    expect(markup).toContain("BPH-01.2");
  });
});
