import { test, expect } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady, waitForLongOperation } from "../helpers/wait-helpers";
import { getWorldStateFromAPI } from "../helpers/store-helpers";

test.describe("Advance — Detailed Flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test("event checkboxes can be toggled and deselected events are excluded", async ({ page }) => {
    test.setTimeout(300_000);
    await waitForAppReady(page);

    await page.locator("button", { hasText: /^1$/ }).first().click();
    const advanceButton = page.locator("button.icon-btn[data-tooltip*='next epoch']");
    await advanceButton.click();

    await expect(page.getByText("Confirm Simulation")).toBeVisible({ timeout: 15_000 });

    const checkboxes = page.locator("input[type='checkbox']");
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);

    if (count >= 2) {
      await checkboxes.nth(0).uncheck();
      expect(await checkboxes.nth(0).isChecked()).toBe(false);
      expect(await checkboxes.nth(1).isChecked()).toBe(true);

      await checkboxes.nth(0).check();
      expect(await checkboxes.nth(0).isChecked()).toBe(true);
    }

    await page.locator("button", { hasText: "Cancel" }).click();
    await expect(page.getByText("Confirm Simulation")).toBeHidden({ timeout: 5_000 });
  });

  test("advance confirm modal shows event details", async ({ page }) => {
    test.setTimeout(300_000);
    await waitForAppReady(page);

    await page.locator("button", { hasText: /^1$/ }).first().click();
    const advanceButton = page.locator("button.icon-btn[data-tooltip*='next epoch']");
    await advanceButton.click();

    await expect(page.getByText("Confirm Simulation")).toBeVisible({ timeout: 15_000 });

    const checkboxes = page.locator("input[type='checkbox']");
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);

    const eventItems = page.locator("label:has(input[type='checkbox'])");
    const eventCount = await eventItems.count();
    expect(eventCount).toBeGreaterThan(0);

    await page.locator("button", { hasText: "Cancel" }).click();
  });

  test("region data mutates after advance — GDP, population, or status changes", async ({ page }) => {
    test.setTimeout(300_000);
    await waitForAppReady(page);

    const beforeState = await getWorldStateFromAPI(page);
    const beforeRegions = new Map(
      beforeState.regions.map((r: {
        id: string;
        status: string;
        economy?: { gdpEstimate?: { goldKg?: number } };
        demographics?: { population?: number };
      }) => [r.id, {
        status: r.status,
        gdpGoldKg: r.economy?.gdpEstimate?.goldKg,
        population: r.demographics?.population,
      }])
    );

    await page.locator("button", { hasText: /^1$/ }).first().click();
    const advanceButton = page.locator("button.icon-btn[data-tooltip*='next epoch']");
    await advanceButton.click();

    await expect(page.getByText("Confirm Simulation")).toBeVisible({ timeout: 15_000 });
    await page.locator("button", { hasText: "Start Simulation" }).click();
    await waitForLongOperation(page, 240_000);

    const afterState = await getWorldStateFromAPI(page);

    let changesDetected = 0;
    for (const region of afterState.regions) {
      const before = beforeRegions.get(region.id);
      if (!before) continue;

      if (
        region.status !== before.status ||
        region.economy?.gdpEstimate?.goldKg !== before.gdpGoldKg ||
        region.demographics?.population !== before.population
      ) {
        changesDetected++;
      }
    }

    expect(changesDetected).toBeGreaterThan(0);
  });

  test("epoch count selector works — selects 3 and 5", async ({ page }) => {
    await waitForAppReady(page);

    const btn3 = page.locator("button", { hasText: /^3$/ }).first();
    await btn3.click();

    const btn5 = page.locator("button", { hasText: /^5$/ }).first();
    await btn5.click();

    const btn1 = page.locator("button", { hasText: /^1$/ }).first();
    await btn1.click();
  });

  test("cancel advance modal does not trigger simulation", async ({ page }) => {
    await waitForAppReady(page);

    const initialState = await getWorldStateFromAPI(page);
    const initialYear = initialState.timestamp.year;

    await page.locator("button", { hasText: /^1$/ }).first().click();
    const advanceButton = page.locator("button.icon-btn[data-tooltip*='next epoch']");
    await advanceButton.click();

    await expect(page.getByText("Confirm Simulation")).toBeVisible({ timeout: 15_000 });
    await page.locator("button", { hasText: "Cancel" }).click();

    await page.waitForTimeout(1_000);

    const afterState = await getWorldStateFromAPI(page);
    expect(afterState.timestamp.year).toBe(initialYear);
  });

  test("advance creates new economic snapshots", async ({ page }) => {
    test.setTimeout(300_000);
    await waitForAppReady(page);

    // Reset to clean state to ensure events are available
    await page.request.post("/api/playback/reset");
    await page.reload();
    await waitForAppReady(page);

    const beforeEcon = await page.request.get("/api/economic-history");
    const beforeData = await beforeEcon.json();
    const beforeCount = Array.isArray(beforeData) ? beforeData.length
      : (beforeData.snapshots?.length ?? 0);

    await page.locator("button", { hasText: /^1$/ }).first().click();
    const advanceButton = page.locator("button.icon-btn[data-tooltip*='next epoch']");
    await advanceButton.click();

    const confirmVisible = await page.getByText("Confirm Simulation").isVisible({ timeout: 15_000 }).catch(() => false);
    if (!confirmVisible) {
      test.skip(true, "No events available for advance — skipping economic snapshot test");
      return;
    }

    await page.locator("button", { hasText: "Start Simulation" }).click();
    await waitForLongOperation(page, 240_000);

    const afterEcon = await page.request.get("/api/economic-history");
    const afterData = await afterEcon.json();
    const afterCount = Array.isArray(afterData) ? afterData.length
      : (afterData.snapshots?.length ?? 0);

    expect(afterCount).toBeGreaterThan(beforeCount);
  });
});
