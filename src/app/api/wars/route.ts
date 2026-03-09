import { NextRequest, NextResponse } from "next/server";
import { getActiveWars, getAllWars } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");

  try {
    const wars = year ? getActiveWars(Number(year)) : getAllWars();
    return NextResponse.json({ wars });
  } catch (error) {
    console.error("Failed to get wars:", error);
    return NextResponse.json(
      { error: "Failed to get wars" },
      { status: 500 }
    );
  }
}
