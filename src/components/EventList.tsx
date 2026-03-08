"use client";

import { useState, useRef, useEffect } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import type { HistoricalEvent, EventCategory } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  war: "#8b3a3a",
  dynasty: "#5b4a8a",
  invention: "#3a6b8b",
  trade: "#2e6b4f",
  religion: "#8a7340",
  disaster: "#8b4513",
  natural_disaster: "#4a7c59",
  exploration: "#2e8b57",
  diplomacy: "#4682b4",
  migration: "#7b6b8a",
  other: "#6b5f4e",
};

const ALL_CATEGORIES: EventCategory[] = [
  "war", "dynasty", "invention", "trade", "religion",
  "disaster", "natural_disaster", "exploration", "diplomacy", "migration", "other",
];

function formatYear(year: number, locale: "zh" | "en"): string {
  if (locale === "zh") {
    return year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年`;
  }
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

export default function EventList() {
  const pastEvents = useWorldStore((s) => s.pastEvents);
  const futureEvents = useWorldStore((s) => s.futureEvents);
  const setFutureEvents = useWorldStore((s) => s.setFutureEvents);
  const isGeneratingEvents = useWorldStore((s) => s.isGeneratingEvents);
  const setIsGeneratingEvents = useWorldStore((s) => s.setIsGeneratingEvents);
  const currentState = useWorldStore((s) => s.currentState);
  const frontier = useWorldStore((s) => s.frontier);
  const { locale, t, localized } = useLocale();
  const [tab, setTab] = useState<"past" | "future">("future");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFormDefaultYear, setCustomFormDefaultYear] = useState<number | undefined>(undefined);

  const events = tab === "past" ? [...pastEvents].reverse() : futureEvents;

  const groupedByYear = events.reduce(
    (acc, evt) => {
      const yearKey = evt.timestamp.year;
      if (!acc[yearKey]) acc[yearKey] = [];
      acc[yearKey].push(evt);
      return acc;
    },
    {} as Record<number, HistoricalEvent[]>
  );

  const sortedYears = Object.keys(groupedByYear)
    .map(Number)
    .sort((a, b) => (tab === "past" ? b - a : a - b));

  const [genStatus, setGenStatus] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGeneratingEvents && tab === "future" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [futureEvents.length, isGeneratingEvents, tab]);

  const handleGenerateEvents = async () => {
    setIsGeneratingEvents(true);
    setGenStatus(t("events.generating"));
    try {
      const resp = await fetch("/api/events/generate", { method: "POST" });

      if (!resp.ok || !resp.body) {
        console.error("Generate events error:", resp.status);
        setGenStatus("");
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === "progress") {
                const stage = data.stage as string;
                if (stage === "calling_llm") {
                  const sy = data.startYear as number;
                  const ey = data.endYear as number;
                  const fmtY = (y: number) => y < 0 ? `${Math.abs(y)} BCE` : `${y} CE`;
                  setGenStatus(locale === "zh"
                    ? `AI 正在生成 ${fmtY(sy)}–${fmtY(ey)} 的事件...`
                    : `Generating ${fmtY(sy)}–${fmtY(ey)}...`);
                } else if (stage === "streaming") {
                  setGenStatus(locale === "zh"
                    ? `正在接收数据...`
                    : `Receiving data...`);
                }
              } else if (currentEvent === "new_event") {
                const evt: HistoricalEvent = {
                  id: data.id,
                  timestamp: data.timestamp,
                  title: data.title,
                  description: data.description,
                  affectedRegions: data.affectedRegions,
                  category: data.category,
                  status: "pending",
                };
                const current = useWorldStore.getState().futureEvents;
                setFutureEvents([...current, evt]);
                setGenStatus(locale === "zh"
                  ? `已生成 ${data.count} 个事件...`
                  : `Generated ${data.count} events...`);
              } else if (currentEvent === "done") {
                setGenStatus("");
              } else if (currentEvent === "error") {
                console.error("Event generation error:", data.error);
                setGenStatus("");
              }
            } catch {
              // skip
            }
            currentEvent = "";
          }
        }
      }
    } catch (err) {
      console.error("Generate events failed:", err);
      setGenStatus("");
    } finally {
      setIsGeneratingEvents(false);
      setGenStatus("");
    }
  };

  const handleCustomEventAdded = (evt: HistoricalEvent) => {
    const current = useWorldStore.getState().futureEvents;
    const updated = [...current, evt].sort(
      (a, b) => a.timestamp.year - b.timestamp.year || a.timestamp.month - b.timestamp.month
    );
    setFutureEvents(updated);
    setShowCustomForm(false);
  };

  return (
    <>
      <div className="glass-panel h-full flex flex-col overflow-hidden w-[280px] min-w-[280px] border-l border-border-subtle">
        {/* Tabs */}
        <div className="flex border-b border-border-subtle">
          <button
            onClick={() => setTab("past")}
            className={`flex-1 py-2 text-xs font-semibold transition-colors border-b-2 ${tab === "past"
              ? "text-accent-gold border-accent-gold"
              : "text-text-muted border-transparent"
              }`}
          >
            {t("events.past")} ({pastEvents.length})
          </button>
          <button
            onClick={() => setTab("future")}
            className={`flex-1 py-2 text-xs font-semibold transition-colors border-b-2 ${tab === "future"
              ? "text-accent-gold border-accent-gold"
              : "text-text-muted border-transparent"
              }`}
          >
            {t("events.future")} ({futureEvents.length})
          </button>
        </div>

        {/* Events */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
          {sortedYears.length === 0 && (
            <div className="text-center text-xs py-8 text-text-muted">
              {t("events.empty")}
            </div>
          )}
          {sortedYears.map((year) => (
            <div key={year}>
              <div className="font-mono text-xs font-semibold py-1 sticky top-0 text-accent-copper bg-bg-glass backdrop-blur-sm flex items-center justify-between">
                <span>{formatYear(year, locale)}</span>
                {tab === "future" && (
                  <button
                    onClick={() => { setCustomFormDefaultYear(year); setShowCustomForm(true); }}
                    className="text-text-muted hover:text-accent-gold transition-colors px-1 py-0.5 rounded hover:bg-bg-tertiary/60"
                    title={t("events.addCustom")}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <line x1="8" y1="3" x2="8" y2="13" />
                      <line x1="3" y1="8" x2="13" y2="8" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {groupedByYear[year].map((evt) => (
                  <EventCard key={evt.id} event={evt} locale={locale} localized={localized} t={t} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom controls — only visible on future tab */}
        {tab === "future" && (
          <div className="shrink-0 px-2 py-2 border-t border-border-subtle space-y-2">
            <button
              onClick={handleGenerateEvents}
              disabled={isGeneratingEvents}
              className={`w-full py-2 rounded text-xs font-semibold transition-all border ${isGeneratingEvents
                ? "bg-bg-tertiary text-text-muted border-border-subtle cursor-not-allowed"
                : "bg-transparent text-accent-gold border-accent-gold hover:bg-accent-gold/10"
                }`}
              title={t("events.generateHint")}
            >
              {isGeneratingEvents ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
                  <span className="truncate">{genStatus || t("events.generating")}</span>
                </span>
              ) : (
                t("events.generate")
              )}
            </button>

            <button
              onClick={() => { setCustomFormDefaultYear(undefined); setShowCustomForm(true); }}
              className="w-full py-1.5 rounded text-xs font-semibold transition-all border bg-transparent text-text-secondary border-border-subtle hover:border-accent-gold hover:text-accent-gold"
            >
              + {t("events.addCustom")}
            </button>
          </div>
        )}
      </div>

      {showCustomForm && (
        <CustomEventModal
          locale={locale}
          t={t}
          localized={localized}
          regions={currentState?.regions ?? []}
          frontier={frontier}
          defaultYear={customFormDefaultYear}
          onSubmit={handleCustomEventAdded}
          onCancel={() => setShowCustomForm(false)}
        />
      )}
    </>
  );
}

function CustomEventModal({
  locale,
  t,
  localized,
  regions,
  frontier,
  defaultYear,
  onSubmit,
  onCancel,
}: {
  locale: "zh" | "en";
  t: (key: string) => string;
  localized: (text: { zh: string; en: string } | undefined) => string;
  regions: { id: string; name: { zh: string; en: string } }[];
  frontier: { year: number; month: number };
  defaultYear?: number;
  onSubmit: (evt: HistoricalEvent) => void;
  onCancel: () => void;
}) {
  const minYear = frontier.year;
  const initYear = defaultYear ?? minYear + 1;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [era, setEra] = useState<"bce" | "ce">(initYear <= 0 ? "bce" : "ce");
  const [yearAbs, setYearAbs] = useState(Math.abs(initYear));
  const [month, setMonth] = useState(1);
  const [category, setCategory] = useState<EventCategory>("other");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const computeYear = () => era === "bce" ? -yearAbs : yearAbs;

  const toggleRegion = (id: string) => {
    setSelectedRegions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setError("");

    if (!title.trim()) {
      setError(t("events.customTitleRequired"));
      return;
    }

    const year = computeYear();
    if (year < minYear || (year === minYear && month <= frontier.month)) {
      setError(t("events.customTimeError"));
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        title: locale === "zh"
          ? { zh: title.trim(), en: title.trim() }
          : { zh: title.trim(), en: title.trim() },
        description: locale === "zh"
          ? { zh: description.trim() || title.trim(), en: description.trim() || title.trim() }
          : { zh: description.trim() || title.trim(), en: description.trim() || title.trim() },
        affectedRegions: selectedRegions.length > 0 ? selectedRegions : (regions.length > 0 ? [regions[0].id] : []),
        category,
        timestamp: { year, month },
      };

      const resp = await fetch("/api/events/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const data = await resp.json();
        setError(data.error || t("events.customError"));
        return;
      }

      const data = await resp.json();
      onSubmit({
        id: data.id,
        timestamp: data.timestamp,
        title: data.title,
        description: data.description,
        affectedRegions: data.affectedRegions,
        category: data.category,
        status: "pending",
        isCustom: true,
      });
    } catch {
      setError(t("events.customError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative rounded-lg max-w-lg w-full mx-4 border border-border-active/50 shadow-2xl"
        style={{ background: "linear-gradient(to bottom, #1e1b16, #151310)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">{t("events.addCustom")}</h2>
          <button onClick={onCancel} className="text-text-muted hover:text-text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">{t("events.customTitle")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("events.customTitlePlaceholder")}
              autoFocus
              className="w-full bg-bg-primary/60 border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">{t("events.customDesc")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("events.customDescPlaceholder")}
              rows={2}
              className="w-full bg-bg-primary/60 border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-text-secondary block mb-1">{t("events.customYear")}</label>
              <div className="flex">
                <select
                  value={era}
                  onChange={(e) => setEra(e.target.value as "bce" | "ce")}
                  className="shrink-0 bg-bg-primary/60 border border-r-0 border-border-subtle rounded-l-md px-2 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-gold/60 transition-all"
                >
                  <option value="bce">{t("events.customEra.bce")}</option>
                  <option value="ce">{t("events.customEra.ce")}</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={yearAbs}
                  onChange={(e) => setYearAbs(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-bg-primary/60 border border-border-subtle rounded-r-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 transition-all"
                />
              </div>
            </div>
            <div className="w-20">
              <label className="text-xs font-medium text-text-secondary block mb-1">{t("events.customMonth")}</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full bg-bg-primary/60 border border-border-subtle rounded-md px-2 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-gold/60 transition-all"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-text-secondary block mb-1">{t("events.customCategory")}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full bg-bg-primary/60 border border-border-subtle rounded-md px-2 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-gold/60 transition-all"
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{t(`events.category.${cat}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5">{t("events.customRegions")}</label>
            <div className="flex flex-wrap gap-1.5">
              {regions.map((r) => {
                const selected = selectedRegions.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRegion(r.id)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all border ${selected
                      ? "bg-accent-gold/15 border-accent-gold/50 text-accent-gold"
                      : "bg-bg-primary/40 border-border-subtle text-text-muted hover:border-border-active hover:text-text-secondary"
                      }`}
                  >
                    {localized(r.name)}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-400/5 border border-red-400/20 rounded-md px-3 py-2">{error}</div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-border-subtle flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-md text-xs border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-active transition-colors"
          >
            {t("events.customCancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-1.5 rounded-md text-xs font-semibold border border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="inline-block w-3 h-3 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
            ) : (
              t("events.customSubmit")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventCard({
  event,
  locale,
  localized,
  t,
}: {
  event: HistoricalEvent;
  locale: "zh" | "en";
  localized: (text: { zh: string; en: string } | undefined) => string;
  t: (key: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded p-2 cursor-pointer transition-all hover:scale-[1.01] bg-bg-secondary border border-border-subtle ${event.isCustom ? "border-l-2 border-l-accent-gold" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <span
          className="text-xs px-1.5 py-0.5 rounded whitespace-nowrap mt-0.5 font-medium text-white/90"
          style={{ background: CATEGORY_COLORS[event.category] ?? "#6b5f4e" }}
        >
          {t(`events.category.${event.category}`)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-semibold truncate text-white/90">
              {localized(event.title)}
            </span>
            {event.isCustom && (
              <span className="shrink-0 text-xs px-1 py-px rounded bg-accent-gold/20 text-accent-gold font-medium">
                {t("events.customTag")}
              </span>
            )}
          </div>
          <div className="text-xs font-mono text-text-secondary">
            {t("month.label").replace("{month}", String(event.timestamp.month))}
          </div>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 mt-1 text-text-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </div>
      {expanded && (
        <div className="text-xs mt-2 leading-relaxed text-text-primary">
          {localized(event.description)}
        </div>
      )}
    </div>
  );
}
