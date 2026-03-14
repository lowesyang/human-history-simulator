import { NextRequest, NextResponse } from "next/server";
import {
  SUPPORTED_MODELS,
  DEFAULT_MODEL,
  setRuntimeSettings,
  getRuntimeSettings,
} from "@/lib/settings";

export async function GET() {
  const envApiKey = process.env.OPENROUTER_API_KEY || "";
  const envModel = process.env.LLM_MODEL || DEFAULT_MODEL;

  const runtime = getRuntimeSettings();

  return NextResponse.json({
    envApiKey: envApiKey ? maskKey(envApiKey) : "",
    envModel,
    hasEnvKey: !!envApiKey && envApiKey !== "your_openrouter_api_key_here",
    currentApiKey: runtime?.apiKey ? maskKey(runtime.apiKey) : "",
    currentModel: runtime?.model || "",
    models: SUPPORTED_MODELS,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { apiKey, model, simulationMode, enableCivMemory, enableScenarioInjection, webSearchOnAdvance } = body;

  const validModelIds = SUPPORTED_MODELS.map((m) => m.id);
  if (model && !validModelIds.includes(model)) {
    return NextResponse.json(
      { error: "Invalid model selection" },
      { status: 400 }
    );
  }

  setRuntimeSettings({
    apiKey: apiKey ?? "",
    model: model || DEFAULT_MODEL,
    simulationMode: simulationMode || "historical",
    enableCivMemory: enableCivMemory ?? false,
    enableScenarioInjection: enableScenarioInjection ?? false,
    webSearchOnAdvance: webSearchOnAdvance ?? false,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  setRuntimeSettings(null);
  return NextResponse.json({ success: true });
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 6) + "..." + key.slice(-4);
}
