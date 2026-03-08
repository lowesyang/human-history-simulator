import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { callLLM, extractJSON } from "@/lib/llm";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import {
  getLatestSnapshot,
  insertSnapshot,
  markEventsProcessed,
  getEvents,
} from "@/lib/db";
import type { WorldState, HistoricalEvent, Region } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventIds } = body as { eventIds: string[] };

    if (!eventIds || eventIds.length === 0) {
      return NextResponse.json(
        { error: "No event IDs provided" },
        { status: 400 }
      );
    }

    const latestSnapshot = getLatestSnapshot();
    if (!latestSnapshot) {
      return NextResponse.json(
        { error: "No initial state found. Run seed-db first." },
        { status: 500 }
      );
    }

    const allEvents = getEvents() as HistoricalEvent[];
    const targetEvents = eventIds
      .map((id) => allEvents.find((e) => e.id === id))
      .filter(Boolean) as HistoricalEvent[];

    if (targetEvents.length === 0) {
      return NextResponse.json(
        { error: "No matching events found" },
        { status: 404 }
      );
    }

    const currentState: WorldState = {
      id: latestSnapshot.id,
      timestamp: { year: latestSnapshot.year, month: latestSnapshot.month },
      era: latestSnapshot.era,
      regions: latestSnapshot.regions as Region[],
      summary: latestSnapshot.summary,
    };

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(currentState, targetEvents);

    const llmResponse = await callLLM(systemPrompt, userPrompt);
    const jsonStr = extractJSON(llmResponse);
    const parsed = JSON.parse(jsonStr);

    const lastEvent = targetEvents[targetEvents.length - 1];
    const newSnapshotId = uuidv4();

    insertSnapshot(
      newSnapshotId,
      lastEvent.timestamp.year,
      lastEvent.timestamp.month,
      parsed.era,
      parsed.regions,
      parsed.summary,
      lastEvent.id
    );

    markEventsProcessed(eventIds);

    const newState: WorldState = {
      id: newSnapshotId,
      timestamp: lastEvent.timestamp,
      era: parsed.era,
      regions: parsed.regions,
      triggeredByEventId: lastEvent.id,
      summary: parsed.summary,
    };

    return NextResponse.json({ state: newState, processedEvents: eventIds });
  } catch (error) {
    console.error("Transition error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
