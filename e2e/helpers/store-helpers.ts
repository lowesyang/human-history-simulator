import { type Page } from "@playwright/test";

interface StoreSnapshot {
  currentState: {
    timestamp: { year: number; month: number };
    era: { zh: string; en: string };
    regions: Array<{
      id: string;
      name: { zh: string; en: string };
      economy?: { gdpEstimate?: unknown };
      military?: { totalTroops?: unknown };
      status?: string;
    }>;
    summary?: { zh: string; en: string };
  } | null;
  frontier: { year: number; month: number };
  originTime: { year: number; month: number };
  viewingTime: { year: number; month: number };
  isLoading: boolean;
  evolutionLogs: unknown[];
  activeWars: unknown[];
  futureEvents: Array<{ status: string }>;
  pastEvents: Array<{ status: string }>;
  selectedRegionId: string | null;
  showLogPanel: boolean;
  showWarsPanel: boolean;
  showEconomicPanel: boolean;
}

/**
 * Read a snapshot of the Zustand world store from the browser context.
 * useWorldStore is exposed on the window by Zustand's create() and
 * accessible via the module-level import, but we need to access it
 * through the global React component tree. Instead, we use the store's
 * persist in window and evaluate in the page context.
 */
export async function getStoreState(page: Page): Promise<StoreSnapshot> {
  return page.evaluate(() => {
    // Access the Zustand store through its internal API
    // Zustand stores created with create() expose getState() on the store itself
    // We need to find it in the React component tree or module scope
    // The simplest approach: the store is imported as useWorldStore and has getState()
    // We can access it via the window.__ZUSTAND_STORES__ pattern or directly
    // Since this is a Next.js app, the module is bundled -- we use a different approach:
    // We inject a helper during addInitScript that captures the store reference.

    // Fallback: read from __NEXT_DATA__ or DOM state
    const w = window as unknown as Record<string, unknown>;
    const store = w.__E2E_WORLD_STORE__ as { getState: () => StoreSnapshot } | undefined;
    if (store) return store.getState();

    throw new Error("Store not available. Ensure addStoreAccessor() was called.");
  });
}

/**
 * Inject a script that captures the Zustand store reference for test access.
 * Must be called BEFORE page.goto() (via addInitScript).
 */
export async function addStoreAccessor(page: Page) {
  await page.addInitScript(() => {
    // Override Zustand's create to capture store references
    const origDefineProperty = Object.defineProperty;
    Object.defineProperty = function (obj: unknown, prop: string, desc: PropertyDescriptor) {
      if (prop === "getState" && typeof desc.value === "function") {
        const store = obj as Record<string, unknown>;
        // Check if this looks like the world store by inspecting initial state
        try {
          const state = (desc.value as () => Record<string, unknown>)();
          if ("currentState" in state && "frontier" in state && "evolutionLogs" in state) {
            (window as unknown as Record<string, unknown>).__E2E_WORLD_STORE__ = store;
          }
        } catch {
          // not the right store
        }
      }
      return origDefineProperty.call(Object, obj, prop, desc);
    } as typeof Object.defineProperty;
  });
}

/**
 * A simpler approach: poll the page for store state by reading
 * from the DOM and API responses. This avoids needing store injection.
 */
export async function getWorldStateFromAPI(page: Page): Promise<{
  timestamp: { year: number; month: number };
  era: { zh: string; en: string };
  regions: Array<{ id: string; name: { zh: string; en: string } }>;
}> {
  const response = await page.request.get("/api/state");
  return response.json();
}

/**
 * Get the displayed year from the timeline banner.
 */
export async function getDisplayedYear(page: Page): Promise<string> {
  return page.locator(".era-banner-year").textContent() as Promise<string>;
}

/**
 * Get the displayed era name from the timeline banner.
 */
export async function getDisplayedEraName(page: Page): Promise<string> {
  return page.locator(".era-banner-name").textContent() as Promise<string>;
}
