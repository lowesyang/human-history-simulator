import { type Page, expect } from "@playwright/test";

/**
 * Seed localStorage to bypass WelcomeModal and set up default settings.
 * Must be called BEFORE page.goto().
 */
export async function seedLocalStorage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("hcs-welcome-seen", "1");
    localStorage.setItem("hcs-locale", "en");
  });
}

/**
 * Auto-accept native confirm/prompt dialogs to prevent tests from hanging.
 */
export function autoAcceptDialogs(page: Page) {
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });
}

/**
 * Standard setup: seed localStorage + auto-accept dialogs.
 * Call in beforeEach before page.goto().
 */
export async function setupPage(page: Page) {
  await seedLocalStorage(page);
  autoAcceptDialogs(page);
}

/**
 * Open the Era Select modal reliably with retry.
 * Returns once the modal's .font-cinzel title heading is visible.
 */
export async function openEraModal(page: Page) {
  const eraButton = page.locator("header button", { hasText: "▾" });
  const modalTitle = page.locator(".font-cinzel").first();

  for (let attempt = 0; attempt < 3; attempt++) {
    await expect(eraButton).toBeEnabled({ timeout: 5_000 });
    await eraButton.click();
    const visible = await modalTitle
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (visible) return;
    await page.waitForTimeout(500);
  }
  await expect(modalTitle).toBeVisible({ timeout: 5_000 });
}

/**
 * Click the confirm button in the era switch confirmation step.
 * Handles both EN and ZH locale labels.
 */
export async function confirmEraSwitch(page: Page) {
  const modal = page.locator(".fixed.inset-0.z-50");
  await expect(
    modal.locator(".font-cinzel").first()
  ).toBeVisible({ timeout: 5_000 });
  await modal.locator("button", { hasText: /Confirm Switch|确认切换/ }).click();
}
