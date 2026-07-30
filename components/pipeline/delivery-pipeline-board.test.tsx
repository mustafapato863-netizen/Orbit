import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DeliveryPipelineBoard } from "@/components/pipeline/delivery-pipeline-board";
import { TimelineRoadmapPanel } from "@/components/pipeline/timeline-roadmap-panel";
import { buildDeliveryPipeline } from "@/lib/pipeline/pipeline";
import type { DeliveryPipelineProject } from "@/lib/repositories/delivery-pipeline.repository";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const VISUAL_STAGE_LABELS = [
  "Not Started",
  "In Progress",
  "Under Review",
  "Approved",
  "Completed",
] as const;

function execution(
  id: string,
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
    deliveryStage: "IN_DEVELOPMENT",
    nextGate: "Ready for check",
    startDate: new Date("2026-01-10T00:00:00.000Z"),
    dueDate: new Date("2026-04-10T00:00:00.000Z"),
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
    deliveryStageHistory: [
      {
        fromStage: "NOT_STARTED",
        toStage: "IN_DEVELOPMENT",
        changedAt: new Date("2026-02-10T00:00:00.000Z"),
      },
    ],
    comments: [],
    ...overrides,
  };
}

function projectFixture() {
  const sharedCapability = execution("shared-authentication", {
    name: "Shared Authentication",
    primaryWorkstream: {
      id: "database",
      code: "DATABASE",
      name: "Database",
    },
  });
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
        progress: 50,
        riskLevel: "MEDIUM",
        deliveryStage: "IN_DEVELOPMENT",
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        dueDate: new Date("2026-06-01T00:00:00.000Z"),
        workItems: [
          execution("analytics-dashboard", {
            name: "Analytics Dashboard",
            primaryWorkstream: {
              id: "frontend",
              code: "FRONTEND",
              name: "Frontend",
            },
          }),
          execution("analytics-api", {
            name: "Analytics API",
            status: "AT_RISK",
          }),
        ],
        sharedCapabilityLinks: [
          {
            sourceReference: "M-01",
            dependencyNotes: null,
            isCritical: true,
            sharedCapability,
          },
        ],
      },
      {
        id: "milestone-2",
        code: "M-02",
        name: "Checkout Launch",
        status: "NOT_STARTED",
        progress: 0,
        riskLevel: "LOW",
        deliveryStage: "NOT_STARTED",
        startDate: new Date("2026-07-01T00:00:00.000Z"),
        dueDate: new Date("2026-12-01T00:00:00.000Z"),
        workItems: [
          execution("checkout-api", {
            name: "Checkout API",
            status: "NOT_STARTED",
            progress: 0,
            deliveryStage: "NOT_STARTED",
            startDate: new Date("2026-07-01T00:00:00.000Z"),
            dueDate: new Date("2026-12-01T00:00:00.000Z"),
          }),
        ],
        sharedCapabilityLinks: [],
      },
    ],
    sharedCapabilities: [sharedCapability],
  } as unknown as DeliveryPipelineProject;
}

function labelledElement(markup: string, tag: string, label: string) {
  const labelIndex = markup.indexOf(`aria-label="${label}"`);
  expect(labelIndex).toBeGreaterThanOrEqual(0);
  const start = markup.lastIndexOf(`<${tag}`, labelIndex);
  const end = markup.indexOf(`</${tag}>`, labelIndex);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(labelIndex);
  return markup.slice(start, end + `</${tag}>`.length);
}

describe("Delivery Pipeline roadmap presentation", () => {
  it("groups real delivery cards by Business Milestone rather than workstream", () => {
    const pipeline = buildDeliveryPipeline(
      projectFixture(),
      new Date("2026-03-01T00:00:00.000Z"),
    );
    const markup = renderToStaticMarkup(
      <DeliveryPipelineBoard pipeline={pipeline} projectId="project" />,
    );

    expect(markup).toContain("Customer Insights");
    expect(markup).toContain("Checkout Launch");
    expect(markup).toContain("Analytics Dashboard");
    expect(markup).toContain("Edit phase");
    expect(markup).toContain("Multiple open");
    expect(markup).toContain("Edit Analytics Dashboard");
    expect(markup).not.toContain("Archive");
    expect(markup).toContain("<article");
    expect(markup).not.toContain("No scheduled item");
  });

  it("renders a five-step mobile journey for each visible delivery card", () => {
    const pipeline = buildDeliveryPipeline(
      projectFixture(),
      new Date("2026-03-01T00:00:00.000Z"),
    );
    const markup = renderToStaticMarkup(
      <DeliveryPipelineBoard pipeline={pipeline} projectId="project" />,
    );
    const journey = labelledElement(
      markup,
      "ol",
      "Delivery stage journey",
    );

    expect(journey.match(/<li\b/g) ?? []).toHaveLength(5);
    for (const label of VISUAL_STAGE_LABELS) {
      expect(journey).toContain(label);
    }
  });

  it("keeps the timeline grouping labels aligned with delivery phases", () => {
    const pipeline = buildDeliveryPipeline(
      projectFixture(),
      new Date("2026-03-01T00:00:00.000Z"),
    );
    const markup = renderToStaticMarkup(
      <TimelineRoadmapPanel
        pipeline={pipeline}
        projectId="project"
        groups={pipeline.roadmapGroups}
        viewMode="technical"
        onViewModeChange={() => undefined}
      />,
    );

    expect(markup).toContain(
      "Execution phases coloured by their dominant workstream.",
    );
    expect(markup).toContain(
      'aria-label="Group roadmap by, current option Delivery Phases"',
    );
    expect(markup).toContain(
      'aria-label="Scrollable technical phase timeline"',
    );
    expect(markup).toContain(
      'aria-label="Project workstream colour legend"',
    );
    expect(markup).toContain("Frontend");
    expect(markup).toContain("Backend");
    expect(markup).toContain("Database");
    expect(markup).toContain("bg-[#2f6fe4]");
    expect(markup).toContain("bg-[#17924f]");
    expect(markup).toContain("bg-[#e8890c]");
    expect(markup).toContain('title="Customer Insights"');
    expect(markup).not.toContain(
      "Business milestones grouped by Business Milestone.",
    );
  });
});
