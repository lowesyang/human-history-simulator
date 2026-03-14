"use client";

import { useState, useEffect, useCallback } from "react";
import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import DataTable from "./DataTable";
import PopulationTrendChart, {
  type PopulationDataPoint,
} from "../charts/PopulationTrendChart";

function safeNum(v: unknown): number {
  return typeof v === "number" && !Number.isNaN(v) ? v : 0;
}

const TAG_COLORS: Record<string, string> = {
  economic: "bg-amber-700/40 text-amber-300",
  political: "bg-blue-700/40 text-blue-300",
  cultural: "bg-purple-700/40 text-purple-300",
  tourism: "bg-emerald-700/40 text-emerald-300",
  tech: "bg-cyan-700/40 text-cyan-300",
  port: "bg-teal-700/40 text-teal-300",
  religious: "bg-yellow-700/40 text-yellow-300",
};

const SUBDIVISION_COLLAPSED_LIMIT = 12;

export default function DemographicsTab({ region }: { region: Region }) {
  const { t, localized } = useLocale();
  const demo = region.demographics;
  const [showAllSubdivisions, setShowAllSubdivisions] = useState(false);
  const [popTrend, setPopTrend] = useState<PopulationDataPoint[]>([]);

  const fetchTrend = useCallback(() => {
    fetch(
      `/api/economic-history?populationTrend=true&regionId=${encodeURIComponent(region.id)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.populationTrend) setPopTrend(data.populationTrend);
      })
      .catch(() => { });
  }, [region.id]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  if (!demo) return null;

  const notableCities = demo.majorCities?.filter(
    (c) => c.tags && c.tags.length > 0
  );
  const plainCities = demo.majorCities?.filter(
    (c) => !c.tags || c.tags.length === 0
  );

  const sortedSubdivisions = demo.subdivisions
    ? [...demo.subdivisions].sort((a, b) => b.population - a.population)
    : [];
  const visibleSubdivisions = showAllSubdivisions
    ? sortedSubdivisions
    : sortedSubdivisions.slice(0, SUBDIVISION_COLLAPSED_LIMIT);
  const hasMoreSubdivisions =
    sortedSubdivisions.length > SUBDIVISION_COLLAPSED_LIMIT;

  return (
    <div className="space-y-4">
      {/* Population highlight */}
      <div className="text-center rounded p-3 bg-bg-tertiary">
        <div className="font-mono text-2xl font-bold text-accent-gold">
          {safeNum(demo.population).toLocaleString()}
        </div>
        <div className="text-xs text-text-muted">{t("info.population")}</div>
      </div>

      {/* Population trend chart */}
      {popTrend.length >= 2 && (
        <PopulationTrendChart
          data={popTrend}
          height={140}
          title={t("demographics.populationTrend")}
        />
      )}

      {demo.populationDescription && (
        <p className="readable-prose">
          {localized(demo.populationDescription)}
        </p>
      )}

      {/* Urbanization */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded p-2 bg-bg-tertiary">
          <div className="font-mono font-semibold text-text-primary">
            {safeNum(demo.urbanPopulation).toLocaleString()}
          </div>
          <div className="text-xs text-text-muted">
            {t("demographics.urban")}
          </div>
        </div>
        <div className="rounded p-2 bg-bg-tertiary">
          <div className="font-mono font-semibold text-text-primary">
            {safeNum(demo.urbanizationRate)}%
          </div>
          <div className="text-xs text-text-muted">
            {t("demographics.urbanRate")}
          </div>
        </div>
      </div>

      {/* Notable Cities */}
      {notableCities && notableCities.length > 0 && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper">
            {t("demographics.notableCities")}
          </h4>
          <div className="space-y-2">
            {notableCities.map((c, i) => (
              <div
                key={i}
                className="rounded p-2 bg-bg-tertiary border border-border-subtle"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-text-primary">
                    {localized(c.name)}
                  </span>
                  <span className="font-mono text-text-muted">
                    {safeNum(c.population).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.tags!.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-block px-1.5 py-0.5 rounded text-[12px] leading-tight ${TAG_COLORS[tag] ?? "bg-neutral-700/40 text-neutral-300"}`}
                    >
                      {t(`tag.${tag}`)}
                    </span>
                  ))}
                </div>
                {c.description && (
                  <p className="text-text-muted mt-1 text-[12px]">
                    {localized(c.description)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Cities */}
      {plainCities && plainCities.length > 0 && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper">
            {t("demographics.cities")}
          </h4>
          <DataTable
            columns={[
              { key: "name", label: t("table.city") },
              { key: "pop", label: t("table.population") },
            ]}
            rows={plainCities.map((c) => ({
              name: localized(c.name),
              pop: safeNum(c.population).toLocaleString(),
            }))}
          />
        </div>
      )}

      {/* Subdivisions */}
      {sortedSubdivisions.length > 0 && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper">
            {t("demographics.subdivisions")}
          </h4>
          <DataTable
            columns={[
              { key: "name", label: t("table.subdivision") },
              { key: "pop", label: t("table.population") },
              { key: "cap", label: t("table.capital") },
            ]}
            rows={visibleSubdivisions.map((s) => ({
              name: localized(s.name),
              pop: safeNum(s.population).toLocaleString(),
              cap: s.capital ? localized(s.capital) : "—",
            }))}
          />
          {hasMoreSubdivisions && (
            <button
              onClick={() => setShowAllSubdivisions((prev) => !prev)}
              className="mt-1.5 text-xs text-accent-copper hover:text-accent-gold transition-colors cursor-pointer"
            >
              {showAllSubdivisions
                ? t("demographics.collapse")
                : `${t("demographics.showAll")} (${sortedSubdivisions.length})`}
            </button>
          )}
        </div>
      )}

      {/* Social classes */}
      <div>
        <h4 className="font-semibold mb-1.5 text-accent-copper">
          {t("demographics.classes")}
        </h4>
        <p className="readable-prose">{localized(demo.socialClasses)}</p>
      </div>

      {demo.ethnicGroups && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper">
            {t("demographics.ethnicGroups")}
          </h4>
          <p className="readable-prose">
            {localized(demo.ethnicGroups)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {demo.literacyRate && (
          <div>
            <div className="text-xs text-text-muted">
              {t("demographics.literacy")}
            </div>
            <div className="text-text-primary">
              {localized(demo.literacyRate)}
            </div>
          </div>
        )}
        {demo.lifeExpectancy && (
          <div>
            <div className="text-xs text-text-muted">
              {t("demographics.lifeExpect")}
            </div>
            <div className="text-text-primary">
              {localized(demo.lifeExpectancy)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
