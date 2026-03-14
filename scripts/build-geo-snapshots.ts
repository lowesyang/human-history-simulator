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
  GEOMETRY_MERGE_RULES,
  GEOMETRY_CLIP_RULES,
  GEOMETRY_SUBTRACT_RULES,
  CUSTOM_GEOMETRIES,
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
  nameIndex: Map<string, GeoJSON.Feature[]>,
  snapshotYear: number
): GeoJSON.Geometry | null {
  const candidates = REGION_NAME_MAP[regionId];
  if (!candidates || candidates.length === 0) return null;

  let baseGeometry: GeoJSON.Geometry | null = null;
  for (const candidateName of candidates) {
    const features = nameIndex.get(candidateName);
    if (features && features.length > 0) {
      const geometries = features
        .map((f) => f.geometry)
        .filter(Boolean) as GeoJSON.Geometry[];
      baseGeometry = mergeGeometries(geometries);
      break;
    }
  }

  if (!baseGeometry && CUSTOM_GEOMETRIES[regionId]) {
    return CUSTOM_GEOMETRIES[regionId];
  }

  const mergeRules = GEOMETRY_MERGE_RULES[regionId];
  if (mergeRules && baseGeometry) {
    for (const rule of mergeRules) {
      if (rule.yearMin !== undefined && snapshotYear < rule.yearMin) continue;
      if (rule.yearMax !== undefined && snapshotYear > rule.yearMax) continue;
      for (const name of rule.names) {
        const features = nameIndex.get(name);
        if (features && features.length > 0) {
          const extraGeometries = features
            .map((f) => f.geometry)
            .filter(Boolean) as GeoJSON.Geometry[];
          const extraMerged = mergeGeometries(extraGeometries);
          if (extraMerged) {
            baseGeometry = mergeGeometries([baseGeometry!, extraMerged]);
          }
          break;
        }
      }
    }
  }

  return baseGeometry;
}

function getAllRegionIds(): Set<string> {
  return new Set(Object.keys(REGION_NAME_MAP));
}

// --- Sutherland-Hodgman polygon clipping ---

function clipEdge(
  polygon: number[][],
  edgeStart: number[],
  edgeEnd: number[]
): number[][] {
  const output: number[][] = [];
  const len = polygon.length;
  if (len === 0) return output;

  for (let i = 0; i < len; i++) {
    const current = polygon[i];
    const previous = polygon[(i + len - 1) % len];
    const currInside = isInside(current, edgeStart, edgeEnd);
    const prevInside = isInside(previous, edgeStart, edgeEnd);

    if (currInside) {
      if (!prevInside) {
        const inter = intersection(previous, current, edgeStart, edgeEnd);
        if (inter) output.push(inter);
      }
      output.push(current);
    } else if (prevInside) {
      const inter = intersection(previous, current, edgeStart, edgeEnd);
      if (inter) output.push(inter);
    }
  }
  return output;
}

function isInside(point: number[], edgeStart: number[], edgeEnd: number[]): boolean {
  return (
    (edgeEnd[0] - edgeStart[0]) * (point[1] - edgeStart[1]) -
    (edgeEnd[1] - edgeStart[1]) * (point[0] - edgeStart[0])
  ) >= 0;
}

function intersection(
  p1: number[], p2: number[],
  p3: number[], p4: number[]
): number[] | null {
  const x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1];
  const x3 = p3[0], y3 = p3[1], x4 = p4[0], y4 = p4[1];
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-12) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}

function clipRingByPolygon(ring: number[][], clipPoly: number[][]): number[][] {
  // Ensure clip polygon is CCW (Sutherland-Hodgman expects CCW clip polygon)
  let normalizedClip = clipPoly;
  let area = 0;
  for (let i = 0, j = clipPoly.length - 1; i < clipPoly.length; j = i++) {
    area += clipPoly[j][0] * clipPoly[i][1] - clipPoly[i][0] * clipPoly[j][1];
  }
  if (area < 0) {
    normalizedClip = clipPoly.slice().reverse();
  }

  let output = ring.slice();
  const clipLen = normalizedClip.length;
  for (let i = 0; i < clipLen - 1; i++) {
    if (output.length === 0) break;
    output = clipEdge(output, normalizedClip[i], normalizedClip[i + 1]);
  }
  if (output.length > 0 && (output[0][0] !== output[output.length - 1][0] ||
    output[0][1] !== output[output.length - 1][1])) {
    output.push(output[0]);
  }
  return output;
}

