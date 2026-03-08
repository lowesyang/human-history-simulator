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
      governmentForm: region.civilization?.governmentForm ?? "other",
      status: region.status,
      economyLevel: region.economy?.level ?? 0,
      technologyLevel: region.technology?.level ?? 0,
      militaryLevel: region.military?.level ?? 0,
      population: region.demographics?.population ?? 0,
      ruler: region.civilization?.ruler?.[locale] ?? "",
      rulerTitle: region.civilization?.rulerTitle?.[locale] ?? "",
      capital: region.civilization?.capital?.[locale] ?? "",
      religion: region.culture?.religion?.[locale] ?? "",
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

  return {
    type: "FeatureCollection",
    features,
  };
}
