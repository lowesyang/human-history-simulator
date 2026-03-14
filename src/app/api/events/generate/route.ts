import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  getLatestSnapshot,
  getEvents,
  insertEvent,
  getFrontier,
  getCurrentEraId,
} from "@/lib/db";
import { getEffectiveApiKey, getEffectiveModel, getSimulationMode } from "@/lib/settings";
import { applyClientHeaders } from "@/lib/api-headers";
import type { Region } from "@/lib/types";
import { CONTENT_FILTER_PROMPT, isBlockedEvent } from "@/lib/content-filter";

function sendSSE(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: string,
  data: unknown
) {
  controller.enqueue(
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  );
}

interface RawEvent {
  timestamp: { year: number; month: number };
  title: { zh: string; en: string };
  description: { zh: string; en: string };
  affectedRegions: string[];
  category: string;
}

/**
 * Incrementally extract complete JSON objects from a growing string
 * that represents a JSON array being streamed token-by-token.
 * Returns newly found complete objects and the scan cursor position.
 */
function extractCompleteObjects(
  content: string,
  searchFrom: number
): { objects: RawEvent[]; newCursor: number } {
  const objects: RawEvent[] = [];
  let cursor = searchFrom;

  while (cursor < content.length) {
    const objStart = content.indexOf("{", cursor);
    if (objStart === -1) break;

    let depth = 0;
    let inString = false;
    let escape = false;
    let objEnd = -1;

    for (let i = objStart; i < content.length; i++) {
      const ch = content[i];
      if (escape) { escape = false; continue; }
      if (inString) {
        if (ch === "\\") escape = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') { inString = true; continue; }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          objEnd = i;
          break;
        }
      }
    }

    if (objEnd === -1) break; // incomplete object, wait for more tokens

    const objStr = content.slice(objStart, objEnd + 1);
    try {
      const parsed = JSON.parse(objStr) as RawEvent;
      if (parsed.timestamp && parsed.title && parsed.description) {
        objects.push(parsed);
      }
    } catch {
      // malformed, skip
    }
    cursor = objEnd + 1;
  }

  return { objects, newCursor: cursor };
}

