import { expect, type Page } from "@playwright/test";

import { loadQaState, type QaState } from "./qa-database";

export async function signIn(
  page: Page,
  account: QaState["accounts"][keyof QaState["accounts"]],
  password: string,
) {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/sign-in/);
}

export { loadQaState };
