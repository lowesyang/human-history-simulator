import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { orchestrate } from "@/lib/agents";
import {
  getLatestSnapshot,
  getNextEpochEvents,
  insertSnapshot,
  markEventsProcessed,
  insertEvolutionLog,
} from "@/lib/db";
import { generateChangelog } from "@/lib/changelog";
import type { WorldState, HistoricalEvent, Region } from "@/lib/types";

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
            }
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

          sendSSE(controller, "epoch_complete", {
            epoch: i + 1,
            totalEpochs: epochs,
            state: lastState,
          });
        }

        sendSSE(controller, "done", {
          state: lastState,
          processedEvents: allProcessedEvents,
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
