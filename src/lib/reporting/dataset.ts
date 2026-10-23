import type { Expense, TeamId, TimeEntry } from "@/lib/domain/types";

/**
 * Everything the reports are computed from: the raw fact rows.
 * Reports never read pre-aggregated totals, so a correction or a rolled-back
 * import flows through every screen immediately.
 */
export interface Dataset {
  entries: TimeEntry[];
  expenses: Expense[];
}

/** What a report is filtered to. */
export interface Scope {
  months: string[];
  team?: TeamId | "all";
}

export const isAllTeams = (team?: TeamId | "all") => !team || team === "all";

/** Months that have any data, sorted ascending. */
export function availableMonths(ds: Dataset): string[] {
  const set = new Set<string>();
  ds.entries.forEach((e) => set.add(e.month));
  ds.expenses.forEach((e) => set.add(e.month));
  return [...set].sort();
}
