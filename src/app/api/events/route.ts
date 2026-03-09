import { NextRequest, NextResponse } from "next/server";
import { getEvents, getFrontier, getOriginTime, deletePendingEvents } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") as
      | "pending"
      | "processed"
      | null;

    const events = getEvents(statusFilter ?? undefined);
    const frontier = getFrontier();
    const originTime = getOriginTime();

    return NextResponse.json({ events, frontier, originTime });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const deleted = deletePendingEvents();
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("Clear pending events error:", error);
    return NextResponse.json(
      { error: "Failed to clear pending events" },
      { status: 500 }
    );
  }
}
