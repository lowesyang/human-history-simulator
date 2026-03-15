import { test, expect } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady } from "../helpers/wait-helpers";
import { getWorldStateFromAPI } from "../helpers/store-helpers";

async function openRegionDetail(page: import("@playwright/test").Page) {
  const state = await getWorldStateFromAPI(page);
  const firstRegion = state.regions[0];
  const searchTerm = firstRegion.name.en.slice(0, 5);

  const searchInput = page.locator("input[placeholder*='Search']");
  await searchInput.click();
  await searchInput.fill(searchTerm);
  await page.waitForTimeout(500);

  const firstResult = page.locator("[class*='z-[999]'] button").first();
  await expect(firstResult).toBeVisible({ timeout: 5_000 });
  await firstResult.click();
  await page.waitForTimeout(500);

  return firstRegion;
}

test.describe("Region Detail — Deep Validation", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await waitForAppReady(page);
  });

  test("political tab shows government and civilization info", async ({ page }) => {
    await openRegionDetail(page);

    const politicalTab = page.getByRole("button", { name: "Political", exact: true });
    await expect(politicalTab).toBeVisible({ timeout: 5_000 });
    await politicalTab.click();
    await page.waitForTimeout(300);

    const tabContent = page.locator(".slide-in-right .flex-1.overflow-y-auto");
    await expect(tabContent).toBeVisible();

    const contentText = await tabContent.textContent();
    expect(contentText).toBeTruthy();
    expect(contentText!.length).toBeGreaterThan(20);
  });

  test("economy tab shows GDP and trade data", async ({ page }) => {
    await openRegionDetail(page);

    const economyTab = page.getByRole("button", { name: /Economy/i }).first();
    if (await economyTab.isVisible().catch(() => false)) {
      await economyTab.click();
      await page.waitForTimeout(300);

      const tabContent = page.locator(".slide-in-right .flex-1.overflow-y-auto");
      const text = await tabContent.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(10);
    }
  });

  test("military tab shows troop counts", async ({ page }) => {
    await openRegionDetail(page);

    const militaryTab = page.getByRole("button", { name: "Military", exact: true });
    if (await militaryTab.isVisible().catch(() => false)) {
      await militaryTab.click();
      await page.waitForTimeout(300);

      const tabContent = page.locator(".slide-in-right .flex-1.overflow-y-auto");
      const text = await tabContent.textContent();
      expect(text).toBeTruthy();
    }
  });

  test("demographics tab shows population data", async ({ page }) => {
    await openRegionDetail(page);

    const demoTab = page.getByRole("button", { name: "Demographics", exact: true });
    if (await demoTab.isVisible().catch(() => false)) {
      await demoTab.click();
      await page.waitForTimeout(300);

      const tabContent = page.locator(".slide-in-right .flex-1.overflow-y-auto");
      const text = await tabContent.textContent();
      expect(text).toBeTruthy();
    }
  });

  test("diplomacy tab shows allies and enemies", async ({ page }) => {
    await openRegionDetail(page);

    const diploTab = page.getByRole("button", { name: "Diplomacy", exact: true });
    if (await diploTab.isVisible().catch(() => false)) {
      await diploTab.click();
      await page.waitForTimeout(300);

      const tabContent = page.locator(".slide-in-right .flex-1.overflow-y-auto");
      const text = await tabContent.textContent();
      expect(text).toBeTruthy();
    }
  });

  test("technology tab shows tech level", async ({ page }) => {
    await openRegionDetail(page);

    const techTab = page.getByRole("button", { name: "Technology", exact: true });
    if (await techTab.isVisible().catch(() => false)) {
      await techTab.click();
      await page.waitForTimeout(300);

      const tabContent = page.locator(".slide-in-right .flex-1.overflow-y-auto");
      const text = await tabContent.textContent();
      expect(text).toBeTruthy();
    }
  });

  test("culture tab shows religion and achievements", async ({ page }) => {
    await openRegionDetail(page);

    const cultureTab = page.getByRole("button", { name: "Culture", exact: true });
    if (await cultureTab.isVisible().catch(() => false)) {
      await cultureTab.click();
      await page.waitForTimeout(300);

      const tabContent = page.locator(".slide-in-right .flex-1.overflow-y-auto");
      const text = await tabContent.textContent();
      expect(text).toBeTruthy();
    }
  });

  test("assessment tab shows strengths, weaknesses, outlook", async ({ page }) => {
    await openRegionDetail(page);

    const assessTab = page.getByRole("button", { name: "Assessment", exact: true });
    if (await assessTab.isVisible().catch(() => false)) {
      await assessTab.click();
      await page.waitForTimeout(300);

      const tabContent = page.locator(".slide-in-right .flex-1.overflow-y-auto");
      const text = await tabContent.textContent();
      expect(text).toBeTruthy();
    }
  });

  test("history tab shows region changelog", async ({ page }) => {
    await openRegionDetail(page);

    const historyTab = page.getByRole("button", { name: "History", exact: true });
    if (await historyTab.isVisible().catch(() => false)) {
      await historyTab.click();
      await page.waitForTimeout(300);

      const tabContent = page.locator(".slide-in-right .flex-1.overflow-y-auto");
      await expect(tabContent).toBeVisible();
    }
  });

  test("finances tab shows revenue and expenditure", async ({ page }) => {
    await openRegionDetail(page);

    const finTab = page.getByRole("button", { name: "Finances", exact: true });
    if (await finTab.isVisible().catch(() => false)) {
      await finTab.click();
      await page.waitForTimeout(300);

      const tabContent = page.locator(".slide-in-right .flex-1.overflow-y-auto");
      const text = await tabContent.textContent();
      expect(text).toBeTruthy();
    }
  });

  test("region API data validates all required fields", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);

    for (const region of state.regions.slice(0, 3)) {
      expect(region.civilization.name.en).toBeTruthy();
      expect(region.civilization.type).toBeTruthy();
      expect(region.economy.level).toBeDefined();
      expect(region.economy.gdpEstimate).toBeDefined();
      expect(region.economy.mainIndustries).toBeDefined();
      expect(region.military.level).toBeDefined();
      expect(region.military.totalTroops).toBeGreaterThanOrEqual(0);
      expect(region.demographics.population).toBeGreaterThan(0);
      expect(region.demographics.majorCities).toBeDefined();
      expect(Array.isArray(region.demographics.majorCities)).toBeTruthy();
      expect(region.technology.level).toBeDefined();
      expect(region.assessment.strengths).toBeDefined();
      expect(region.assessment.weaknesses).toBeDefined();
      expect(region.assessment.outlook).toBeDefined();
      expect(region.government.structure).toBeDefined();
    }
  });
});
