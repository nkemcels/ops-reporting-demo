/**
 * Shared chart styling. Series colors come from a fixed, color-blind-validated
 * categorical order (CSS variables in globals.css): series 1 is always revenue /
 * the primary measure, series 2 always cost, so a color keeps its meaning
 * across every chart in the app.
 */

export const SERIES = {
  primary: "var(--series-1)",
  secondary: "var(--series-2)",
} as const;

/** Recessive axes: hairline, muted labels, no tick marks. */
export const AXIS_PROPS = {
  stroke: "var(--axis)",
  tick: { fill: "var(--ink-3)", fontSize: 11.5 },
  tickLine: false,
} as const;

export const GRID_STROKE = "var(--grid)";

/** Bars are capped at 22px and rounded only at the data end. */
export const BAR_MAX_SIZE = 22;
export const BAR_RADIUS_TOP: [number, number, number, number] = [4, 4, 0, 0];
export const BAR_RADIUS_RIGHT: [number, number, number, number] = [0, 4, 4, 0];

export const ACTIVE_DOT = { r: 5, stroke: "var(--surface)", strokeWidth: 2 };
