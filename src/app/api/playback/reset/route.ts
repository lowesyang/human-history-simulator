import { NextResponse } from "next/server";
import { resetToInitialState, getLatestSnapshot, getEvents, getFrontier } from "@/lib/db";

export async function POST() {
  try {
    resetToInitialState();

    const snapshot = getLatestSnapshot();
    const events = getEvents();
    const frontier = getFrontier();

    return NextResponse.json({
      state: snapshot
        ? {
          id: snapshot.id,
          timestamp: { year: snapshot.year, month: snapshot.month },
          era: snapshot.era,
          regions: snapshot.regions,
          summary: snapshot.summary,
        }
        : null,
      events,
      frontier,
    });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reset failed" },
      { status: 500 }
    );
  }
}
