import type { Region, CivilizationType, RegionStatus } from "./types";

const CIVILIZATION_COLORS: Record<
  CivilizationType,
  { fill: string; border: string }
> = {
  empire: { fill: "#B8860B", border: "#8B6914" },
  kingdom: { fill: "#CD853F", border: "#A0522D" },
  city_state: { fill: "#D4A76A", border: "#B8956A" },
  tribal: { fill: "#6B8E23", border: "#556B2F" },
  nomadic: { fill: "#8B7355", border: "#6B5B3F" },
  trade_network: { fill: "#2E8B57", border: "#1B6B3F" },
  theocracy: { fill: "#8B668B", border: "#6B4A6B" },
  republic: { fill: "#4682B4", border: "#2E6B8B" },
};

const STATUS_MODIFIERS: Record<
  RegionStatus,
  {
    colorOverride?: string;
    dashArray?: number[];
    opacityMultiplier: number;
  }
> = {
  thriving: { opacityMultiplier: 1.0 },
  stable: { opacityMultiplier: 0.85 },
  declining: { dashArray: [4, 4], opacityMultiplier: 0.6 },
  conflict: { colorOverride: "#CD5C5C", opacityMultiplier: 0.8 },
  collapsed: { dashArray: [2, 6], opacityMultiplier: 0.3 },
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
  const colors = CIVILIZATION_COLORS[region.civilization?.type] ?? {
    fill: "#888",
    border: "#666",
  };
  const statusMod = STATUS_MODIFIERS[region.status] ?? {
    opacityMultiplier: 0.8,
  };

  const baseOpacity = 0.2 + ((region.economy?.level ?? 0) / 10) * 0.5;
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
      fillColor: statusMod.colorOverride ?? colors.fill,
      borderColor: colors.border,
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
  if (!_territories) return { type: "FeatureCollection", features: [] };

  const labelFeatures: GeoJSON.Feature[] = [];

  for (const region of regions) {
    const regionTemplates = _territories[region.territoryId];
    if (!regionTemplates) continue;
    const template =
      regionTemplates[region.territoryScale] ??
      Object.values(regionTemplates)[0];
    if (!template) continue;

    const centroid = computeCentroid(template.geometry);
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

function computeCentroid(geometry: GeoJSON.Geometry): [number, number] | null {
  const coords: number[][] = [];

  function collect(g: GeoJSON.Geometry) {
    if (g.type === "Polygon") {
      for (const c of (g as GeoJSON.Polygon).coordinates[0]) coords.push(c);
    } else if (g.type === "MultiPolygon") {
      for (const poly of (g as GeoJSON.MultiPolygon).coordinates)
        for (const c of poly[0]) coords.push(c);
    }
  }

  collect(geometry);
  if (coords.length === 0) return null;

  let sumLng = 0, sumLat = 0;
  for (const c of coords) {
    sumLng += c[0];
    sumLat += c[1];
  }
  return [sumLng / coords.length, sumLat / coords.length];
}

export function getRegionCentroid(
  region: Region
): [number, number] | null {
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
