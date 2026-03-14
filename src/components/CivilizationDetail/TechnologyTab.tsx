"use client";

import { useState } from "react";
import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import StatBar from "./StatBar";

const SECTOR_ICONS: Record<string, string> = {
  semiconductors: "🔬",
  cloudAndInternet: "☁️",
  biotechAndPharma: "🧬",
  spaceAndAerospace: "🚀",
  newEnergy: "⚡",
  quantumComputing: "⚛️",
  quantumTechnology: "⚛️",
  autonomousDriving: "🚗",
  embodiedIntelligence: "🤖",
  newEnergyVehicles: "🔋",
  solarAndCleanEnergy: "☀️",
  telecomAnd5G: "📡",
  militaryEngineering: "⚔️",
  militaryTechnology: "⚔️",
  militaryTech: "⚔️",
  militaryModernization: "⚔️",
  militaryReform: "⚔️",
  navalTechnology: "⚓",
  navalAndAerospace: "⚓",
  navalAndMaritime: "⚓",
  navalAndShipbuilding: "⚓",
  navigationAndShipbuilding: "⛵",
  navigationAndExploration: "🧭",
  chemicalsAndIndustrial: "🧪",
  chemicalsAndPharma: "🧪",
  chemicalsAndPharmaceuticals: "🧪",
  chemicalsAndMaterials: "🧪",
  opticsAndPrecision: "🔭",
  opticsAndInstruments: "🔭",
  radarAndIntelligence: "📡",
  nuclearResearch: "☢️",
  nuclearTechnology: "☢️",
  nuclearAndAerospace: "☢️",
  nuclearEnergy: "☢️",
  industrialCapacity: "🏭",
  heavyIndustry: "🏭",
  industrialAndEngineering: "🏭",
  industrialization: "🏭",
  aviationAndEngineering: "✈️",
  aviationAndDefense: "✈️",
  aviationAndAuto: "✈️",
  spaceAndMissile: "🚀",
  electronicsAndComputers: "💻",
  electronics: "📱",
  automotive: "🚗",
  automotiveAndIndustrial: "🚗",
  automotiveAndDesign: "🚗",
  shipbuilding: "🚢",
  steamAndMachinery: "⚙️",
  railwayAndTransport: "🚂",
  highSpeedRail: "🚄",
  textileIndustry: "🧵",
  financialInfrastructure: "🏦",
  educationAndScience: "🎓",
  scientificResearch: "🔬",
  scientificRevolution: "🔬",
  massProduction: "🏭",
  inventionAndInnovation: "💡",
  protoIndustrialization: "⚙️",
  traditionalCrafts: "🏺",
  porcelainAndSilk: "🏺",
  agriculturalTechnology: "🌾",
  agricultureAndIrrigation: "🌾",
  waterEngineering: "💧",
  hydraulicEngineering: "💧",
  architectureAndEngineering: "🏛️",
  glassAndCrafts: "🔮",
  printingAndPaper: "📜",
  gunpowderAndWeaponry: "💥",
  railwayAndInfrastructure: "🚂",
  miningAndMetallurgy: "⛏️",
  scienceAndMedicine: "🔬",
  opticsAndScience: "🔭",
  nuclearAndEnergy: "☢️",
  metallurgyAndAgriculture: "⚒️",
  defenseIndustry: "🛡️",
  buddhistArtAndArchitecture: "🏛️",
  militaryInnovation: "⚔️",
  irrigationAndAgriculture: "🌾",
  petroleumEngineering: "🛢️",
  manufacturingAndInvention: "💡",
  automotiveAndAviation: "✈️",
  railwayExpansion: "🚂",
  scienceAndEngineering: "🔬",
  architectureAndTrade: "🏛️",
  navalAndTrade: "⚓",
  financialInnovation: "🏦",
  engineeringAndInfrastructure: "🏗️",
  militaryOrganization: "⚔️",
  scienceAndLearning: "📚",
  defenseAndAgriculture: "🛡️",
  industrialAndResources: "🏭",
  automotiveAndEV: "🚗",
  digitalEconomy: "💻",
  tourismTech: "🏖️",
  foodAndAgriculture: "🌾",
  greenEnergy: "🍃",
  ecommerce: "🛒",
  logistics: "📦",
  healthcare: "🏥",
  edtech: "📚",
  smartCities: "🏙️",
  blockchainAndCrypto: "⛓️",
  droneAndRobotics: "🤖",
  oilAndGas: "🛢️",
  textileAndGarment: "🧵",
  realEstate: "🏗️",
  mediaAndEntertainment: "🎬",
  cloudComputing: "☁️",
  artificialIntelligence: "🧠",
  biotech: "🧬",
  spaceExploration: "🚀",
  advancedMaterials: "🔬",
  quantumTech: "⚛️",
};

export default function TechnologyTab({ region }: { region: Region }) {
  const { t, localized } = useLocale();
  const tech = region.technology;

  if (!tech) return null;

  const sectors = tech.sectors;
  const sectorKeys = sectors ? Object.keys(sectors) : [];
  const [expandedSector, setExpandedSector] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <StatBar label={t("info.technology")} value={typeof tech.level === "number" ? tech.level : 0} color="#4682B4" />

      <div>
        <h4 className="font-semibold mb-1.5 text-accent-copper text-sm">
          {t("tech.era")}
        </h4>
        <p className="text-text-primary">{localized(tech.era)}</p>
      </div>

      <div>
        <h4 className="font-semibold mb-1.5 text-accent-copper text-sm">
          {t("tech.innovations")}
        </h4>
        <p className="readable-prose">{localized(tech.keyInnovations)}</p>
      </div>

      {tech.infrastructure && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper text-sm">
            {t("tech.infrastructure")}
          </h4>
          <p className="readable-prose">{localized(tech.infrastructure)}</p>
        </div>
      )}

      {sectorKeys.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-accent-copper">
            {t("tech.sectors")}
          </h4>
          <div className="space-y-1.5">
            {sectorKeys.map((key) => {
              const isOpen = expandedSector === key;
              const translated = t(`tech.sector.${key}`);
              const label =
                translated !== `tech.sector.${key}`
                  ? translated
                  : key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
              const icon = SECTOR_ICONS[key] || "📌";
              return (
                <div
                  key={key}
                  className="bg-bg-tertiary rounded border border-border-subtle overflow-hidden"
                >
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-bg-secondary transition-colors"
                    onClick={() =>
                      setExpandedSector(isOpen ? null : key)
                    }
                  >
                    <span className="text-sm leading-none">{icon}</span>
                    <span className="font-medium text-text-primary flex-1">
                      {label}
                    </span>
                    <span
                      className={`text-text-tertiary text-[12px] transition-transform ${isOpen ? "rotate-90" : ""
                        }`}
                    >
                      ▶
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-2.5 pb-2.5 pt-1 border-t border-border-subtle">
                      <p className="readable-prose">
                        {localized(sectors![key])}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tech.overallAssessment && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper text-sm">
            {t("tech.overallAssessment")}
          </h4>
          <p className="readable-prose">
            {localized(tech.overallAssessment)}
          </p>
        </div>
      )}
    </div>
  );
}
