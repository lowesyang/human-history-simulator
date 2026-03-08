"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/lib/i18n";
import { ERA_PRESETS, type EraPreset } from "@/data/era-presets";

interface Props {
  onConfirm: (eraId: string) => void;
  onCancel: () => void;
}

function formatYear(year: number, locale: "zh" | "en"): string {
  if (locale === "zh") {
    return year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年`;
  }
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

export default function EraSelectModal({ onConfirm, onCancel }: Props) {
  const { locale, t, localized } = useLocale();
  const [selectedEra, setSelectedEra] = useState<EraPreset | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [prebuiltSet, setPrebuiltSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/eras")
      .then((r) => r.json())
      .then((data) => {
        if (data.eras) {
          const ids = new Set<string>(
            data.eras
              .filter((e: { hasPrebuilt?: boolean }) => e.hasPrebuilt)
              .map((e: { id: string }) => e.id)
          );
          setPrebuiltSet(ids);
        }
      })
      .catch(() => { });
  }, []);

  const handleEraClick = (era: EraPreset) => {
    setSelectedEra(era);
    setConfirming(true);
  };

  const handleBack = () => {
    setConfirming(false);
    setSelectedEra(null);
  };

  const handleConfirm = () => {
    if (selectedEra) {
      onConfirm(selectedEra.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="glass-panel relative rounded-lg max-w-3xl w-full mx-4 border border-border-subtle flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {!confirming ? (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-border-subtle shrink-0">
              <h2 className="text-base font-cinzel font-semibold text-accent-gold">
                {t("era.selectTitle")}
              </h2>
              <p className="text-xs text-text-muted mt-1">
                {t("era.selectDesc")}
              </p>
            </div>

            {/* Era grid */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ERA_PRESETS.map((era) => (
                  <button
                    key={era.id}
                    onClick={() => handleEraClick(era)}
                    className="group text-left px-4 py-3 rounded-lg border border-border-subtle transition-all hover:border-border-active hover:bg-bg-tertiary/50 cursor-pointer"
                    style={{
                      borderLeftWidth: "3px",
                      borderLeftColor: era.color,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{era.icon}</span>
                      <span className="text-sm font-semibold text-text-primary group-hover:text-accent-gold transition-colors">
                        {localized(era.name)}
                      </span>
                      {prebuiltSet.has(era.id) && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 font-mono">
                          {locale === "zh" ? "即时" : "instant"}
                        </span>
                      )}
                      <span className="text-xs text-text-muted ml-auto font-mono">
                        {formatYear(era.year, locale)}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                      {localized(era.description)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-end shrink-0">
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-xs rounded border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-active transition-colors"
              >
                {t("advance.cancel")}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation view */}
            <div className="px-5 py-4 border-b border-border-subtle shrink-0">
              <h2 className="text-base font-cinzel font-semibold text-accent-gold">
                {t("era.confirmTitle")}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              {selectedEra && (
                <div className="flex flex-col items-center text-center">
                  <div className="text-5xl mb-4">{selectedEra.icon}</div>
                  <h3
                    className="text-xl font-cinzel font-bold mb-2"
                    style={{ color: selectedEra.color }}
                  >
                    {localized(selectedEra.name)}
                  </h3>
                  <div className="text-sm font-mono text-accent-amber mb-4">
                    {formatYear(selectedEra.year, locale)}
                  </div>
                  <p className="text-sm text-text-secondary max-w-md leading-relaxed mb-6">
                    {localized(selectedEra.description)}
                  </p>

                  {prebuiltSet.has(selectedEra.id) ? (
                    <div className="w-full max-w-md rounded-lg border border-emerald-700/40 bg-emerald-900/20 px-4 py-3 mb-3">
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <span>⚡</span>
                        <span>
                          {locale === "zh"
                            ? "该时代已有预构建数据，将即时加载"
                            : "Prebuilt data available — loads instantly"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-md rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-3 mb-3">
                      <div className="flex items-center gap-2 text-xs text-amber-400">
                        <span>🤖</span>
                        <span>
                          {locale === "zh"
                            ? "该时代需要 AI 实时生成，可能需要 1-2 分钟"
                            : "This era requires AI generation — may take 1-2 minutes"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="w-full max-w-md rounded-lg border border-border-subtle bg-bg-tertiary/30 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-status-war">
                      <span>⚠️</span>
                      <span>{t("era.confirmWarning")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-between shrink-0">
              <button
                onClick={handleBack}
                className="px-3 py-1.5 text-xs rounded border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-active transition-colors flex items-center gap-1"
              >
                <span>←</span> {t("era.back")}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="px-3 py-1.5 text-xs rounded border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-active transition-colors"
                >
                  {t("advance.cancel")}
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-1.5 text-xs rounded font-semibold transition-all border border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-bg-primary"
                >
                  {t("era.confirmBtn")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
