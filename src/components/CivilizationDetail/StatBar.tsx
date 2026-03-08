"use client";

export default function StatBar({
  label,
  value,
  max = 10,
  color = "var(--color-accent-gold)",
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs min-w-[60px] text-text-secondary">
        {label}
      </span>
      <div className="flex gap-[2px] flex-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm ${i >= value ? "bg-bg-tertiary opacity-30" : ""}`}
            style={i < value ? { background: color } : undefined}
          />
        ))}
      </div>
      <span className="text-xs font-mono min-w-[24px] text-right text-text-primary">
        {value}
      </span>
    </div>
  );
}
