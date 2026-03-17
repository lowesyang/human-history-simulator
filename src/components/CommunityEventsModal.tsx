"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import { ERA_PRESETS } from "@/data/era-presets";

interface CommunityEvent {
  id: string;
  timestamp: { year: number; month: number };
  title: { zh: string; en: string };
  description: { zh: string; en: string };
  affectedRegions: string[];
  category: string;
  status: string;
  source?: string;
  contributor?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  war: "bg-status-war/60 text-red-300",
  dynasty: "bg-status-dynasty/60 text-purple-300",
  invention: "bg-status-invention/60 text-blue-300",
  trade: "bg-status-trade/60 text-emerald-300",
  religion: "bg-status-religion/60 text-yellow-300",
  disaster: "bg-red-900/50 text-red-200",
  natural_disaster: "bg-orange-900/50 text-orange-200",
  exploration: "bg-cyan-900/50 text-cyan-200",
  diplomacy: "bg-indigo-900/50 text-indigo-200",
  migration: "bg-teal-900/50 text-teal-200",
  technology: "bg-sky-900/50 text-sky-200",
  finance: "bg-amber-900/50 text-amber-200",
  political: "bg-violet-900/50 text-violet-200",
  announcement: "bg-pink-900/50 text-pink-200",
  other: "bg-gray-700/50 text-gray-300",
};

const SORTED_ERAS = [...ERA_PRESETS].sort((a, b) => a.year - b.year);

const ERA_RANGES = SORTED_ERAS.map((era, i) => ({
  id: era.id,
  name: era.name,
  icon: era.icon,
  color: era.color,
  startYear: era.year,
  endYear: i < SORTED_ERAS.length - 1 ? SORTED_ERAS[i + 1].year - 1 : 9999,
}));

function formatYear(year: number, t: (key: string) => string): string {
  if (year < 0) return t("year.bce").replace("{year}", String(Math.abs(year)));
  return t("year.ce").replace("{year}", String(year));
}

function getEraForYear(
  year: number,
  locale: "zh" | "en"
): { name: string; icon: string; color: string } | null {
  let matched: (typeof SORTED_ERAS)[number] | null = null;
  for (const era of SORTED_ERAS) {
    if (era.year <= year) matched = era;
    else break;
  }
  if (!matched) return null;
  return { name: matched.name[locale], icon: matched.icon, color: matched.color };
}

let cachedEvents: CommunityEvent[] | null = null;

