import { test, expect, type Page } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady } from "../helpers/wait-helpers";

async function openSettingsModal(page: Page) {
  const settingsBtn = page.locator("button[data-tooltip]").filter({ hasText: "⚙" });
  const altSettingsBtn = page.locator("header button").filter({ hasText: /engine|引擎|model|模型/i });

  if (await settingsBtn.isVisible().catch(() => false)) {
    await settingsBtn.click();
  } else if (await altSettingsBtn.isVisible().catch(() => false)) {
    await altSettingsBtn.click();
  } else {
    const gearBtn = page.locator("button").filter({ has: page.locator("svg") }).filter({ hasText: "" }).last();
    await gearBtn.click();
  }
}

test.describe("Settings & Configuration", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await waitForAppReady(page);
  });

  test("settings API returns hasEnvKey and envModel", async ({ page }) => {
    const resp = await page.request.get("/api/settings");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(typeof data.hasEnvKey).toBe("boolean");
    expect(data.envModel).toBeDefined();
  });

  test("validate-key API rejects invalid key", async ({ page }) => {
    const resp = await page.request.post("/api/validate-key", {
      data: { apiKey: "sk-invalid-key-12345" },
    });
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.valid).toBe(false);
  });

  test("language switch toggles between EN and 中文", async ({ page }) => {
    const langBtn = page.locator("button").filter({ hasText: /^(EN|中文)$/ });
    await expect(langBtn).toBeVisible({ timeout: 5_000 });

    const initialText = await langBtn.textContent();

    await langBtn.click();
    await page.waitForTimeout(500);

    const newText = await langBtn.textContent();
    expect(newText).not.toBe(initialText);

    if (initialText === "中文") {
      expect(newText).toBe("EN");
    } else {
      expect(newText).toBe("中文");
    }

    await langBtn.click();
    await page.waitForTimeout(500);

    const restoredText = await langBtn.textContent();
    expect(restoredText).toBe(initialText);
  });

  test("language switch changes UI labels", async ({ page }) => {
    const langBtn = page.locator("button").filter({ hasText: /^(EN|中文)$/ });
    await expect(langBtn).toBeVisible({ timeout: 5_000 });

    const initialLang = await langBtn.textContent();

    if (initialLang === "中文") {
      await langBtn.click();
      await page.waitForTimeout(500);

      const header = await page.locator("header").textContent();
      expect(header).toMatch(/演进|冲突|经济/);

      await langBtn.click();
      await page.waitForTimeout(500);
    } else {
      await langBtn.click();
      await page.waitForTimeout(500);

      const header = await page.locator("header").textContent();
      expect(header).toMatch(/Evolution|Wars|Economy/);

      await langBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test("settings POST syncs data to server", async ({ page }) => {
    const postResp = await page.request.post("/api/settings", {
      data: {
        apiKey: "",
        model: "openai/gpt-5.4",
        simulationMode: "historical",
        enableCivMemory: false,
        enableScenarioInjection: false,
        webSearchOnAdvance: false,
      },
    });
    expect(postResp.ok()).toBeTruthy();

    const getResp = await page.request.get("/api/settings");
    const data = await getResp.json();
    expect(data).toBeDefined();
  });

  test("settings DELETE clears server overrides", async ({ page }) => {
    const delResp = await page.request.delete("/api/settings");
    expect(delResp.ok()).toBeTruthy();

    const getResp = await page.request.get("/api/settings");
    expect(getResp.ok()).toBeTruthy();
  });
});