function clipGeometry(
  geometry: GeoJSON.Geometry,
  clipPoly: number[][]
): GeoJSON.Geometry | null {
  if (geometry.type === "Polygon") {
    const coords = (geometry as GeoJSON.Polygon).coordinates;
    const clipped = clipRingByPolygon(coords[0], clipPoly);
    if (clipped.length < 4) return null;
    return { type: "Polygon", coordinates: [clipped] };
  } else if (geometry.type === "MultiPolygon") {
    const resultPolys: number[][][][] = [];
    for (const poly of (geometry as GeoJSON.MultiPolygon).coordinates) {
      const clipped = clipRingByPolygon(poly[0], clipPoly);
      if (clipped.length >= 4) {
        resultPolys.push([clipped]);
      }
    }
    if (resultPolys.length === 0) return null;
    if (resultPolys.length === 1) {
      return { type: "Polygon", coordinates: resultPolys[0] };
    }
    return { type: "MultiPolygon", coordinates: resultPolys };
  }
  return geometry;
}

function applyClipRules(
  regionId: string,
  geometry: GeoJSON.Geometry,
  snapshotYear: number
): GeoJSON.Geometry {
  const rules = GEOMETRY_CLIP_RULES[regionId];
  if (!rules) return geometry;

  for (const rule of rules) {
    if (rule.yearMin !== undefined && snapshotYear < rule.yearMin) continue;
    if (rule.yearMax !== undefined && snapshotYear > rule.yearMax) continue;
    const clipped = clipGeometry(geometry, rule.clipPolygon);
    if (clipped) return clipped;
  }
  return geometry;
}

function polygonOverlapsBox(ring: number[][], box: { minLon: number; maxLon: number; minLat: number; maxLat: number }): boolean {
  for (const p of ring) {
    if (p[0] >= box.minLon && p[0] <= box.maxLon && p[1] >= box.minLat && p[1] <= box.maxLat) return true;
  }
  return false;
}

function extractOuterRings(geometry: GeoJSON.Geometry): number[][][] {
  if (geometry.type === "Polygon") {
    return [(geometry as GeoJSON.Polygon).coordinates[0]];
  } else if (geometry.type === "MultiPolygon") {
    return (geometry as GeoJSON.MultiPolygon).coordinates.map(p => p[0]);
  }
  return [];
}

function addHoleToGeometry(
  geometry: GeoJSON.Geometry,
  holeRing: number[][]
): GeoJSON.Geometry {
  const hole = holeRing.slice();
  if (hole.length > 0 && (hole[0][0] !== hole[hole.length - 1][0] || hole[0][1] !== hole[hole.length - 1][1])) {
    hole.push(hole[0]);
  }

  // Ensure hole has CW winding (matching the convention of existing holes)
  let holeArea = 0;
  for (let i = 0, j = hole.length - 1; i < hole.length; j = i++) {
    holeArea += hole[j][0] * hole[i][1] - hole[i][0] * hole[j][1];
  }
  const cwHole = holeArea > 0 ? hole : hole.slice().reverse();

  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const p of cwHole) {
    if (p[0] < minLon) minLon = p[0];
    if (p[0] > maxLon) maxLon = p[0];
    if (p[1] < minLat) minLat = p[1];
    if (p[1] > maxLat) maxLat = p[1];
  }
  const box = { minLon, maxLon, minLat, maxLat };

  if (geometry.type === "Polygon") {
    const coords = (geometry as GeoJSON.Polygon).coordinates;
    if (polygonOverlapsBox(coords[0], box)) {
      return { type: "Polygon", coordinates: [...coords, cwHole] };
    }
    return geometry;
  } else if (geometry.type === "MultiPolygon") {
    const newCoords: number[][][][] = [];
    for (const poly of (geometry as GeoJSON.MultiPolygon).coordinates) {
      if (polygonOverlapsBox(poly[0], box)) {
        newCoords.push([...poly, cwHole]);
      } else {
        newCoords.push(poly);
      }
    }
    return { type: "MultiPolygon", coordinates: newCoords };
  }
  return geometry;
}

function applySubtractRules(
  regionId: string,
  geometry: GeoJSON.Geometry,
  snapshotYear: number,
  allResults: Record<string, GeoJSON.Geometry>
): GeoJSON.Geometry {
  const rules = GEOMETRY_SUBTRACT_RULES[regionId];
  if (!rules) return geometry;

  let result = geometry;
  for (const rule of rules) {
    if (rule.yearMin !== undefined && snapshotYear < rule.yearMin) continue;
    if (rule.yearMax !== undefined && snapshotYear > rule.yearMax) continue;

    const childGeometry = allResults[rule.childRegionId];
    if (!childGeometry) continue;

    const outerRings = extractOuterRings(childGeometry);
    for (const ring of outerRings) {
      result = addHoleToGeometry(result, ring);
    }
  }
  return result;
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
      const geometry = matchRegion(regionId, nameIndex, year);
      if (geometry) {
        const clipped = applyClipRules(regionId, geometry, year);
        const simplified = simplifyGeometry(clipped);
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

    // Second pass: apply subtract rules (cut holes for vassal regions)
    for (const regionId of Object.keys(result)) {
      result[regionId] = applySubtractRules(regionId, result[regionId], year, result);
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
