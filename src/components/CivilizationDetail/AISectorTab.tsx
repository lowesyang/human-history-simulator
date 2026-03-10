"use client";

import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import StatBar from "./StatBar";

export default function AISectorTab({ region }: { region: Region }) {
  const { t, localized } = useLocale();
  const ai = region.aiSector;

  if (!ai) {
    return (
      <div className="text-text-secondary text-xs py-4">
        {t("ai.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      <StatBar label={t("info.aiSector")} value={ai.level} color="#8B5CF6" />

      <div>
        <h4 className="font-semibold mb-1 text-accent-copper">{t("ai.policy")}</h4>
        <p className="text-text-primary">{localized(ai.policy)}</p>
      </div>

      <div>
        <h4 className="font-semibold mb-1 text-accent-copper">{t("ai.regulatory")}</h4>
        <p className="text-text-secondary">{localized(ai.regulatoryStance)}</p>
      </div>

      <div>
        <h4 className="font-semibold mb-1 text-accent-copper">{t("ai.investment")}</h4>
        <p className="text-text-secondary">{localized(ai.investmentScale)}</p>
      </div>

      {ai.keyModels && ai.keyModels.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-accent-copper">{t("ai.models")}</h4>
          <div className="space-y-2">
            {ai.keyModels.map((model, i) => (
              <div key={i} className="bg-bg-tertiary rounded p-2 border border-border-subtle">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-text-primary">{localized(model.name)}</span>
                  <span className="text-text-tertiary">{model.releaseYear}</span>
                </div>
                <div className="text-text-secondary">
                  <span className="text-accent-copper">{localized(model.developer)}</span>
                </div>
                <p className="text-text-tertiary mt-1">{localized(model.capabilities)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {ai.leadingCompanies && ai.leadingCompanies.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-accent-copper">{t("ai.companies")}</h4>
          <div className="space-y-2">
            {ai.leadingCompanies.map((company, i) => (
              <div key={i} className="bg-bg-tertiary rounded p-2 border border-border-subtle">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-text-primary">{localized(company.name)}</span>
                  {company.valuation && (
                    <span className="text-accent-gold text-xs">{localized(company.valuation)}</span>
                  )}
                </div>
                <p className="text-text-secondary">{localized(company.keyProducts)}</p>
                {company.headquarters && (
                  <span className="text-text-tertiary">{localized(company.headquarters)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {ai.keyFigures && ai.keyFigures.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-accent-copper">{t("ai.keyFigures")}</h4>
          <div className="space-y-2">
            {ai.keyFigures.map((figure, i) => (
              <div key={i} className="bg-bg-tertiary rounded p-2 border border-border-subtle">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-text-primary">{localized(figure.name)}</span>
                  <span className="text-accent-copper text-xs">{localized(figure.title)}</span>
                </div>
                <div className="text-text-secondary">{localized(figure.affiliation)}</div>
                <p className="text-text-tertiary mt-1">{localized(figure.contribution)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold mb-1 text-accent-copper">{t("ai.researchFocus")}</h4>
        <p className="text-text-secondary">{localized(ai.researchFocus)}</p>
      </div>

      <div>
        <h4 className="font-semibold mb-1 text-accent-copper">{t("ai.compute")}</h4>
        <p className="text-text-secondary">{localized(ai.computeInfrastructure)}</p>
      </div>

      <div>
        <h4 className="font-semibold mb-1 text-accent-copper">{t("ai.talent")}</h4>
        <p className="text-text-secondary">{localized(ai.talentPool)}</p>
      </div>

      {ai.globalRanking && (
        <div>
          <h4 className="font-semibold mb-1 text-accent-copper">{t("ai.ranking")}</h4>
          <p className="text-text-secondary">{localized(ai.globalRanking)}</p>
        </div>
      )}

      <div>
        <h4 className="font-semibold mb-1 text-accent-copper">{t("ai.outlook")}</h4>
        <p className="text-text-primary">{localized(ai.outlook)}</p>
      </div>
    </div>
  );
}
