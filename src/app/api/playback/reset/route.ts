import { NextResponse } from "next/server";
import {
  hardResetCurrentEra,
  getLatestSnapshot,
  getEvents,
  getFrontier,
  getOriginTime,
  getCurrentEraId,
  switchToEra,
} from "@/lib/db";
import { ERA_PRESETS } from "@/data/era-presets";
import {
  findClosestSnapshotYear,
  mergeSnapshotGeometry,
} from "@/lib/geo-snapshots";
import type { Region } from "@/lib/types";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

function tryLoadPrebuilt(eraId: string) {
  const filePath = path.join(process.cwd(), "src", "data", "seed", `era-${eraId}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export async function POST() {
  try {
    const eraId = getCurrentEraId();

    hardResetCurrentEra();

    if (eraId) {
      const preset = ERA_PRESETS.find((e) => e.id === eraId);
      const prebuilt = tryLoadPrebuilt(eraId);

      if (preset && prebuilt) {
        const dbEvents = (prebuilt.events || []).map((evt: { id: string; timestamp: { year: number; month: number }; title: object; description: object; affectedRegions: string[]; category: string; status?: string }) => ({
          id: evt.id || `evt-seed-${uuidv4().slice(0, 8)}`,
          year: evt.timestamp.year,
          month: evt.timestamp.month,
          title: evt.title,
          description: evt.description,
          affectedRegions: evt.affectedRegions,
          category: evt.category,
          status: "pending",
        }));

        const snapshotYear = findClosestSnapshotYear(prebuilt.timestamp.year);
        const regions = prebuilt.regions as Region[];
        mergeSnapshotGeometry(regions, snapshotYear);

        switchToEra(
          prebuilt.id,
          prebuilt.timestamp.year,
          prebuilt.timestamp.month,
          prebuilt.era,
          regions,
          prebuilt.summary,
          dbEvents.length > 0 ? dbEvents : undefined,
          eraId
        );
      }
    }

    const snapshot = getLatestSnapshot();
    const events = getEvents();
    const frontier = getFrontier();
    const originTime = getOriginTime();

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
      originTime,
    });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reset failed" },
      { status: 500 }
    );
  }
}
