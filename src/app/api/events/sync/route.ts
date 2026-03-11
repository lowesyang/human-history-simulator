import { NextRequest, NextResponse } from "next/server";
import { insertEvent, getEvents, getCurrentEraId } from "@/lib/db";
import type { HistoricalEvent } from "@/lib/types";
import { isBlockedEvent } from "@/lib/content-filter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientEvents = body.events as HistoricalEvent[];

    if (!clientEvents || clientEvents.length === 0) {
      return NextResponse.json({ synced: 0 });
    }

    const eraId = getCurrentEraId();
    const dbEvents = getEvents("pending");
    const existingIds = new Set(dbEvents.map((e) => e.id));

    let synced = 0;
    for (const evt of clientEvents) {
      if (evt.status !== "pending" || existingIds.has(evt.id)) continue;
      if (isBlockedEvent(evt)) continue;

      insertEvent(
        evt.id,
        evt.timestamp.year,
        evt.timestamp.month,
        evt.title,
        evt.description,
        evt.affectedRegions,
        evt.category,
        "pending",
        evt.isCustom ?? false,
        eraId ?? undefined
      );
      synced++;
    }

    return NextResponse.json({ synced });
  } catch (error) {
    console.error("Events sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync events" },
      { status: 500 }
    );
  }
}
