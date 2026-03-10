import type { Region, RegionStatus } from "./types";

const STATUS_COLORS: Record<
  RegionStatus,
  { fill: string; border: string }
> = {
  thriving: { fill: "#22c55e", border: "#15803d" },
  stable: { fill: "#d97706", border: "#92400e" },
  declining: { fill: "#eab308", border: "#a16207" },
  conflict: { fill: "#ef4444", border: "#b91c1c" },
  collapsed: { fill: "#6b7280", border: "#4b5563" },
};

const STATUS_MODIFIERS: Record<
  RegionStatus,
  {
    dashArray?: number[];
    opacityMultiplier: number;
  }
> = {
  thriving: { opacityMultiplier: 1.0 },
  stable: { opacityMultiplier: 0.85 },
  declining: { dashArray: [4, 4], opacityMultiplier: 0.7 },
  conflict: { opacityMultiplier: 0.85 },
  collapsed: { dashArray: [2, 6], opacityMultiplier: 0.35 },
};

let _territories: Record<
  string,
  Record<string, { geometry: GeoJSON.Geometry }>
> | null = null;

export async function loadTerritories() {
  if (_territories) return _territories;
  const resp = await fetch("/geojson/territories.json");
  _territories = await resp.json();
  return _territories!;
}

export function setTerritories(
  data: Record<string, Record<string, { geometry: GeoJSON.Geometry }>>
) {
  _territories = data;
}

export function regionToGeoJSON(
  region: Region,
  locale: "zh" | "en"
): GeoJSON.Feature | null {
  if (region.geometry) {
    return buildFeature(region, region.geometry, locale);
  }

  if (!_territories) return null;

  const regionTemplates = _territories[region.territoryId];
  if (!regionTemplates) {
    console.warn(`No territory template for: ${region.territoryId}`);
    return null;
  }

  const template = regionTemplates[region.territoryScale];
  if (!template) {
    const fallback = Object.values(regionTemplates)[0];
    if (!fallback) return null;
    return buildFeature(region, fallback.geometry, locale);
  }

  return buildFeature(region, template.geometry, locale);
}

function buildFeature(
  region: Region,
  geometry: GeoJSON.Geometry,
  locale: "zh" | "en"
): GeoJSON.Feature {
  const statusColors = STATUS_COLORS[region.status] ?? {
    fill: "#888",
    border: "#666",
  };
  const statusMod = STATUS_MODIFIERS[region.status] ?? {
    opacityMultiplier: 0.8,
  };

  const baseOpacity = 0.25 + ((region.economy?.level ?? 0) / 10) * 0.45;
  const fillOpacity = baseOpacity * (statusMod.opacityMultiplier ?? 1.0);
  const borderWidth = 1 + ((region.military?.level ?? 0) / 10) * 2;
  const area = computeArea(geometry);

  return {
    type: "Feature",
    geometry,
    properties: {
      regionId: region.id,
      label: region.name?.[locale] ?? region.id,
      sublabel: region.civilization?.name?.[locale] ?? "",
      fillColor: statusColors.fill,
      borderColor: statusColors.border,
      fillOpacity,
      borderWidth,
      borderDash: statusMod.dashArray ?? [0],
      civilizationType: region.civilization?.type ?? "kingdom",
      governmentForm: typeof region.civilization?.governmentForm === "string"
        ? region.civilization.governmentForm
        : region.civilization?.governmentForm?.[locale] ?? "other",
      status: region.status,
      economyLevel: region.economy?.level ?? 0,
      technologyLevel: region.technology?.level ?? 0,
      militaryLevel: region.military?.level ?? 0,
      population: region.demographics?.population ?? 0,
      ruler: region.civilization?.ruler?.[locale] ?? "",
      rulerTitle: region.civilization?.rulerTitle?.[locale] ?? "",
      capital: region.civilization?.capital?.[locale] ?? "",
      religion: region.culture?.religion?.[locale] ?? "",
      area,
    },
  };
}

