"use client";

import { useState } from "react";
import type { Region } from "@/lib/types";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import ExplainButton from "@/components/ExplainButton";
import type { ChangeEntry, ChangeSentiment } from "@/lib/changelog";

const SENTIMENT_COLORS: Record<ChangeSentiment, string> = {
  positive: "#4ead6b",
  negative: "#c95a4a",
  neutral: "",
};

const CATEGORY_ICONS: Record<string, string> = {
  status: "⚑",
  political: "👑",
  demographics: "👥",
  economy: "💰",
  military: "⚔",
  technology: "🔬",
  diplomacy: "🤝",
  culture: "🎭",
  assessment: "📊",
};

const EVENT_CATEGORY_COLORS: Record<string, string> = {
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

export default function HistoryTab({ region }: { region: Region }) {
  const evolutionLogs = useWorldStore((s) => s.evolutionLogs);
  const { locale, t, localized } = useLocale();

  const regionLogs = evolutionLogs
    .map((log) => {
      const regionEntry = log.regions.find((r) => r.regionId === region.id);
      if (!regionEntry || regionEntry.changes.length === 0) return null;
      return {
        targetYear: log.targetYear,
        era: log.era,
        summary: log.summary,
        events: log.events,
        isDirect: regionEntry.isDirect,
        description: regionEntry.description,
        changes: regionEntry.changes,
        timestamp: log.timestamp,
        regionName: region.name[locale],
      };
    })
    .filter(Boolean)
    .reverse();

  if (regionLogs.length === 0) {
    return (
      <div className="text-center text-xs py-8 text-text-muted">
        {t("history.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      <div className="text-text-muted text-xs">
        {regionLogs.length} {t("history.records")}
      </div>
      {regionLogs.map((log, idx) => (
        <EpochBlock key={idx} log={log!} locale={locale} t={t} localized={localized} regionId={region.id} />
      ))}
    </div>
  );
}

function EpochBlock({
  log,
  locale,
  t,
  localized,
  regionId,
}: {
  log: {
    targetYear: number;
    era: { zh: string; en: string };
    summary: { zh: string; en: string };
    events: { title: { zh: string; en: string }; category: string }[];
    isDirect: boolean;
    description?: { zh: string; en: string };
    changes: ChangeEntry[];
    timestamp: string;
    regionName: string;
  };
  locale: "zh" | "en";
  t: (key: string) => string;
  localized: (text: { zh: string; en: string } | undefined) => string;
  regionId: string;
}) {
  const [expanded, setExpanded] = useState(true);

  const yearStr = log.targetYear < 0
    ? locale === "zh"
      ? `公元前${Math.abs(log.targetYear)}年`
      : `${Math.abs(log.targetYear)} BCE`
    : locale === "zh"
      ? `公元${log.targetYear}年`
      : `${log.targetYear} CE`;

  const epochContext = {
    year: log.targetYear,
    era: localized(log.era),
    eventTitles: log.events.map((e) => localized(e.title)),
  };

  return (
    <div className="rounded border border-border-subtle overflow-hidden">
      {/* Epoch header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-tertiary/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
        style={{ borderLeft: `3px solid ${log.isDirect ? "#c9a84c" : "#8a7d6a"}` }}
      >
        <span className="text-xs text-text-muted">{expanded ? "▾" : "▸"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-accent-gold">{yearStr}</span>
            <span
              className="text-xs px-1 py-0.5 rounded whitespace-nowrap"
              style={{
                background: log.isDirect ? "rgba(201, 168, 76, 0.2)" : "rgba(107, 95, 78, 0.2)",
                color: log.isDirect ? "#c9a84c" : "#8a7d6a",
              }}
            >
              {log.isDirect ? t("log.directlyAffected") : t("log.indirectlyAffected")}
            </span>
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {localized(log.era)}
          </div>
        </div>
        <span className="text-xs text-text-muted shrink-0">
          {log.changes.length} {t("log.changes")}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-border-subtle">
          {/* Triggering events */}
          {log.events.length > 0 && (
            <div className="px-3 py-2 border-b border-border-subtle">
              <div className="text-xs font-semibold text-text-muted mb-1">
                {t("history.triggerEvents")}
              </div>
              <div className="flex flex-wrap gap-1">
                {log.events.map((evt, i) => (
                  <span
                    key={i}
                    className="text-xs px-1.5 py-0.5 rounded text-text-primary"
                    style={{ background: EVENT_CATEGORY_COLORS[evt.category] ?? "#6b5f4e" }}
                  >
                    {localized(evt.title)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Change entries */}
          <div className="divide-y divide-border-subtle">
            {log.description && (
              <div className="px-3 py-2 text-xs text-text-secondary italic bg-bg-tertiary/30">
                {localized(log.description)}
              </div>
            )}
            {log.changes.map((change, i) => (
              <div key={i} className="px-3 py-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5 shrink-0">
                    {CATEGORY_ICONS[change.category] || "•"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-text-secondary">
                        {localized(change.label)}
                      </span>
                      <ExplainButton
                        locale={locale}
                        regionName={log.regionName}
                        regionId={regionId}
                        year={epochContext.year}
                        era={epochContext.era}
                        eventTitles={epochContext.eventTitles}
                        changeLabel={localized(change.label)}
                        changeDetail={localized(change.detail)}
                        changeSentiment={change.sentiment}
                        regionDescription={localized(log.description)}
                      />
                    </div>
                    <div
                      className={`leading-relaxed break-words mt-0.5${SENTIMENT_COLORS[change.sentiment] ? "" : " text-text-primary"}`}
                      style={SENTIMENT_COLORS[change.sentiment] ? { color: SENTIMENT_COLORS[change.sentiment] } : undefined}
                    >
                      {localized(change.detail)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
