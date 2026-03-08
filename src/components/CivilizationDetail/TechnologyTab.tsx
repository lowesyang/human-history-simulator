"use client";

import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import StatBar from "./StatBar";

export default function TechnologyTab({ region }: { region: Region }) {
  const { t, localized } = useLocale();
  const tech = region.technology;

  return (
    <div className="space-y-4 text-xs">
      <StatBar label={t("info.technology")} value={tech.level} color="#4682B4" />

      <div>
        <h4 className="font-semibold mb-1 text-accent-copper">
          {t("tech.era")}
        </h4>
        <p className="text-text-primary">{localized(tech.era)}</p>
      </div>

      <div>
        <h4 className="font-semibold mb-1 text-accent-copper">
          {t("tech.innovations")}
        </h4>
        <p className="text-text-secondary">{localized(tech.keyInnovations)}</p>
      </div>

      {tech.infrastructure && (
        <div>
          <h4 className="font-semibold mb-1 text-accent-copper">
            {t("tech.infrastructure")}
          </h4>
          <p className="text-text-secondary">{localized(tech.infrastructure)}</p>
        </div>
      )}
    </div>
  );
}
