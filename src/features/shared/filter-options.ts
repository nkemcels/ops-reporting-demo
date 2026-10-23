import { TEAMS } from "@/lib/data/reference-data";
import type { TeamId } from "@/lib/domain/types";
import { monthLabel } from "@/lib/utils/months";

export type TeamFilter = TeamId | "all";

export const TEAM_OPTIONS = [{ value: "all", label: "All teams" }, ...TEAMS.map((t) => ({ value: t.id, label: t.name }))];

/** Newest month first, as people usually want the latest close. */
export function monthOptions(months: string[], prefix = "") {
  return [...months].reverse().map((m) => ({ value: m, label: `${prefix}${monthLabel(m, true)}` }));
}
