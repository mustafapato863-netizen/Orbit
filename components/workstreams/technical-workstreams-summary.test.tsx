import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TechnicalWorkstreamsSummary } from "@/components/workstreams/technical-workstreams-summary";
import type { DeliveryPipelineView } from "@/lib/pipeline/pipeline";

function textContent(markup: string) {
  return markup
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("Project workstream summary", () => {
  it("counts canonical tasks once and does not repeat average progress", () => {
    const sharedCapability = {
      id: "shared-audit",
      itemKind: "shared",
      name: "Shared audit history",
      status: "IN_PROGRESS",
      progress: 80,
      riskLevel: "LOW",
      dueDate: new Date("2026-08-05T00:00:00.000Z"),
      primaryWorkstream: { code: "DATABASE" },
      supportingWorkstreams: [],
    };
    const pipeline = {
      roadmapGroups: [
        { items: [sharedCapability] },
        { items: [sharedCapability] },
      ],
    } as unknown as DeliveryPipelineView;

    const markup = renderToStaticMarkup(
      <TechnicalWorkstreamsSummary pipeline={pipeline} />,
    );
    const summaryText = textContent(markup);

    expect(markup).toContain('aria-label="Database workstream summary"');
    expect(summaryText).toContain(
      "Database Owner: Unassigned 80% Open items 1 Blockers 0 Health On Track",
    );
    expect(markup).not.toContain("Avg. progress");
  });

  it("shows only active upcoming due items for each workstream", () => {
    const pipeline = {
      roadmapGroups: [
        {
          items: [
            {
              id: "frontend-complete",
              itemKind: "specific",
              name: "Frontend completed item",
              status: "COMPLETED",
              progress: 100,
              riskLevel: "LOW",
              dueDate: new Date("2026-06-03T00:00:00.000Z"),
              primaryWorkstream: { code: "FRONTEND" },
              supportingWorkstreams: [],
            },
            {
              id: "frontend-active",
              itemKind: "specific",
              name: "Frontend active item",
              status: "IN_PROGRESS",
              progress: 55,
              riskLevel: "LOW",
              dueDate: new Date("2026-06-05T00:00:00.000Z"),
              primaryWorkstream: { code: "FRONTEND" },
              supportingWorkstreams: [],
            },
          ],
        },
      ],
    } as unknown as DeliveryPipelineView;

    const markup = renderToStaticMarkup(
      <TechnicalWorkstreamsSummary pipeline={pipeline} />,
    );
    const summaryText = textContent(markup);

    expect(summaryText).toContain("Frontend");
    expect(summaryText).toContain("Frontend active item");
    expect(summaryText).not.toContain("Frontend completed item");
  });
});
