import { NextRequest, NextResponse } from "next/server";
import { rollbackToYear, getLatestSnapshot, getEvents, getFrontier, getActiveWars } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const year = body.year as number;

    if (year == null || typeof year !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid 'year' parameter" },
        { status: 400 }
      );
    }

    rollbackToYear(year);

    const snapshot = getLatestSnapshot();
    const events = getEvents();
    const frontier = getFrontier();
    const wars = snapshot ? getActiveWars(snapshot.year) : [];

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
      wars,
    });
  } catch (error) {
    console.error("Rollback error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rollback failed" },
      { status: 500 }
    );
  }
}
