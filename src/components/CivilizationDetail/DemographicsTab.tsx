"use client";

import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import DataTable from "./DataTable";

export default function DemographicsTab({ region }: { region: Region }) {
  const { t, localized } = useLocale();
  const demo = region.demographics;

  return (
    <div className="space-y-4 text-xs">
      {/* Population highlight */}
      <div className="text-center rounded p-3 bg-bg-tertiary">
        <div className="font-mono text-2xl font-bold text-accent-gold">
          {demo.population.toLocaleString()}
        </div>
        <div className="text-xs text-text-muted">
          {t("info.population")}
        </div>
      </div>

      <p className="text-text-secondary">{localized(demo.populationDescription)}</p>

      {/* Urbanization */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded p-2 bg-bg-tertiary">
          <div className="font-mono font-semibold text-text-primary">
            {demo.urbanPopulation.toLocaleString()}
          </div>
          <div className="text-xs text-text-muted">
            {t("demographics.urban")}
          </div>
        </div>
        <div className="rounded p-2 bg-bg-tertiary">
          <div className="font-mono font-semibold text-text-primary">
            {demo.urbanizationRate}%
          </div>
          <div className="text-xs text-text-muted">
            {t("demographics.urbanRate")}
          </div>
        </div>
      </div>

      {/* Cities */}
      {demo.majorCities && demo.majorCities.length > 0 && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper">
            {t("demographics.cities")}
          </h4>
          <DataTable
            columns={[
              { key: "name", label: t("table.city") },
              { key: "pop", label: t("table.population") },
            ]}
            rows={demo.majorCities.map((c) => ({
              name: localized(c.name),
              pop: c.population.toLocaleString(),
            }))}
          />
        </div>
      )}

      {/* Social classes */}
      <div>
        <h4 className="font-semibold mb-1.5 text-accent-copper">
          {t("demographics.classes")}
        </h4>
        <p className="text-text-secondary">{localized(demo.socialClasses)}</p>
      </div>

      {demo.ethnicGroups && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper">
            {t("demographics.ethnicGroups")}
          </h4>
          <p className="text-text-secondary">{localized(demo.ethnicGroups)}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {demo.literacyRate && (
          <div>
            <div className="text-xs text-text-muted">
              {t("demographics.literacy")}
            </div>
            <div className="text-text-primary">{localized(demo.literacyRate)}</div>
          </div>
        )}
        {demo.lifeExpectancy && (
          <div>
            <div className="text-xs text-text-muted">
              {t("demographics.lifeExpect")}
            </div>
            <div className="text-text-primary">{localized(demo.lifeExpectancy)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
