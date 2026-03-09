import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  getLatestSnapshot,
  getEvents,
  insertEvent,
  getFrontier,
} from "@/lib/db";
import type { Region } from "@/lib/types";

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
  const encoder = new TextEncoder();

  let reqCount = 20;
  let reqStartYear: number | undefined;
  let reqEventsPerYear = 3;
  let reqCategories: string[] | undefined;
  let reqFocusRegions: string[] | undefined;
  let reqDetailLevel: "brief" | "normal" | "detailed" = "normal";
  try {
    const body = await request.json();
    if (body.count) reqCount = Math.min(Math.max(Number(body.count), 1), 50);
    if (body.startYear != null) reqStartYear = Number(body.startYear);
    if (body.eventsPerYear != null) reqEventsPerYear = Math.min(Math.max(Number(body.eventsPerYear), 1), 5);
    if (body.categories && Array.isArray(body.categories) && body.categories.length > 0) {
      reqCategories = body.categories;
    }
    if (body.focusRegions && Array.isArray(body.focusRegions) && body.focusRegions.length > 0) {
      reqFocusRegions = body.focusRegions;
    }
    if (body.detailLevel) reqDetailLevel = body.detailLevel;
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
        });

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
          sendSSE(controller, encoder, "error", { error: "OPENROUTER_API_KEY not configured" });
          controller.close();
          return;
        }

        const model = process.env.LLM_MODEL || "openai/gpt-5.4";

        const descInstruction = reqDetailLevel === "brief"
          ? "Keep descriptions very concise (1 sentence each)."
          : reqDetailLevel === "detailed"
            ? "Provide detailed descriptions (2-4 sentences each) including causes, key figures, and consequences."
            : "Provide moderate descriptions (1-2 sentences each).";

        const systemPrompt = `You are a historical events generator for a civilization simulation.

CRITICAL RULES:
1. You must ONLY generate events that are historically documented and actually happened in real history. Every event must be a real, verifiable historical event with accurate dates, people, places, and outcomes.
2. Only include events that had SIGNIFICANT historical impact — events that shaped the course of history, influenced civilizations, triggered major changes, or had lasting consequences. Examples: major wars, decisive battles, dynastic changes, important inventions/discoveries, significant treaties, documented plagues/famines/earthquakes, religious movements, great migrations.
3. Do NOT include trivial, minor, or obscure events. Every event should be one that a historian would consider important.
4. Do NOT invent, fabricate, or speculate any events. If an event is not recorded in historical sources, do not include it.
5. For natural disasters: only include historically documented ones that had significant impact (e.g., major recorded earthquakes, devastating plagues, severe famines).
6. ${descInstruction}

Each event's title and description must reflect the real historical record — real names of rulers, battles, treaties, inventions, and their actual consequences.

Return ONLY a JSON array, no other text.`;

        const minCount = Math.max(1, reqCount - 5);
        const maxCount = Math.min(50, reqCount + 5);

        const fmtY = (y: number) => y < 0 ? `${Math.abs(y)} BCE` : `${y} CE`;

        const categoryList = reqCategories
          ? reqCategories.join("|")
          : "war|dynasty|invention|trade|religion|disaster|natural_disaster|exploration|diplomacy|migration|other";

        const regionFocusHint = reqFocusRegions && reqFocusRegions.length > 0
          ? `\n- PRIORITIZE events related to these regions: [${reqFocusRegions.join(", ")}]. Most events should involve at least one of these regions, but you may include events from other regions if they are historically significant enough.`
          : "\n- Cover as many of the listed regions as possible.";

        const userPrompt = `Starting from ${fmtY(startYear)}, generate the next ${minCount}-${maxCount} SIGNIFICANT, real historical events that actually happened.

Regions: [${regionIds.join(", ")}]
(${regionSummaries})

Recent events already generated: ${recentEvents || "None"}

REQUIREMENTS:
- Every event MUST be a real, documented historical event that had significant impact on history.
- Use accurate dates (year and approximate month), real names of people, places, battles, treaties, and inventions.
- Only include events important enough to shape civilizations, trigger wars, change dynasties, advance technology, or cause major demographic shifts.
- Include documented natural disasters ONLY if they had significant historical consequences.
- IMPORTANT: Generate up to ${reqEventsPerYear} events per year. Many years had multiple significant events happening simultaneously across different regions. Spread events naturally across different months.
- Do NOT fabricate any event. Do NOT include minor or trivial events.
- The events should be in chronological order starting from ${fmtY(startYear)}.${regionFocusHint}

Categories (ONLY use these): ${categoryList}.

JSON array format:
[{"timestamp":{"year":${startYear},"month":6},"title":{"zh":"标题","en":"Title"},"description":{"zh":"描述","en":"Desc"},"affectedRegions":["id"],"category":"war"}]`;

        const abortCtrl = new AbortController();
        const timeout = setTimeout(() => abortCtrl.abort(), 120_000);

        const validCategories = new Set([
          "war", "dynasty", "invention", "trade", "religion",
          "disaster", "natural_disaster", "exploration", "diplomacy", "migration", "other",
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
                      "pending"
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
            "pending"
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

        console.log(`[Event Generator] Inserted ${inserted} events starting from year ${startYear}`);

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
