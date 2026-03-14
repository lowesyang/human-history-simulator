"use client";

import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import DataTable from "./DataTable";

export default function PoliticalTab({ region }: { region: Region }) {
  const { t, localized, tWithFallback } = useLocale();

  if (!region.government) {
    return null;
  }

  const deptRows = (region.government.departments || []).map((d) => ({
    name: localized(d.name),
    function: localized(d.function),
    count: d.headCount != null ? d.headCount.toLocaleString() : "—",
  }));

  return (
    <div className="space-y-4">
      <Section title={t("govt.structure")}>
        <p>{localized(region.government.structure)}</p>
      </Section>

      {region.civilization && (
        <Section title={t("info.government")}>
          <InfoRow label={t("info.government")} value={tWithFallback("govtForm", region.civilization.governmentForm)} />
          <InfoRow label={t("political.socialStructure")} value={localized(region.civilization.socialStructure)} />
          <InfoRow label={t("political.rulingClass")} value={localized(region.civilization.rulingClass)} />
          <InfoRow label={t("political.succession")} value={localized(region.civilization.succession)} />
        </Section>
      )}

      <Section title={t("govt.departments")}>
        <DataTable
          columns={[
            { key: "name", label: t("table.name"), width: "30%" },
            { key: "function", label: t("table.function"), width: "50%" },
            { key: "count", label: t("table.count"), width: "20%" },
          ]}
          rows={deptRows}
        />
        {region.government?.totalOfficials != null && (
          <div className="mt-1 text-text-muted">
            {t("govt.officials")}: {region.government.totalOfficials.toLocaleString()}
          </div>
        )}
      </Section>

      {region.government?.localAdmin && (
        <Section title={t("govt.localAdmin")}>
          <p>{localized(region.government.localAdmin)}</p>
        </Section>
      )}

      {region.government?.legalSystem && (
        <Section title={t("govt.legal")}>
          <p>{localized(region.government.legalSystem)}</p>
        </Section>
      )}

      {region.government?.taxationSystem && (
        <Section title={t("govt.taxation")}>
          <p>{localized(region.government.taxationSystem)}</p>
        </Section>
      )}

      {region.government.keyOfficials && region.government.keyOfficials.length > 0 && (
        <Section title={t("govt.keyOfficials")}>
          <DataTable
            columns={[
              { key: "title", label: t("table.title") },
              { key: "name", label: t("table.name") },
              { key: "role", label: t("table.role") },
            ]}
            rows={region.government.keyOfficials.map((o) => ({
              title: localized(o.title),
              name: localized(o.name),
              role: localized(o.role),
            }))}
          />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold mb-1.5 text-accent-copper text-sm">
        {title}
      </h4>
      <div className="readable-prose">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 py-0.5">
      <span className="shrink-0 w-[110px] text-text-muted">
        {label}
      </span>
      <span className="break-words min-w-0 text-text-primary">{value}</span>
    </div>
  );
}
