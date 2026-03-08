"use client";

import { useRef, useEffect, useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";

function getRegionName(
  regionId: string,
  locale: "zh" | "en"
): string {
  const state = useWorldStore.getState().currentState;
  if (!state) return regionId;
  const region = state.regions.find((r) => r.id === regionId);
  return region ? region.name[locale] : regionId;
}

export default function LlmStreamPanel() {
  const isLoading = useWorldStore((s) => s.isLoading);
  const llmStreams = useWorldStore((s) => s.llmStreams);
  const { locale } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const regionIds = Object.keys(llmStreams);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [llmStreams, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  };

  if (!isLoading) return null;

  const activeRegions = regionIds.filter((id) => llmStreams[id].length > 0);

  return (
    <div className="absolute bottom-14 left-3 z-40 flex flex-col" style={{ maxWidth: "520px", maxHeight: collapsed ? "auto" : "380px" }}>
      {/* Header */}
      <div
        className="glass-panel flex items-center justify-between px-3 py-1.5 cursor-pointer border border-border-subtle rounded-t-lg select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <span className="text-accent-gold text-xs">⚡</span>
          <span className="text-xs font-semibold text-text-primary">
            {locale === "zh" ? "AI 思考过程" : "AI Thinking Process"}
          </span>
          {activeRegions.length > 0 && (
            <span className="text-xs text-text-muted">
              ({activeRegions.length} {locale === "zh" ? "个文明" : activeRegions.length === 1 ? "civilization" : "civilizations"})
            </span>
          )}
        </div>
        <span className="text-text-muted text-xs">{collapsed ? "▲" : "▼"}</span>
      </div>

      {/* Body */}
      {!collapsed && (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="glass-panel border border-t-0 border-border-subtle rounded-b-lg overflow-y-auto"
          style={{ maxHeight: "340px" }}
        >
          {activeRegions.length === 0 ? (
            <div className="px-3 py-4 text-xs text-text-muted animate-pulse text-center">
              {locale === "zh" ? "等待 AI 响应..." : "Waiting for AI response..."}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {activeRegions.map((regionId) => (
                <RegionStream
                  key={regionId}
                  regionId={regionId}
                  content={llmStreams[regionId]}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RegionStream({
  regionId,
  content,
  locale,
}: {
  regionId: string;
  content: string;
  locale: "zh" | "en";
}) {
  const [expanded, setExpanded] = useState(true);
  const name = getRegionName(regionId, locale);
  const displayContent = truncateForDisplay(content);

  return (
    <div className="px-3 py-2">
      <div
        className="flex items-center gap-1.5 cursor-pointer mb-1"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xs text-text-muted">{expanded ? "▾" : "▸"}</span>
        <span className="text-xs font-semibold text-accent-amber">{name}</span>
        <span className="flex-1" />
        <span className="text-xs text-text-muted font-mono">
          {content.length.toLocaleString()} chars
        </span>
      </div>
      {expanded && (
        <pre className="text-xs leading-relaxed text-text-secondary font-mono whitespace-pre-wrap break-all max-h-[180px] overflow-y-auto">
          {displayContent}
          <span className="animate-pulse text-accent-gold">▌</span>
        </pre>
      )}
    </div>
  );
}

function truncateForDisplay(content: string): string {
  const MAX_DISPLAY = 3000;
  if (content.length <= MAX_DISPLAY) return content;
  return "..." + content.slice(-MAX_DISPLAY);
}
