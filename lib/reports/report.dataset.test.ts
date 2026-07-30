import { describe, expect, it } from "vitest";

import {
  assertReportDatasetComplete,
  buildReportDataset,
  OWNER_NOT_ASSIGNED,
} from "@/lib/reports/report.dataset";
import { createReportSourceFixture } from "@/lib/reports/report.test-fixture";

describe("report dataset", () => {
  it("counts canonical packages once and preserves workstream relationships", () => {
    const dataset = buildReportDataset(createReportSourceFixture(), new Date("2026-07-25T12:00:00.000Z"));

    expect(dataset.metrics.workItems).toBe(2);
    expect(dataset.metrics.sharedCapabilities).toBe(1);
    expect(dataset.metrics.canonicalPackages).toBe(3);
    expect(new Set(dataset.canonicalPackages.map(({ canonicalKey }) => canonicalKey)).size).toBe(3);
    expect(dataset.workItems[0]?.owner).toBe(OWNER_NOT_ASSIGNED);

    const backend = dataset.workstreams.find(({ code }) => code === "BACKEND");
    expect(backend?.items.map(({ code, assignment }) => [code, assignment])).toEqual([
      ["WI-001", "Supporting"],
      ["WI-002", "Supporting"],
      ["SC-001", "Primary"],
    ]);
    expect(() => assertReportDatasetComplete(dataset)).not.toThrow();
  });

  it("fails coverage validation when a Work Item is silently omitted", () => {
    const dataset = buildReportDataset(createReportSourceFixture());
    dataset.milestones[0]!.workItems.pop();
    expect(() => assertReportDatasetComplete(dataset)).toThrow(/omitted|count changed/i);
  });
});
