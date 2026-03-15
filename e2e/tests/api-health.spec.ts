import { test, expect } from "@playwright/test";
import { setupPage } from "../helpers/setup";
import { waitForAppReady } from "../helpers/wait-helpers";

test.describe("API Health Checks", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await waitForAppReady(page);
  });

  test("GET /api/eras returns era list", async ({ page }) => {
    const resp = await page.request.get("/api/eras");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.eras).toBeDefined();
    expect(data.eras.length).toBeGreaterThanOrEqual(20);
  });

  test("GET /api/state returns valid world state", async ({ page }) => {
    const resp = await page.request.get("/api/state");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.timestamp).toBeDefined();
    expect(data.timestamp.year).toBeDefined();
    expect(data.regions).toBeDefined();
    expect(Array.isArray(data.regions)).toBeTruthy();
    expect(data.regions.length).toBeGreaterThan(0);
  });

  test("GET /api/events returns events array", async ({ page }) => {
    const resp = await page.request.get("/api/events");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.events).toBeDefined();
    expect(Array.isArray(data.events)).toBeTruthy();
  });

  test("GET /api/wars returns wars data", async ({ page }) => {
    const resp = await page.request.get("/api/wars");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.wars).toBeDefined();
    expect(Array.isArray(data.wars)).toBeTruthy();
  });

  test("GET /api/logs returns logs", async ({ page }) => {
    const resp = await page.request.get("/api/logs");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.logs).toBeDefined();
    expect(Array.isArray(data.logs)).toBeTruthy();
  });

  test("GET /api/economic-history returns data", async ({ page }) => {
    const resp = await page.request.get("/api/economic-history");
    expect(resp.ok()).toBeTruthy();
  });

  test("POST /api/playback/reset resets state", async ({ page }) => {
    const resp = await page.request.post("/api/playback/reset");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.state).toBeDefined();
    expect(data.state.timestamp).toBeDefined();
    expect(data.state.regions).toBeDefined();
  });

  test("GET /api/state with year parameter returns snapshot", async ({ page }) => {
    const resp = await page.request.get("/api/state?year=2023&month=1");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.timestamp).toBeDefined();
  });

  test("region data structure is valid", async ({ page }) => {
    const resp = await page.request.get("/api/state");
    const data = await resp.json();

    for (const region of data.regions.slice(0, 5)) {
      expect(region.id).toBeTruthy();
      expect(region.name).toBeDefined();
      expect(region.name.en).toBeTruthy();
      expect(region.name.zh).toBeTruthy();
      expect(region.civilization).toBeDefined();
      expect(region.economy).toBeDefined();
      expect(region.military).toBeDefined();
      expect(region.demographics).toBeDefined();
      expect(region.status).toBeTruthy();
      expect(
        ["thriving", "rising", "stable", "declining", "conflict", "collapsed"].includes(region.status)
      ).toBeTruthy();
    }
  });
});
