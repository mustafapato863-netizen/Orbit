import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PhaseSummaryTable } from "@/components/projects/phase-summary-table";
import type { DeliveryPipelineView } from "@/lib/pipeline/pipeline";

describe("PhaseSummaryTable", () => {
  it("renders phases from the real roadmap groups", () => {
    const markup = renderToStaticMarkup(
      <PhaseSummaryTable
        pipeline={
          {
            roadmapGroups: [
              {
                code: "PH-01",
                name: "Requirements, Scope & Solution Architecture",
                progress: 100,
                startDate: new Date("2026-06-01T00:00:00.000Z"),
                dueDate: new Date("2026-06-10T00:00:00.000Z"),
              },
              {
                code: "PH-07",
                name: "Production Rollout, Handover & Sign-off",
                progress: 0,
                startDate: new Date("2026-09-21T00:00:00.000Z"),
                dueDate: new Date("2026-09-30T00:00:00.000Z"),
              },
            ],
          } as unknown as DeliveryPipelineView
        }
        viewMode="technical"
        onPhaseClick={() => undefined}
      />,
    );
    const body = markup.match(/<tbody[\s\S]*?<\/tbody>/)?.[0] ?? "";

    expect(body.match(/<tr\b/g) ?? []).toHaveLength(2);
    expect(body).toContain("Requirements, Scope &amp; Solution Architecture");
    expect(body).toContain(
      "Production Rollout, Handover &amp; Sign-off",
    );
    expect(body).toContain("01 Jun 2026");
    expect(body).toContain("30 Sept 2026");
    expect(body).toContain('role="button"');
    expect(body).toContain('aria-label="Jump to timeline for PH-01"');
  });

  it("keeps existing business-coded phases in the unified summary", () => {
    const markup = renderToStaticMarkup(
      <PhaseSummaryTable
        pipeline={
          {
            roadmapGroups: [
              {
                code: "BPH-01",
                name: "Business Delivery — Operational Scope, KPI Governance & Team Onboarding",
                progress: 100,
                startDate: new Date("2026-06-01T00:00:00.000Z"),
                dueDate: new Date("2026-06-20T00:00:00.000Z"),
              },
              {
                code: "BPH-07",
                name: "Business Delivery — Reporting, Management Review & Business Adoption",
                progress: 40,
                startDate: new Date("2026-09-07T00:00:00.000Z"),
                dueDate: new Date("2026-09-30T00:00:00.000Z"),
              },
            ],
          } as unknown as DeliveryPipelineView
        }
        viewMode="business"
      />,
    );
    const body = markup.match(/<tbody[\s\S]*?<\/tbody>/)?.[0] ?? "";

    expect(body.match(/<tr\b/g) ?? []).toHaveLength(2);
    expect(body).toContain("Operational Scope, KPI Governance &amp; Team Onboarding");
    expect(body).toContain(
      "Reporting, Management Review &amp; Business Adoption",
    );
    expect(body).toContain("20 Jun 2026");
    expect(body).toContain("30 Sept 2026");
  });

  it("shows a real-data empty state when no roadmap groups are present", () => {
    const markup = renderToStaticMarkup(
      <PhaseSummaryTable
        pipeline={{ roadmapGroups: [] } as unknown as DeliveryPipelineView}
        viewMode="overall"
      />,
    );
    const body = markup.match(/<tbody[\s\S]*?<\/tbody>/)?.[0] ?? "";

    expect(body).toContain("No phase delivery data is available yet.");
  });

});
