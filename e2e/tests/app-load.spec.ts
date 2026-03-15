import { test, expect } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady } from "../helpers/wait-helpers";
import { getWorldStateFromAPI, getDisplayedYear } from "../helpers/store-helpers";

test.describe("App Load & Default Era Init", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test("loads the app and renders main UI elements", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await waitForAppReady(page);

    await expect(page.locator("text=Human History Simulator")).toBeVisible();
    await expect(page.locator(".era-banner-year")).toBeVisible();
    await expect(page.locator(".era-banner-name")).toBeVisible();

    const yearText = await getDisplayedYear(page);
    expect(yearText).toBeTruthy();
    expect(yearText.length).toBeGreaterThan(0);

    const state = await getWorldStateFromAPI(page);
    expect(state).toBeTruthy();
    expect(state.timestamp).toBeDefined();
    expect(state.regions.length).toBeGreaterThan(0);

    const fatalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("MapLibre") &&
        !e.includes("WebGL") &&
        !e.includes("404") &&
        !e.includes("Failed to load resource")
    );
    expect(fatalErrors).toHaveLength(0);
  });

  test("world state has valid region structure", async ({ page }) => {
    await waitForAppReady(page);

    const state = await getWorldStateFromAPI(page);
    expect(state.regions.length).toBeGreaterThan(5);

    for (const region of state.regions.slice(0, 5)) {
      expect(region.id).toBeTruthy();
      expect(region.name.en).toBeTruthy();
      expect(region.name.zh).toBeTruthy();
    }
  });
});
