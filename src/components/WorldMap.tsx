"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Map, Source, Layer, Marker, type MapRef } from "@vis.gl/react-maplibre";
import type { MapLayerMouseEvent } from "maplibre-gl";
import { useWorldStore } from "@/store/useWorldStore";
import {
  loadTerritories,
  regionsToFeatureCollection,
  regionsToLabelPoints,
  getRegionCentroids,
} from "@/lib/geo-transform";
import { t, localized } from "@/lib/i18n";
import type { War } from "@/lib/types";

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const STATUS_COLORS: Record<string, string> = {
  thriving: "#22c55e",
  rising: "#10b981",
  stable: "#d97706",
  declining: "#eab308",
  conflict: "#ef4444",
  collapsed: "#8b5cf6",
};

const WarMarkerItem = React.memo(function WarMarkerItem({
  war,
  lng,
  lat,
  isPrimary,
  locale,
  onSelect,
}: {
  war: War;
  lng: number;
  lat: number;
  isPrimary: boolean;
  locale: "zh" | "en";
  onSelect: (war: War) => void;
}) {
  const statusKey = `war.${war.status}`;
  const side1Label = localized(war.belligerents.side1.label);
  const side2Label = localized(war.belligerents.side2.label);
  const summaryText = localized(war.summary);
  const warName = war.name[locale];
  const formatYr = (y: number) =>
    locale === "zh"
      ? (y < 0 ? `公元前${Math.abs(y)}年` : `公元${y}年`)
      : (y < 0 ? `${Math.abs(y)} BCE` : `${y} CE`);
  const period = war.endYear
    ? `${formatYr(war.startYear)} — ${formatYr(war.endYear)}`
    : `${formatYr(war.startYear)} — ${t("war.ongoing")}`;

  const handleClick = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onSelect(war); },
    [onSelect, war]
  );

  return (
    <Marker longitude={lng} latitude={lat} anchor="center">
      <div
        className="war-marker-btn group"
        onClick={handleClick}
        style={{ position: "relative", width: 28, height: 28, cursor: "pointer" }}
      >
        {isPrimary && (
          <span
            style={{
              position: "absolute", inset: -4,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.15)",
              animation: "warPing 1.5s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
        )}
        <span
          style={{
            position: "absolute", inset: 0,
            borderRadius: "50%",
            background: "rgba(127,29,29,0.8)",
            border: "1.5px solid rgba(239,68,68,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(127,29,29,0.4)",
          }}
        >
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
        {isPrimary && (
          <span
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              marginTop: 4,
              fontSize: 12,
              fontWeight: 600,
              color: "#fca5a5",
              whiteSpace: "nowrap",
              textShadow: "0 1px 3px rgba(0,0,0,0.9)",
              pointerEvents: "none",
            }}
          >
            {warName}
          </span>
        )}
        <div className="war-marker-tooltip">
          <div style={{ fontWeight: 700, color: "#fca5a5", marginBottom: 2 }}>{warName}</div>
          <div style={{ color: "#9ca3af", marginBottom: 4 }}>{period}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ color: "#f87171", fontWeight: 600 }}>{side1Label}</span>
            <span style={{ color: "#6b7280" }}>vs</span>
            <span style={{ color: "#60a5fa", fontWeight: 600 }}>{side2Label}</span>
          </div>
          <div style={{
            display: "inline-block",
            padding: "1px 6px",
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            background: war.status === "ongoing" ? "rgba(239,68,68,0.15)" : war.status === "ceasefire" ? "rgba(251,191,36,0.15)" : "rgba(34,197,94,0.15)",
            color: war.status === "ongoing" ? "#f87171" : war.status === "ceasefire" ? "#fbbf24" : war.status === "stalemate" ? "#9ca3af" : "#4ade80",
            marginBottom: summaryText ? 4 : 0,
          }}>
            {t(statusKey)}
          </div>
          {summaryText && (
            <div style={{ color: "#d1ccc0", lineHeight: 1.4, WebkitLineClamp: 2, WebkitBoxOrient: "vertical", display: "-webkit-box", overflow: "hidden" }}>
              {summaryText}
            </div>
          )}
        </div>
      </div>
    </Marker>
  );
});

