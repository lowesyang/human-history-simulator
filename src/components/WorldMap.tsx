"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Map, Source, Layer, type MapRef } from "@vis.gl/react-maplibre";
import type { MapLayerMouseEvent } from "maplibre-gl";
import { useWorldStore } from "@/store/useWorldStore";
import {
  loadTerritories,
  regionsToFeatureCollection,
} from "@/lib/geo-transform";
import { t } from "@/lib/i18n";

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
          <Layer
            id="region-label"
            type="symbol"
            layout={{
              "text-field": [
                "format",
                ["get", "label"],
                { "font-scale": 1.1 },
                "\n",
                {},
                ["get", "sublabel"],
                { "font-scale": 0.75 },
              ],
              "text-font": ["Open Sans Regular"],
              "text-size": ["interpolate", ["linear"], ["zoom"], 1, 8, 5, 16],
              "text-anchor": "center",
              "text-allow-overlap": false,
            }}
            paint={{
              "text-color": "#E8DCC8",
              "text-halo-color": "rgba(15,14,12,0.8)",
              "text-halo-width": 1.5,
            }}
          />
        </Source>
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
