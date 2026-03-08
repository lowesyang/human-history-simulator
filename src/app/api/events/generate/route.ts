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
        if (pendingEvents.length > 0) {
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

        const endYear = startYear + 29;

        sendSSE(controller, encoder, "progress", {
          stage: "calling_llm",
          startYear,
          endYear,
        });

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
          sendSSE(controller, encoder, "error", { error: "OPENROUTER_API_KEY not configured" });
          controller.close();
          return;
        }

        const model = process.env.LLM_MODEL || "openai/gpt-5.4";

        const systemPrompt = `You are a historical events generator for a civilization simulation. Generate concise, historically plausible events. Return ONLY a JSON array, no other text.`;

        const userPrompt = `Generate events for ${startYear < 0 ? `${Math.abs(startYear)} BCE` : `${startYear} CE`} to ${endYear < 0 ? `${Math.abs(endYear)} BCE` : `${endYear} CE`}.

Regions: [${regionIds.join(", ")}]
(${regionSummaries})

Recent: ${recentEvents || "None"}

Generate 20-30 events. Categories: war|dynasty|invention|trade|religion|disaster|natural_disaster|exploration|diplomacy|migration|other.
Include 3-4 natural disasters. Every region should appear at least once.

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
                temperature: 0.7,
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

        console.log(`[Event Generator] Inserted ${inserted} events for years ${startYear}-${endYear}`);

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
