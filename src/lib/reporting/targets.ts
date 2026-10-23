/**
 * Business thresholds in one place so management can agree on them once and
 * every dashboard, badge and report applies the same rules.
 * In production these would be editable settings stored in the database.
 */

export const UTILIZATION_TARGET = 0.75;
export const MARGIN_TARGET = 0.35;

/** CPI below this flags a project "at risk". */
export const CPI_AT_RISK = 0.95;
/** CPI below this flags a project "off track". */
export const CPI_OFF_TRACK = 0.85;

/** Utilization bands used by the heatmap and bench list. */
export const UTILIZATION_BANDS = [
  { max: 0.4, label: "< 40%" },
  { max: 0.6, label: "40–60%" },
  { max: 0.75, label: "60–75%" },
  { max: 0.9, label: "75–90%" },
  { max: Infinity, label: "90%+" },
] as const;
