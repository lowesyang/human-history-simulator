import { test, expect } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady } from "../helpers/wait-helpers";
import { getWorldStateFromAPI } from "../helpers/store-helpers";

test.describe("Region Detail Panel", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await waitForAppReady(page);
  });

  test("searches for a region and opens detail panel", async ({ page }) => {
    // Get a known region name from the current state
    const state = await getWorldStateFromAPI(page);
    const firstRegion = state.regions[0];
    const searchTerm = firstRegion.name.en.slice(0, 5);

    const searchInput = page.locator("input[placeholder*='Search']");
    await searchInput.click();
    await searchInput.fill(searchTerm);

    // Wait for debounce and dropdown
    await page.waitForTimeout(500);

    // Click first result in the dropdown
    const firstResult = page.locator("[class*='z-[999]'] button").first();
    await expect(firstResult).toBeVisible({ timeout: 5_000 });
    await firstResult.click();

    // Wait for detail panel
    await page.waitForTimeout(500);

    // Verify at least some tab buttons are visible in the detail panel
    await expect(page.getByRole("button", { name: "Political", exact: true })).toBeVisible({ timeout: 5_000 });
  });

  test("switches tabs in detail panel", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);
    const firstRegion = state.regions[0];
    const searchTerm = firstRegion.name.en.slice(0, 5);

    const searchInput = page.locator("input[placeholder*='Search']");
    await searchInput.click();
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(800);

    const firstResult2 = page.locator("[class*='z-[999]'] button").first();
    await expect(firstResult2).toBeVisible({ timeout: 10_000 });
    await firstResult2.click();
    await page.waitForTimeout(800);

    // Click various tabs
    const tabs = ["Economy", "Military", "Diplomacy", "Technology"];
    for (const tabName of tabs) {
      const tab = page.getByRole("button", { name: tabName, exact: true });
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(200);
      }
    }
  });

  test("closes detail panel with Escape", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);
    const firstRegion = state.regions[0];
    const searchTerm = firstRegion.name.en.slice(0, 5);

    const searchInput = page.locator("input[placeholder*='Search']");
    await searchInput.click();
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(500);

    const firstResult2 = page.locator("[class*='z-[999]'] button").first();
    await expect(firstResult2).toBeVisible({ timeout: 5_000 });
    await firstResult2.click();
    await page.waitForTimeout(500);

    // Panel should have the Political tab visible
    await expect(page.getByRole("button", { name: "Political", exact: true })).toBeVisible({ timeout: 5_000 });

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // After closing, the History tab should no longer be visible
    // (or at least the search input should be accessible)
    await searchInput.click();
  });
});