export function regionsToFeatureCollection(
  regions: Region[],
  locale: "zh" | "en"
): GeoJSON.FeatureCollection {
  const features = regions
    .map((r) => regionToGeoJSON(r, locale))
    .filter(Boolean) as GeoJSON.Feature[];

  features.sort(
    (a, b) => (b.properties?.area ?? 0) - (a.properties?.area ?? 0)
  );

  return {
    type: "FeatureCollection",
    features,
  };
}

export function regionsToLabelPoints(
  regions: Region[],
  locale: "zh" | "en"
): GeoJSON.FeatureCollection {
  const labelFeatures: GeoJSON.Feature[] = [];

  for (const region of regions) {
    let geometry: GeoJSON.Geometry | null = null;

    if (region.geometry) {
      geometry = region.geometry;
    } else if (_territories) {
      const regionTemplates = _territories[region.territoryId];
      if (regionTemplates) {
        const template =
          regionTemplates[region.territoryScale] ??
          Object.values(regionTemplates)[0];
        if (template) geometry = template.geometry;
      }
    }

    if (!geometry) continue;

    const centroid = computeCentroid(geometry);
    if (!centroid) continue;

    const population = region.demographics?.population ?? 0;
    const economyLevel = region.economy?.level ?? 0;
    const importance = population / 1000 + economyLevel * 100;

    labelFeatures.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: centroid },
      properties: {
        regionId: region.id,
        label: region.name?.[locale] ?? region.id,
        sublabel: region.civilization?.name?.[locale] ?? "",
        status: region.status,
        population,
        importance,
        sortKey: -importance,
      },
    });
  }

  return { type: "FeatureCollection", features: labelFeatures };
}

function ringArea(ring: number[][]): number {
  let area = 0;
  for (let i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(area) / 2;
}

function computeArea(geometry: GeoJSON.Geometry): number {
  let total = 0;
  if (geometry.type === "Polygon") {
    total = ringArea((geometry as GeoJSON.Polygon).coordinates[0]);
  } else if (geometry.type === "MultiPolygon") {
    for (const poly of (geometry as GeoJSON.MultiPolygon).coordinates) {
      total += ringArea(poly[0]);
    }
  }
  return total;
}

function polygonCentroid(ring: number[][]): { cx: number; cy: number; area: number } {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    area += cross;
    cx += (ring[j][0] + ring[i][0]) * cross;
    cy += (ring[j][1] + ring[i][1]) * cross;
  }
  area /= 2;
  const absArea = Math.abs(area);
  if (absArea < 1e-10) return { cx: ring[0][0], cy: ring[0][1], area: 0 };
  const factor = 1 / (6 * area);
  return { cx: cx * factor, cy: cy * factor, area: absArea };
}

function computeCentroid(geometry: GeoJSON.Geometry): [number, number] | null {
  const parts: { cx: number; cy: number; area: number }[] = [];

  if (geometry.type === "Polygon") {
    const p = polygonCentroid((geometry as GeoJSON.Polygon).coordinates[0]);
    parts.push(p);
  } else if (geometry.type === "MultiPolygon") {
    for (const poly of (geometry as GeoJSON.MultiPolygon).coordinates) {
      parts.push(polygonCentroid(poly[0]));
    }
  }

  if (parts.length === 0) return null;

  const totalArea = parts.reduce((s, p) => s + p.area, 0);
  if (totalArea < 1e-10) {
    return [parts[0].cx, parts[0].cy];
  }

  let wLng = 0;
  let wLat = 0;
  for (const p of parts) {
    const w = p.area / totalArea;
    wLng += p.cx * w;
    wLat += p.cy * w;
  }
  return [wLng, wLat];
}

export function getRegionCentroid(
  region: Region
): [number, number] | null {
  if (region.geometry) {
    return computeCentroid(region.geometry);
  }
  if (!_territories) return null;
  const regionTemplates = _territories[region.territoryId];
  if (!regionTemplates) return null;
  const template = regionTemplates[region.territoryScale] ?? Object.values(regionTemplates)[0];
  if (!template) return null;
  return computeCentroid(template.geometry);
}

export function getRegionCentroids(
  regions: Region[]
): Record<string, [number, number]> {
  const result: Record<string, [number, number]> = {};
  for (const r of regions) {
    const c = getRegionCentroid(r);
    if (c) result[r.id] = c;
  }
  return result;
}
