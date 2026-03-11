type Locale = "zh" | "en";

export function fmtNum(n: number, locale: Locale = "en"): string {
  const abs = Math.abs(n);
  if (locale === "zh") {
    if (abs >= 1_000_000_000_000) return trimTrailingZero((n / 1_000_000_000_000).toFixed(1)) + "兆";
    if (abs >= 100_000_000) return trimTrailingZero((n / 100_000_000).toFixed(1)) + "亿";
    if (abs >= 10_000) return trimTrailingZero((n / 10_000).toFixed(1)) + "万";
    return n.toLocaleString();
  }
  if (abs >= 1_000_000_000_000) return trimTrailingZero((n / 1_000_000_000_000).toFixed(1)) + "T";
  if (abs >= 1_000_000_000) return trimTrailingZero((n / 1_000_000_000).toFixed(1)) + "B";
  if (abs >= 1_000_000) return trimTrailingZero((n / 1_000_000).toFixed(1)) + "M";
  if (abs >= 1_000) return trimTrailingZero((n / 1_000).toFixed(1)) + "K";
  return n.toLocaleString();
}

const SUFFIX_RE = /[KMBT万亿兆]$/;

export function fmtKg(n: number, locale: Locale = "en"): string {
  const v = fmtNum(n, locale);
  return SUFFIX_RE.test(v) ? `${v} kg` : `${v}kg`;
}

function trimTrailingZero(s: string): string {
  return s.replace(/\.0$/, "");
}
