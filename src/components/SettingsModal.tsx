"use client";

import { useState, useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useLocale } from "@/lib/i18n";
import { SUPPORTED_MODELS, DEFAULT_MODEL } from "@/lib/settings";
import type { SupportedModelId } from "@/lib/settings";

export default function SettingsModal() {
  const { t } = useLocale();
  const showSettings = useSettingsStore((s) => s.showSettings);
  const setShowSettings = useSettingsStore((s) => s.setShowSettings);
  const storeApiKey = useSettingsStore((s) => s.apiKey);
  const storeModel = useSettingsStore((s) => s.model);
  const hasEnvKey = useSettingsStore((s) => s.hasEnvKey);
  const envModel = useSettingsStore((s) => s.envModel);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setModel = useSettingsStore((s) => s.setModel);
  const syncToServer = useSettingsStore((s) => s.syncToServer);

  const [localKey, setLocalKey] = useState("");
  const [localModel, setLocalModel] = useState<SupportedModelId>(DEFAULT_MODEL as SupportedModelId);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (showSettings) {
      setLocalKey(storeApiKey);
      setLocalModel(storeModel);
      setSaved(false);
    }
  }, [showSettings, storeApiKey, storeModel]);

  if (!showSettings) return null;

  const handleSave = async () => {
    setSaving(true);
    setApiKey(localKey);
    setModel(localModel);

    await new Promise((resolve) => setTimeout(resolve, 0));
    useSettingsStore.getState().syncToServer().then(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleReset = async () => {
    setLocalKey("");
    setLocalModel(DEFAULT_MODEL as SupportedModelId);
    setApiKey("");
    setModel(DEFAULT_MODEL as SupportedModelId);
    await syncToServer();
  };

  const keyPlaceholder = hasEnvKey
    ? t("settings.keyFromEnv")
    : t("settings.keyPlaceholder");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowSettings(false)}
      />

      <div className="relative glass-panel rounded-lg border border-border-active shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent-gold"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <h2 className="font-cinzel text-sm font-bold text-accent-gold tracking-wide">
              {t("settings.title")}
            </h2>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {/* API Key */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-secondary tracking-wide uppercase">
              {t("settings.apiKey")}
            </label>
            {hasEnvKey && !localKey && (
              <div className="flex items-center gap-1.5 text-xs text-accent-amber">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {t("settings.envKeyActive")}
              </div>
            )}
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder={keyPlaceholder}
                className="w-full px-3 py-2 pr-10 rounded border border-border-subtle bg-bg-tertiary text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-border-active transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
              >
                {showKey ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              {t("settings.apiKeyHint")}
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-secondary tracking-wide uppercase">
              {t("settings.model")}
            </label>
            {envModel && envModel !== DEFAULT_MODEL && !localModel && (
              <div className="flex items-center gap-1.5 text-xs text-accent-amber">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {t("settings.envModelActive")}: {envModel}
              </div>
            )}
            <div className="space-y-1.5">
              {SUPPORTED_MODELS.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded border cursor-pointer transition-all ${localModel === m.id
                      ? "border-accent-gold bg-accent-gold/10"
                      : "border-border-subtle hover:border-border-active bg-bg-tertiary/50"
                    }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={m.id}
                    checked={localModel === m.id}
                    onChange={() => setLocalModel(m.id as SupportedModelId)}
                    className="sr-only"
                  />
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${localModel === m.id
                        ? "border-accent-gold"
                        : "border-text-muted"
                      }`}
                  >
                    {localModel === m.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-text-primary">
                      {m.label}
                    </div>
                    <div className="text-xs text-text-muted">{m.provider}</div>
                  </div>
                  {m.id === DEFAULT_MODEL && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-accent-gold/15 text-accent-gold font-medium shrink-0">
                      {t("settings.default")}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            {t("settings.reset")}
          </button>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs text-green-500 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t("settings.saved")}
              </span>
            )}
            <button
              onClick={() => setShowSettings(false)}
              className="px-3 py-1.5 rounded text-xs text-text-secondary border border-border-subtle hover:border-border-active transition-colors cursor-pointer"
            >
              {t("settings.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded text-xs font-semibold bg-accent-gold/20 text-accent-gold border border-accent-gold/40 hover:bg-accent-gold/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? t("settings.saving") : t("settings.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
