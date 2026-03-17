export const SUPPORTED_MODELS = [
  { id: "openai/gpt-5.4", label: "GPT-5.4", provider: "OpenAI" },
  { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", provider: "Anthropic" },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", provider: "Google" },
  { id: "x-ai/grok-4.1-fast", label: "Grok 4.1 Fast", provider: "xAI" },
  { id: "moonshotai/kimi-k2.5", label: "Kimi K2.5", provider: "Moonshot AI" },
  { id: "z-ai/glm-5", label: "GLM-5", provider: "Zhipu AI" },
  { id: "deepseek/deepseek-v3.2", label: "DeepSeek V3.2", provider: "DeepSeek" },
] as const;

export const DEFAULT_MODEL = "openai/gpt-5.4";

export type SupportedModelId = (typeof SUPPORTED_MODELS)[number]["id"];

export type SimulationMode = "historical" | "speculative";

export interface UserSettings {
  apiKey: string;
  model: SupportedModelId;
  simulationMode: SimulationMode;
  enableCivMemory?: boolean;
  enableScenarioInjection?: boolean;
  webSearchOnAdvance?: boolean;
  enableDiplomatAgent?: boolean;
  enablePresetEvents?: boolean;
}

export interface ModelProfile {
  maxGroupSize: number;
  maxParallel: number;
}

const MODEL_PROFILES: Record<string, ModelProfile> = {
  "openai/gpt-5.4": { maxGroupSize: 10, maxParallel: 15 },
  "anthropic/claude-sonnet-4.6": { maxGroupSize: 10, maxParallel: 10 },
  "google/gemini-3-flash-preview": { maxGroupSize: 10, maxParallel: 15 },
  "x-ai/grok-4.1-fast": { maxGroupSize: 10, maxParallel: 12 },
  "moonshotai/kimi-k2.5": { maxGroupSize: 8, maxParallel: 8 },
  "z-ai/glm-5": { maxGroupSize: 6, maxParallel: 5 },
  "deepseek/deepseek-v3.2": { maxGroupSize: 8, maxParallel: 8 },
};

const DEFAULT_PROFILE: ModelProfile = { maxGroupSize: 10, maxParallel: 15 };

let runtimeSettings: UserSettings | null = null;

export function setRuntimeSettings(settings: UserSettings | null) {
  runtimeSettings = settings;
}

export function getRuntimeSettings(): UserSettings | null {
  return runtimeSettings;
}

export function getEffectiveApiKey(headerOverride?: string | null): string {
  if (headerOverride && headerOverride.trim()) return headerOverride.trim();
  const override = runtimeSettings?.apiKey;
  if (override && override.trim()) return override.trim();
  return process.env.OPENROUTER_API_KEY || "";
}

export function getEffectiveModel(headerOverride?: string | null): string {
  if (headerOverride && headerOverride.trim()) return headerOverride.trim();
  const override = runtimeSettings?.model;
  if (override && override.trim()) return override.trim();
  return process.env.LLM_MODEL || DEFAULT_MODEL;
}

export function getModelProfile(): ModelProfile {
  const model = getEffectiveModel();
  return MODEL_PROFILES[model] ?? DEFAULT_PROFILE;
}

export function getSimulationMode(): SimulationMode {
  return runtimeSettings?.simulationMode ?? "historical";
}

export function getWebSearchOnAdvance(): boolean {
  return runtimeSettings?.webSearchOnAdvance ?? false;
}

export function getEnableDiplomatAgent(): boolean {
  return runtimeSettings?.enableDiplomatAgent ?? false;
}

export function getEnablePresetEvents(): boolean {
  return runtimeSettings?.enablePresetEvents ?? true;
}

