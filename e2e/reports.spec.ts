import { expect, test } from "@playwright/test";

import { loadQaState, signIn } from "./helpers";

test("generates authorized PowerPoint and Excel downloads", async ({ page }) => {
  const state = await loadQaState();
  await signIn(page, state.accounts.administrator, state.password);
  await page.goto(`/projects/${state.projectId}/reports`);
  await expect(
    page.getByRole("heading", { name: "Reports & Exports" }),
  ).toBeVisible();

  for (const [format, mimeType] of [
    [
      "powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    [
      "excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  ] as const) {
    const response = await page.request.post(
      `/api/projects/${state.projectId}/reports/${format}`,
    );
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain(mimeType);
    expect(response.headers()["cache-control"]).toContain("no-store");
    const body = await response.body();
    expect(body.subarray(0, 2).toString("utf8")).toBe("PK");
  }

  await page.reload();
  await expect(page.getByText("PowerPoint snapshot").first()).toBeVisible();
  await expect(page.getByText("Excel snapshot").first()).toBeVisible();
});
