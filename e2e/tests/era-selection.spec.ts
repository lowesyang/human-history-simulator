import { test, expect } from "@playwright/test";
import { setupPage, openEraModal, confirmEraSwitch } from "../helpers/setup";
import { waitForAppReady, waitForLongOperation } from "../helpers/wait-helpers";
import { getWorldStateFromAPI, getDisplayedYear } from "../helpers/store-helpers";

test.describe("Era Selection", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await waitForAppReady(page);
  });

  test("opens era modal and lists all presets", async ({ page }) => {
    await openEraModal(page);

    await expect(page.getByText("Bronze Age", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("AI Age", { exact: true }).first()).toBeVisible();
  });

  test("switches to Cold War era", async ({ page }) => {
    await openEraModal(page);

    const modal = page.locator(".fixed.inset-0.z-50");
    const coldWarCard = modal.locator("button", { hasText: "Cold War Era" }).first();
    await coldWarCard.click();

    await confirmEraSwitch(page);

    await waitForLongOperation(page, 60_000);

    const yearText = await getDisplayedYear(page);
    expect(yearText).toContain("1962");

    const state = await getWorldStateFromAPI(page);
    expect(state.timestamp.year).toBe(1962);
    expect(state.regions.length).toBeGreaterThan(0);
  });

  test("switches to Renaissance era", async ({ page }) => {
    await openEraModal(page);

    const modal = page.locator(".fixed.inset-0.z-50");
    const renaissanceCard = modal.locator("button", { hasText: "Renaissance" }).first();
    await renaissanceCard.click();

    await confirmEraSwitch(page);

    await waitForLongOperation(page, 60_000);

    const state = await getWorldStateFromAPI(page);
    expect(state.timestamp.year).toBe(1500);
  });

  test("can cancel era selection with back button", async ({ page }) => {
    await openEraModal(page);

    const modal = page.locator(".fixed.inset-0.z-50");
    const ironAgeCard = modal.locator("button", { hasText: "Iron Age" }).first();
    await ironAgeCard.click();

    await expect(page.getByText(/Confirm Era Switch|确认切换纪元/)).toBeVisible({ timeout: 5_000 });

    // Click Back -- should return to era grid without switching
    await modal.locator("button", { hasText: /Back|返回/ }).click();

    // Should return to era grid
    await expect(page.locator(".font-cinzel").first()).toBeVisible();
  });
});
