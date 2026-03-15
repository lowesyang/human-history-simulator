import { test, expect } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady } from "../helpers/wait-helpers";
import { getWorldStateFromAPI } from "../helpers/store-helpers";

test.describe("Wars Panel — Detailed", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await waitForAppReady(page);
  });

  test("wars API returns well-structured war objects", async ({ page }) => {
    const resp = await page.request.get("/api/wars");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(Array.isArray(data.wars)).toBeTruthy();

    for (const war of data.wars.slice(0, 5)) {
      expect(war.id).toBeTruthy();
      expect(war.name).toBeDefined();
      expect(war.name.en).toBeTruthy();
      expect(war.name.zh).toBeTruthy();
      expect(typeof war.startYear).toBe("number");
      expect(war.belligerents).toBeDefined();
      expect(war.belligerents.side1).toBeDefined();
      expect(Array.isArray(war.belligerents.side1.regionIds)).toBeTruthy();
      expect(war.belligerents.side2).toBeDefined();
      expect(Array.isArray(war.belligerents.side2.regionIds)).toBeTruthy();
      expect(war.status).toBeTruthy();
      expect(
        ["ongoing", "side1_victory", "side2_victory", "stalemate", "ceasefire"].includes(war.status)
      ).toBeTruthy();
    }
  });

  test("wars panel shows war count badge when wars exist", async ({ page }) => {
    const resp = await page.request.get("/api/wars");
    const data = await resp.json();

    const warButton = page.locator("header button", { hasText: /Wars|Conflicts/ });
    await warButton.click();
    await page.waitForTimeout(300);

    if (data.wars.length === 0) {
      await expect(page.getByText(/No active wars|no active wars/i)).toBeVisible({ timeout: 5_000 });
    } else {
      const warCards = page.locator(".flex.flex-col > div").filter({ has: page.locator("text=/ongoing|ceasefire|victory|stalemate/i") });
      const cardCount = await warCards.count();
      expect(cardCount).toBeGreaterThan(0);
    }

    await page.keyboard.press("Escape");
  });

  test("wars API supports year parameter for historical queries", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);
    const resp = await page.request.get(`/api/wars?year=${state.timestamp.year}`);
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(Array.isArray(data.wars)).toBeTruthy();
  });
});

test.describe("Economic Panel — Detailed", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await waitForAppReady(page);
  });

  test("economic panel opens and shows tabs", async ({ page }) => {
    const econButton = page.locator("header button", { hasText: "Economy" });
    await econButton.click();
    await page.waitForTimeout(500);

    await expect(page.getByText("Economic Observatory", { exact: true })).toBeVisible({
      timeout: 5_000,
    });

    const gdpTab = page.getByRole("button", { name: /GDP Trend|GDP/i }).first();
    await expect(gdpTab).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press("Escape");
  });

  test("economic-history API returns valid snapshot data", async ({ page }) => {
    const resp = await page.request.get("/api/economic-history");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();

    if (Array.isArray(data) && data.length > 0) {
      const snap = data[0];
      expect(snap.regionId).toBeTruthy();
      expect(typeof snap.year).toBe("number");
      expect(typeof snap.gdpGoldKg).toBe("number");
      expect(snap.gdpGoldKg).toBeGreaterThanOrEqual(0);
      expect(typeof snap.population).toBe("number");
    }
  });

  test("economic-history supports regionId filter", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);
    if (state.regions.length > 0) {
      const regionId = state.regions[0].id;
      const resp = await page.request.get(
        `/api/economic-history?regionId=${encodeURIComponent(regionId)}`
      );
      expect(resp.ok()).toBeTruthy();
    }
  });

  test("asset-prices API returns data with all flag", async ({ page }) => {
    const resp = await page.request.get("/api/asset-prices?all=true");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data).toBeDefined();
  });
});
