import { NextResponse } from "next/server";
import { getEvolutionLogs } from "@/lib/db";

export async function GET() {
  try {
    const logs = getEvolutionLogs();
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Failed to fetch evolution logs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
