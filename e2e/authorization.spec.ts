import { expect, test } from "@playwright/test";

import { loadQaState, signIn } from "./helpers";

test("enforces administration permission and project membership", async ({
  browser,
}) => {
  const state = await loadQaState();
  const viewerContext = await browser.newContext();
  const viewerPage = await viewerContext.newPage();
  await signIn(viewerPage, state.accounts.viewer, state.password);

  await viewerPage.goto("/access");
  await expect(
    viewerPage.getByRole("heading", { name: "Access denied" }),
  ).toBeVisible();
  await viewerPage.goto(`/projects/${state.projectId}`);
  await expect(
    viewerPage.getByRole("heading", { name: "Phase 11 Release QA" }),
  ).toBeVisible();
  const forbiddenExport = await viewerPage.request.post(
    `/api/projects/${state.projectId}/reports/excel`,
  );
  expect(forbiddenExport.status()).toBe(403);
  await viewerContext.close();

  const outsiderContext = await browser.newContext();
  const outsiderPage = await outsiderContext.newPage();
  await signIn(outsiderPage, state.accounts.outsider, state.password);
  await outsiderPage.goto(`/projects/${state.projectId}`);
  await expect(
    outsiderPage.getByRole("heading", { name: "Access denied" }),
  ).toBeVisible();
  await outsiderContext.close();
});

test("rejects cross-origin report mutations before authorization", async ({
  page,
}) => {
  const state = await loadQaState();
  await signIn(page, state.accounts.administrator, state.password);

  const response = await page.request.post(
    `/api/projects/${state.projectId}/reports/powerpoint`,
    { headers: { origin: "https://attacker.example" } },
  );

  expect(response.status()).toBe(403);
});
