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
  const setEventGenAbortController = useWorldStore((s) => s.setEventGenAbortController);
  const isLoading = useWorldStore((s) => s.isLoading);
  const needsEvents = useWorldStore((s) => s.needsEvents);
  const setNeedsEvents = useWorldStore((s) => s.setNeedsEvents);
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

  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  const handleAbortGeneration = () => {
    const ctrl = useWorldStore.getState().eventGenAbortController;
    if (ctrl) {
      ctrl.abort();
    }
  };

  const handleGenerateEvents = async (params: {
    count: number;
    startYear: number;
    eventsPerYear: number;
    categories?: string[];
    focusRegions?: string[];
    detailLevel: string;
  }) => {
    setShowGenerateConfirm(false);
    setIsGeneratingEvents(true);
    setNeedsEvents(false);
    setGenStatus(t("events.generating"));

    const abortCtrl = new AbortController();
    setEventGenAbortController(abortCtrl);

    try {
      const resp = await fetch("/api/events/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: abortCtrl.signal,
      });

      if (!resp.ok || !resp.body) {
        console.error("Generate events error:", resp.status);
        setGenStatus("");
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

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
                  const fmtY = (y: number) => y < 0 ? `${Math.abs(y)} BCE` : `${y} CE`;
                  setGenStatus(locale === "zh"
                    ? `AI 正在生成 ${fmtY(sy)} 起的重大历史事件...`
                    : `Generating significant events from ${fmtY(sy)}...`);
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

      if (buffer.trim()) {
        const remaining = buffer.split("\n");
        for (const line of remaining) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === "done") {
                setGenStatus("");
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
      if (err instanceof DOMException && err.name === "AbortError") {
        setGenStatus(locale === "zh" ? "已中止生成" : "Generation aborted");
        setTimeout(() => setGenStatus(""), 2000);
      } else {
        console.error("Generate events failed:", err);
        setGenStatus("");
      }
    } finally {
      setIsGeneratingEvents(false);
      setEventGenAbortController(null);
    }
  };

  const handleCustomEventAdded = (evt: HistoricalEvent) => {
    const current = useWorldStore.getState().futureEvents;
    const updated = [...current, evt].sort(
      (a, b) => a.timestamp.year - b.timestamp.year || a.timestamp.month - b.timestamp.month
    );
    setFutureEvents(updated);
    setShowCustomForm(false);
    setEditingEvent(undefined);
  };

  const [editingEvent, setEditingEvent] = useState<HistoricalEvent | undefined>(undefined);

  const handleEditEvent = (evt: HistoricalEvent) => {
    setEditingEvent(evt);
    setCustomFormDefaultYear(evt.timestamp.year);
    setShowCustomForm(true);
  };

  const handleCustomEventUpdated = (evt: HistoricalEvent) => {
    const current = useWorldStore.getState().futureEvents;
    const updated = current.map((e) => e.id === evt.id ? evt : e).sort(
      (a, b) => a.timestamp.year - b.timestamp.year || a.timestamp.month - b.timestamp.month
    );
    setFutureEvents(updated);
    setShowCustomForm(false);
    setEditingEvent(undefined);
  };

  const handleDeleteEvent = async (evtId: string) => {
    if (!confirm(t("events.deleteConfirm"))) return;
    try {
      const resp = await fetch(`/api/events/custom?id=${evtId}`, { method: "DELETE" });
      if (resp.ok) {
        const current = useWorldStore.getState().futureEvents;
        setFutureEvents(current.filter((e) => e.id !== evtId));
      }
    } catch (err) {
      console.error("Delete event failed:", err);
    }
  };

  const handleClearPendingEvents = async () => {
    if (!confirm(t("events.clearConfirm"))) return;
    try {
      const resp = await fetch("/api/events", { method: "DELETE" });
      if (resp.ok) {
        setFutureEvents([]);
      }
    } catch (err) {
      console.error("Clear pending events failed:", err);
    }
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
          {needsEvents && tab === "future" && sortedYears.length === 0 && !isGeneratingEvents && (
            <div className="flex flex-col items-center gap-3 py-6 px-3 text-center">
              <div className="w-10 h-10 rounded-full bg-accent-gold/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent-gold">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-text-primary">
                  {locale === "zh" ? "世界状态已加载" : "World state loaded"}
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  {locale === "zh"
                    ? "请点击下方按钮生成该时期的历史事件，以便开始模拟演进"
                    : "Click the button below to generate historical events for this era to start the simulation"}
                </p>
              </div>
            </div>
          )}
          {sortedYears.length === 0 && !needsEvents && (
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
                    onClick={() => { setCustomFormDefaultYear(year); setEditingEvent(undefined); setShowCustomForm(true); }}
                    disabled={isLoading}
                    className="text-text-muted hover:text-accent-gold transition-colors px-1 py-0.5 rounded hover:bg-bg-tertiary/60 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-text-muted disabled:hover:bg-transparent"
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
                  <EventCard
                    key={evt.id}
                    event={evt}
                    locale={locale}
                    localized={localized}
                    t={t}
                    showActions={tab === "future"}
                    isSimulating={isLoading}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom controls — only visible on future tab */}
        {tab === "future" && (
          <div className="shrink-0 px-2 py-2 border-t border-border-subtle space-y-2">
            {isGeneratingEvents ? (
              <button
                onClick={handleAbortGeneration}
                disabled={isLoading}
                className="w-full py-2 rounded text-xs font-semibold transition-all border bg-bg-tertiary text-text-muted border-border-subtle hover:border-red-500/60 hover:text-red-400 cursor-pointer group disabled:opacity-40 disabled:cursor-not-allowed"
                title={t("events.abortGenerate")}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-accent-gold border-t-transparent rounded-full animate-spin group-hover:hidden" />
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="hidden group-hover:block text-red-400">
                    <rect x="3" y="3" width="10" height="10" rx="1.5" />
                  </svg>
                  <span className="truncate">
                    <span className="group-hover:hidden">{genStatus || t("events.generating")}</span>
                    <span className="hidden group-hover:inline text-red-400">{t("events.abortGenerate")}</span>
                  </span>
                </span>
              </button>
            ) : (
              <button
                onClick={() => setShowGenerateConfirm(true)}
                disabled={isLoading}
                className={`w-full py-2 rounded text-xs font-semibold transition-all border ${needsEvents
                  ? "bg-accent-gold/10 text-accent-gold border-accent-gold animate-pulse"
                  : "bg-transparent text-accent-gold border-accent-gold hover:bg-accent-gold/10"
                  } disabled:opacity-40 disabled:cursor-not-allowed disabled:animate-none`}
                title={t("events.generateHint")}
              >
                {t("events.generate")}
              </button>
            )}

            <button
              onClick={() => { setCustomFormDefaultYear(undefined); setEditingEvent(undefined); setShowCustomForm(true); }}
              disabled={isLoading}
              className="w-full py-1.5 rounded text-xs font-semibold transition-all border bg-transparent text-text-secondary border-border-subtle hover:border-accent-gold hover:text-accent-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border-subtle disabled:hover:text-text-secondary"
            >
              + {t("events.addCustom")}
            </button>

            {futureEvents.length > 0 && !isGeneratingEvents && (
              <button
                onClick={handleClearPendingEvents}
                disabled={isLoading}
                className="w-full py-1.5 rounded text-xs font-semibold transition-all border bg-transparent text-text-muted border-border-subtle hover:border-red-500/60 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border-subtle disabled:hover:text-text-muted"
              >
                {t("events.clearAll")}
              </button>
            )}
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
          editEvent={editingEvent}
          onSubmit={editingEvent ? handleCustomEventUpdated : handleCustomEventAdded}
          onCancel={() => { setShowCustomForm(false); setEditingEvent(undefined); }}
        />
      )}

      {showGenerateConfirm && (
        <GenerateConfirmModal
          locale={locale}
          t={t}
          frontier={frontier}
          regions={currentState?.regions ?? []}
          onConfirm={handleGenerateEvents}
          onCancel={() => setShowGenerateConfirm(false)}
        />
      )}
    </>
  );
}

function GenerateConfirmModal({
  locale,
  t,
  frontier,
  regions,
  onConfirm,
  onCancel,
}: {
  locale: "zh" | "en";
  t: (key: string) => string;
  frontier: { year: number; month: number };
  regions: { id: string; name: { zh: string; en: string } }[];
  onConfirm: (params: {
    count: number;
    startYear: number;
    eventsPerYear: number;
    categories?: string[];
    focusRegions?: string[];
    detailLevel: string;
  }) => void;
  onCancel: () => void;
}) {
  const defaultStart = frontier.year + 1;
  const [count, setCount] = useState(20);
  const [startEra, setStartEra] = useState<"bce" | "ce">(defaultStart <= 0 ? "bce" : "ce");
  const [startAbs, setStartAbs] = useState(Math.abs(defaultStart));
  const [eventsPerYear, setEventsPerYear] = useState(3);
  const [detailLevel, setDetailLevel] = useState<"brief" | "normal" | "detailed">("normal");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const allCategories: { id: string; label: string }[] = [
    { id: "war", label: t("events.category.war") },
    { id: "dynasty", label: t("events.category.dynasty") },
    { id: "invention", label: t("events.category.invention") },
    { id: "trade", label: t("events.category.trade") },
    { id: "religion", label: t("events.category.religion") },
    { id: "disaster", label: t("events.category.disaster") },
    { id: "natural_disaster", label: t("events.category.natural_disaster") },
    { id: "exploration", label: t("events.category.exploration") },
    { id: "diplomacy", label: t("events.category.diplomacy") },
    { id: "migration", label: t("events.category.migration") },
  ];
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(allCategories.map((c) => c.id))
  );
  const [focusRegions, setFocusRegions] = useState<Set<string>>(new Set());

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  };

  const toggleFocusRegion = (id: string) => {
    setFocusRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const computeStart = () => startEra === "bce" ? -startAbs : startAbs;

  const fmtYear = (y: number) => {
    if (locale === "zh") return y < 0 ? `公元前${Math.abs(y)}年` : `公元${y}年`;
    return y < 0 ? `${Math.abs(y)} BCE` : `${y} CE`;
  };

  const allCategoriesSelected = selectedCategories.size === allCategories.length;

  const handleConfirm = () => {
    onConfirm({
      count,
      startYear: computeStart(),
      eventsPerYear,
      categories: allCategoriesSelected ? undefined : [...selectedCategories],
      focusRegions: focusRegions.size > 0 ? [...focusRegions] : undefined,
      detailLevel,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative rounded-lg max-w-md w-full mx-4 border border-border-active/50 shadow-2xl max-h-[85vh] flex flex-col"
        style={{ background: "linear-gradient(to bottom, #1e1b16, #151310)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">{t("events.generateConfirmTitle")}</h2>
          <button onClick={onCancel} className="text-text-muted hover:text-text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs text-text-muted">{t("events.generateConfirmDesc")}</p>

          {/* Count slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-text-secondary">{t("events.generateCount")}</label>
              <span className="text-xs font-semibold text-accent-gold">{count} {t("events.generateCountUnit")}</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-accent-gold bg-bg-tertiary"
              style={{ accentColor: "var(--accent-gold, #d4a853)" }}
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>1</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          {/* Start year */}
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5">{t("events.generateStartYear")}</label>
            <div className="flex">
              <select
                value={startEra}
                onChange={(e) => setStartEra(e.target.value as "bce" | "ce")}
                className="shrink-0 bg-bg-primary/60 border border-r-0 border-border-subtle rounded-l-md px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-gold/60 transition-all"
              >
                <option value="bce">{t("events.customEra.bce")}</option>
                <option value="ce">{t("events.customEra.ce")}</option>
              </select>
              <input
                type="number"
                min={1}
                value={startAbs}
                onChange={(e) => setStartAbs(Math.max(1, Number(e.target.value)))}
                className="w-full bg-bg-primary/60 border border-border-subtle rounded-r-md px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 transition-all"
              />
            </div>
          </div>

          {/* Events per year */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-text-secondary">{t("events.prefEventsPerYear")}</label>
              <span className="text-xs font-semibold text-accent-gold">{t("events.prefMaxPerYear").replace("{n}", String(eventsPerYear))}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={eventsPerYear}
              onChange={(e) => setEventsPerYear(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-accent-gold bg-bg-tertiary"
              style={{ accentColor: "var(--accent-gold, #d4a853)" }}
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          {/* Detail level */}
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5">{t("events.prefDetailLevel")}</label>
            <div className="flex gap-1.5">
              {([
                { id: "brief" as const, label: t("events.prefDetail.brief") },
                { id: "normal" as const, label: t("events.prefDetail.normal") },
                { id: "detailed" as const, label: t("events.prefDetail.detailed") },
              ]).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDetailLevel(opt.id)}
                  className={`flex-1 py-1.5 rounded text-xs font-medium transition-all border ${detailLevel === opt.id
                    ? "bg-accent-gold/15 border-accent-gold/50 text-accent-gold"
                    : "bg-bg-primary/40 border-border-subtle text-text-muted hover:border-border-active hover:text-text-secondary"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            <svg
              width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-200 ${showAdvanced ? "rotate-90" : ""}`}
            >
              <polyline points="6 4 10 8 6 12" />
            </svg>
            {t("events.prefAdvanced")}
          </button>

          {showAdvanced && (
            <div className="space-y-4 pl-1">
              {/* Category filter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-text-secondary">{t("events.prefCategories")}</label>
                  <button
                    onClick={() => {
                      if (allCategoriesSelected) {
                        setSelectedCategories(new Set(["war"]));
                      } else {
                        setSelectedCategories(new Set(allCategories.map((c) => c.id)));
                      }
                    }}
                    className="text-xs text-text-muted hover:text-accent-gold transition-colors"
                  >
                    {allCategoriesSelected ? t("advance.deselectAll") : t("advance.selectAll")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-2 py-1 rounded-full text-xs transition-all border ${selectedCategories.has(cat.id)
                        ? "bg-accent-gold/15 border-accent-gold/50 text-accent-gold"
                        : "bg-bg-primary/40 border-border-subtle text-text-muted hover:border-border-active"
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Region focus */}
              {regions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-text-secondary">{t("events.prefFocusRegions")}</label>
                    {focusRegions.size > 0 && (
                      <button
                        onClick={() => setFocusRegions(new Set())}
                        className="text-xs text-text-muted hover:text-accent-gold transition-colors"
                      >
                        {t("events.prefClearFocus")}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mb-1.5">{t("events.prefFocusRegionsHint")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {regions.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => toggleFocusRegion(r.id)}
                        className={`px-2 py-1 rounded-full text-xs transition-all border ${focusRegions.has(r.id)
                          ? "bg-accent-gold/15 border-accent-gold/50 text-accent-gold"
                          : "bg-bg-primary/40 border-border-subtle text-text-muted hover:border-border-active"
                          }`}
                      >
                        {r.name[locale]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="text-xs text-text-muted bg-bg-primary/30 rounded-md px-3 py-2 border border-border-subtle">
            {locale === "zh"
              ? `从 ${fmtYear(computeStart())} 开始生成约 ${count} 个重大历史事件，每年最多 ${eventsPerYear} 个${focusRegions.size > 0 ? `，聚焦 ${focusRegions.size} 个地区` : ""}`
              : `~${count} significant events from ${fmtYear(computeStart())}, up to ${eventsPerYear}/year${focusRegions.size > 0 ? `, focusing on ${focusRegions.size} region(s)` : ""}`}
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-border-subtle flex justify-end gap-2 shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-md text-xs border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-active transition-colors"
          >
            {t("events.customCancel")}
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-1.5 rounded-md text-xs font-semibold border border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-bg-primary transition-all"
          >
            {t("events.generateStart")}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomEventModal({
  locale,
  t,
  localized,
  regions,
  frontier,
  defaultYear,
  editEvent,
  onSubmit,
  onCancel,
}: {
  locale: "zh" | "en";
  t: (key: string) => string;
  localized: (text: { zh: string; en: string } | undefined) => string;
  regions: { id: string; name: { zh: string; en: string } }[];
  frontier: { year: number; month: number };
  defaultYear?: number;
  editEvent?: HistoricalEvent;
  onSubmit: (evt: HistoricalEvent) => void;
  onCancel: () => void;
}) {
  const isEdit = !!editEvent;
  const minYear = frontier.year;
  const initYear = editEvent ? editEvent.timestamp.year : (defaultYear ?? minYear + 1);
  const [title, setTitle] = useState(editEvent ? localized(editEvent.title) : "");
  const [description, setDescription] = useState(editEvent ? localized(editEvent.description) : "");
  const [era, setEra] = useState<"bce" | "ce">(initYear <= 0 ? "bce" : "ce");
  const [yearAbs, setYearAbs] = useState(Math.abs(initYear));
  const [month, setMonth] = useState(editEvent ? editEvent.timestamp.month : 1);
  const [category, setCategory] = useState<EventCategory>(editEvent ? editEvent.category : "other");
  const [selectedRegions, setSelectedRegions] = useState<string[]>(editEvent ? editEvent.affectedRegions : []);
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
        ...(isEdit ? { id: editEvent.id } : {}),
        title: { zh: title.trim(), en: title.trim() },
        description: { zh: description.trim() || title.trim(), en: description.trim() || title.trim() },
        affectedRegions: selectedRegions.length > 0 ? selectedRegions : (regions.length > 0 ? [regions[0].id] : []),
        category,
        timestamp: { year, month },
      };

      const resp = await fetch("/api/events/custom", {
        method: isEdit ? "PUT" : "POST",
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
          <h2 className="text-sm font-semibold text-text-primary">{t(isEdit ? "events.editCustom" : "events.addCustom")}</h2>
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
              t(isEdit ? "events.customSave" : "events.customSubmit")
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
  showActions,
  isSimulating,
  onEdit,
  onDelete,
}: {
  event: HistoricalEvent;
  locale: "zh" | "en";
  localized: (text: { zh: string; en: string } | undefined) => string;
  t: (key: string) => string;
  showActions?: boolean;
  isSimulating?: boolean;
  onEdit?: (evt: HistoricalEvent) => void;
  onDelete?: (id: string) => void;
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
        {showActions && event.isCustom && event.status === "pending" && !isSimulating && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(event); }}
              className="p-1 rounded text-text-muted hover:text-accent-gold hover:bg-bg-tertiary/60 transition-colors"
              title={t("events.editCustom")}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.5 2.5l2 2L5 13H3v-2z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(event.id); }}
              className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title={t("events.deleteCustom")}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5h10M5.5 5V3.5a1 1 0 011-1h3a1 1 0 011 1V5M6.5 7.5v4M9.5 7.5v4M4.5 5l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" />
              </svg>
            </button>
          </div>
        )}
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