export async function POST(request: NextRequest) {
  applyClientHeaders(request);
  const encoder = new TextEncoder();

  let reqCount = 20;
  let reqStartYear: number | undefined;
  let reqEventsPerYear = 4;
  let reqCategories: string[] | undefined;
  let reqFocusRegions: string[] | undefined;
  let reqDetailLevel: "brief" | "normal" | "detailed" = "normal";
  let reqWebSearch = false;
  let reqScenarioPremises: string[] = [];
  let reqSimulationParams: { contingencyRatio?: number; categoryWeights?: Record<string, number> } | undefined;
  try {
    const body = await request.json();
    if (body.count) reqCount = Math.min(Math.max(Number(body.count), 1), 50);
    if (body.startYear != null && !isNaN(Number(body.startYear))) reqStartYear = Number(body.startYear);
    if (body.eventsPerYear != null) reqEventsPerYear = Math.min(Math.max(Number(body.eventsPerYear), 1), 8);
    if (body.categories && Array.isArray(body.categories) && body.categories.length > 0) {
      reqCategories = body.categories;
    }
    if (body.focusRegions && Array.isArray(body.focusRegions) && body.focusRegions.length > 0) {
      reqFocusRegions = body.focusRegions;
    }
    if (body.detailLevel) reqDetailLevel = body.detailLevel;
    if (body.webSearch) reqWebSearch = true;
    if (body.scenarioPremises && Array.isArray(body.scenarioPremises)) {
      reqScenarioPremises = body.scenarioPremises.filter((p: unknown) => typeof p === "string" && (p as string).trim());
    }
    if (body.simulationParams && typeof body.simulationParams === "object") {
      reqSimulationParams = body.simulationParams;
    }
  } catch {
    // no body or invalid JSON, use defaults
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        sendSSE(controller, encoder, "progress", { stage: "preparing" });

        const latestSnapshot = getLatestSnapshot();
        if (!latestSnapshot) {
          sendSSE(controller, encoder, "error", { error: "No world state found" });
          controller.close();
          return;
        }

        const eraId = getCurrentEraId();
        const regions = latestSnapshot.regions as Region[];
        const regionIds = regions.map((r) => r.id);
        const regionSummaries = regions
          .map((r) => `${r.id}: ${r.name?.en ?? r.id} (${r.civilization?.type ?? "unknown"})`)
          .join(", ");

        const frontier = getFrontier();
        const allEvents = getEvents();
        const pendingEvents = allEvents.filter((e) => e.status === "pending");

        let startYear: number;
        if (reqStartYear != null) {
          startYear = reqStartYear;
        } else if (pendingEvents.length > 0) {
          const nonCustomPending = pendingEvents.filter((e) => !e.isCustom);
          if (nonCustomPending.length > 0) {
            const maxPendingYear = Math.max(...nonCustomPending.map((e) => e.timestamp.year));
            startYear = maxPendingYear + 1;
          } else {
            startYear = frontier.year + 1;
          }
        } else {
          startYear = frontier.year + 1;
        }

        const recentEvents = allEvents
          .slice(-15)
          .map((e) => `[${e.timestamp.year}] ${e.title.en}`)
          .join("\n");

        sendSSE(controller, encoder, "progress", {
          stage: "calling_llm",
          startYear,
          webSearch: reqWebSearch,
        });

        const apiKey = getEffectiveApiKey();
        if (!apiKey) {
          sendSSE(controller, encoder, "error", { error: "OPENROUTER_API_KEY not configured" });
          controller.close();
          return;
        }

        const model = getEffectiveModel();
        const effectiveModel = reqWebSearch ? `${model}:online` : model;

        const descInstruction = reqDetailLevel === "brief"
          ? "Keep descriptions very concise (1 sentence each)."
          : reqDetailLevel === "detailed"
            ? "Provide detailed descriptions (2-4 sentences each) including causes, key figures, and consequences."
            : "Provide moderate descriptions (1-2 sentences each).";

        const webSearchHint = reqWebSearch
          ? "\n8. You have access to real-time web search results. Use the web search data to verify historical facts — exact dates, names, locations, and outcomes. Prioritize web search findings over uncertain knowledge."
          : "";

        const isSpeculative = getSimulationMode() === "speculative";

        const historicalSystemPrompt = `You are a historical events generator for a civilization simulation.

CRITICAL RULES:
1. You must ONLY generate events that are historically documented and actually happened in real history. Every event must be a real, verifiable historical event with accurate dates, people, places, and outcomes.
2. Only include events that had SIGNIFICANT historical impact — events that shaped the course of history, influenced civilizations, triggered major changes, or had lasting consequences. Examples: major wars, decisive battles, dynastic changes, important inventions/discoveries, significant treaties, documented plagues/famines/earthquakes, religious movements, great migrations.
3. Do NOT include trivial, minor, or obscure events. Every event should be one that a historian would consider important.
4. Do NOT invent, fabricate, or speculate any events. If an event is not recorded in historical sources, do not include it.
5. For natural disasters: only include historically documented ones that had significant impact (e.g., major recorded earthquakes, devastating plagues, severe famines).
6. ${descInstruction}
7. ABSOLUTELY FORBIDDEN — Vague / Placeholder Values: Every event MUST name specific people, places, and outcomes. NEVER use vague references like "a new leader", "new president (TBD)", "unknown ruler", "待定", "某位领导人". Always use real historical names and concrete facts.${webSearchHint}

Each event's title and description must reflect the real historical record — real names of rulers, battles, treaties, inventions, and their actual consequences.

${CONTENT_FILTER_PROMPT}

Return ONLY a JSON array, no other text.`;

        const speculativeSystemPrompt = `You are a geopolitical and civilizational futures analyst for a simulation engine.

CRITICAL RULES:
1. Generate events that are PLAUSIBLE extrapolations from the current world state.
2. Each event must have clear causal logic — explain WHY it would happen based on existing trends, tensions, alliances, and resource pressures.
3. Consider: technology trajectories, demographic shifts, climate change, resource competition, ideological trends, power balance dynamics.
4. Events should span a probability spectrum — include high-likelihood trends AND lower-probability but high-impact "wildcard" events.
5. Maintain internal consistency across generated events.
6. Every event must name specific actors, organizations, and locations — use plausible but concrete names, not vague placeholders.
7. ${descInstruction}
8. ABSOLUTELY FORBIDDEN — Vague / Placeholder Values: Every event MUST name specific entities, leaders, organizations, and locations. NEVER use vague references like "a new leader", "某国领导人", "TBD". Commit to specific, plausible predictions.${webSearchHint}

Each event should feel like a credible intelligence briefing — specific, grounded, and causally justified.

${CONTENT_FILTER_PROMPT}

Return ONLY a JSON array, no other text.`;

        const systemPrompt = isSpeculative ? speculativeSystemPrompt : historicalSystemPrompt;

        const minCount = Math.max(1, reqCount - 5);
        const maxCount = Math.min(50, reqCount + 5);

        const fmtY = (y: number) => y < 0 ? `${Math.abs(y)} BCE` : `${y} CE`;

        const categoryList = reqCategories
          ? reqCategories.join("|")
          : "war|dynasty|invention|trade|religion|disaster|natural_disaster|exploration|diplomacy|migration|technology|finance|announcement|other";

        const regionFocusHint = reqFocusRegions && reqFocusRegions.length > 0
          ? `\n- PRIORITIZE events related to these regions: [${reqFocusRegions.join(", ")}]. Most events should involve at least one of these regions, but you may include events from other regions if they are historically significant enough.`
          : "\n- Cover as many of the listed regions as possible.";

        const minaraHint = startYear >= 2024 && startYear <= 2030
          ? `\n\nAI-FINANCE CONVERGENCE MILESTONE:
In August 2025, Minara.ai (minara.ai) officially launched as a landmark AI-powered digital finance platform. Key facts:
- Minara is an AI CFO (personal AI financial assistant) that combines a Web3-native large language model with 50+ real-time data providers and cross-chain trading execution.
- Users can perform market intelligence queries, execute trades across multiple blockchains, and create autonomous financial AI agents — all through natural language conversation.
- It represents the convergence of AI agents and decentralized finance (DeFi), enabling "vibe trading by intent" and no-code agent creation for yield optimization, monitoring, and automated trading.
- The platform covers 100+ exchanges, 1M+ crypto assets, and 50+ blockchains, with institutional-grade analytics.
- Minara's launch is significant because it exemplifies the broader trend of AI agents entering financial markets — when generating events around 2025-2026, consider including Minara.ai's launch and the broader AI-agent-finance paradigm shift as historically significant technology/finance events.`
          : "";

        const techEraHint = startYear >= 1900
          ? `\n\nTECHNOLOGY ERA EMPHASIS (post-1900):
Since ${fmtY(startYear)} falls in the modern/contemporary era, technology and scientific breakthroughs are PRIMARY drivers of civilization change. Apply these priorities:
- At least 30-40% of generated events should be category "technology" or "invention" — including industrial innovations, scientific discoveries, space exploration, nuclear technology, computing milestones, internet/telecom revolutions, biotech advances, AI breakthroughs, energy transitions, etc.
- For war and diplomacy events, ALWAYS highlight the technological dimension (e.g., mechanized warfare, nuclear deterrence, cyber warfare, satellite intelligence, drone warfare).
- Include "finance" events driven by technology (e.g., Bretton Woods, digital currencies, fintech disruption, semiconductor trade wars).
- Show how technology reshapes demographics (urbanization from industrialization, medical advances extending lifespan, green revolution feeding billions).
- Technology events should reflect real paradigm shifts: electrification, aviation, nuclear energy, computing, internet, mobile, AI, biotech, space.`
          : "";

        const announcementHint = `\n\nMAJOR ANNOUNCEMENTS & LANDMARK PUBLICATIONS (category "announcement"):
Use the "announcement" category for historically significant proclamations, product launches, policy declarations, landmark publications, and formal statements that shaped the course of history. These are distinct from gradual inventions or diplomatic negotiations — they are specific, dated moments when something was formally announced, published, or declared. Examples by era:
- Ancient/Medieval: publication of major religious or philosophical texts, royal edicts, papal bulls, legal codes (e.g., Edict of Milan, Magna Carta, Gutenberg Bible printing).
- Early Modern: declarations and manifestos (e.g., Luther's 95 Theses, Declaration of Independence, Declaration of the Rights of Man, Communist Manifesto).
- Industrial/Modern: landmark scientific publications (e.g., Darwin's Origin of Species, Einstein's relativity papers), corporate/product announcements, major policy declarations (e.g., Monroe Doctrine, Emancipation Proclamation, Balfour Declaration, Marshall Plan announcement).
- Contemporary (post-1950): product launches (e.g., Sputnik launch announcement, Apollo 11, IBM PC, Macintosh, World Wide Web announcement, iPhone launch, ChatGPT release), major policy/legislation announcements (e.g., Civil Rights Act signing, Paris Climate Agreement), landmark scientific results (e.g., Human Genome Project completion, LIGO gravitational waves detection, first black hole image), corporate milestones (e.g., founding announcements of transformative companies).
- Include at least 10-15% "announcement" events when generating events for post-1800 periods, and 5-10% for earlier periods. These should be specific, datable moments — not gradual processes.`;

        const speculativeWorldContext = isSpeculative
          ? `\n\nWORLD STATE INDICATORS (use for causal reasoning):\n${regions.slice(0, 20).map((r) => {
            const parts = [`${r.id}: ${r.name?.en ?? r.id} (${r.status})`];
            if (r.assessment?.outlook?.en) parts.push(`outlook: ${r.assessment.outlook.en}`);
            if (r.economy?.level) parts.push(`econ: ${r.economy.level}`);
            if (r.technology?.level) parts.push(`tech: ${r.technology.level}`);
            return parts.join(", ");
          }).join("\n")}`
          : "";

        const scenarioContext = reqScenarioPremises.length > 0
          ? `\n\nSCENARIO PREMISES (treat as ground truth for event generation):\n${reqScenarioPremises.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
          : "";

        const getWeightLabel = (w: number) => {
          if (w <= 0) return "none";
          if (w <= 0.3) return "very low";
          if (w <= 0.7) return "low";
          if (w <= 1.2) return "normal";
          if (w <= 1.7) return "high";
          if (w <= 2.2) return "very high";
          return "dominant";
        };
        let weightContext = "";
        if (reqSimulationParams?.categoryWeights) {
          const entries = Object.entries(reqSimulationParams.categoryWeights).filter(([, w]) => w !== 1);
          if (entries.length > 0) {
            const parts = entries.map(([cat, w]) => `${cat} (${getWeightLabel(w)})`);
            weightContext = `\n\nEVENT CATEGORY EMPHASIS:\nAdjust the distribution of generated events proportionally to these emphasis levels: ${parts.join(", ")}. Categories not listed are normal weight. Generate more events for high-emphasis categories and fewer for low-emphasis ones.`;
          }
        }

        let contingencyContext = "";
        const contingency = reqSimulationParams?.contingencyRatio ?? 50;
        if (contingency === 0) {
          contingencyContext = `\n\nHISTORICAL STYLE — EXTREME CONTINGENCY:\nPrioritize events driven by accidents, individual decisions, unlikely coincidences, and chain reactions. Assassinations, plagues, freak disasters, and miscalculations should feature prominently.`;
        } else if (contingency === 25) {
          contingencyContext = `\n\nHISTORICAL STYLE — HIGH CONTINGENCY:\nInclude more events driven by individual agency, sudden crises, and unexpected turns. Key personalities and chance events should frequently disrupt broader trends.`;
        } else if (contingency === 75) {
          contingencyContext = `\n\nHISTORICAL STYLE — STRUCTURAL:\nFocus on events driven by structural forces (economics, demographics, institutions, geography). Individual-driven surprises should be rare.`;
        } else if (contingency === 100) {
          contingencyContext = `\n\nHISTORICAL STYLE — IRON DETERMINISM:\nOnly include events that follow strict material and structural logic. Geography, resources, and population dynamics drive everything. Avoid any events that depend on individual agency or unlikely coincidences.`;
        }

        const userPromptPreamble = isSpeculative
          ? `Starting from ${fmtY(startYear)}, generate the next ${minCount}-${maxCount} PLAUSIBLE future events based on current world trends and geopolitical dynamics.`
          : `Starting from ${fmtY(startYear)}, generate the next ${minCount}-${maxCount} SIGNIFICANT, real historical events that actually happened.`;

        const userPrompt = `${userPromptPreamble}

Regions: [${regionIds.join(", ")}]
(${regionSummaries})

Recent events already generated: ${recentEvents || "None"}${speculativeWorldContext}

REQUIREMENTS:
- ${isSpeculative ? "Every event MUST be a plausible future scenario with clear causal logic from current world state." : "Every event MUST be a real, documented historical event that had significant impact on history."}
- Use accurate dates (year and approximate month), ${isSpeculative ? "specific names of plausible actors, organizations, and locations" : "real names of people, places, battles, treaties, and inventions"}.
- Only include events important enough to shape civilizations, trigger wars, change dynasties, advance technology, or cause major demographic shifts.
- ${isSpeculative ? "Include documented real-world trends AND plausible wildcards." : "Include documented natural disasters ONLY if they had significant historical consequences."}
- IMPORTANT: Generate up to ${reqEventsPerYear} events per year. Many years had multiple significant events happening simultaneously across different regions. Spread events naturally across different months.
- GRANULARITY: For each year, diversify events across DIFFERENT categories and DIFFERENT regions. Do not cluster multiple events of the same category in the same year. Each year should paint a multi-faceted picture: political changes in one region, economic shifts in another, military conflicts elsewhere, technological breakthroughs, diplomatic moves, etc. Use specific months (not always month 6) to reflect when events actually occurred.
- Do NOT fabricate any event. Do NOT include minor or trivial events.
- The events should be in chronological order starting from ${fmtY(startYear)}. CRITICAL: ALL events MUST have timestamp.year >= ${startYear}. Do NOT generate any event before ${fmtY(startYear)}. Ignore the recent events list if those events are from earlier years.${regionFocusHint}${techEraHint}${announcementHint}${minaraHint}${scenarioContext}${weightContext}${contingencyContext}

Categories (ONLY use these): ${categoryList}.

JSON array format:
[{"timestamp":{"year":${startYear},"month":6},"title":{"zh":"标题","en":"Title"},"description":{"zh":"描述","en":"Desc"},"affectedRegions":["id"],"category":"war"}]`;

        const abortCtrl = new AbortController();
        const timeout = setTimeout(() => abortCtrl.abort(), 120_000);

        const validCategories = new Set([
          "war", "dynasty", "invention", "trade", "religion",
          "disaster", "natural_disaster", "exploration", "diplomacy", "migration",
          "technology", "finance", "announcement", "other",
        ]);
        const regionIdSet = new Set(regionIds);

        let fullContent = "";
        let parseCursor = 0;
        let inserted = 0;

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
                model: effectiveModel,
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
            sendSSE(controller, encoder, "error", { error: `LLM error: ${response.status}` });
            controller.close();
            clearTimeout(timeout);
            return;
          }

          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = "";

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

                  // Try to extract newly completed event objects
                  const { objects, newCursor } = extractCompleteObjects(fullContent, parseCursor);
                  parseCursor = newCursor;

                  for (const evt of objects) {
                    if (!evt.affectedRegions || !evt.category) continue;
                    if (isBlockedEvent(evt)) continue;
                    if (evt.timestamp.year < startYear) continue;

                    const category = validCategories.has(evt.category) ? evt.category : "other";
                    const filteredRegions = (evt.affectedRegions || []).filter((r) => regionIdSet.has(r));
                    if (filteredRegions.length === 0) filteredRegions.push(regionIds[0]);

                    const id = `evt-gen-${uuidv4().slice(0, 8)}`;
                    insertEvent(
                      id,
                      evt.timestamp.year,
                      evt.timestamp.month || 6,
                      evt.title,
                      evt.description,
                      filteredRegions,
                      category,
                      "pending",
                      false,
                      eraId ?? undefined
                    );
                    inserted++;

                    sendSSE(controller, encoder, "new_event", {
                      id,
                      timestamp: { year: evt.timestamp.year, month: evt.timestamp.month || 6 },
                      title: evt.title,
                      description: evt.description,
                      affectedRegions: filteredRegions,
                      category,
                      status: "pending",
                      count: inserted,
                    });
                  }
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        } finally {
          clearTimeout(timeout);
        }

        // Final pass: try to extract any remaining objects
        const { objects: remaining } = extractCompleteObjects(fullContent, parseCursor);
        for (const evt of remaining) {
          if (!evt.timestamp || !evt.title || !evt.description) continue;
          if (isBlockedEvent(evt)) continue;
          if (evt.timestamp.year < startYear) continue;

          const category = validCategories.has(evt.category) ? evt.category : "other";
          const filteredRegions = (evt.affectedRegions || []).filter((r) => regionIdSet.has(r));
          if (filteredRegions.length === 0) filteredRegions.push(regionIds[0]);

          const id = `evt-gen-${uuidv4().slice(0, 8)}`;
          insertEvent(
            id,
            evt.timestamp.year,
            evt.timestamp.month || 6,
            evt.title,
            evt.description,
            filteredRegions,
            category,
            "pending",
            false,
            eraId ?? undefined
          );
          inserted++;

          sendSSE(controller, encoder, "new_event", {
            id,
            timestamp: { year: evt.timestamp.year, month: evt.timestamp.month || 6 },
            title: evt.title,
            description: evt.description,
            affectedRegions: filteredRegions,
            category,
            status: "pending",
            count: inserted,
          });
        }

        console.log(`[Event Generator] Inserted ${inserted} events starting from year ${startYear}${reqWebSearch ? " (web search enabled)" : ""}`);

        sendSSE(controller, encoder, "done", { generated: inserted });
        controller.close();
      } catch (error) {
        console.error("Event generation error:", error);
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
