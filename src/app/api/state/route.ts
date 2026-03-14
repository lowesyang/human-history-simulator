import { NextRequest, NextResponse } from "next/server";
import { getSnapshot, getLatestSnapshot, getActiveWars, getWarSnapshotsForWars } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get("year");
    const monthStr = searchParams.get("month");

    let snapshot;
    if (yearStr && monthStr) {
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      snapshot = getSnapshot(year, month);
    } else {
      snapshot = getLatestSnapshot();
    }

    if (!snapshot) {
      return NextResponse.json(
        { error: "No state snapshot found" },
        { status: 404 }
      );
    }

    const wars = getActiveWars(snapshot.year);
    const warIds = (wars as { id: string }[]).map((w) => w.id);
    const warSnapshots = warIds.length > 0 ? getWarSnapshotsForWars(warIds) : {};

    return NextResponse.json({
      id: snapshot.id,
      timestamp: { year: snapshot.year, month: snapshot.month },
      era: snapshot.era,
      regions: snapshot.regions,
      summary: snapshot.summary,
      triggeredByEventId: snapshot.triggeredByEventId,
      wars,
      warSnapshots,
    });
  } catch (error) {
    console.error("State API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch state" },
      { status: 500 }
    );
  }
}
