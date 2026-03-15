import { test, expect } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady, waitForLongOperation } from "../helpers/wait-helpers";
import { getWorldStateFromAPI, getDisplayedYear } from "../helpers/store-helpers";

test.describe("Era Selection", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await waitForAppReady(page);
  });

  test("opens era modal and lists all presets", async ({ page }) => {
    const eraButton = page.locator("header button", { hasText: "▾" });
    await eraButton.click();

    // Wait for the modal title (uses font-cinzel class)
    await expect(page.locator(".font-cinzel", { hasText: "Select Starting Era" })).toBeVisible({ timeout: 5_000 });

    // Check some era names are visible
    await expect(page.getByText("Bronze Age", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("AI Age", { exact: true }).first()).toBeVisible();
  });

  test("switches to Cold War era", async ({ page }) => {
    const eraButton = page.locator("header button", { hasText: "▾" });
    await eraButton.click();
    await expect(page.locator(".font-cinzel", { hasText: "Select Starting Era" })).toBeVisible({ timeout: 5_000 });

    // The era cards are buttons in a grid; find by text within the grid
    const coldWarCard = page.locator("button", { hasText: "Cold War Era" }).filter({ hasText: /1962|instant|current/ });
    await coldWarCard.first().click();

    // Confirmation step
    await expect(page.getByText("Confirm Era Switch")).toBeVisible({ timeout: 5_000 });
    await page.locator("button", { hasText: "Confirm Switch" }).click();

    await waitForLongOperation(page, 60_000);

    const yearText = await getDisplayedYear(page);
    expect(yearText).toContain("1962");

    const state = await getWorldStateFromAPI(page);
    expect(state.timestamp.year).toBe(1962);
    expect(state.regions.length).toBeGreaterThan(0);
  });

  test("switches to Renaissance era", async ({ page }) => {
    const eraButton = page.locator("header button", { hasText: "▾" });
    await eraButton.click();
    await expect(page.locator(".font-cinzel", { hasText: "Select Starting Era" })).toBeVisible({ timeout: 5_000 });

    const renaissanceCard = page.locator("button", { hasText: "Renaissance" }).filter({ hasText: /1500|instant|current/ });
    await renaissanceCard.first().click();

    await expect(page.getByText("Confirm Era Switch")).toBeVisible({ timeout: 5_000 });
    await page.locator("button", { hasText: "Confirm Switch" }).click();

    await waitForLongOperation(page, 60_000);

    const state = await getWorldStateFromAPI(page);
    expect(state.timestamp.year).toBe(1500);
  });

  test("can cancel era selection with back button", async ({ page }) => {
    const eraButton = page.locator("header button", { hasText: "▾" });
    await eraButton.click();
    await expect(page.locator(".font-cinzel", { hasText: "Select Starting Era" })).toBeVisible({ timeout: 5_000 });

    // Pick any era to get to confirmation step
    const ironAgeCard = page.locator("button", { hasText: "Iron Age" }).filter({ hasText: /800 BCE|instant|current/ });
    await ironAgeCard.first().click();

    await expect(page.getByText("Confirm Era Switch")).toBeVisible({ timeout: 5_000 });

    // Click Back -- should return to era grid without switching
    await page.locator("button", { hasText: "Back" }).click();

    // Should return to era grid
    await expect(page.locator(".font-cinzel", { hasText: "Select Starting Era" })).toBeVisible();
  });
});
