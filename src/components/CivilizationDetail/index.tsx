"use client";

import React, { useState, useMemo } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import HeaderSection from "./HeaderSection";
import PoliticalTab from "./PoliticalTab";
import MilitaryTab from "./MilitaryTab";
import EconomyTab from "./EconomyTab";
import FinancesTab from "./FinancesTab";
import DemographicsTab from "./DemographicsTab";
import CultureTab from "./CultureTab";
import DiplomacyTab from "./DiplomacyTab";
import TechnologyTab from "./TechnologyTab";
import AISectorTab from "./AISectorTab";
import AssessmentTab from "./AssessmentTab";
import HistoryTab from "./HistoryTab";
import FactionsTab from "./FactionsTab";
import WarsTab from "./WarsTab";

const TAB_ICONS: Record<string, React.ReactNode> = {
  history: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <path d="M8 1v6l3 3" /><circle cx="8" cy="8" r="6.5" />
    </svg>
  ),
  political: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <path d="M8 1L2 5v6l6 4 6-4V5L8 1z" />
    </svg>
  ),
  factions: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <circle cx="5" cy="5" r="2.5" /><circle cx="11" cy="5" r="2.5" /><circle cx="8" cy="11" r="2.5" />
    </svg>
  ),
  military: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <path d="M8 1v10M5 8l3 3 3-3M3 14h10" />
    </svg>
  ),
  wars: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <path d="M4 12L12 4M4 4l8 8" />
    </svg>
  ),
  economy: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <path d="M2 14l3-5 3 3 4-7 2 3" />
    </svg>
  ),
  finances: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <circle cx="8" cy="8" r="6.5" /><path d="M8 4v8M6 5.5h3a1.5 1.5 0 010 3H6.5h3a1.5 1.5 0 010 3H6" />
    </svg>
  ),
  demographics: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <circle cx="8" cy="4" r="2.5" /><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />
    </svg>
  ),
  culture: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <path d="M3 2h10v2a5 5 0 01-10 0V2zM8 9v4M5 13h6" />
    </svg>
  ),
  diplomacy: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <path d="M2 8a3 3 0 013-3h1l2-3 2 3h1a3 3 0 013 3v0a3 3 0 01-3 3H5a3 3 0 01-3-3z" /><path d="M5 11v3M11 11v3" />
    </svg>
  ),
  technology: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <circle cx="8" cy="8" r="2" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M13 3l-1.5 1.5M4.5 11.5L3 13" />
    </svg>
  ),
  aiSector: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <rect x="3" y="3" width="10" height="10" rx="2" /><circle cx="6.5" cy="7" r="1" /><circle cx="9.5" cy="7" r="1" /><path d="M6 10h4" />
    </svg>
  ),
  assessment: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1zM6 5h4M6 8h4M6 11h2" />
    </svg>
  ),
};

const BASE_TABS = [
  { key: "history", labelKey: "info.history" },
  { key: "political", labelKey: "info.political" },
  { key: "factions", labelKey: "info.factions" },
  { key: "military", labelKey: "info.military" },
  { key: "wars", labelKey: "info.wars" },
  { key: "economy", labelKey: "info.economy" },
  { key: "finances", labelKey: "info.finances" },
  { key: "demographics", labelKey: "info.demographics" },
  { key: "culture", labelKey: "info.culture" },
  { key: "diplomacy", labelKey: "info.diplomacy" },
  { key: "technology", labelKey: "info.technology" },
  { key: "aiSector", labelKey: "info.aiSector" },
  { key: "assessment", labelKey: "info.assessment" },
] as const;

type TabKey = (typeof BASE_TABS)[number]["key"];

export default function CivilizationDetail() {
  const selectedRegion = useWorldStore((s) => s.selectedRegion);
  const setSelectedRegionId = useWorldStore((s) => s.setSelectedRegionId);
  const activeWars = useWorldStore((s) => s.activeWars);
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<TabKey>("political");

  const hasFactions = !!(selectedRegion?.factions && selectedRegion.factions.length > 0);
  const hasAiSector = !!selectedRegion?.aiSector;
  const hasWars = selectedRegion
    ? activeWars.some(
      (w) =>
        w.belligerents.side1.regionIds.includes(selectedRegion.id) ||
        w.belligerents.side2.regionIds.includes(selectedRegion.id)
    )
    : false;

  const tabs = useMemo(
    () => BASE_TABS.filter((tab) => {
      if (tab.key === "factions") return hasFactions;
      if (tab.key === "aiSector") return hasAiSector;
      if (tab.key === "wars") return hasWars;
      return true;
    }),
    [hasFactions, hasAiSector, hasWars]
  );

  if (!selectedRegion) return null;

  const effectiveTab =
    (activeTab === "factions" && !hasFactions) ||
      (activeTab === "aiSector" && !hasAiSector) ||
      (activeTab === "wars" && !hasWars)
      ? "political"
      : activeTab;

  const renderTab = () => {
    switch (effectiveTab) {
      case "history":
        return <HistoryTab region={selectedRegion} />;
      case "political":
        return <PoliticalTab region={selectedRegion} />;
      case "factions":
        return <FactionsTab region={selectedRegion} />;
      case "military":
        return <MilitaryTab region={selectedRegion} />;
      case "wars":
        return <WarsTab region={selectedRegion} />;
      case "economy":
        return <EconomyTab region={selectedRegion} />;
      case "finances":
        return <FinancesTab region={selectedRegion} />;
      case "demographics":
        return <DemographicsTab region={selectedRegion} />;
      case "culture":
        return <CultureTab region={selectedRegion} />;
      case "diplomacy":
        return <DiplomacyTab region={selectedRegion} />;
      case "technology":
        return <TechnologyTab region={selectedRegion} />;
      case "aiSector":
        return <AISectorTab region={selectedRegion} />;
      case "assessment":
        return <AssessmentTab region={selectedRegion} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="absolute top-0 bottom-0 right-[280px] w-[420px] z-40 flex flex-col overflow-hidden slide-in-right bg-bg-glass backdrop-blur-[16px] border-l-2 border-l-accent-gold border-r border-r-border-subtle"
      style={{ WebkitBackdropFilter: "blur(16px)" }}
    >
      {/* Close button */}
      <button
        onClick={() => setSelectedRegionId(null)}
        className="absolute top-3 right-3 z-50 w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-bg-tertiary text-text-secondary border border-border-subtle"
        title={t("tooltip.close")}
      >
        ✕
      </button>

      {/* Header */}
      <div className="p-4 shrink-0 border-b border-border-subtle">
        <HeaderSection region={selectedRegion} />
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 px-3 py-2 shrink-0 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-2 py-1 rounded text-xs transition-all border flex items-center gap-1 ${effectiveTab === tab.key
              ? "bg-accent-gold text-bg-primary border-accent-gold"
              : "bg-transparent text-text-secondary border-border-subtle"
              }`}
          >
            {TAB_ICONS[tab.key]}
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">{renderTab()}</div>
    </div>
  );
}
