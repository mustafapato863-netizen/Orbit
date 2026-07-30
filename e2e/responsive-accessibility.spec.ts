import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { loadQaState, signIn } from "./helpers";

async function expectNoSeriousAccessibilityViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const violations = results.violations.filter(({ impact }) =>
    impact === "serious" || impact === "critical",
  );
  expect(violations).toEqual([]);
}

test("has accessible sign-in and authenticated workspace surfaces", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await expectNoSeriousAccessibilityViolations(page);

  const state = await loadQaState();
  await signIn(page, state.accounts.viewer, state.password);
  await page.goto(`/projects/${state.pmsProjectId}`);
  await expectNoSeriousAccessibilityViolations(page);
});

test("keeps the light-only mobile roadmap inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await loadQaState();
  await signIn(page, state.accounts.viewer, state.password);
  await page.goto(`/projects/${state.pmsProjectId}`);
  await expect(
    page.getByRole("heading", { name: /Roadmap$/ }),
  ).toBeVisible();

  const pageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(pageOverflow).toBeLessThanOrEqual(1);

  const milestoneButtons = page.locator("button[aria-expanded]:visible");
  expect(await milestoneButtons.count()).toBeGreaterThan(1);
  await expect(milestoneButtons.nth(0)).toHaveAttribute("aria-expanded", "true");
  await expect(milestoneButtons.nth(1)).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.locator('button[aria-expanded="true"]:visible'),
  ).toHaveCount(1);
  await milestoneButtons.nth(1).click();
  await expect(milestoneButtons.nth(0)).toHaveAttribute("aria-expanded", "false");
  await expect(milestoneButtons.nth(1)).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.locator('button[aria-expanded="true"]:visible'),
  ).toHaveCount(1);

  await expect(page.locator("html")).toHaveClass(/light/);
  await expect(
    page.getByRole("button", { name: "Toggle color theme" }),
  ).toHaveCount(0);
  await expectNoSeriousAccessibilityViolations(page);
});
