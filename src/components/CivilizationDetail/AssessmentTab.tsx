"use client";

import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

export default function AssessmentTab({ region }: { region: Region }) {
  const { t, localized } = useLocale();
  const assess = region.assessment;

  if (!assess) return null;

  return (
    <div className="space-y-4">
      <Card color="#2e6b4f" title={t("assessment.strengths")}>
        {localized(assess.strengths)}
      </Card>

      <Card color="#8b3a3a" title={t("assessment.weaknesses")}>
        {localized(assess.weaknesses)}
      </Card>

      <Card color="#8a7340" title={t("assessment.outlook")}>
        {localized(assess.outlook)}
      </Card>

      <div>
        <h4 className="font-semibold mb-1.5 text-accent-copper text-sm">
          {t("assessment.overview")}
        </h4>
        <p className="readable-prose">
          {localized(region.description)}
        </p>
      </div>
    </div>
  );
}

function Card({
  color,
  title,
  children,
}: {
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded p-3"
      style={{
        background: `${color}20`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <h4 className="font-semibold mb-1.5 text-sm" style={{ color }}>
        {title}
      </h4>
      <p className="readable-prose">{children}</p>
    </div>
  );
}
