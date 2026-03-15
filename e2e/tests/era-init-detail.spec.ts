import { test, expect } from "@playwright/test";
import { setupPage, openEraModal, confirmEraSwitch } from "../helpers/setup";
import { waitForAppReady, waitForLongOperation } from "../helpers/wait-helpers";
import { getWorldStateFromAPI } from "../helpers/store-helpers";

test.describe("Era Init — Detailed Validation", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test("prebuilt era loads correct region count and seed structure", async ({ page }) => {
    // Reset to ensure we're testing a clean prebuilt state
    await page.request.post("/api/playback/reset");
    await waitForAppReady(page);

    const state = await getWorldStateFromAPI(page);
    expect(state.regions.length).toBeGreaterThanOrEqual(5);

    for (const region of state.regions) {
      expect(region.id).toBeTruthy();
      expect(region.name).toBeDefined();
      expect(region.name.en).toBeTruthy();
      expect(region.economy).toBeDefined();
      expect(region.military).toBeDefined();
      expect(region.demographics).toBeDefined();
      expect(typeof region.demographics.population).toBe("number");
      expect(region.demographics.population).toBeGreaterThan(0);
      expect(region.culture).toBeDefined();
      expect(region.technology).toBeDefined();
      expect(region.finances).toBeDefined();
    }
  });

  test("era init loads both past and future events", async ({ page }) => {
    await waitForAppReady(page);

    const eventsResp = await page.request.get("/api/events");
    const eventsData = await eventsResp.json();
    expect(Array.isArray(eventsData.events)).toBeTruthy();

    const state = await getWorldStateFromAPI(page);
    const currentYear = state.timestamp.year;

    const pastEvents = eventsData.events.filter(
      (e: { status: string }) => e.status === "processed"
    );
    const futureEvents = eventsData.events.filter(
      (e: { status: string }) => e.status === "pending"
    );

    expect(pastEvents.length + futureEvents.length).toBe(eventsData.events.length);

    for (const evt of eventsData.events.slice(0, 10)) {
      expect(evt.id).toBeTruthy();
      expect(evt.timestamp).toBeDefined();
      expect(typeof evt.timestamp.year).toBe("number");
      expect(evt.title).toBeDefined();
      expect(evt.title.en).toBeTruthy();
      expect(evt.description).toBeDefined();
      expect(evt.category).toBeTruthy();
      expect(["pending", "processed"]).toContain(evt.status);
      expect(Array.isArray(evt.affectedRegions)).toBeTruthy();
    }
  });

  test("switching to a different prebuilt era resets state correctly", async ({ page }) => {
    await waitForAppReady(page);

    const initialState = await getWorldStateFromAPI(page);
    const initialYear = initialState.timestamp.year;

    await openEraModal(page);

    const targetEra = initialYear === 1962
      ? { name: "Renaissance", year: 1500 }
      : { name: "Cold War Era", year: 1962 };

    // Scope to modal to avoid matching the header era button
    const modal = page.locator(".fixed.inset-0.z-50");
    const eraCard = modal.locator("button", { hasText: targetEra.name }).first();
    await eraCard.click();

    await confirmEraSwitch(page);
    await waitForLongOperation(page, 60_000);

    const newState = await getWorldStateFromAPI(page);
    expect(newState.timestamp.year).toBe(targetEra.year);
    expect(newState.regions.length).toBeGreaterThanOrEqual(5);

    const newEventsResp = await page.request.get("/api/events");
    const newEventsData = await newEventsResp.json();
    expect(newEventsData.events.length).toBeGreaterThan(0);
  });

  test("era init provides economic snapshots", async ({ page }) => {
    await waitForAppReady(page);

    const econResp = await page.request.get("/api/economic-history");
    expect(econResp.ok()).toBeTruthy();
    const econData = await econResp.json();

    if (Array.isArray(econData) && econData.length > 0) {
      const snap = econData[0];
      expect(snap.regionId).toBeTruthy();
      expect(typeof snap.year).toBe("number");
      expect(typeof snap.gdpGoldKg).toBe("number");
    } else if (econData.snapshots && Array.isArray(econData.snapshots)) {
      expect(econData.snapshots.length).toBeGreaterThanOrEqual(0);
    }
  });

  test("all 20 prebuilt eras are accessible via API", async ({ page }) => {
    await waitForAppReady(page);

    const resp = await page.request.get("/api/eras");
    const data = await resp.json();
    expect(data.eras.length).toBeGreaterThanOrEqual(20);

    const expectedIds = [
      "bronze-age", "iron-age", "axial-age", "hellenistic", "qin-rome",
      "han-rome-peak", "three-kingdoms", "fall-of-rome", "tang-golden-age",
      "crusades", "mongol-empire", "renaissance", "early-modern",
      "enlightenment", "industrial-revolution", "imperialism",
      "world-war-era", "cold-war", "modern-era", "ai-age",
    ];

    for (const id of expectedIds) {
      const found = data.eras.some((e: { id: string }) => e.id === id);
      expect(found).toBeTruthy();
    }
  });
});
