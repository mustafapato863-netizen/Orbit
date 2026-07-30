import { describe, expect, it } from "vitest";

import { env } from "@/lib/env";
import { buildReportDataset } from "@/lib/reports/report.dataset";
import { assertDatasetContainsNoSecrets } from "@/lib/reports/report.service";
import { createReportSourceFixture } from "@/lib/reports/report.test-fixture";

describe("report secret guard", () => {
  it("rejects a dataset containing a server-only secret without exposing it", () => {
    const dataset = buildReportDataset(createReportSourceFixture());
    const authSecret = env.AUTH_SECRET;
    if (!authSecret) throw new Error("AUTH_SECRET must be validated before report tests.");
    dataset.project.description = authSecret;
    let rejected = false;
    try {
      assertDatasetContainsNoSecrets(dataset);
    } catch {
      rejected = true;
    }
    expect(rejected).toBe(true);
  });
});

