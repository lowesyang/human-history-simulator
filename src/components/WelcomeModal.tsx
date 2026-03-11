"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "@/lib/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";

const GITHUB_URL = "https://github.com/lowesyang/human-history-simulator";

const TAGS = [
  { icon: "🧠", key: "welcome.tag.multiAgent" },
  { icon: "🗺️", key: "welcome.tag.realBoundaries" },
  { icon: "📜", key: "welcome.tag.deepProfiles" },
  { icon: "⚔️", key: "welcome.tag.warSystem" },
  { icon: "🔀", key: "welcome.tag.whatIf" },
  { icon: "🏛️", key: "welcome.tag.eras" },
  { icon: "🌍", key: "welcome.tag.interactiveMap" },
];

interface WelcomeModalProps {
  onClose: () => void;
  requireApiKey?: boolean;
}

export default function WelcomeModal({ onClose, requireApiKey = false }: WelcomeModalProps) {
  const { t, locale } = useLocale();
  const [phase, setPhase] = useState<"entering" | "visible" | "exiting">("entering");
  const [activeTagIdx, setActiveTagIdx] = useState(0);

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKeyPlaintext, setShowKeyPlaintext] = useState(false);
  const [validationState, setValidationState] = useState<"idle" | "validating" | "success" | "error">("idle");
  const [validationError, setValidationError] = useState("");
  const [keyValidated, setKeyValidated] = useState(false);

  const syncToServer = useSettingsStore((s) => s.syncToServer);
  const setStoreApiKey = useSettingsStore((s) => s.setApiKey);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase("visible"));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTagIdx((prev) => (prev + 1) % TAGS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClose = useCallback(() => {
    if (requireApiKey && !keyValidated) return;
    setPhase("exiting");
    setTimeout(onClose, 600);
  }, [onClose, requireApiKey, keyValidated]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  const handleValidateKey = async () => {
    const key = apiKeyInput.trim();
    if (!key) return;

    setValidationState("validating");
    setValidationError("");

    try {
      const resp = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
      });
      const data = await resp.json();

      if (data.valid) {
        setValidationState("success");
        setKeyValidated(true);

        setStoreApiKey(key);
        await syncToServer();
      } else {
        setValidationState("error");
        setValidationError(data.error || "Unknown error");
      }
    } catch (err) {
      setValidationState("error");
      setValidationError(err instanceof Error ? err.message : "Network error");
    }
  };

  const isVisible = phase === "visible";
  const canClose = !requireApiKey || keyValidated;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center welcome-backdrop ${phase}`}
      onClick={canClose ? handleClose : undefined}
    >
      <div className="welcome-particles" aria-hidden="true">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="welcome-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
            }}
          />
        ))}
      </div>

      <div
        className={`welcome-card ${phase}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="welcome-card-glow" />

        <div className="welcome-content">
          {/* Logo + Title */}
          <div className={`welcome-header ${isVisible ? "welcome-anim-in" : ""}`}>
            <div className="welcome-logo-ring">
              <img src="/logo.png" alt="Logo" className="welcome-logo-img" />
            </div>
            <h1 className="welcome-title">{t("app.title")}</h1>
            <div className="welcome-title-line" />
          </div>

          {/* Slogan */}
          <p
            className={`welcome-slogan ${isVisible ? "welcome-anim-in" : ""}`}
            style={{ animationDelay: "0.15s" }}
          >
            {t("welcome.slogan.line1")}
            <br />
            {t("welcome.slogan.line2")}
          </p>

          {/* Feature tags */}
          <div
            className={`welcome-eras ${isVisible ? "welcome-anim-in" : ""}`}
            style={{ animationDelay: "0.3s" }}
          >
            {TAGS.map((tag, i) => (
              <div
                key={tag.key}
                className={`welcome-era-chip ${i === activeTagIdx ? "welcome-era-active" : ""}`}
              >
                <span className="welcome-era-icon">{tag.icon}</span>
                <span className="welcome-era-year">{t(tag.key)}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <p
            className={`welcome-desc ${isVisible ? "welcome-anim-in" : ""}`}
            style={{ animationDelay: "0.4s" }}
          >
            {t("welcome.description")}
          </p>

          {/* Feature highlights */}
          <div
            className={`welcome-features ${isVisible ? "welcome-anim-in" : ""}`}
            style={{ animationDelay: "0.5s" }}
          >
            <div className="welcome-feature">
              <span className="welcome-feature-number">20</span>
              <span className="welcome-feature-label">{t("welcome.feature.eras")}</span>
            </div>
            <div className="welcome-feature-divider" />
            <div className="welcome-feature">
              <span className="welcome-feature-number">1400+</span>
              <span className="welcome-feature-label">{t("welcome.feature.civilizations")}</span>
            </div>
            <div className="welcome-feature-divider" />
            <div className="welcome-feature">
              <span className="welcome-feature-number">3600+</span>
              <span className="welcome-feature-label">{t("welcome.feature.years")}</span>
            </div>
          </div>

          {/* API Key Section */}
          {requireApiKey && !keyValidated && (
            <div
              className={`welcome-apikey-section ${isVisible ? "welcome-anim-in" : ""}`}
              style={{ animationDelay: "0.55s" }}
            >
              <div className="welcome-apikey-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
                <span>{t("welcome.apiKey.title")}</span>
              </div>
              <p className="welcome-apikey-desc">{t("welcome.apiKey.desc")}</p>

              <div className="welcome-apikey-input-row">
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    type={showKeyPlaintext ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      if (validationState === "error") setValidationState("idle");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && apiKeyInput.trim()) handleValidateKey();
                    }}
                    placeholder={t("welcome.apiKey.placeholder")}
                    className="welcome-apikey-input"
                    autoFocus
                    disabled={validationState === "validating"}
                  />
                  <button
                    type="button"
                    className="welcome-apikey-eye"
                    onClick={() => setShowKeyPlaintext((v) => !v)}
                    tabIndex={-1}
                    aria-label={showKeyPlaintext ? "Hide" : "Show"}
                  >
                    {showKeyPlaintext ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  onClick={handleValidateKey}
                  disabled={!apiKeyInput.trim() || validationState === "validating"}
                  className="welcome-apikey-btn"
                >
                  {validationState === "validating" ? (
                    <>
                      <span className="welcome-apikey-spinner" />
                      {t("welcome.apiKey.validating")}
                    </>
                  ) : (
                    t("welcome.apiKey.validate")
                  )}
                </button>
              </div>

              {validationState === "error" && (
                <p className="welcome-apikey-error">
                  {t("welcome.apiKey.error").replace("{error}", validationError)}
                </p>
              )}

              <p className="welcome-apikey-hint">
                {t("welcome.apiKey.getKey")}{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  openrouter.ai/keys
                </a>
              </p>
              <p className="welcome-apikey-safe">{t("welcome.apiKey.hint")}</p>
            </div>
          )}

          {/* Success message after validation */}
          {requireApiKey && keyValidated && (
            <div
              className="welcome-apikey-success welcome-anim-in"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{t("welcome.apiKey.success")}</span>
            </div>
          )}

          {/* CTA + Github */}
          <div
            className={`welcome-actions ${isVisible ? "welcome-anim-in" : ""}`}
            style={{ animationDelay: requireApiKey ? "0.7s" : "0.6s" }}
          >
            <button
              onClick={canClose ? handleClose : undefined}
              className={`welcome-cta ${!canClose ? "welcome-cta-disabled" : ""}`}
              disabled={!canClose}
            >
              <span>{t("welcome.cta")}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="welcome-github"
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>

          {/* Footer hint */}
          <p
            className={`welcome-hint ${isVisible ? "welcome-anim-in" : ""}`}
            style={{ animationDelay: requireApiKey ? "0.8s" : "0.7s" }}
          >
            {canClose
              ? (locale === "zh" ? "按 ESC 或点击任意处关闭" : "Press ESC or click anywhere to close")
              : (locale === "zh" ? "请先验证 API Key 后继续" : "Please validate your API key to continue")
            }
          </p>
        </div>
      </div>
    </div>
  );
}
