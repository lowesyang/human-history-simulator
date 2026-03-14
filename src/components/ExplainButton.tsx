"use client";

import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { getLlmHeaders } from "@/lib/client-headers";

const ReactMarkdown = lazy(() => import("react-markdown"));

const explainCache = new Map<string, string>();

function cacheKey(
  regionId: string,
  year: number,
  changeLabel: string,
  changeSentiment: string,
): string {
  return `${regionId}::${year}::${changeLabel}::${changeSentiment}`;
}

interface ExplainButtonProps {
  locale: "zh" | "en";
  regionName: string;
  regionId: string;
  year: number;
  era: string;
  eventTitles: string[];
  changeLabel: string;
  changeDetail: string;
  changeSentiment: string;
  regionDescription: string;
  tooltipPosition?: "top" | "right";
}

export default function ExplainButton({
  locale,
  regionName,
  regionId,
  year,
  era,
  eventTitles,
  changeLabel,
  changeDetail,
  changeSentiment,
  regionDescription,
  tooltipPosition = "top",
}: ExplainButtonProps) {
  const key = cacheKey(regionId, year, changeLabel, changeSentiment);
  const [explanation, setExplanation] = useState(() => explainCache.get(key) ?? "");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const computePos = useCallback(() => {
    if (!btnRef.current) return null;
    const rect = btnRef.current.getBoundingClientRect();
    if (tooltipPosition === "right") {
      return { top: rect.top + rect.height / 2, left: rect.right + 8 };
    }
    return { top: rect.top, left: rect.left + rect.width / 2 };
  }, [tooltipPosition]);

  const showAt = useCallback(() => {
    const p = computePos();
    if (p) setPos(p);
    setShowTooltip(true);
  }, [computePos]);

  const toggle = useCallback(() => {
    if (showTooltip) {
      setShowTooltip(false);
    } else {
      showAt();
    }
  }, [showTooltip, showAt]);

  useEffect(() => {
    if (!showTooltip) return;

    function onClickOutside(e: MouseEvent) {
      if (
        btnRef.current?.contains(e.target as Node) ||
        tooltipRef.current?.contains(e.target as Node)
      ) return;
      setShowTooltip(false);
    }
    function onScroll() {
      const p = computePos();
      if (p) setPos(p);
    }

    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [showTooltip, computePos]);

  const handleClick = useCallback(async () => {
    if (isStreaming) {
      toggle();
      return;
    }

    const cached = explainCache.get(key);
    if (cached) {
      setExplanation(cached);
      toggle();
      return;
    }

    showAt();
    setIsStreaming(true);
    setExplanation("");

    try {
      const resp = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getLlmHeaders() },
        body: JSON.stringify({
          regionName,
          regionId,
          year,
          era,
          events: eventTitles,
          changeLabel,
          changeDetail,
          changeSentiment,
          regionDescription,
          locale,
        }),
      });

      if (!resp.ok || !resp.body) {
        setExplanation(locale === "zh" ? "请求失败" : "Request failed");
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const data = JSON.parse(payload);
            if (data.token) {
              text += data.token;
              setExplanation(text);
            }
          } catch {
            // skip
          }
        }
      }

      if (text) {
        explainCache.set(key, text);
      }
    } catch {
      setExplanation(locale === "zh" ? "请求失败" : "Request failed");
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, key, regionName, regionId, year, era, eventTitles, changeLabel, changeDetail, changeSentiment, regionDescription, locale, toggle, showAt]);

  const isRight = tooltipPosition === "right";
  const tooltipStyle: React.CSSProperties | undefined = pos
    ? {
      position: "fixed",
      left: pos.left,
      top: isRight ? pos.top : pos.top - 8,
      transform: isRight ? "translateY(-50%)" : "translate(-50%, -100%)",
      zIndex: 9999,
      width: 340,
    }
    : undefined;

  const ready = showTooltip && pos;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleClick}
        className={`explain-btn ${showTooltip ? "explain-btn-active" : ""}`}
      >
        {isStreaming
          ? locale === "zh" ? "分析中…" : "Analyzing…"
          : locale === "zh" ? "为什么?" : "Why?"
        }
      </button>
      {ready &&
        typeof document !== "undefined" &&
        createPortal(
          <div ref={tooltipRef} className={`explain-tooltip ${isRight ? "explain-tooltip-right" : ""}`} style={tooltipStyle}>
            {!isRight && <div className="explain-tooltip-arrow" />}
            {isRight && <div className="explain-tooltip-arrow-left" />}
            <div className="explain-tooltip-body explain-prose">
              {explanation ? (
                <Suspense fallback={<span className="text-text-muted">{explanation}</span>}>
                  <ReactMarkdown>{explanation}</ReactMarkdown>
                </Suspense>
              ) : (
                <span className="text-text-muted animate-pulse">
                  {locale === "zh" ? "正在分析…" : "Analyzing…"}
                </span>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
