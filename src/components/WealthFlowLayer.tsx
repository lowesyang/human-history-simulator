"use client";

import { Source, Layer, type MapRef } from "@vis.gl/react-maplibre";
import React, { useMemo, useEffect, useRef, useCallback } from "react";
import { getRegionCentroids } from "@/lib/geo-transform";
import type { Region } from "@/lib/types";

const MAX_FLOWS = 30;

function getGoldKg(v: { goldKg?: number } | undefined): number {
  if (!v) return 0;
  if (typeof v.goldKg === "number") return v.goldKg;
  return 0;
  return 0;
}

interface TradeFlow {
  from: string;
  to: string;
  volume: number;
  fromCoord: [number, number];
  toCoord: [number, number];
}

function extractTradeFlows(regions: Region[]): TradeFlow[] {
  const centroids = getRegionCentroids(regions);
  const regionMap = new Map(regions.map((r) => [r.id, r]));

  const searchTerms = regions
    .filter((r) => r.id !== "global")
    .map((r) => ({
      id: r.id,
      terms: [
        r.name?.zh?.trim(),
        r.name?.en?.trim(),
        r.id.replace(/^ai_/, ""),
      ].filter((t): t is string => !!t && t.length >= 2),
    }))
    .filter((s) => s.terms.length > 0)
    .sort((a, b) => {
      const maxLenA = Math.max(...a.terms.map((t) => t.length));
      const maxLenB = Math.max(...b.terms.map((t) => t.length));
      return maxLenB - maxLenA;
    });

  const flows: TradeFlow[] = [];
  const seen = new Set<string>();

  for (const region of regions) {
    const routes = region.economy?.tradeRoutes;
    if (!routes) continue;

    const zh = routes.zh?.trim() ?? "";
    const en = routes.en?.trim() ?? "";
    const combined = zh + "\n" + en;
    if (!combined.trim()) continue;

    const fromId = region.id;
    const fromCoord = centroids[fromId];
    if (!fromCoord) continue;

    const volA = getGoldKg(region.economy?.foreignTradeVolume);
    if (volA <= 0) continue;

    for (const { id: toId, terms } of searchTerms) {
      if (toId === fromId) continue;

      const matched = terms.some((term) => {
        if (term.length < 2) return false;
        return (
          combined.includes(term) ||
          combined.toLowerCase().includes(term.toLowerCase())
        );
      });
      if (!matched) continue;

      const partner = regionMap.get(toId);
      if (!partner) continue;

      const volB = getGoldKg(partner.economy?.foreignTradeVolume);
      const volume =
        Math.min(volA, volB) * 0.3;

      const key =
        fromId < toId ? `${fromId}|${toId}` : `${toId}|${fromId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const toCoord = centroids[toId];
      if (!toCoord) continue;

      flows.push({
        from: fromId,
        to: toId,
        volume,
        fromCoord,
        toCoord,
      });
    }
  }

  flows.sort((a, b) => b.volume - a.volume);
  return flows.slice(0, MAX_FLOWS);
}

function flowsToGeoJSON(flows: TradeFlow[]): GeoJSON.FeatureCollection {
  if (flows.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }

  const maxVol = Math.max(...flows.map((f) => f.volume), 1);
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = flows.map(
    (flow) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [flow.fromCoord, flow.toCoord],
      },
      properties: {
        from: flow.from,
        to: flow.to,
        volume: flow.volume,
        volumeNorm: maxVol > 0 ? flow.volume / maxVol : 0,
      },
    })
  );

  return { type: "FeatureCollection", features };
}

export function useTradeFlowData(regions: Region[]): GeoJSON.FeatureCollection {
  return useMemo(() => {
    if (!regions?.length) {
      return { type: "FeatureCollection", features: [] };
    }
    const flows = extractTradeFlows(regions);
    return flowsToGeoJSON(flows);
  }, [regions]);
}

export const WealthFlowLayers = React.memo(function WealthFlowLayers({
  regions,
  visible,
  mapRef,
}: {
  regions: Region[];
  visible: boolean;
  mapRef: React.RefObject<MapRef | null>;
}) {
  const geoData = useTradeFlowData(regions);
  const frameRef = useRef<number | null>(null);

  const animate = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !visible) return;

    const phase = ((Date.now() / 60) % 6) as number;
    const dash = 2 + phase;
    const gap = 6 - phase;
    try {
      map.setPaintProperty("trade-flow-main", "line-dasharray", [dash, gap]);
    } catch {
      // line-dasharray animation fallback if layer not ready
    }
    frameRef.current = requestAnimationFrame(animate);
  }, [mapRef, visible]);

  useEffect(() => {
    if (!visible || geoData.features.length === 0) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [visible, geoData.features.length, animate]);

  if (!visible) return null;

  return (
    <Source
      id="wealth-flow-source"
      type="geojson"
      data={geoData}
    >
      <Layer
        id="trade-flow-glow"
        type="line"
        paint={{
          "line-blur": 4,
          "line-opacity": 0.15,
          "line-color": "#D4A853",
        }}
      />
      <Layer
        id="trade-flow-main"
        type="line"
        paint={{
          "line-width": [
            "interpolate",
            ["linear"],
            ["get", "volumeNorm"],
            0,
            1,
            1,
            6,
          ],
          "line-dasharray": [2, 4],
          "line-color": "#D4A853",
          "line-opacity": 0.6,
        }}
      />
    </Source>
  );
});
