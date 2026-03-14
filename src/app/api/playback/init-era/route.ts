import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  switchToEra,
  getLatestSnapshot,
  getEvents,
  getFrontier,
  getEvolutionLogs,
  getActiveWars,
  getOriginTime,
} from "@/lib/db";
import { ERA_PRESETS } from "@/data/era-presets";
import { getEffectiveApiKey, getEffectiveModel } from "@/lib/settings";
import { applyClientHeaders } from "@/lib/api-headers";
import {
  findClosestSnapshotYear,
  mergeSnapshotGeometry,
} from "@/lib/geo-snapshots";
import type { Region } from "@/lib/types";
import { CONTENT_FILTER_PROMPT, isBlockedEvent } from "@/lib/content-filter";
import {
  insertEconomicSnapshot,
  insertAssetPrice,
  insertExchangeRate,
  interpolatePrice,
  interpolateSeries,
  clearEconomicData,
  getLatestAssetPrices,
  migratePortfoliosToEra,
} from "@/lib/economic-history";
import exchangeRatesData from "@/data/economic/exchange-rates.json";
import assetPricesData from "@/data/economic/asset-prices.json";
import fs from "fs";
import path from "path";

function getPrebuiltPath(eraId: string): string {
  return path.join(process.cwd(), "src", "data", "seed", `era-${eraId}.json`);
}

function tryLoadPrebuilt(eraId: string): {
  id: string;
  timestamp: { year: number; month: number };
  era: object;
  summary?: object;
  regions: object[];
  events?: {
    id: string;
    timestamp: { year: number; month: number };
    title: object;
    description: object;
    affectedRegions: string[];
    category: string;
    status: string;
  }[];
} | null {
  const filePath = getPrebuiltPath(eraId);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getTerritoryList(): string {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "public", "geojson", "territories.json"),
    "utf-8"
  );
  const territories = JSON.parse(raw) as Record<string, Record<string, unknown>>;
  const lines: string[] = [];
  for (const [id, scales] of Object.entries(territories)) {
    const scaleKeys = Object.keys(scales).join(", ");
    lines.push(`- ${id}: [${scaleKeys}]`);
  }
  return lines.join("\n");
}

function sendSSE(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: string,
  data: unknown
) {
  try {
    controller.enqueue(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    );
  } catch {
    // Controller already closed — safe to ignore
  }
}

export async function POST(request: NextRequest) {
  applyClientHeaders(request);
  const body = await request.json();
  const eraId = body.eraId as string;

  const preset = ERA_PRESETS.find((e) => e.id === eraId);
  if (!preset) {
    return NextResponse.json({ error: "Unknown era ID" }, { status: 400 });
  }

  const prebuilt = tryLoadPrebuilt(eraId);

  if (prebuilt) {
    return handlePrebuilt(preset, prebuilt);
  }

  return handleLLMGeneration(preset);
}

