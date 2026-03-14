"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import { getRegionCentroid } from "@/lib/geo-transform";
import type { Region } from "@/lib/types";

function fuzzyMatch(query: string, target: string): { match: boolean; score: number } {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) {
    const startBonus = t.startsWith(q) ? 100 : 0;
    return { match: true, score: 200 + startBonus - t.length };
  }
  let qi = 0;
  let score = 0;
  let lastMatchIdx = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 10;
      if (lastMatchIdx >= 0 && ti - lastMatchIdx === 1) score += 5;
      lastMatchIdx = ti;
      qi++;
    }
  }
  if (qi < q.length) return { match: false, score: 0 };
  return { match: true, score };
}

interface SearchResult {
  region: Region;
  displayName: string;
  civName: string;
  score: number;
}

export default function RegionSearchBar() {
  const { t, localized } = useLocale();
  const currentState = useWorldStore((s) => s.currentState);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(value.trim());
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const regions = currentState?.regions ?? [];

  const results = useMemo<SearchResult[]>(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) return [];
    const q = debouncedQuery;
    const matched: SearchResult[] = [];

    for (const region of regions) {
      const nameZh = region.name?.zh ?? "";
      const nameEn = region.name?.en ?? "";
      const civZh = region.civilization?.name?.zh ?? "";
      const civEn = region.civilization?.name?.en ?? "";

      const targets = [nameZh, nameEn, civZh, civEn, region.id];
      let bestScore = 0;
      let isMatch = false;

      for (const target of targets) {
        if (!target) continue;
        const r = fuzzyMatch(q, target);
        if (r.match && r.score > bestScore) {
          bestScore = r.score;
          isMatch = true;
        }
      }

      if (isMatch) {
        matched.push({
          region,
          displayName: localized(region.name) || region.id,
          civName: localized(region.civilization?.name) || "",
          score: bestScore,
        });
      }
    }

    matched.sort((a, b) => b.score - a.score);
    return matched.slice(0, 20);
  }, [debouncedQuery, regions, localized]);

  useEffect(() => {
    setHighlightIdx(0);
  }, [results]);

  const selectRegion = useCallback((region: Region) => {
    const store = useWorldStore.getState();
    store.setSelectedRegionId(region.id);

    const centroid = getRegionCentroid(region);
    if (centroid && store.mapFlyTo) {
      store.mapFlyTo({ longitude: centroid[0], latitude: centroid[1], zoom: 5 });
    }

    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[highlightIdx]) {
          selectRegion(results[highlightIdx].region);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    },
    [results, highlightIdx, selectRegion]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown = isOpen && debouncedQuery.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <svg
          className="absolute left-2 w-3.5 h-3.5 text-text-muted pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("search.placeholder")}
          className="w-[180px] focus:w-[240px] transition-all duration-200 h-7 pl-7 pr-2 rounded border border-border-subtle bg-surface-secondary text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/20"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-1.5 w-4 h-4 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-1 w-[280px] max-h-[320px] overflow-y-auto glass-panel rounded-lg border border-border-subtle shadow-xl z-[999]">
          {results.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-text-muted">
              {t("search.noResults")}
            </div>
          ) : (
            <div className="py-1">
              {results.map((result, idx) => (
                <button
                  key={result.region.id}
                  onClick={() => selectRegion(result.region)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors cursor-pointer ${idx === highlightIdx
                    ? "bg-accent-gold/10 text-accent-gold"
                    : "text-text-primary hover:bg-surface-tertiary"
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {result.displayName}
                    </div>
                    {result.civName && result.civName !== result.displayName && (
                      <div className="text-xs text-text-muted truncate">
                        {result.civName}
                      </div>
                    )}
                  </div>
                  <StatusDot status={result.region.status} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  thriving: "#22c55e",
  rising: "#10b981",
  stable: "#d97706",
  declining: "#eab308",
  conflict: "#ef4444",
  collapsed: "#8b5cf6",
};

function StatusDot({ status }: { status: string }) {
  const normalized = typeof status === "string" ? status.toLowerCase() : "stable";
  const color = STATUS_COLORS[normalized] ?? "#888";
  return (
    <span
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}
