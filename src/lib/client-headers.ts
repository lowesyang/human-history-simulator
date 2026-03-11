import { useSettingsStore } from "@/store/useSettingsStore";

const API_KEY_HEADER = "x-openrouter-key";
const MODEL_HEADER = "x-llm-model";

export function getLlmHeaders(): Record<string, string> {
  const { apiKey, model } = useSettingsStore.getState();
  const headers: Record<string, string> = {};
  if (apiKey) headers[API_KEY_HEADER] = apiKey;
  if (model) headers[MODEL_HEADER] = model;
  return headers;
}