function WorldMapInner() {
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const coordsElRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef(0);
  const currentState = useWorldStore((s) => s.currentState);
  const locale = useWorldStore((s) => s.locale);
  const setSelectedRegionId = useWorldStore((s) => s.setSelectedRegionId);
  const selectedRegionId = useWorldStore((s) => s.selectedRegionId);
  const activeWars = useWorldStore((s) => s.activeWars);
  const setSelectedWar = useWorldStore((s) => s.setSelectedWar);
  const warSnapshots = useWorldStore((s) => s.warSnapshots);
  const warNotifications = useWorldStore((s) => s.warNotifications);
  const removeWarNotification = useWorldStore((s) => s.removeWarNotification);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    label: string;
    sublabel: string;
    ruler: string;
    status: string;
  } | null>(null);
  const [territoriesLoaded, setTerritoriesLoaded] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [hoverLegend, setHoverLegend] = useState<string | null>(null);

  useEffect(() => {
    loadTerritories().then(() => setTerritoriesLoaded(true));
  }, []);

  useEffect(() => {
    const flyTo = (opts: { longitude: number; latitude: number; zoom?: number }) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      map.flyTo({
        center: [opts.longitude, opts.latitude],
        zoom: opts.zoom ?? 5,
        duration: 1500,
      });
    };
    useWorldStore.getState().setMapFlyTo(flyTo);
    return () => {
      useWorldStore.getState().setMapFlyTo(null);
    };
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
      const snaps = warSnapshots[war.id];
      const latestSnap = snaps && snaps.length > 0 ? snaps[snaps.length - 1] : null;
      const totalTroops = latestSnap
        ? latestSnap.side1.totalTroops + latestSnap.side2.totalTroops
        : 0;
      const intensity = Math.min(1, Math.max(0.2, totalTroops / 2_000_000));
      const isOngoing = war.status === "ongoing";

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
              properties: { warId: war.id, intensity, isOngoing },
            });
          }
        }
      }
    }
    return { type: "FeatureCollection", features };
  }, [activeWars, centroids, warSnapshots]);

  const warMarkers = useMemo(() => {
    if (activeWars.length === 0 || Object.keys(centroids).length === 0) return [];
    const markers: { war: War; lng: number; lat: number; isPrimary: boolean }[] = [];

    for (const war of activeWars) {
      const side1Coords = war.belligerents.side1.regionIds
        .map((id) => centroids[id])
        .filter(Boolean) as [number, number][];
      const side2Coords = war.belligerents.side2.regionIds
        .map((id) => centroids[id])
        .filter(Boolean) as [number, number][];
      if (side1Coords.length === 0 || side2Coords.length === 0) continue;

      let minDist = Infinity;
      let primaryIdx = 0;
      const pairs: { lng: number; lat: number }[] = [];

      for (const c1 of side1Coords) {
        for (const c2 of side2Coords) {
          const d = (c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2;
          if (d < minDist) {
            minDist = d;
            primaryIdx = pairs.length;
          }
          pairs.push({ lng: (c1[0] + c2[0]) / 2, lat: (c1[1] + c2[1]) / 2 });
        }
      }

      for (let i = 0; i < pairs.length; i++) {
        markers.push({ war, ...pairs[i], isPrimary: i === primaryIdx });
      }
    }

    return markers;
  }, [activeWars, centroids]);

  const flushCoords = useCallback(() => {
    rafIdRef.current = 0;
    const c = coordsRef.current;
    const el = coordsElRef.current;
    if (el && c) {
      el.textContent = `${c.lat >= 0 ? "N" : "S"} ${Math.abs(c.lat).toFixed(1)} / ${c.lng >= 0 ? "E" : "W"} ${Math.abs(c.lng).toFixed(1)}`;
      el.style.display = "";
    } else if (el) {
      el.style.display = "none";
    }
  }, []);

  const onMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      coordsRef.current = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(flushCoords);
      }

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
    [flushCoords]
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
    coordsRef.current = null;
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = 0;
    const el = coordsElRef.current;
    if (el) el.style.display = "none";
  }, []);

  const tooltipStyle = useMemo(() => {
    if (!hoverInfo) return {};
    const container = containerRef.current;
    const cw = container?.clientWidth ?? 9999;
    const ch = container?.clientHeight ?? 9999;
    const gap = 12;
    const flipX = hoverInfo.x > cw - 240;
    const flipY = hoverInfo.y < 80;
    return {
      left: flipX ? undefined : hoverInfo.x + gap,
      right: flipX ? cw - hoverInfo.x + gap : undefined,
      top: flipY ? hoverInfo.y + gap : hoverInfo.y - gap,
    };
  }, [hoverInfo]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
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
                ...(filterStatus
                  ? [
                    ["==", ["get", "status"], filterStatus],
                    ["get", "fillOpacity"],
                    0.08,
                  ]
                  : [["get", "fillOpacity"]]),
              ] as any,
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
              "line-opacity": filterStatus
                ? [
                  "case",
                  ["==", ["get", "status"], filterStatus],
                  1,
                  0.12,
                ] as any
                : 1,
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
              "text-justify": "center",
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
              "text-opacity": filterStatus
                ? [
                  "case",
                  ["==", ["get", "status"], filterStatus],
                  1,
                  0.15,
                ] as any
                : 1,
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
              "text-anchor": "top",
              "text-justify": "center",
              "text-allow-overlap": false,
              "text-optional": true,
              "text-padding": 1,
              "text-offset": [0, 0.8],
              "symbol-sort-key": ["get", "sortKey"],
              "text-max-width": 10,
            }}
            paint={{
              "text-color": "#E8DCC8",
              "text-halo-color": "rgba(15,14,12,0.9)",
              "text-halo-width": 1.5,
              "text-opacity": filterStatus
                ? [
                  "case",
                  ["==", ["get", "status"], filterStatus],
                  1,
                  0.15,
                ] as any
                : 1,
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
              "line-width": [
                "interpolate", ["linear"], ["get", "intensity"],
                0, 3, 0.5, 5, 1, 8,
              ] as any,
              "line-opacity": 0.12,
              "line-blur": 4,
            }}
          />
          <Layer
            id="war-lines-main"
            type="line"
            paint={{
              "line-color": "#ef4444",
              "line-width": [
                "interpolate", ["linear"], ["get", "intensity"],
                0, 1, 0.5, 2, 1, 3.5,
              ] as any,
              "line-opacity": 0.7,
              "line-dasharray": [4, 3],
            }}
          />
        </Source>

        {warMarkers.map(({ war, lng, lat, isPrimary }, idx) => (
          <WarMarkerItem
            key={`${war.id}-${idx}`}
            war={war}
            lng={lng}
            lat={lat}
            isPrimary={isPrimary}
            locale={locale}
            onSelect={setSelectedWar}
          />
        ))}
      </Map>

      {/* Status legend */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 glass-panel rounded-lg px-4 py-2 z-30 flex items-center gap-1">
        {(Object.keys(STATUS_COLORS) as Array<keyof typeof STATUS_COLORS>).map(
          (key) => {
            const isActive = filterStatus === key;
            const isHovered = hoverLegend === key;
            const isDimmed = filterStatus !== null && !isActive;
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(isActive ? null : key)}
                onMouseEnter={() => setHoverLegend(key)}
                onMouseLeave={() => setHoverLegend(null)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200"
                style={{
                  background: isActive
                    ? `${STATUS_COLORS[key]}20`
                    : isHovered
                      ? `${STATUS_COLORS[key]}10`
                      : "transparent",
                  outline: isActive
                    ? `1.5px solid ${STATUS_COLORS[key]}80`
                    : isHovered
                      ? `1.5px solid ${STATUS_COLORS[key]}40`
                      : "1.5px solid transparent",
                  opacity: isDimmed ? (isHovered ? 0.7 : 0.4) : 1,
                  cursor: "pointer",
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[key] }}
                />
                <span className="text-xs text-text-secondary whitespace-nowrap">
                  {t(`status.${key}`)}
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* Coordinate display — updated via ref to avoid re-renders */}
      <div
        ref={coordsElRef}
        className="absolute bottom-2 left-2 glass-panel px-3 py-1 rounded text-xs font-mono text-text-secondary"
        style={{ display: "none" }}
      />

      {/* War status notifications */}
      {warNotifications.length > 0 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-1.5 pointer-events-none">
          {warNotifications.map((notif) => (
            <WarNotificationBanner
              key={notif.id}
              notification={notif}
              onDismiss={removeWarNotification}
            />
          ))}
        </div>
      )}

      {/* Hover tooltip */}
      {hoverInfo && (
        <div
          className="absolute pointer-events-none glass-panel rounded-lg px-3 py-2 shadow-lg z-50 border-l-2 border-l-accent-gold whitespace-nowrap"
          style={tooltipStyle}
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
                backgroundColor: STATUS_COLORS[hoverInfo.status] ?? "#888",
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

const WarNotificationBanner = React.memo(function WarNotificationBanner({
  notification,
  onDismiss,
}: {
  notification: { id: string; message: string; type: "new" | "ended" | "update" };
  onDismiss: (id: string) => void;
}) {
  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const bgColor = notification.type === "new"
    ? "rgba(239, 68, 68, 0.9)"
    : notification.type === "ended"
      ? "rgba(34, 197, 94, 0.9)"
      : "rgba(251, 191, 36, 0.9)";

  const icon = notification.type === "new" ? "⚔" : notification.type === "ended" ? "🕊" : "📢";

  return (
    <div
      className="px-4 py-2 rounded-lg shadow-lg text-white text-xs font-semibold pointer-events-auto animate-fade-in-down"
      style={{
        background: bgColor,
        backdropFilter: "blur(8px)",
        minWidth: 200,
        textAlign: "center",
      }}
    >
      <span className="mr-1.5">{icon}</span>
      {notification.message}
    </div>
  );
});

const WorldMap = React.memo(WorldMapInner);
export default WorldMap;
