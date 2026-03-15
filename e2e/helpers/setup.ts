import { type Page } from "@playwright/test";

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
