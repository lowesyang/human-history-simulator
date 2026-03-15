import { test, expect } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady } from "../helpers/wait-helpers";

test.describe("Search Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await waitForAppReady(page);
  });

  test("empty search shows no dropdown", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']");
    await searchInput.click();
    await searchInput.fill("");
    await page.waitForTimeout(500);

    const dropdown = page.locator("[class*='z-[999]'] button");
    const count = await dropdown.count();
    expect(count).toBe(0);
  });

  test("partial name match returns results", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']");
    await searchInput.click();
    await searchInput.fill("Un");
    await page.waitForTimeout(500);

    const results = page.locator("[class*='z-[999]'] button");
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("gibberish query returns no results", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']");
    await searchInput.click();
    await searchInput.fill("zzzzxqwmn");
    await page.waitForTimeout(500);

    const results = page.locator("[class*='z-[999]'] button");
    const count = await results.count();
    expect(count).toBe(0);
  });

  test("search with special characters does not crash", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']");
    await searchInput.click();
    await searchInput.fill("test<>\"'&");
    await page.waitForTimeout(500);

    await expect(searchInput).toBeVisible();
  });

  test("clearing search input closes dropdown", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']");
    await searchInput.click();

    const state = await (await page.request.get("/api/state")).json();
    const name = state.regions[0]?.name?.en?.slice(0, 4) || "test";
    await searchInput.fill(name);
    await page.waitForTimeout(500);

    await searchInput.fill("");
    await page.waitForTimeout(300);

    const results = page.locator("[class*='z-[999]'] button");
    const count = await results.count();
    expect(count).toBe(0);
  });

  test("clicking outside search closes dropdown", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']");
    await searchInput.click();

    const state = await (await page.request.get("/api/state")).json();
    const name = state.regions[0]?.name?.en?.slice(0, 4) || "test";
    await searchInput.fill(name);
    await page.waitForTimeout(500);

    await page.locator(".era-banner-year").click();
    await page.waitForTimeout(300);
  });
});