export default function CommunityEventsModal({ onClose }: { onClose: () => void }) {
  const locale = useWorldStore((s) => s.locale);
  const { t, localized } = useLocale();

  const [events, setEvents] = useState<CommunityEvent[]>(cachedEvents ?? []);
  const [loading, setLoading] = useState(cachedEvents === null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEra, setSelectedEra] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (cachedEvents !== null) return;

    const ac = new AbortController();
    abortRef.current = ac;

    fetch("/api/community-events", { signal: ac.signal })
      .then((r) => r.json())
      .then((data) => {
        const list = data.events || [];
        cachedEvents = list;
        setEvents(list);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setEvents([]);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const categories = useMemo(() => {
    const set = new Set(events.map((e) => e.category));
    return [...set].sort();
  }, [events]);

  const filtered = useMemo(() => {
    let result = events;

    if (selectedEra !== "all") {
      const range = ERA_RANGES.find((r) => r.id === selectedEra);
      if (range) {
        result = result.filter(
          (e) => e.timestamp.year >= range.startYear && e.timestamp.year <= range.endYear
        );
      }
    }

    if (selectedCategory !== "all") {
      result = result.filter((e) => e.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.en.toLowerCase().includes(q) ||
          e.title.zh.includes(q) ||
          e.description.en.toLowerCase().includes(q) ||
          e.description.zh.includes(q) ||
          e.affectedRegions.some((r) => r.toLowerCase().includes(q))
      );
    }

    return result;
  }, [events, selectedEra, selectedCategory, searchQuery]);

  const groupedByYear = useMemo(() => {
    const map = new Map<number, CommunityEvent[]>();
    for (const evt of filtered) {
      const arr = map.get(evt.timestamp.year) || [];
      arr.push(evt);
      map.set(evt.timestamp.year, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  const toggleExpand = useCallback(
    (id: string) => setExpandedId((prev) => (prev === id ? null : id)),
    []
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop — click to close */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-[90vw] max-w-3xl max-h-[85vh] flex flex-col rounded-xl border border-border-subtle bg-bg-primary shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-base font-semibold text-text-primary truncate font-[family-name:var(--font-cinzel)]">
              {t("communityEvents.title")}
            </h2>
            {events.length > 0 && (
              <span className="text-xs text-text-muted">
                {t("communityEvents.totalCount").replace("{count}", String(events.length))}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://github.com/lowesyang/human-history-simulator/tree/main/public/community-events"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded text-xs font-semibold transition-colors border border-border-subtle text-text-secondary hover:border-accent-gold hover:text-accent-gold"
            >
              {t("communityEvents.contribute")}
            </a>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 pt-4 pb-3 border-b border-border-subtle/50 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("communityEvents.searchPlaceholder")}
                className="w-full pl-9 pr-3 py-1.5 bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold/50 transition-colors"
              />
            </div>
            <select
              value={selectedEra}
              onChange={(e) => setSelectedEra(e.target.value)}
              className="px-3 py-1.5 bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-gold/50 transition-colors cursor-pointer"
            >
              <option value="all">{t("communityEvents.allEras")}</option>
              {ERA_RANGES.map((era) => (
                <option key={era.id} value={era.id}>
                  {era.icon} {era.name[locale]}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-gold/50 transition-colors cursor-pointer"
            >
              <option value="all">{t("communityEvents.allCategories")}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`events.category.${cat}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-14 h-14 mx-auto mb-4 text-accent-gold/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <h3 className="text-sm font-semibold text-text-primary mb-1.5">{t("communityEvents.emptyTitle")}</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto mb-5 leading-relaxed">{t("communityEvents.emptyDesc")}</p>
              <a
                href="https://github.com/lowesyang/human-history-simulator/tree/main/public/community-events"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-accent-gold/50 text-accent-gold hover:bg-accent-gold/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                {t("communityEvents.startContributing")}
              </a>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedByYear.map(([year, yearEvents]) => {
                const era = getEraForYear(year, locale);
                return (
                  <section key={year}>
                    <div className="flex items-center gap-3 mb-2 sticky top-0 z-10 py-1.5 bg-bg-primary/95 backdrop-blur-sm">
                      <h3 className="text-sm font-semibold text-accent-gold font-[family-name:var(--font-cinzel)]">
                        {formatYear(year, t)}
                      </h3>
                      {era && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full border border-border-subtle text-text-muted"
                          style={{ borderColor: `${era.color}40` }}
                        >
                          {era.icon} {era.name}
                        </span>
                      )}
                      <span className="text-xs text-text-muted">
                        {yearEvents.length} {yearEvents.length === 1 ? "event" : "events"}
                      </span>
                      <div className="flex-1 h-px bg-border-subtle" />
                    </div>

                    <div className="grid gap-2">
                      {yearEvents.map((evt) => {
                        const isExpanded = expandedId === evt.id;
                        return (
                          <div
                            key={evt.id}
                            className="group border border-border-subtle rounded-lg bg-bg-secondary/50 hover:border-border-active transition-colors cursor-pointer overflow-hidden"
                            onClick={() => toggleExpand(evt.id)}
                          >
                            <div className="px-3 py-2.5 flex items-start gap-2.5">
                              <span
                                className={`shrink-0 mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.other}`}
                              >
                                {t(`events.category.${evt.category}`)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors">
                                  {localized(evt.title)}
                                </h4>
                                {!isExpanded && (
                                  <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                                    {localized(evt.description)}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 text-xs text-text-muted">
                                {t("month.label").replace("{month}", String(evt.timestamp.month))}
                              </span>
                              <svg
                                className={`w-4 h-4 text-text-muted transition-transform shrink-0 mt-0.5 ${isExpanded ? "rotate-180" : ""}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>

                            {isExpanded && (
                              <div className="px-3 pb-3 border-t border-border-subtle/50 pt-2.5 space-y-2.5">
                                <p className="text-sm text-text-secondary leading-relaxed">
                                  {localized(evt.description)}
                                </p>
                                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-muted">
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{t("communityEvents.regions")}: </span>
                                    <span className="text-text-secondary">{evt.affectedRegions.join(", ")}</span>
                                  </div>
                                  {evt.source && (
                                    <div className="flex items-center gap-1.5">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                      </svg>
                                      <span>{t("communityEvents.source")}: </span>
                                      <a href={evt.source} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline truncate max-w-[300px]">{evt.source}</a>
                                    </div>
                                  )}
                                  {evt.contributor && (
                                    <div className="flex items-center gap-1.5">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span>{t("communityEvents.contributor")}: </span>
                                      <span className="text-text-secondary">{evt.contributor}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="pt-2 border-t border-border-subtle/30">
                                  <div className="text-xs text-text-muted mb-0.5">
                                    {locale === "zh" ? "English" : "中文"}:
                                  </div>
                                  <p className="text-xs text-text-muted/80 leading-relaxed">
                                    {locale === "zh" ? evt.description.en : evt.description.zh}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
