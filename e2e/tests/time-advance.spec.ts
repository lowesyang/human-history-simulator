import { test, expect } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady, waitForLongOperation } from "../helpers/wait-helpers";
import { getWorldStateFromAPI } from "../helpers/store-helpers";

test.describe("Time Advance (Real LLM)", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test("advances 1 epoch with real LLM and verifies state progression", async ({ page }) => {
    test.setTimeout(300_000);

    await waitForAppReady(page);

    const initialState = await getWorldStateFromAPI(page);
    const initialYear = initialState.timestamp.year;

    const initialLogsResp = await page.request.get("/api/logs");
    const initialLogsData = await initialLogsResp.json();
    const initialLogCount = initialLogsData.logs.length;

    await page.locator("button", { hasText: /^1$/ }).first().click();

    const advanceButton = page.locator("button.icon-btn[data-tooltip*='next epoch']");
    await advanceButton.click();

    await expect(page.getByText("Confirm Simulation")).toBeVisible({ timeout: 15_000 });

    const checkboxes = page.locator("input[type='checkbox']");
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);

    await page.locator("button", { hasText: "Start Simulation" }).click();

    await waitForLongOperation(page, 240_000);

    const newState = await getWorldStateFromAPI(page);
    expect(newState.timestamp.year).toBeGreaterThanOrEqual(initialYear);

    expect(newState.regions.length).toBeGreaterThan(0);
    for (const region of newState.regions.slice(0, 5)) {
      expect(region.id).toBeTruthy();
      expect(region.name.en).toBeTruthy();
    }

    const logsResp = await page.request.get("/api/logs");
    const logsData = await logsResp.json();
    expect(logsData.logs.length).toBeGreaterThan(initialLogCount);
  });
});
