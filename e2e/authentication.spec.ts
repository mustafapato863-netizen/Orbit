import { expect, test } from "@playwright/test";

import { loadQaState, signIn } from "./helpers";

test("protects workspace routes and supports sign-in and sign-out", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/sign-in$/);

  const state = await loadQaState();
  await signIn(page, state.accounts.viewer, state.password);
  await expect(page.getByText("Orbit workspace")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("enforces first-login password change before workspace access", async ({
  page,
}) => {
  const state = await loadQaState();
  await signIn(page, state.accounts.forcedPassword, state.password);

  await expect(page).toHaveURL(/\/change-password$/);
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/change-password$/);
});