function handlePrebuilt(
  preset: (typeof ERA_PRESETS)[number],
  prebuilt: NonNullable<ReturnType<typeof tryLoadPrebuilt>>
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      try {
        sendSSE(controller, encoder, "progress", {
          stage: "loading_prebuilt",
          era: preset.name,
        });

        const dbEvents = (prebuilt.events || []).map((evt) => ({
          id: evt.id,
          year: evt.timestamp.year,
          month: evt.timestamp.month,
          title: evt.title,
          description: evt.description,
          affectedRegions: evt.affectedRegions,
          category: evt.category,
          status: evt.status || "pending",
        }));

        const snapshotYear = findClosestSnapshotYear(prebuilt.timestamp.year);
        const regions = prebuilt.regions as Region[];
        mergeSnapshotGeometry(regions, snapshotYear);

        switchToEra(
          prebuilt.id,
          prebuilt.timestamp.year,
          prebuilt.timestamp.month,
          prebuilt.era,
          regions,
          prebuilt.summary,
          dbEvents.length > 0 ? dbEvents : undefined,
          preset.id
        );

        loadEconomicSeedData(preset.id, prebuilt.timestamp.year, regions);

        const snapshot = getLatestSnapshot();
        const events = getEvents();
        const frontier = getFrontier();
        const originTime = getOriginTime();
        const evolutionLogs = getEvolutionLogs();
        const wars = snapshot ? getActiveWars(snapshot.year) : [];

        const worldState = snapshot
          ? {
            id: snapshot.id,
            timestamp: { year: snapshot.year, month: snapshot.month },
            era: snapshot.era,
            regions: snapshot.regions,
            summary: snapshot.summary,
          }
          : null;

        sendSSE(controller, encoder, "done", {
          state: worldState,
          events,
          frontier,
          originTime,
          evolutionLogs,
          wars,
          eraId: preset.id,
          needsEvents: !events || events.length === 0,
        });
        controller.close();
      } catch (error) {
        console.error("Prebuilt load error:", error);
        sendSSE(controller, encoder, "error", {
          error: error instanceof Error ? error.message : "Unknown error",
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

function handleLLMGeneration(preset: (typeof ERA_PRESETS)[number]) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        sendSSE(controller, encoder, "progress", {
          stage: "generating_state",
          era: preset.name,
        });

        const apiKey = getEffectiveApiKey();
        if (!apiKey) {
          sendSSE(controller, encoder, "error", {
            error: "OPENROUTER_API_KEY not configured",
          });
          controller.close();
          return;
        }

        const model = getEffectiveModel();
        const territoryList = getTerritoryList();

        const yearLabel =
          preset.year < 0
            ? `${Math.abs(preset.year)} BCE`
            : `${preset.year} CE`;

        const systemPrompt = `You are a world history state generator for a civilization simulation.
Your task is to generate the complete world state for a specific historical period.

You must return a JSON object with two top-level keys:
1. "state" — the world state with era, summary, and regions
2. "events" — an array of 20-30 historical events spanning the next 30 years from the start date

## State Format
The "state" object must contain:
- "era": { "zh": "...", "en": "..." }
- "summary": { "zh": "...", "en": "..." }
- "regions": [ ... array of Region objects ... ]

Each Region must have ALL of these fields:
{
  "id": "territory_based_id",
  "name": { "zh": "...", "en": "..." },
  "territoryId": "from_territory_list",
  "territoryScale": "xs|sm|md|lg|xl",
  "civilization": {
    "name": { "zh": "...", "en": "..." },
    "type": "empire|kingdom|city_state|tribal|nomadic|trade_network|theocracy|republic",
    "ruler": { "zh": "...", "en": "..." },
    "rulerTitle": { "zh": "...", "en": "..." },
    "dynasty": { "zh": "...", "en": "..." },
    "capital": { "zh": "...", "en": "..." },
    "governmentForm": { "zh": "...", "en": "..." },
    "socialStructure": { "zh": "...", "en": "..." },
    "rulingClass": { "zh": "...", "en": "..." },
    "succession": { "zh": "...", "en": "..." }
  },
  "government": {
    "structure": { "zh": "...", "en": "..." },
    "departments": [{ "name": { "zh": "...", "en": "..." }, "function": { "zh": "...", "en": "..." }, "headCount": 0 }],
    "totalOfficials": 0,
    "localAdmin": { "zh": "...", "en": "..." },
    "legalSystem": { "zh": "...", "en": "..." },
    "taxationSystem": { "zh": "...", "en": "..." }
  },
  "culture": {
    "religion": { "zh": "...", "en": "..." },
    "philosophy": { "zh": "...", "en": "..." },
    "writingSystem": { "zh": "...", "en": "..." },
    "culturalAchievements": { "zh": "...", "en": "..." },
    "languageFamily": { "zh": "...", "en": "..." }
  },
  "economy": {
    "level": 1-10,
    "gdpEstimate": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
    "gdpPerCapita": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
    "gdpDescription": { "zh": "...", "en": "..." },
    "mainIndustries": { "zh": "...", "en": "..." },
    "tradeGoods": { "zh": "...", "en": "..." },
    "currency": { "name": { "zh": "...", "en": "..." }, "type": "commodity|metal_weight|coin|paper|fiat", "unitName": { "zh": "...", "en": "..." } },
    "householdWealth": { "zh": "...", "en": "..." },
    "averageIncome": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "silverKg": 0 },
    "foreignTradeVolume": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
    "economicSystem": { "zh": "...", "en": "..." }
  },
  "finances": {
    "annualRevenue": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
    "annualExpenditure": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
    "surplus": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
    "revenueBreakdown": [{ "source": { "zh": "...", "en": "..." }, "amount": { "amount": 0, "unit": { "zh": "...", "en": "..." } }, "percentage": 0 }],
    "expenditureBreakdown": [{ "category": { "zh": "...", "en": "..." }, "amount": { "amount": 0, "unit": { "zh": "...", "en": "..." } }, "percentage": 0 }],
    "treasury": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
    "treasuryDescription": { "zh": "...", "en": "..." },
    "fiscalPolicy": { "zh": "...", "en": "..." }
  },
  "military": {
    "level": 1-10,
    "totalTroops": 0,
    "standingArmy": 0,
    "reserves": 0,
    "branches": [{ "name": { "zh": "...", "en": "..." }, "count": 0, "description": { "zh": "...", "en": "..." } }],
    "commandStructure": { "commanderInChief": { "zh": "...", "en": "..." }, "totalGenerals": 0 },
    "technology": { "zh": "...", "en": "..." },
    "annualMilitarySpending": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "silverKg": 0 },
    "militarySpendingPctGdp": 0,
    "threats": { "zh": "...", "en": "..." }
  },
  "demographics": {
    "population": 0,
    "populationDescription": { "zh": "...", "en": "..." },
    "urbanPopulation": 0,
    "urbanizationRate": 0,
    "majorCities": [{ "name": { "zh": "...", "en": "..." }, "population": 0 }],
    "socialClasses": { "zh": "...", "en": "..." }
  },
  "diplomacy": {
    "allies": { "zh": "...", "en": "..." },
    "enemies": { "zh": "...", "en": "..." },
    "foreignPolicy": { "zh": "...", "en": "..." }
  },
  "technology": {
    "level": 1-10,
    "era": { "zh": "...", "en": "..." },
    "keyInnovations": { "zh": "...", "en": "..." }
  },
  "assessment": {
    "strengths": { "zh": "...", "en": "..." },
    "weaknesses": { "zh": "...", "en": "..." },
    "outlook": { "zh": "...", "en": "..." }
  },
  "status": "thriving|stable|declining|conflict|collapsed",
  "description": { "zh": "...", "en": "..." }
}

## Events Format
Each event in the "events" array:
{
  "timestamp": { "year": number, "month": number },
  "title": { "zh": "...", "en": "..." },
  "description": { "zh": "...", "en": "..." },
  "affectedRegions": ["region_id"],
  "category": "war|dynasty|invention|trade|religion|disaster|natural_disaster|exploration|diplomacy|migration|technology|finance|announcement|other"
}

## Rules
1. ALL text fields MUST be bilingual: { "zh": "...", "en": "..." }
2. Include 6-12 major civilizations that existed in this period
3. Use ONLY territoryIds from the available list
4. Be historically accurate with real names, titles, rulers, capitals — based on documented historical records
5. Each region's id should be based on its territoryId (e.g., "china_central" → "tang_dynasty")
6. Military troops = 1-5% of population
7. finances must be internally consistent
8. CRITICAL: Every event in the "events" array MUST be a real, documented historical event that actually happened. Use accurate dates, real names of people, battles, treaties, inventions, and natural disasters. Do NOT invent or fabricate any event. Only include events with historical evidence.
9. Events should span years ${preset.year} to ${preset.year + 29}, covering all major regions. Generate 1-3 events per year — many years had multiple significant events across different regions. Spread events naturally across different months.
10. Return ONLY valid JSON, no markdown, no explanation

${CONTENT_FILTER_PROMPT}

## Available Territory Templates
${territoryList}`;

        const userPrompt = `Generate the complete world state for the year ${yearLabel}, the "${preset.name.en}" period.

Context: ${preset.description.en}

Create a historically accurate snapshot of all major civilizations that existed at this time, including their political systems, economies, militaries, cultures, and diplomatic relationships.

Also generate 20-30 REAL historical events for the next 30 years. CRITICAL: Every event must be a historically documented, verifiable event that actually occurred. Use real names, real dates, real battles, real treaties, real inventions, and real natural disasters from the historical record. Do NOT fabricate any event.

Return compact JSON: {"state":{...},"events":[...]}`;

        const abortCtrl = new AbortController();
        const timeout = setTimeout(() => abortCtrl.abort(), 300_000);

        try {
          const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
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
                temperature: 0.4,
                stream: true,
              }),
              signal: abortCtrl.signal,
            }
          );

          if (!response.ok) {
            const errText = await response.text();
            sendSSE(controller, encoder, "error", {
              error: `LLM error: ${response.status} - ${errText}`,
            });
            controller.close();
            clearTimeout(timeout);
            return;
          }

          sendSSE(controller, encoder, "progress", {
            stage: "streaming",
            era: preset.name,
          });

          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = "";
          let fullContent = "";
          let tokenCount = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split("\n");
            sseBuffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") continue;

              try {
                const chunk = JSON.parse(payload);
                const delta = chunk.choices?.[0]?.delta?.content;
                if (delta) {
                  fullContent += delta;
                  tokenCount++;
                  if (tokenCount % 200 === 0) {
                    sendSSE(controller, encoder, "progress", {
                      stage: "streaming",
                      tokens: tokenCount,
                      era: preset.name,
                    });
                  }
                }
              } catch {
                // skip
              }
            }
          }

          clearTimeout(timeout);

          sendSSE(controller, encoder, "progress", {
            stage: "parsing",
            era: preset.name,
          });

          const jsonStr = extractJSON(fullContent);
          let parsed: { state: Record<string, unknown>; events: Record<string, unknown>[] };

          try {
            parsed = JSON.parse(jsonStr);
          } catch {
            const repaired = repairTruncatedJSON(jsonStr);
            parsed = JSON.parse(repaired);
          }

          if (!parsed.state || !parsed.state.regions) {
            sendSSE(controller, encoder, "error", {
              error: "Invalid response format from LLM",
            });
            controller.close();
            return;
          }

          sendSSE(controller, encoder, "progress", {
            stage: "saving",
            era: preset.name,
          });

          const stateRegions = parsed.state.regions as Record<string, unknown>[];
          const stateEra = parsed.state.era || preset.era;
          const stateSummary = parsed.state.summary;

          const snapshotId = `state-${preset.id}-y${preset.year}-m${preset.month}-initial`;

          const validCategories = new Set([
            "war", "dynasty", "invention", "trade", "religion",
            "disaster", "natural_disaster", "exploration", "diplomacy", "migration",
            "technology", "finance", "announcement", "other",
          ]);
          const regionIds = new Set(stateRegions.map((r) => r.id as string));

          const dbEvents = (parsed.events || [])
            .filter((evt) => !isBlockedEvent(evt as { title?: { zh?: string; en?: string }; description?: { zh?: string; en?: string } }))
            .map((evt) => {
              const ts = evt.timestamp as { year: number; month: number };
              const affectedRegions = ((evt.affectedRegions as string[]) || []).filter(
                (r) => regionIds.has(r)
              );
              if (affectedRegions.length === 0 && regionIds.size > 0) {
                affectedRegions.push([...regionIds][0]);
              }
              const category = validCategories.has(evt.category as string)
                ? (evt.category as string)
                : "other";

              return {
                id: `evt-era-${uuidv4().slice(0, 8)}`,
                year: ts.year,
                month: ts.month || 6,
                title: evt.title as object,
                description: evt.description as object,
                affectedRegions,
                category,
                status: "pending",
              };
            });

          const llmSnapshotYear = findClosestSnapshotYear(preset.year);
          mergeSnapshotGeometry(stateRegions as unknown as Region[], llmSnapshotYear);

          switchToEra(
            snapshotId,
            preset.year,
            preset.month,
            stateEra as object,
            stateRegions,
            stateSummary as object | undefined,
            dbEvents,
            preset.id
          );

          loadEconomicSeedData(preset.id, preset.year, stateRegions as unknown as Region[]);

          const snapshot = getLatestSnapshot();
          const events = getEvents();
          const frontier = getFrontier();
          const originTime = getOriginTime();

          const worldState = snapshot
            ? {
              id: snapshot.id,
              timestamp: { year: snapshot.year, month: snapshot.month },
              era: snapshot.era,
              regions: snapshot.regions,
              summary: snapshot.summary,
            }
            : null;

          sendSSE(controller, encoder, "done", {
            state: worldState,
            events,
            frontier,
            originTime,
            eraId: preset.id,
          });
          controller.close();
        } catch (err) {
          clearTimeout(timeout);
          throw err;
        }
      } catch (error) {
        console.error("Era init error:", error);
        sendSSE(controller, encoder, "error", {
          error: error instanceof Error ? error.message : "Unknown error",
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

function extractJSON(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1) {
    return text.slice(braceStart, braceEnd + 1);
  }
  return text;
}

function repairTruncatedJSON(json: string): string {
  let repaired = json.replace(/,\s*([}\]])/g, "$1");
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;
  for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += "]";
  for (let i = 0; i < openBraces - closeBraces; i++) repaired += "}";
  return repaired;
}

