"use client";

import { useState, useMemo, useCallback } from "react";
import { useLocale } from "@/lib/i18n";
import { useWorldStore } from "@/store/useWorldStore";
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
  technology: "#6d28d9",
  finance: "#0d9488",
  other: "#6b5f4e",
};

const ALL_CATEGORIES: EventCategory[] = [
  "war", "dynasty", "invention", "trade", "religion",
  "disaster", "natural_disaster", "exploration", "diplomacy", "migration",
  "technology", "finance", "announcement", "other",
];

function formatYear(year: number, locale: "zh" | "en"): string {
  if (locale === "zh") {
    return year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年`;
  }
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

interface Props {
  events: HistoricalEvent[];
  epochs: number;
  onConfirm: (excludedEventIds: string[]) => void;
  onCancel: () => void;
}

export default function AdvanceConfirmModal({
  events: initialEvents,
  epochs,
  onConfirm,
  onCancel,
}: Props) {
  const { locale, t, localized } = useLocale();
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<HistoricalEvent[]>(initialEvents);
  const [customFormYear, setCustomFormYear] = useState<number | null>(null);

  const currentState = useWorldStore((s) => s.currentState);
  const frontier = useWorldStore((s) => s.frontier);

  const groupedByYear = useMemo(() => {
    const map = new Map<number, HistoricalEvent[]>();
    for (const evt of events) {
      const year = evt.timestamp.year;
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(evt);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [events]);

  const totalCount = events.length;
  const selectedCount = totalCount - unchecked.size;

  const toggleEvent = useCallback((id: string) => {
    setUnchecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (unchecked.size === 0) {
      setUnchecked(new Set(events.map((e) => e.id)));
    } else {
      setUnchecked(new Set());
    }
  }, [events, unchecked.size]);

  const handleConfirm = () => {
    onConfirm(Array.from(unchecked));
  };

  const handleCustomEventAdded = (evt: HistoricalEvent) => {
    const updated = [...events, evt].sort(
      (a, b) => a.timestamp.year - b.timestamp.year || a.timestamp.month - b.timestamp.month
    );
    setEvents(updated);

    const store = useWorldStore.getState();
    const currentFuture = store.futureEvents;
    const updatedFuture = [...currentFuture, evt].sort(
      (a, b) => a.timestamp.year - b.timestamp.year || a.timestamp.month - b.timestamp.month
    );
    store.setFutureEvents(updatedFuture);

    setCustomFormYear(null);
    setEditingEvent(undefined);
  };

  const [editingEvent, setEditingEvent] = useState<HistoricalEvent | undefined>(undefined);

  const handleEditEvent = (evt: HistoricalEvent) => {
    setEditingEvent(evt);
    setCustomFormYear(evt.timestamp.year);
  };

  const handleCustomEventUpdated = (evt: HistoricalEvent) => {
    const updated = events.map((e) => e.id === evt.id ? evt : e).sort(
      (a, b) => a.timestamp.year - b.timestamp.year || a.timestamp.month - b.timestamp.month
    );
    setEvents(updated);

    const store = useWorldStore.getState();
    const currentFuture = store.futureEvents;
    const updatedFuture = currentFuture.map((e) => e.id === evt.id ? evt : e).sort(
      (a, b) => a.timestamp.year - b.timestamp.year || a.timestamp.month - b.timestamp.month
    );
    store.setFutureEvents(updatedFuture);

    setCustomFormYear(null);
    setEditingEvent(undefined);
  };

  const handleDeleteEvent = async (evtId: string) => {
    if (!confirm(t("events.deleteConfirm"))) return;
    try {
      const resp = await fetch(`/api/events/custom?id=${evtId}`, { method: "DELETE" });
      if (resp.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== evtId));
        setUnchecked((prev) => { const n = new Set(prev); n.delete(evtId); return n; });

        const store = useWorldStore.getState();
        store.setFutureEvents(store.futureEvents.filter((e) => e.id !== evtId));
      }
    } catch (err) {
      console.error("Delete event failed:", err);
    }
  };

  if (events.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="glass-panel relative rounded-lg p-6 max-w-md w-full mx-4 border border-border-subtle"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-sm font-semibold text-text-primary mb-3">{t("advance.confirmTitle")}</h2>
          <p className="text-xs text-text-muted mb-4">{t("advance.noEvents")}</p>
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs rounded border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-active transition-colors"
            >
              {t("advance.cancel")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="glass-panel relative rounded-lg max-w-2xl w-full mx-4 border border-border-subtle flex flex-col"
        style={{ maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border-subtle shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">{t("advance.confirmTitle")}</h2>
          <p className="text-xs text-text-muted mt-1">
            {t("advance.confirmDesc").replace("{epochs}", String(epochs))}
          </p>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-border-subtle flex items-center justify-between shrink-0">
          <span className="text-xs text-text-secondary">
            {t("advance.selectedCount")
              .replace("{selected}", String(selectedCount))
              .replace("{total}", String(totalCount))}
          </span>
          <button
            onClick={toggleAll}
            className="text-xs text-accent-gold hover:underline cursor-pointer"
          >
            {unchecked.size === 0 ? t("advance.deselectAll") : t("advance.selectAll")}
          </button>
        </div>

        {/* Event list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {groupedByYear.map(([year, yearEvents]) => (
            <div key={year}>
              {/* Year header */}
              <div className="flex items-center gap-2 mb-1.5 sticky top-0 bg-bg-glass/95 backdrop-blur-sm py-1 z-10">
                <span className="text-xs font-semibold text-accent-gold">
                  {formatYear(year, locale)}
                </span>
                <span className="text-xs text-text-muted">
                  {t("advance.eventCount").replace("{count}", String(yearEvents.length))}
                </span>
                <button
                  onClick={() => { setEditingEvent(undefined); setCustomFormYear(year); }}
                  className="ml-auto text-text-muted hover:text-accent-gold transition-colors px-1 py-0.5 rounded hover:bg-bg-tertiary/60"
                  title={t("events.addCustom")}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="8" y1="3" x2="8" y2="13" />
                    <line x1="3" y1="8" x2="13" y2="8" />
                  </svg>
                </button>
              </div>

              {/* Events in this year */}
              <div className="space-y-1">
                {yearEvents.map((evt) => {
                  const checked = !unchecked.has(evt.id);
                  return (
                    <label
                      key={evt.id}
                      className={`flex items-start gap-2.5 px-2.5 py-2 rounded cursor-pointer transition-colors ${checked
                        ? "bg-bg-tertiary/50 hover:bg-bg-tertiary/80"
                        : "opacity-50 hover:opacity-70"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEvent(evt.id)}
                        className="mt-0.5 shrink-0 accent-accent-gold"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs px-1.5 py-0.5 rounded text-text-primary shrink-0"
                            style={{ background: CATEGORY_COLORS[evt.category] ?? "#6b5f4e" }}
                          >
                            {t(`events.category.${evt.category}`)}
                          </span>
                          {evt.isCustom && (
                            <span className="shrink-0 text-xs px-1 py-0.5 rounded bg-accent-gold/20 text-accent-gold font-medium">
                              {t("events.customTag")}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-text-primary truncate">
                            {localized(evt.title)}
                          </span>
                          <span className="text-xs text-text-muted shrink-0">
                            M{evt.timestamp.month}
                          </span>
                        </div>
                        <div className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                          {localized(evt.description)}
                        </div>
                      </div>
                      {evt.isCustom && evt.status === "pending" && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditEvent(evt); }}
                            className="p-1 rounded text-text-muted hover:text-accent-gold hover:bg-bg-tertiary/60 transition-colors"
                            title={t("events.editCustom")}
                          >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11.5 2.5l2 2L5 13H3v-2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteEvent(evt.id); }}
                            className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            title={t("events.deleteCustom")}
                          >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 5h10M5.5 5V3.5a1 1 0 011-1h3a1 1 0 011 1V5M6.5 7.5v4M9.5 7.5v4M4.5 5l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-active transition-colors"
          >
            {t("advance.cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="px-4 py-1.5 text-xs rounded font-semibold transition-all border border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-bg-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("advance.confirm")}
          </button>
        </div>
      </div>

      {customFormYear !== null && (
        <InlineCustomEventModal
          locale={locale}
          t={t}
          localized={localized}
          regions={currentState?.regions ?? []}
          frontier={frontier}
          defaultYear={customFormYear}
          editEvent={editingEvent}
          onSubmit={editingEvent ? handleCustomEventUpdated : handleCustomEventAdded}
          onCancel={() => { setCustomFormYear(null); setEditingEvent(undefined); }}
        />
      )}
    </div>
  );
}

function InlineCustomEventModal({
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
  defaultYear: number;
  editEvent?: HistoricalEvent;
  onSubmit: (evt: HistoricalEvent) => void;
  onCancel: () => void;
}) {
  const isEdit = !!editEvent;
  const minYear = frontier.year;
  const initYear = editEvent ? editEvent.timestamp.year : defaultYear;
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
      <div className="absolute inset-0 bg-black/60" />
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
