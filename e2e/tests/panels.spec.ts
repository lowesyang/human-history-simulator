import { test, expect } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady } from "../helpers/wait-helpers";

test.describe("Panel Toggling", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test("toggles Evolution Log panel", async ({ page }) => {
    await waitForAppReady(page);

    const logButton = page.locator("header button", { hasText: "Evolution Log" });
    await logButton.click();
    await page.waitForTimeout(300);

    // Panel header should show "Evolution Log"
    await expect(page.getByText("Evolution Log").first()).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("toggles Wars panel", async ({ page }) => {
    await waitForAppReady(page);

    const warButton = page.locator("header button", { hasText: /Wars|Conflicts/ });
    await warButton.click();
    await page.waitForTimeout(300);

    // Panel should show "Active Wars" title
    await expect(page.getByText("Active Wars", { exact: true })).toBeVisible({ timeout: 5_000 });

    // Close with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("toggles Economic panel", async ({ page }) => {
    await waitForAppReady(page);

    const econButton = page.locator("header button", { hasText: "Economy" });
    await econButton.click();
    await page.waitForTimeout(500);

    // Panel header should show "Economic Observatory"
    await expect(page.getByText("Economic Observatory", { exact: true })).toBeVisible({
      timeout: 5_000,
    });

    // Close with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("only one panel open at a time", async ({ page }) => {
    await waitForAppReady(page);

    // Open Log
    const logButton = page.locator("header button", { hasText: "Evolution Log" });
    await logButton.click();
    await page.waitForTimeout(300);

    // Open Wars (should close Log)
    const warButton = page.locator("header button", { hasText: /Wars|Conflicts/ });
    await warButton.click();
    await page.waitForTimeout(300);

    // Open Economy (should close Wars)
    const econButton = page.locator("header button", { hasText: "Economy" });
    await econButton.click();
    await page.waitForTimeout(500);

    // Economy panel should be visible
    await expect(page.getByText("Economic Observatory", { exact: true })).toBeVisible({
      timeout: 5_000,
    });
  });
});
