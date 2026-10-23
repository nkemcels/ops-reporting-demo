/** Display formatters. All money is USD; ratios are stored as 0–1 fractions. */

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const compactUsdMillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});
const wholeUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** $1.2M / $724.6K when compact (default), $724,612 otherwise. */
export function money(n: number, compact = true): string {
  if (!compact || Math.abs(n) < 1000) return wholeUsd.format(n);
  return (Math.abs(n) >= 1_000_000 ? compactUsdMillions : compactUsd).format(n);
}

export function num(n: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(n);
}

export function pct(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** Relative change, e.g. +14.1%. */
export function signedPct(ratio: number, digits = 1): string {
  return `${ratio > 0 ? "+" : ""}${(ratio * 100).toFixed(digits)}%`;
}

/** Difference between two percentages, e.g. +3.4 pts. */
export function signedPts(ratioDiff: number, digits = 1): string {
  return `${ratioDiff > 0 ? "+" : ""}${(ratioDiff * 100).toFixed(digits)} pts`;
}

/** Relative change that is safe when the base period is empty. */
export function change(current: number, previous: number): number {
  return previous ? current / previous - 1 : 0;
}
