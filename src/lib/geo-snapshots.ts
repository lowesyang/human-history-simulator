import fs from "fs";
import path from "path";
import type { Region } from "./types";
import { getPublicDir } from "./paths";

const SNAPSHOT_YEARS = [
  -2000, -1500, -1000, -700, -500, -400, -323, -300, -200, -100, -1,
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1279,
  1300, 1400, 1492, 1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815,
  1880, 1900, 1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010,
];

const snapshotCache = new Map<number, Record<string, GeoJSON.Geometry>>();

export function findClosestSnapshotYear(simYear: number): number {
  let best = SNAPSHOT_YEARS[0];
  let bestDist = Math.abs(simYear - best);
  for (const y of SNAPSHOT_YEARS) {
    const dist = Math.abs(simYear - y);
    if (dist < bestDist) {
      bestDist = dist;
      best = y;
    }
    if (y > simYear && dist > bestDist) break;
  }
  return best;
}

export function loadSnapshot(
  year: number
): Record<string, GeoJSON.Geometry> | null {
  const cached = snapshotCache.get(year);
  if (cached) return cached;

  const filePath = path.join(
    getPublicDir(),
    "geojson",
    "snapshots",
    `${year}.json`
  );
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as Record<string, GeoJSON.Geometry>;
    snapshotCache.set(year, data);
    return data;
  } catch {
    return null;
  }
}

/**
 * Merge real boundary geometry from a snapshot into Region objects.
 * Only overwrites region.geometry if a match is found in the snapshot;
 * regions without a snapshot match keep their existing geometry (or none).
 */
export function mergeSnapshotGeometry(
  regions: Region[],
  snapshotYear: number
): void {
  const snapshot = loadSnapshot(snapshotYear);
  if (!snapshot) return;

  for (const region of regions) {
    const geometry = snapshot[region.id];
    if (geometry) {
      region.geometry = geometry;
    }
  }
}

export function getSnapshotYears(): number[] {
  return SNAPSHOT_YEARS;
}
