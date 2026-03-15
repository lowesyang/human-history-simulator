import { test, expect } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady, waitForLongOperation } from "../helpers/wait-helpers";
import { getWorldStateFromAPI } from "../helpers/store-helpers";

test.describe("Time Rollback", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test("advances then rolls back to original year via API", async ({ page }) => {
    test.setTimeout(300_000);

    await waitForAppReady(page);

    const initialState = await getWorldStateFromAPI(page);
    const initialYear = initialState.timestamp.year;

    // Advance 1 epoch
    await page.locator("button", { hasText: /^1$/ }).first().click();
    const advanceButton = page.locator("button.icon-btn[data-tooltip*='next epoch']");
    await advanceButton.click();

    await expect(page.getByText("Confirm Simulation")).toBeVisible({ timeout: 15_000 });
    await page.locator("button", { hasText: "Start Simulation" }).click();
    await waitForLongOperation(page, 240_000);

    const advancedState = await getWorldStateFromAPI(page);
    expect(advancedState.timestamp.year).toBeGreaterThanOrEqual(initialYear);

    // Rollback via API
    const rollbackResp = await page.request.post("/api/playback/rollback", {
      data: { year: initialYear },
    });
    expect(rollbackResp.ok()).toBeTruthy();

    const rollbackData = await rollbackResp.json();
    expect(rollbackData.state).toBeTruthy();
    expect(rollbackData.state.timestamp.year).toBe(initialYear);

    // Reload and verify
    await page.reload();
    await waitForAppReady(page);

    const stateAfterRollback = await getWorldStateFromAPI(page);
    expect(stateAfterRollback.timestamp.year).toBe(initialYear);
  });

  test("rollback resets events to pending", async ({ page }) => {
    test.setTimeout(300_000);

    await waitForAppReady(page);

    const initialState = await getWorldStateFromAPI(page);
    const initialYear = initialState.timestamp.year;

    // Advance
    await page.locator("button", { hasText: /^1$/ }).first().click();
    const advanceButton = page.locator("button.icon-btn[data-tooltip*='next epoch']");
    await advanceButton.click();
    await expect(page.getByText("Confirm Simulation")).toBeVisible({ timeout: 15_000 });
    await page.locator("button", { hasText: "Start Simulation" }).click();
    await waitForLongOperation(page, 240_000);

    // Rollback
    await page.request.post("/api/playback/rollback", {
      data: { year: initialYear },
    });

    // Check events: those after initial year should be pending
    const eventsResp = await page.request.get("/api/events");
    const eventsData = await eventsResp.json();
    const futureEvents = eventsData.events.filter(
      (e: { timestamp: { year: number }; status: string }) =>
        e.timestamp.year > initialYear
    );
    for (const evt of futureEvents) {
      expect(evt.status).toBe("pending");
    }
  });
});
