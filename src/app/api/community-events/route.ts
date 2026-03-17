import { NextResponse } from "next/server";
import { getAllCommunityEvents } from "@/lib/community-events";

export async function GET() {
  try {
    const events = getAllCommunityEvents();
    return NextResponse.json({ events });
  } catch (error) {
    console.error("[API] Failed to load community events:", error);
    return NextResponse.json({ events: [], error: "Failed to load community events" }, { status: 500 });
  }
}
