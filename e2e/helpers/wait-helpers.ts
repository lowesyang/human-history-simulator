import { type Page, expect } from "@playwright/test";

/**
 * Wait for the loading overlay to disappear, meaning
 * isLoading === false in the Zustand store.
 */
export async function waitForLoadingDone(page: Page, timeout = 30_000) {
  await expect(page.locator(".loading-ring")).toBeHidden({ timeout });
}

/**
 * Wait for the app to fully initialize:
 * 1. Navigate to /
 * 2. Wait for loading overlay to disappear (era auto-load completes)
 * 3. Wait for the timeline to be visible
 */
export async function waitForAppReady(page: Page, timeout = 60_000) {
  await page.goto("/", { timeout: 30_000, waitUntil: "domcontentloaded" });
  await waitForLoadingDone(page, timeout);
  await expect(page.locator(".era-banner-year")).toBeVisible({ timeout: 15_000 });
}

/**
 * Wait for a long-running operation (advance/era-switch) that
 * shows the loading overlay, then wait for it to finish.
 */
export async function waitForLongOperation(page: Page, timeout = 180_000) {
  await expect(page.locator(".loading-ring")).toBeVisible({ timeout: 15_000 }).catch(() => {
    // Loading may have already finished before we checked
  });
  await waitForLoadingDone(page, timeout);
}
