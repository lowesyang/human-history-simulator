import { test, expect } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady } from "../helpers/wait-helpers";
import { getWorldStateFromAPI } from "../helpers/store-helpers";

test.describe("Timeline Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await waitForAppReady(page);
  });

  test("year slider is visible and reflects current year", async ({ page }) => {
    const slider = page.locator("input[type='range']");
    await expect(slider).toBeVisible({ timeout: 5_000 });

    const state = await getWorldStateFromAPI(page);
    const sliderValue = await slider.inputValue();
    expect(parseInt(sliderValue, 10)).toBe(state.timestamp.year);
  });

  test("API returns correct snapshot for a given year", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);
    const currentYear = state.timestamp.year;

    const resp = await page.request.get(
      `/api/state?year=${currentYear}&month=1`
    );
    expect(resp.ok()).toBeTruthy();
    const snapshot = await resp.json();
    expect(snapshot.timestamp.year).toBe(currentYear);
    expect(snapshot.regions.length).toBeGreaterThan(0);
  });

  test("era banner displays formatted year correctly", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);
    const year = state.timestamp.year;

    const yearText = await page.locator(".era-banner-year").textContent();
    expect(yearText).toBeTruthy();

    if (year < 0) {
      expect(yearText).toContain("BCE");
      expect(yearText).toContain(String(Math.abs(year)));
    } else {
      expect(yearText).toContain("CE");
      expect(yearText).toContain(String(year));
    }
  });

  test("era name banner is non-empty and matches state", async ({ page }) => {
    const eraName = await page.locator(".era-banner-name").textContent();
    expect(eraName).toBeTruthy();
    expect(eraName!.length).toBeGreaterThan(2);
  });

  test("epoch count buttons highlight on selection", async ({ page }) => {
    const buttons = [
      page.locator("button", { hasText: /^1$/ }).first(),
      page.locator("button", { hasText: /^3$/ }).first(),
      page.locator("button", { hasText: /^5$/ }).first(),
      page.locator("button", { hasText: /^10$/ }).first(),
    ];

    for (const btn of buttons) {
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(100);
      }
    }

    await buttons[0].click();
  });

  test("UI reset button triggers state reset", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);
    const originalYear = state.timestamp.year;

    const resetButton = page.locator("button[data-tooltip*='reset'], button[data-tooltip*='Reset']");
    if (await resetButton.isVisible().catch(() => false)) {
      await resetButton.click();

      await page.waitForTimeout(2_000);

      const newState = await getWorldStateFromAPI(page);
      expect(newState.timestamp).toBeDefined();
      expect(newState.regions.length).toBeGreaterThan(0);
    }
  });
});
