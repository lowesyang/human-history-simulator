import { test, expect } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady } from "../helpers/wait-helpers";
import { getWorldStateFromAPI } from "../helpers/store-helpers";

test.describe("API Routes — Extended Coverage", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await waitForAppReady(page);
  });

  test("GET /api/events/preview returns events for upcoming epochs", async ({ page }) => {
    const resp = await page.request.get("/api/events/preview?epochs=1");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.events).toBeDefined();
    expect(Array.isArray(data.events)).toBeTruthy();
  });

  test("event structure has all required fields", async ({ page }) => {
    const resp = await page.request.get("/api/events");
    const data = await resp.json();

    for (const evt of data.events.slice(0, 10)) {
      expect(evt.id).toBeTruthy();
      expect(evt.timestamp).toBeDefined();
      expect(typeof evt.timestamp.year).toBe("number");
      expect(typeof evt.timestamp.month).toBe("number");
      expect(evt.title).toBeDefined();
      expect(evt.title.en).toBeTruthy();
      expect(evt.title.zh).toBeTruthy();
      expect(evt.description).toBeDefined();
      expect(evt.description.en).toBeTruthy();
      expect(evt.description.zh).toBeTruthy();
      expect(Array.isArray(evt.affectedRegions)).toBeTruthy();
      expect(evt.category).toBeTruthy();
      expect(["pending", "processed"]).toContain(evt.status);
    }
  });

  test("event categories are valid", async ({ page }) => {
    const validCategories = [
      "war", "dynasty", "invention", "trade", "religion",
      "disaster", "natural_disaster", "exploration", "diplomacy",
      "migration", "technology", "finance", "political", "announcement", "other",
    ];

    const resp = await page.request.get("/api/events");
    const data = await resp.json();

    for (const evt of data.events) {
      expect(validCategories).toContain(evt.category);
    }
  });

  test("region economy fields are complete", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);

    for (const region of state.regions.slice(0, 3)) {
      expect(region.economy).toBeDefined();
      expect(typeof region.economy.level).toBe("number");
      expect(region.economy.mainIndustries).toBeDefined();
      expect(region.economy.currency).toBeDefined();
    }
  });

  test("region military fields are complete", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);

    for (const region of state.regions.slice(0, 3)) {
      expect(region.military).toBeDefined();
      expect(typeof region.military.level).toBe("number");
      expect(typeof region.military.totalTroops).toBe("number");
      expect(typeof region.military.standingArmy).toBe("number");
    }
  });

  test("region demographics fields are complete", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);

    for (const region of state.regions.slice(0, 3)) {
      expect(region.demographics).toBeDefined();
      expect(typeof region.demographics.population).toBe("number");
      expect(region.demographics.population).toBeGreaterThan(0);
      expect(typeof region.demographics.urbanPopulation).toBe("number");
      expect(typeof region.demographics.urbanizationRate).toBe("number");
      expect(Array.isArray(region.demographics.majorCities)).toBeTruthy();
      if (region.demographics.majorCities.length > 0) {
        const city = region.demographics.majorCities[0];
        expect(city.name).toBeDefined();
        expect(typeof city.population).toBe("number");
      }
    }
  });

  test("region diplomacy fields are complete", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);

    for (const region of state.regions.slice(0, 3)) {
      expect(region.diplomacy).toBeDefined();
      expect(region.diplomacy.allies).toBeDefined();
      expect(region.diplomacy.enemies).toBeDefined();
      expect(region.diplomacy.foreignPolicy).toBeDefined();
    }
  });

  test("region finances fields are complete", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);

    for (const region of state.regions.slice(0, 3)) {
      expect(region.finances).toBeDefined();
      expect(region.finances.annualRevenue).toBeDefined();
      expect(region.finances.annualExpenditure).toBeDefined();
      expect(region.finances.treasury).toBeDefined();
      expect(Array.isArray(region.finances.revenueBreakdown)).toBeTruthy();
      expect(Array.isArray(region.finances.expenditureBreakdown)).toBeTruthy();
    }
  });

  test("rollback API with current year is a no-op", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);
    const resp = await page.request.post("/api/playback/rollback", {
      data: { year: state.timestamp.year },
    });
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.state.timestamp.year).toBe(state.timestamp.year);
  });

  test("state API with month parameter", async ({ page }) => {
    const state = await getWorldStateFromAPI(page);
    const resp = await page.request.get(
      `/api/state?year=${state.timestamp.year}&month=${state.timestamp.month}`
    );
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.timestamp.year).toBe(state.timestamp.year);
  });
});
