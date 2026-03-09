"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Map, Source, Layer, Marker, type MapRef } from "@vis.gl/react-maplibre";
import type { MapLayerMouseEvent } from "maplibre-gl";
import { useWorldStore } from "@/store/useWorldStore";
import {
  loadTerritories,
  regionsToFeatureCollection,
  regionsToLabelPoints,
  getRegionCentroids,
} from "@/lib/geo-transform";
import { t } from "@/lib/i18n";
import type { War } from "@/lib/types";

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function WorldMapInner() {
  const mapRef = useRef<MapRef>(null);
  const currentState = useWorldStore((s) => s.currentState);
  const locale = useWorldStore((s) => s.locale);
  const setSelectedRegionId = useWorldStore((s) => s.setSelectedRegionId);
  const selectedRegionId = useWorldStore((s) => s.selectedRegionId);
  const activeWars = useWorldStore((s) => s.activeWars);
  const setSelectedWar = useWorldStore((s) => s.setSelectedWar);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    label: string;
    sublabel: string;
    ruler: string;
    status: string;
  } | null>(null);
  const [territoriesLoaded, setTerritoriesLoaded] = useState(false);

  useEffect(() => {
    loadTerritories().then(() => setTerritoriesLoaded(true));
  }, []);

  useEffect(() => {
    if (selectedRegionId) {
      setHoverInfo(null);
    }
  }, [selectedRegionId]);

  const geojsonData = useMemo(() => {
    if (!territoriesLoaded || !currentState) return EMPTY_FC;
    return regionsToFeatureCollection(currentState.regions, locale);
  }, [currentState, locale, territoriesLoaded]);

  const labelPointsData = useMemo(() => {
    if (!territoriesLoaded || !currentState) return EMPTY_FC;
    return regionsToLabelPoints(currentState.regions, locale);
  }, [currentState, locale, territoriesLoaded]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const civSource = map.getSource("civilizations") as maplibregl.GeoJSONSource | undefined;
    if (civSource && typeof civSource.setData === "function") {
      civSource.setData(geojsonData);
    }
    const labelSource = map.getSource("civ-labels") as maplibregl.GeoJSONSource | undefined;
    if (labelSource && typeof labelSource.setData === "function") {
      labelSource.setData(labelPointsData);
    }
  }, [geojsonData, labelPointsData]);

  const centroids = useMemo(() => {
    if (!territoriesLoaded || !currentState) return {};
    return getRegionCentroids(currentState.regions);
  }, [currentState, territoriesLoaded]);

  const warLinesData = useMemo((): GeoJSON.FeatureCollection => {
    if (activeWars.length === 0 || Object.keys(centroids).length === 0) return EMPTY_FC;
    const features: GeoJSON.Feature[] = [];
    for (const war of activeWars) {
      const side1Ids = war.belligerents.side1.regionIds;
      const side2Ids = war.belligerents.side2.regionIds;
      for (const r1 of side1Ids) {
        for (const r2 of side2Ids) {
          const c1 = centroids[r1];
          const c2 = centroids[r2];
          if (c1 && c2) {
            features.push({
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [c1, c2],
              },
              properties: { warId: war.id },
            });
          }
        }
      }
    }
    return { type: "FeatureCollection", features };
  }, [activeWars, centroids]);

  const warMarkers = useMemo(() => {
    if (activeWars.length === 0 || Object.keys(centroids).length === 0) return [];
    return activeWars.map((war) => {
      const allCoords: [number, number][] = [];
      for (const rid of [...war.belligerents.side1.regionIds, ...war.belligerents.side2.regionIds]) {
        const c = centroids[rid];
        if (c) allCoords.push(c);
      }
      if (allCoords.length === 0) return null;
      const midLng = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length;
      const midLat = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length;
      return { war, lng: midLng, lat: midLat };
    }).filter(Boolean) as { war: War; lng: number; lat: number }[];
  }, [activeWars, centroids]);

  const onMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      setCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });

      if (useWorldStore.getState().selectedRegionId) {
        setHoverInfo(null);
        e.target.getCanvas().style.cursor = "";
        return;
      }

      if (!e.target.getLayer("region-fill")) {
        setHoverInfo(null);
        return;
      }

      const features = e.target.queryRenderedFeatures(e.point, {
        layers: ["region-fill"],
      });

      if (features.length > 0) {
        const f = features[0];
        e.target.getCanvas().style.cursor = "pointer";
        setHoverInfo({
          x: e.point.x,
          y: e.point.y,
          label: (f.properties?.label as string) || "",
          sublabel: (f.properties?.sublabel as string) || "",
          ruler: (f.properties?.ruler as string) || "",
          status: (f.properties?.status as string) || "",
        });
      } else {
        e.target.getCanvas().style.cursor = "";
        setHoverInfo(null);
      }
    },
    []
  );

  const onClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!e.target.getLayer("region-fill")) return;
      const features = e.target.queryRenderedFeatures(e.point, {
        layers: ["region-fill"],
      });
      if (features.length > 0) {
        const regionId = features[0].properties?.regionId as string;
        setSelectedRegionId(regionId);
      } else {
        setSelectedRegionId(null);
      }
    },
    [setSelectedRegionId]
  );

  const onMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  const statusColors: Record<string, string> = {
    thriving: "#4ade80",
    stable: "#60a5fa",
    declining: "#fbbf24",
    conflict: "#f87171",
    collapsed: "#9ca3af",
  };

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 60,
          latitude: 30,
          zoom: 2.5,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="/map-style.json"
        onMouseMove={onMouseMove}
        onClick={onClick}
        onMouseLeave={onMouseLeave}
        attributionControl={false}
      >
        <Source id="civilizations" type="geojson" data={geojsonData}>
          <Layer
            id="region-fill"
            type="fill"
            layout={{
              "fill-sort-key": ["*", -1, ["get", "area"]],
            }}
            paint={{
              "fill-color": ["get", "fillColor"],
              "fill-opacity": [
                "case",
                [
                  "==",
                  ["get", "regionId"],
                  selectedRegionId ?? "",
                ],
                0.8,
                ["get", "fillOpacity"],
              ],
            }}
          />
          <Layer
            id="region-border"
            type="line"
            layout={{
              "line-sort-key": ["*", -1, ["get", "area"]],
            }}
            paint={{
              "line-color": [
                "case",
                [
                  "==",
                  ["get", "regionId"],
                  selectedRegionId ?? "",
                ],
                "#C9A84C",
                ["get", "borderColor"],
              ],
              "line-width": [
                "case",
                [
                  "==",
                  ["get", "regionId"],
                  selectedRegionId ?? "",
                ],
                3,
                ["get", "borderWidth"],
              ],
            }}
          />
        </Source>

        {/* Civilization labels as separate point source for better overlap handling */}
        <Source id="civ-labels" type="geojson" data={labelPointsData}>
          <Layer
            id="region-label-primary"
            type="symbol"
            layout={{
              "text-field": ["get", "label"],
              "text-font": ["Open Sans Regular"],
              "text-size": ["interpolate", ["linear"], ["zoom"], 1, 12, 3, 14, 5, 18, 8, 28, 12, 40],
              "text-anchor": "center",
              "text-variable-anchor": ["center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"],
              "text-radial-offset": 0.5,
              "text-justify": "auto",
              "text-allow-overlap": false,
              "text-optional": false,
              "text-padding": 3,
              "symbol-sort-key": ["get", "sortKey"],
              "text-max-width": 8,
            }}
            paint={{
              "text-color": "#E8DCC8",
              "text-halo-color": "rgba(15,14,12,0.9)",
              "text-halo-width": 2,
            }}
          />
          <Layer
            id="region-label-sub"
            type="symbol"
            minzoom={3}
            layout={{
              "text-field": ["get", "sublabel"],
              "text-font": ["Open Sans Regular"],
              "text-size": ["interpolate", ["linear"], ["zoom"], 3, 12, 5, 14, 8, 20, 12, 30],
              "text-anchor": "center",
              "text-variable-anchor": ["center", "top", "bottom", "left", "right"],
              "text-radial-offset": 0.3,
              "text-justify": "auto",
              "text-allow-overlap": false,
              "text-optional": true,
              "text-padding": 1,
              "text-offset": [0, 1.2],
              "symbol-sort-key": ["get", "sortKey"],
              "text-max-width": 10,
            }}
            paint={{
              "text-color": "#E8DCC8",
              "text-halo-color": "rgba(15,14,12,0.9)",
              "text-halo-width": 1.5,
            }}
          />
        </Source>

        {/* War connection lines */}
        <Source id="war-lines" type="geojson" data={warLinesData}>
          <Layer
            id="war-lines-glow"
            type="line"
            paint={{
              "line-color": "#ef4444",
              "line-width": 4,
              "line-opacity": 0.15,
              "line-blur": 4,
            }}
          />
          <Layer
            id="war-lines-main"
            type="line"
            paint={{
              "line-color": "#ef4444",
              "line-width": 1.5,
              "line-opacity": 0.7,
              "line-dasharray": [4, 3],
            }}
          />
        </Source>

        {/* War markers */}
        {warMarkers.map(({ war, lng, lat }) => (
          <Marker key={war.id} longitude={lng} latitude={lat} anchor="center">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedWar(war); }}
              className="war-marker-btn group relative flex items-center justify-center"
              title={war.name[locale]}
            >
              <span className="absolute w-8 h-8 rounded-full bg-red-500/20 animate-ping" />
              <span className="relative w-7 h-7 rounded-full bg-red-900/70 border border-red-500/50 flex items-center justify-center shadow-lg shadow-red-900/30 backdrop-blur-sm group-hover:bg-red-800/80 group-hover:border-red-400/60 transition-all cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="3" x2="12" y2="12" />
                  <line x1="12" y1="12" x2="20" y2="20" />
                  <line x1="3" y1="7" x2="7" y2="3" />
                  <line x1="17" y1="21" x2="21" y2="17" />
                  <line x1="21" y1="3" x2="12" y2="12" />
                  <line x1="12" y1="12" x2="4" y2="20" />
                  <line x1="17" y1="3" x2="21" y2="7" />
                  <line x1="3" y1="17" x2="7" y2="21" />
                </svg>
              </span>
            </button>
          </Marker>
        ))}
      </Map>

      {/* Coordinate display */}
      {coords && (
        <div className="absolute bottom-2 left-2 glass-panel px-3 py-1 rounded text-xs font-mono text-text-secondary">
          {coords.lat >= 0 ? "N" : "S"}{" "}
          {Math.abs(coords.lat).toFixed(1)} /{" "}
          {coords.lng >= 0 ? "E" : "W"}{" "}
          {Math.abs(coords.lng).toFixed(1)}
        </div>
      )}

      {/* Hover tooltip */}
      {hoverInfo && (
        <div
          className="absolute pointer-events-none glass-panel rounded-lg px-3 py-2 shadow-lg z-50 border-l-2 border-l-accent-gold max-w-[220px]"
          style={{
            left: hoverInfo.x + 12,
            top: hoverInfo.y - 12,
          }}
        >
          <div className="font-cinzel text-sm font-semibold text-text-primary">
            {hoverInfo.label}
          </div>
          <div className="text-xs text-text-secondary">
            {hoverInfo.sublabel}
          </div>
          {hoverInfo.ruler && (
            <div className="text-xs mt-1 text-text-secondary">
              {hoverInfo.ruler}
            </div>
          )}
          <div className="flex items-center gap-1 mt-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{
                backgroundColor: statusColors[hoverInfo.status] ?? "#888",
              }}
            />
            <span className="text-xs capitalize text-text-muted">
              {t(`status.${hoverInfo.status}`)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const WorldMap = React.memo(WorldMapInner);
export default WorldMap;
