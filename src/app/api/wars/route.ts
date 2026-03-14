import { NextRequest, NextResponse } from "next/server";
import { getActiveWars, getAllWars, getWarSnapshotsForWars } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");

  try {
    const wars = year ? getActiveWars(Number(year)) : getAllWars();
    const warIds = (wars as { id: string }[]).map((w) => w.id);
    const snapshots = getWarSnapshotsForWars(warIds);
    return NextResponse.json({ wars, snapshots });
  } catch (error) {
    console.error("Failed to get wars:", error);
    return NextResponse.json(
      { error: "Failed to get wars" },
      { status: 500 }
    );
  }
}
