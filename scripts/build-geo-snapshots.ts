#!/usr/bin/env npx tsx
/**
 * Build script that downloads historical basemap GeoJSON files from
 * aourednik/historical-basemaps, simplifies polygons, matches them
 * to our region IDs, and outputs per-snapshot files.
 *
 * Usage:  npx tsx scripts/build-geo-snapshots.ts
 */

import fs from "fs";
import path from "path";
import simplify from "@turf/simplify";
import { multiPolygon, polygon } from "@turf/helpers";
import {
  REGION_NAME_MAP,
  SNAPSHOT_YEARS,
  snapshotYearToFilename,
} from "./name-mapping";

const BASE_URL =
  "https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson";
const OUT_DIR = path.join(process.cwd(), "public", "geojson", "snapshots");
const SIMPLIFY_TOLERANCE = 0.02;

async function downloadSnapshot(
  year: number
): Promise<GeoJSON.FeatureCollection | null> {
  const filename = snapshotYearToFilename(year);
  const url = `${BASE_URL}/${filename}`;
  console.log(`  Downloading ${filename}...`);
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.warn(`  ⚠ HTTP ${resp.status} for ${filename}`);
      return null;
    }
    return (await resp.json()) as GeoJSON.FeatureCollection;
  } catch (err) {
    console.warn(`  ⚠ Failed to download ${filename}:`, err);
    return null;
  }
}

function mergeGeometries(
  geometries: GeoJSON.Geometry[]
): GeoJSON.Geometry | null {
  if (geometries.length === 0) return null;
  if (geometries.length === 1) return geometries[0];

  const allCoords: number[][][][] = [];
  for (const g of geometries) {
    if (g.type === "Polygon") {
      allCoords.push((g as GeoJSON.Polygon).coordinates);
    } else if (g.type === "MultiPolygon") {
      for (const poly of (g as GeoJSON.MultiPolygon).coordinates) {
        allCoords.push(poly);
      }
    }
  }
  if (allCoords.length === 0) return null;
  if (allCoords.length === 1) {
    return { type: "Polygon", coordinates: allCoords[0] };
  }
  return { type: "MultiPolygon", coordinates: allCoords };
}

function simplifyGeometry(geometry: GeoJSON.Geometry): GeoJSON.Geometry {
  try {
    if (geometry.type === "Polygon") {
      const feature = polygon(
        (geometry as GeoJSON.Polygon).coordinates
      );
      const simplified = simplify(feature, {
        tolerance: SIMPLIFY_TOLERANCE,
        highQuality: true,
      });
      return simplified.geometry;
    } else if (geometry.type === "MultiPolygon") {
      const feature = multiPolygon(
        (geometry as GeoJSON.MultiPolygon).coordinates
      );
      const simplified = simplify(feature, {
        tolerance: SIMPLIFY_TOLERANCE,
        highQuality: true,
      });
      return simplified.geometry;
    }
  } catch {
    // If simplification fails, return original
  }
  return geometry;
}

/**
 * Build a name -> Feature[] index for fast lookup.
 */
function buildNameIndex(
  fc: GeoJSON.FeatureCollection
): Map<string, GeoJSON.Feature[]> {
  const index = new Map<string, GeoJSON.Feature[]>();
  for (const feature of fc.features) {
    const name = feature.properties?.NAME;
    if (!name) continue;
    const normalized = name.trim();
    const existing = index.get(normalized);
    if (existing) {
      existing.push(feature);
    } else {
      index.set(normalized, [feature]);
    }
  }
  return index;
}

function matchRegion(
  regionId: string,
  nameIndex: Map<string, GeoJSON.Feature[]>
): GeoJSON.Geometry | null {
  const candidates = REGION_NAME_MAP[regionId];
  if (!candidates || candidates.length === 0) return null;

  for (const candidateName of candidates) {
    const features = nameIndex.get(candidateName);
    if (features && features.length > 0) {
      const geometries = features
        .map((f) => f.geometry)
        .filter(Boolean) as GeoJSON.Geometry[];
      return mergeGeometries(geometries);
    }
  }
  return null;
}

function getAllRegionIds(): Set<string> {
  return new Set(Object.keys(REGION_NAME_MAP));
}

async function main() {
  console.log("=== Building geo snapshots ===\n");

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const allRegionIds = getAllRegionIds();
  const stats: { year: number; matched: number; total: number; sizeKb: number }[] = [];

  const prevSnapshots = new Map<string, GeoJSON.Geometry>();

  for (const year of SNAPSHOT_YEARS) {
    console.log(`\nProcessing snapshot year ${year}...`);
    const fc = await downloadSnapshot(year);
    if (!fc) {
      console.warn(`  Skipping year ${year} (download failed)`);
      continue;
    }

    const nameIndex = buildNameIndex(fc);
    const result: Record<string, GeoJSON.Geometry> = {};
    let matched = 0;
    let carried = 0;

    for (const regionId of allRegionIds) {
      const geometry = matchRegion(regionId, nameIndex);
      if (geometry) {
        const simplified = simplifyGeometry(geometry);
        result[regionId] = simplified;
        prevSnapshots.set(regionId, simplified);
        matched++;
      } else {
        const prev = prevSnapshots.get(regionId);
        if (prev) {
          result[regionId] = prev;
          carried++;
        }
      }
    }

    const json = JSON.stringify(result);
    const outFile = path.join(OUT_DIR, `${year}.json`);
    fs.writeFileSync(outFile, json, "utf-8");
    const sizeKb = Math.round(json.length / 1024);

    stats.push({ year, matched: matched + carried, total: nameIndex.size, sizeKb });
    console.log(
      `  ✓ Matched ${matched} regions (+${carried} carried forward) from ${nameIndex.size} entities → ${sizeKb}KB`
    );
  }

  console.log("\n=== Summary ===");
  console.log(
    "Year".padEnd(8) +
    "Matched".padEnd(10) +
    "Entities".padEnd(10) +
    "Size"
  );
  for (const s of stats) {
    console.log(
      String(s.year).padEnd(8) +
      String(s.matched).padEnd(10) +
      String(s.total).padEnd(10) +
      `${s.sizeKb}KB`
    );
  }
  console.log("\nDone!");
}

main().catch(console.error);