function loadEconomicSeedData(eraId: string, eraStartYear: number, regions: Region[]) {
  try {
    const prevPrices = getLatestAssetPrices();
    const prevPriceMap = new Map<string, number>();
    for (const p of prevPrices) prevPriceMap.set(p.assetId, p.priceGoldGrams);

    clearEconomicData(eraId);

    const exRates = exchangeRatesData as {
      goldSilverRatio: { year: number; ratio: number }[];
      pppAnchors: {
        grain_kg: { year: number; goldGrams: number }[];
        daily_unskilled_wage: { year: number; silverGrams: number }[];
      };
    };
    for (const entry of exRates.goldSilverRatio) {
      if (entry.year <= eraStartYear) {
        const grainGoldG = interpolateSeries(
          exRates.pppAnchors.grain_kg.map((e) => ({ year: e.year, value: e.goldGrams })),
          entry.year,
          "value"
        );
        insertExchangeRate(entry.year, eraId, entry.ratio, grainGoldG, null);
      }
    }
    const startRatio = interpolateSeries(
      exRates.goldSilverRatio.map((e) => ({ year: e.year, value: e.ratio })),
      eraStartYear,
      "value"
    );
    const startGrain = interpolateSeries(
      exRates.pppAnchors.grain_kg.map((e) => ({ year: e.year, value: e.goldGrams })),
      eraStartYear,
      "value"
    );
    insertExchangeRate(eraStartYear, eraId, startRatio, startGrain, null);

    const assets = (assetPricesData as { assets: { id: string; priceHistory: { year: number; price: number }[]; availableFrom: number; availableTo: number; baseVolatility: number }[] }).assets;
    for (const asset of assets) {
      if (eraStartYear < asset.availableFrom || eraStartYear > asset.availableTo) continue;
      const seedPrice = interpolatePrice(asset.priceHistory, eraStartYear);
      const prevPrice = prevPriceMap.get(asset.id);
      const price = prevPrice != null && prevPrice > 0
        ? prevPrice * 0.7 + seedPrice * 0.3
        : seedPrice;
      const silverPrice = price * startRatio;
      insertAssetPrice(asset.id, eraStartYear, eraId, price, silverPrice, asset.baseVolatility);
    }

    const newPriceMap = new Map<string, number>();
    for (const asset of assets) {
      if (eraStartYear < asset.availableFrom || eraStartYear > asset.availableTo) continue;
      const seedPrice = interpolatePrice(asset.priceHistory, eraStartYear);
      const prevPrice = prevPriceMap.get(asset.id);
      newPriceMap.set(asset.id, prevPrice != null && prevPrice > 0 ? prevPrice * 0.7 + seedPrice * 0.3 : seedPrice);
    }
    const migrated = migratePortfoliosToEra(eraId, eraStartYear, newPriceMap);
    if (migrated > 0) {
      console.log(`[init-era] Migrated ${migrated} portfolio(s) to era ${eraId}`);
    }

    for (const region of regions) {
      const gk = (v: { goldKg?: number } | undefined) =>
        v?.goldKg ?? 0;
      const snap = {
        gdpGoldKg: gk(region.economy?.gdpEstimate),
        gdpPerCapitaGoldKg: gk(region.economy?.gdpPerCapita),
        treasuryGoldKg: gk(region.finances?.treasury),
        revenueGoldKg: gk(region.finances?.annualRevenue),
        expenditureGoldKg: gk(region.finances?.annualExpenditure),
        tradeVolumeGoldKg: gk(region.economy?.foreignTradeVolume),
        debtGoldKg: gk(region.finances?.debtLevel),
        militarySpendingPctGdp: region.military?.militarySpendingPctGdp ?? 0,
        population: region.demographics?.population ?? 0,
        urbanizationRate: region.demographics?.urbanizationRate ?? 0,
        giniEstimate: region.economy?.giniEstimate,
      };
      insertEconomicSnapshot(region.id, eraStartYear, eraId, snap);

      if (snap.gdpGoldKg > 0) {
        const growthRate = eraStartYear >= 2000 ? 0.03
          : eraStartYear >= 1950 ? 0.04
            : eraStartYear >= 1800 ? 0.02
              : eraStartYear >= 1000 ? 0.005
                : 0.002;
        const baseGdp = snap.gdpGoldKg;
        const basePop = snap.population || 1;
        const popGrowth = eraStartYear >= 1900 ? 0.012 : eraStartYear >= 1500 ? 0.004 : 0.002;
        // Backfill 5 points at 5-year intervals (year-5, -10, -15, -20, -25)
        for (let i = 1; i <= 5; i++) {
          const yearsBack = i * 5;
          const pastYear = eraStartYear - yearsBack;
          const factor = Math.pow(1 + growthRate, -yearsBack);
          const popFactor = Math.pow(1 + popGrowth, -yearsBack);
          const pastGdp = baseGdp * factor;
          const pastPop = Math.round(basePop * popFactor);
          const pastPcGdp = pastPop > 0 ? pastGdp / pastPop : 0;
          const giniBase = snap.giniEstimate;
          // ~1-3% variation per 5-year step, with a slight trend (older = slightly different)
          const giniDrift = 0.012 * (3 - i);
          const giniMod = giniBase != null ? Math.max(0.01, Math.min(0.99, giniBase * (1 + giniDrift))) : undefined;
          insertEconomicSnapshot(region.id, pastYear, eraId, {
            ...snap,
            gdpGoldKg: pastGdp,
            gdpPerCapitaGoldKg: pastPcGdp,
            population: pastPop,
            treasuryGoldKg: snap.treasuryGoldKg * factor,
            revenueGoldKg: snap.revenueGoldKg * factor,
            expenditureGoldKg: snap.expenditureGoldKg * factor,
            tradeVolumeGoldKg: snap.tradeVolumeGoldKg * factor,
            debtGoldKg: snap.debtGoldKg * factor,
            giniEstimate: giniMod,
          });
        }
      }
    }
  } catch (err) {
    console.error("[init-era] Failed to load economic seed data:", err);
  }
}
