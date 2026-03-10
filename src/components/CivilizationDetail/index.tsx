"use client";

import { useState, useMemo } from "react";
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
            className={`px-2 py-1 rounded text-xs transition-all border ${effectiveTab === tab.key
              ? "bg-accent-gold text-bg-primary border-accent-gold"
              : "bg-transparent text-text-secondary border-border-subtle"
              }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">{renderTab()}</div>
    </div>
  );
}
