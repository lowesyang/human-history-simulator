import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { orchestrate } from "@/lib/agents";
import {
  getLatestSnapshot,
  getNextEpochEvents,
  insertSnapshot,
  markEventsProcessed,
  insertEvolutionLog,
  insertWar,
  getActiveWars,
  updateWarStatus,
} from "@/lib/db";
import { generateChangelog } from "@/lib/changelog";
import { extractWarsFromEvents } from "@/lib/war-extractor";
import type { WorldState, HistoricalEvent, Region, War } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const epochs = Math.min(Math.max(body.epochs || 1, 1), 10);
  const excludedEventIds = new Set<string>(
    Array.isArray(body.excludedEventIds) ? body.excludedEventIds : []
  );

  const encoder = new TextEncoder();
  let closed = false;

  function sendSSE(
    controller: ReadableStreamDefaultController,
    event: string,
    data: unknown
  ) {
    if (closed) return;
    try {
      controller.enqueue(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      );
    } catch {
      closed = true;
    }
  }

  function safeClose(controller: ReadableStreamDefaultController) {
    if (closed) return;
    closed = true;
    try {
      controller.close();
    } catch {
      // already closed
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let lastState: WorldState | null = null;
        const allProcessedEvents: string[] = [];

        const preSnapshot = getLatestSnapshot();
        const preAdvanceYear = preSnapshot ? preSnapshot.year : null;
        sendSSE(controller, "pre_advance", { preAdvanceYear });

        for (let i = 0; i < epochs; i++) {
          const allEpochEvents = getNextEpochEvents() as HistoricalEvent[];
          const pendingEvents = excludedEventIds.size > 0
            ? allEpochEvents.filter((e) => !excludedEventIds.has(e.id))
            : allEpochEvents;
          if (pendingEvents.length === 0) {
            if (allEpochEvents.length > 0) {
              markEventsProcessed(allEpochEvents.map((e) => e.id));
              continue;
            }
            if (i === 0) {
              sendSSE(controller, "done", {
                error: "No pending events",
                done: true,
              });
              safeClose(controller);
              return;
            }
            break;
          }

          const targetYear = pendingEvents[0].timestamp.year;

          sendSSE(controller, "progress", {
            stage: "loading_events",
            epoch: i + 1,
            totalEpochs: epochs,
            targetYear,
            eventCount: pendingEvents.length,
          });

          const latestSnapshot = getLatestSnapshot();
          if (!latestSnapshot) {
            sendSSE(controller, "error", {
              error: "No initial state found",
            });
            safeClose(controller);
            return;
          }

          const currentState: WorldState = {
            id: latestSnapshot.id,
            timestamp: {
              year: latestSnapshot.year,
              month: latestSnapshot.month,
            },
            era: latestSnapshot.era,
            regions: latestSnapshot.regions as Region[],
            summary: latestSnapshot.summary,
          };

          const tokenBuffers = new Map<string, string>();
          let tokenFlushTimer: ReturnType<typeof setTimeout> | null = null;

          const flushTokens = () => {
            for (const [rid, buf] of tokenBuffers.entries()) {
              if (buf) {
                sendSSE(controller, "llm_token", {
                  regionId: rid,
                  token: buf,
                });
              }
            }
            tokenBuffers.clear();
            tokenFlushTimer = null;
          };

          const warsForOrchestrate = getActiveWars(targetYear) as War[];

          const result = await orchestrate(
            currentState,
            pendingEvents,
            (stage, detail) => {
              sendSSE(controller, "progress", {
                stage,
                epoch: i + 1,
                totalEpochs: epochs,
                targetYear,
                ...detail,
              });
            },
            (regionId, token) => {
              tokenBuffers.set(regionId, (tokenBuffers.get(regionId) || "") + token);
              if (!tokenFlushTimer) {
                tokenFlushTimer = setTimeout(flushTokens, 80);
              }
            },
            warsForOrchestrate
          );

          if (tokenFlushTimer) {
            clearTimeout(tokenFlushTimer);
          }
          flushTokens();

          sendSSE(controller, "progress", {
            stage: "saving",
            epoch: i + 1,
            totalEpochs: epochs,
            targetYear,
          });

          const lastEvent = pendingEvents[pendingEvents.length - 1];
          const newSnapshotId = uuidv4();

          insertSnapshot(
            newSnapshotId,
            lastEvent.timestamp.year,
            lastEvent.timestamp.month,
            result.era as object,
            result.regions as object[],
            result.summary as object,
            lastEvent.id
          );

          const eventIds = allEpochEvents.map((e) => e.id);
          markEventsProcessed(eventIds);
          allProcessedEvents.push(...pendingEvents.map((e) => e.id));

          lastState = {
            id: newSnapshotId,
            timestamp: lastEvent.timestamp,
            era: result.era,
            regions: result.regions,
            triggeredByEventId: lastEvent.id,
            summary: result.summary,
          };

          const directIds = new Set<string>();
          for (const evt of pendingEvents) {
            for (const rid of evt.affectedRegions) {
              directIds.add(rid);
            }
          }

          const changelog = generateChangelog(
            result.transitions,
            currentState.regions,
            pendingEvents,
            targetYear,
            result.era,
            result.summary,
            directIds
          );

          sendSSE(controller, "changelog", changelog);

          insertEvolutionLog(targetYear, changelog);

          const hasWarEvents = pendingEvents.some((e) => e.category === "war");
          let newWars: War[] = [];
          if (hasWarEvents) {
            try {
              const existingWars = getActiveWars(targetYear) as War[];
              const rawWars = await extractWarsFromEvents(
                pendingEvents,
                result.regions,
                existingWars,
                targetYear
              );
              for (const w of rawWars) {
                if (!w.name || !w.belligerents) continue;
                const existingMatch = existingWars.find(
                  (ew) => ew.name.en === w.name!.en || ew.name.zh === w.name!.zh
                );
                if (existingMatch && w.status && w.status !== "ongoing") {
                  updateWarStatus(existingMatch.id, w.status, targetYear);
                } else if (!existingMatch) {
                  const warId = `war-${uuidv4().slice(0, 8)}`;
                  const war: War = {
                    id: warId,
                    name: w.name!,
                    startYear: targetYear,
                    endYear: w.status && w.status !== "ongoing" ? targetYear : null,
                    belligerents: w.belligerents!,
                    cause: w.cause || { zh: "", en: "" },
                    casus_belli: w.casus_belli || { zh: "", en: "" },
                    status: w.status || "ongoing",
                    victor: w.victor ?? null,
                    summary: w.summary || { zh: "", en: "" },
                    advantages: w.advantages || { side1: { zh: "", en: "" }, side2: { zh: "", en: "" } },
                    impact: w.impact || { side1: { zh: "", en: "" }, side2: { zh: "", en: "" } },
                    relatedEventIds: pendingEvents.filter((e) => e.category === "war").map((e) => e.id),
                  };
                  insertWar(
                    war.id, war.name, war.startYear, war.endYear,
                    war.belligerents, war.cause, war.casus_belli,
                    war.status, war.summary, war.advantages,
                    war.impact, war.relatedEventIds, war.victor
                  );
                  newWars.push(war);
                }
              }
            } catch (err) {
              console.error("[Advance] War extraction failed:", err);
            }
          }

          const activeWarsForYear = getActiveWars(targetYear) as War[];

          sendSSE(controller, "epoch_complete", {
            epoch: i + 1,
            totalEpochs: epochs,
            state: lastState,
            wars: activeWarsForYear,
          });
        }

        const finalWars = lastState
          ? (getActiveWars(lastState.timestamp.year) as War[])
          : [];

        sendSSE(controller, "done", {
          state: lastState,
          processedEvents: allProcessedEvents,
          wars: finalWars,
          done: false,
        });

        safeClose(controller);
      } catch (error) {
        console.error("Playback advance error:", error);
        sendSSE(controller, "error", {
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        safeClose(controller);
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
