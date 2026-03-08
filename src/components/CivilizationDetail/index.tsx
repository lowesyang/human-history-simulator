"use client";

import { useState } from "react";
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
import AssessmentTab from "./AssessmentTab";
import HistoryTab from "./HistoryTab";

const TABS = [
  { key: "history", labelKey: "info.history" },
  { key: "political", labelKey: "info.political" },
  { key: "military", labelKey: "info.military" },
  { key: "economy", labelKey: "info.economy" },
  { key: "finances", labelKey: "info.finances" },
  { key: "demographics", labelKey: "info.demographics" },
  { key: "culture", labelKey: "info.culture" },
  { key: "diplomacy", labelKey: "info.diplomacy" },
  { key: "technology", labelKey: "info.technology" },
  { key: "assessment", labelKey: "info.assessment" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function CivilizationDetail() {
  const selectedRegion = useWorldStore((s) => s.selectedRegion);
  const setSelectedRegionId = useWorldStore((s) => s.setSelectedRegionId);
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<TabKey>("political");

  if (!selectedRegion) return null;

  const renderTab = () => {
    switch (activeTab) {
      case "history":
        return <HistoryTab region={selectedRegion} />;
      case "political":
        return <PoliticalTab region={selectedRegion} />;
      case "military":
        return <MilitaryTab region={selectedRegion} />;
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
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-2 py-1 rounded text-xs transition-all border ${activeTab === tab.key
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
