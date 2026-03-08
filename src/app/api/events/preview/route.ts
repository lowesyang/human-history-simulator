import { NextRequest, NextResponse } from "next/server";
import { getNEpochsEvents } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const epochs = Math.min(Math.max(parseInt(searchParams.get("epochs") || "1", 10), 1), 10);

    const events = getNEpochsEvents(epochs);

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Preview events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preview events" },
      { status: 500 }
    );
  }
}
