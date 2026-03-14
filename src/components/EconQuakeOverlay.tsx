"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import type { MapRef } from "@vis.gl/react-maplibre";
import { getRegionCentroids } from "@/lib/geo-transform";
import type { Region, EconShock } from "@/lib/types";
import { t } from "@/lib/i18n";

interface EconQuakeOverlayProps {
  shocks: EconShock[];
  regions: Region[];
  mapRef: React.RefObject<MapRef | null>;
  onDismiss: (index: number) => void;
}

const SHOCK_COLORS: Record<EconShock["type"], string> = {
  crash: "#ef4444",
  boom: "#22c55e",
  trade_disruption: "#ef4444",
  bubble_burst: "#d4a853",
  currency_crisis: "#ef4444",
};

function getAssetLabel(assetId: string): string {
  const key = `economic.denomination.${assetId}`;
  const translated = t(key);
  return translated !== key ? translated : assetId.charAt(0).toUpperCase() + assetId.slice(1);
}

function getTopPriceDeltas(priceDeltas: Record<string, number>, limit: number): { assetId: string; delta: number }[] {
  return Object.entries(priceDeltas)
    .map(([assetId, delta]) => ({ assetId, delta }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
}

export default function EconQuakeOverlay({
  shocks,
  regions,
  mapRef,
  onDismiss,
}: EconQuakeOverlayProps) {
  const [positions, setPositions] = useState<Record<number, { x: number; y: number } | null>>({});

  const updatePositions = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const centroids = getRegionCentroids(regions);
    const next: Record<number, { x: number; y: number } | null> = {};

    for (let i = 0; i < shocks.length; i++) {
      const shock = shocks[i];
      const coord = centroids[shock.epicenterRegionId];
      if (!coord) {
        next[i] = null;
        continue;
      }
      try {
        const pt = map.project([coord[0], coord[1]] as [number, number]);
        next[i] = { x: pt.x, y: pt.y };
      } catch {
        next[i] = null;
      }
    }
    setPositions(next);
  }, [mapRef, regions, shocks]);

  useEffect(() => {
    if (shocks.length === 0) return;

    const map = mapRef.current?.getMap();
    if (!map) return;

    updatePositions();
    const onMove = () => updatePositions();
    map.on("move", onMove);
    map.on("zoom", onMove);
    map.on("load", onMove);

    return () => {
      map.off("move", onMove);
      map.off("zoom", onMove);
      map.off("load", onMove);
    };
  }, [shocks, regions, mapRef, updatePositions]);

  useEffect(() => {
    if (shocks.length === 0) return;

    const timer = setTimeout(() => {
      onDismiss(0);
    }, 4000);
    return () => clearTimeout(timer);
  }, [shocks, onDismiss]);

  if (shocks.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes econ-ripple {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
      <div
        className="absolute inset-0 pointer-events-none z-20"
        aria-hidden
      >
        {shocks.map((shock, index) => {
          const pos = positions[index];
          const color = SHOCK_COLORS[shock.type];
          const topDeltas = getTopPriceDeltas(shock.priceDeltas, 2);

          if (pos == null) return null;

          return (
            <div
              key={`${shock.epicenterRegionId}-${shock.type}-${index}`}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
                width: 200,
                height: 200,
              }}
            >
              {/* 3 concentric expanding circles */}
              {[0, 0.3, 0.6].map((delay, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    inset: 0,
                    border: `2px solid ${color}`,
                    borderRadius: "50%",
                    animation: "econ-ripple 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
                    animationDelay: `${delay}s`,
                  }}
                />
              ))}

              {/* Impact labels - floating badges */}
              {topDeltas.length > 0 && (
                <div
                  className="absolute flex flex-col gap-0.5"
                  style={{
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    marginTop: 8,
                    alignItems: "center",
                  }}
                >
                  {topDeltas.map(({ assetId, delta }) => (
                    <span
                      key={assetId}
                      className="px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
                      style={{
                        fontSize: 12,
                        background: "rgba(15, 14, 12, 0.85)",
                        color: delta >= 0 ? "#22c55e" : "#ef4444",
                        border: "1px solid rgba(212, 168, 83, 0.4)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
                      }}
                    >
                      {delta >= 0 ? "+" : ""}
                      {Math.round(delta * 100)}% {getAssetLabel(assetId)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
