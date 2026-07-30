import { expect, test } from "vitest";

import { generateReportSamples } from "./generate-report-samples";

test("generates the seeded PMS sample report files", async () => {
  const result = await generateReportSamples();

  expect(result.workItems).toBeGreaterThan(0);
  expect(result.sharedCapabilities).toBeGreaterThan(0);
});
