import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { ERA_PRESETS } from "@/data/era-presets";
import fs from "fs";
import path from "path";

const SEED_DIR = path.join(process.cwd(), "src", "data", "seed");
const TERRITORY_PATH = path.join(process.cwd(), "public", "geojson", "territories.json");
const LLM_TIMEOUT_MS = 600_000;

const VALID_CATEGORIES = new Set([
  "war", "dynasty", "invention", "trade", "religion",
  "disaster", "natural_disaster", "exploration", "diplomacy", "migration", "other",
]);

function getTerritoryList(): string {
  const raw = fs.readFileSync(TERRITORY_PATH, "utf-8");
  const territories = JSON.parse(raw) as Record<string, Record<string, unknown>>;
  const lines: string[] = [];
  for (const [id, scales] of Object.entries(territories)) {
    lines.push(`- ${id}: [${Object.keys(scales).join(", ")}]`);
  }
  return lines.join("\n");
}

function sendSSE(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: string,
  data: unknown
) {
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const eraIds = (body.eraIds as string[] | undefined) || ERA_PRESETS.map((e) => e.id);
  const force = body.force === true;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  const model = process.env.LLM_MODEL || "openai/gpt-5.4";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!fs.existsSync(SEED_DIR)) fs.mkdirSync(SEED_DIR, { recursive: true });
        const territoryList = getTerritoryList();

        const presetsToGen = ERA_PRESETS.filter((e) => eraIds.includes(e.id));
        const total = presetsToGen.length;
        let completed = 0;

        for (const preset of presetsToGen) {
          const outPath = path.join(SEED_DIR, `era-${preset.id}.json`);
          if (fs.existsSync(outPath) && !force) {
            completed++;
            sendSSE(controller, encoder, "skip", {
              eraId: preset.id, name: preset.name, completed, total,
            });
            continue;
          }

          sendSSE(controller, encoder, "generating", {
            eraId: preset.id, name: preset.name, completed, total,
          });

          try {
            const result = await generateOneEra(preset, apiKey, model, territoryList);
            fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
            completed++;
            sendSSE(controller, encoder, "success", {
              eraId: preset.id, name: preset.name,
              regions: result.regions.length, events: result.events.length,
              completed, total,
            });
          } catch (err) {
            completed++;
            sendSSE(controller, encoder, "error", {
              eraId: preset.id, name: preset.name,
              error: err instanceof Error ? err.message : String(err),
              completed, total,
            });
          }
        }

        sendSSE(controller, encoder, "done", { completed, total });
        controller.close();
      } catch (err) {
        sendSSE(controller, encoder, "fatal", {
          error: err instanceof Error ? err.message : String(err),
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function generateOneEra(
  preset: (typeof ERA_PRESETS)[number],
  apiKey: string,
  model: string,
  territoryList: string
) {
  const yearRange = `${preset.year} to ${preset.year + 29}`;
  const yearLabel = preset.year < 0 ? `${Math.abs(preset.year)} BCE` : `${preset.year} CE`;

  const systemPrompt = buildSystemPrompt(territoryList, yearRange);
  const userPrompt = `Generate the complete world state for the year ${yearLabel}, the "${preset.name.en}" period.\n\nContext: ${preset.description.en}\n\nReturn compact JSON: {"state":{...},"events":[...]}`;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://human-history-simulator.local",
        "X-Title": "Human Civilization Simulator",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        stream: true,
      }),
      signal: ctrl.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM error ${response.status}: ${errText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let content = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const p = line.slice(6).trim();
        if (p === "[DONE]") continue;
        try {
          const c = JSON.parse(p);
          const d = c.choices?.[0]?.delta?.content;
          if (d) content += d;
        } catch { /* skip */ }
      }
    }

    const jsonStr = extractJSON(content);
    let parsed: { state: { era?: object; summary?: object; regions: Record<string, unknown>[] }; events: Record<string, unknown>[] };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = JSON.parse(repairJSON(jsonStr));
    }

    if (!parsed.state?.regions) throw new Error("Invalid LLM response: missing state.regions");

    const regionIds = new Set(parsed.state.regions.map((r) => r.id as string));
    const events = (parsed.events || []).map((evt) => {
      const ts = evt.timestamp as { year: number; month: number };
      const affected = ((evt.affectedRegions as string[]) || []).filter((r) => regionIds.has(r));
      if (affected.length === 0 && regionIds.size > 0) affected.push([...regionIds][0]);
      return {
        id: `evt-era-${uuidv4().slice(0, 8)}`,
        timestamp: { year: ts.year, month: ts.month || 6 },
        title: evt.title,
        description: evt.description,
        affectedRegions: affected,
        category: VALID_CATEGORIES.has(evt.category as string) ? evt.category : "other",
        status: "pending",
      };
    });

    return {
      id: `state-y${preset.year}-m${preset.month}-initial`,
      timestamp: { year: preset.year, month: preset.month },
      era: parsed.state.era || preset.era,
      summary: parsed.state.summary,
      regions: parsed.state.regions,
      events,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildSystemPrompt(territoryList: string, yearRange: string): string {
  return `You are a world history state generator for a civilization simulation.
Return a JSON object: {"state":{"era":{...},"summary":{...},"regions":[...]},"events":[...]}

Each Region needs: id, name, territoryId, territoryScale, civilization, government, culture, economy, finances, military, demographics, diplomacy, technology, assessment, status, description.

All text fields must be bilingual: {"zh":"...","en":"..."}
Include 6-12 major civilizations. Use ONLY territoryIds from the list below.
Be historically accurate. Events should span years ${yearRange}.
Return ONLY valid JSON, no markdown.

Available territories:
${territoryList}`;
}

function extractJSON(text: string): string {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) return m[1].trim();
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s !== -1 && e !== -1) return text.slice(s, e + 1);
  return text;
}

function repairJSON(json: string): string {
  let r = json.replace(/,\s*([}\]])/g, "$1");
  const ob = (r.match(/{/g) || []).length;
  const cb = (r.match(/}/g) || []).length;
  const oq = (r.match(/\[/g) || []).length;
  const cq = (r.match(/]/g) || []).length;
  for (let i = 0; i < oq - cq; i++) r += "]";
  for (let i = 0; i < ob - cb; i++) r += "}";
  return r;
}
