import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PipelineSummary } from "@/components/pipeline/pipeline-summary";
import { buildDeliveryPipeline } from "@/lib/pipeline/pipeline";
import type { DeliveryPipelineProject } from "@/lib/repositories/delivery-pipeline.repository";

const VISUAL_STAGE_LABELS = [
  "Not Started",
  "In Development",
  "In Review",
  "UAT",
  "Staging",
  "Production",
] as const;

function execution(
  id: string,
  deliveryStage: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    code: id.toUpperCase(),
    name: `Package ${id}`,
    description: null,
    status: "IN_PROGRESS",
    progress: 50,
    riskLevel: "MEDIUM",
    deliveryStage,
    nextGate: null,
    startDate: new Date("2026-08-01T00:00:00.000Z"),
    dueDate: new Date("2026-10-01T00:00:00.000Z"),
    blocker: null,
    notes: null,
    acceptanceCriteria: null,
    primaryWorkstream: {
      id: "backend",
      code: "BACKEND",
      name: "Backend",
    },
    supportingWorkstreams: [],
    owner: null,
    deliveryStageHistory: [],
    comments: [],
    ...overrides,
  };
}

function projectFixture() {
  return {
    id: "project",
    code: "PIPE",
    name: "Pipeline verification",
    description: null,
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    targetDate: new Date("2026-12-31T00:00:00.000Z"),
    milestones: [
      {
        id: "milestone-1",
        code: "M-01",
        name: "Customer Insights",
        status: "IN_PROGRESS",
        progress: 60,
        riskLevel: "MEDIUM",
        deliveryStage: "IN_DEVELOPMENT",
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        dueDate: new Date("2026-12-01T00:00:00.000Z"),
        workItems: [
          execution("planned", "NOT_STARTED", {
            status: "NOT_STARTED",
            progress: 0,
            startDate: new Date("2026-08-10T00:00:00.000Z"),
          }),
          execution("active", "IN_DEVELOPMENT", {
            progress: 45,
            dueDate: new Date("2026-09-18T00:00:00.000Z"),
          }),
          execution("review", "TECHNICAL_VERIFICATION", {
            progress: 70,
            dueDate: new Date("2026-10-20T00:00:00.000Z"),
          }),
          execution("uat", "BUSINESS_UAT", {
            progress: 80,
            dueDate: new Date("2026-11-01T00:00:00.000Z"),
          }),
          execution("staging", "STAGING", {
            progress: 90,
            dueDate: new Date("2026-11-15T00:00:00.000Z"),
          }),
          execution("pilot", "CONTROLLED_PILOT", {
            progress: 95,
            dueDate: new Date("2026-12-01T00:00:00.000Z"),
          }),
          execution("live", "PRODUCTION", {
            status: "COMPLETED",
            progress: 100,
            dueDate: new Date("2026-06-01T00:00:00.000Z"),
          }),
          execution("archived", "PRODUCTION", {
            status: "ARCHIVED",
            progress: 100,
            dueDate: new Date("2026-05-01T00:00:00.000Z"),
          }),
        ],
        sharedCapabilityLinks: [],
      },
    ],
    sharedCapabilities: [],
  } as unknown as DeliveryPipelineProject;
}

function textContent(markup: string) {
  return markup
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function labelledSection(markup: string, label: string) {
  const labelIndex = markup.indexOf(`aria-label="${label}"`);
  expect(labelIndex).toBeGreaterThanOrEqual(0);
  const start = markup.lastIndexOf("<section", labelIndex);
  const end = markup.indexOf("</section>", labelIndex);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(labelIndex);
  return markup.slice(start, end + "</section>".length);
}

describe("Delivery Pipeline summary presentation", () => {
  it("presents the canonical delivery data through the six roadmap stages", () => {
    const pipeline = buildDeliveryPipeline(
      projectFixture(),
      new Date("2026-07-25T00:00:00.000Z"),
    );
    const markup = renderToStaticMarkup(
      <PipelineSummary pipeline={pipeline} />,
    );
    const statusText = textContent(
      labelledSection(markup, "Work package status summary"),
    );
    const statusSection = labelledSection(
      markup,
      "Work package status summary",
    );
    expect(statusSection.match(/<article\b/g) ?? []).toHaveLength(7);
    expect(statusText).toContain("8 Total work");
    expect(statusText).toContain("7 shown · 1 hidden");
    for (const label of VISUAL_STAGE_LABELS) {
      expect(statusText).toContain(label);
    }
    expect(markup).not.toContain("Overall stage distribution");
    expect(markup).not.toContain('aria-label="Overall progress"');
  });

  it("renders one compact distribution section from the same canonical counts", () => {
    const pipeline = buildDeliveryPipeline(
      projectFixture(),
      new Date("2026-07-25T00:00:00.000Z"),
    );
    const markup = renderToStaticMarkup(
      <PipelineSummary pipeline={pipeline} />,
    );
    const distributionText = textContent(
      labelledSection(markup, "Stage distribution"),
    );

    expect(distributionText).toContain("Stage distribution (All 8 work items)");
    expect(distributionText).toContain("Not Started (1)");
    expect(distributionText).toContain("Staging (2)");
    expect(distributionText).toContain("Production (2)");
    expect(distributionText).not.toContain("Package archived");
  });
});
