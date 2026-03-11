import type { NextRequest } from "next/server";
import { setRuntimeSettings, getRuntimeSettings } from "./settings";
import type { UserSettings } from "./settings";

export const API_KEY_HEADER = "x-openrouter-key";
export const MODEL_HEADER = "x-llm-model";

/**
 * Ensures runtimeSettings includes the API key / model sent from the browser.
 * Call at the top of every API route that needs LLM access.
 */
export function applyClientHeaders(request: NextRequest): void {
  const headerKey = request.headers.get(API_KEY_HEADER);
  const headerModel = request.headers.get(MODEL_HEADER);

  if (!headerKey && !headerModel) return;

  const current = getRuntimeSettings();
  const merged: UserSettings = {
    ...{
      apiKey: "",
      model: "openai/gpt-5.4" as UserSettings["model"],
      simulationMode: "historical" as const,
    },
    ...current,
  };

  if (headerKey && headerKey.trim()) {
    merged.apiKey = headerKey.trim();
  }
  if (headerModel && headerModel.trim()) {
    merged.model = headerModel.trim() as UserSettings["model"];
  }

  setRuntimeSettings(merged);
}
