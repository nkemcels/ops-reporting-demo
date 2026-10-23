import { PEOPLE } from "@/lib/data/reference-data";
import type { Person, TeamId } from "@/lib/domain/types";
import { type Dataset, isAllTeams } from "./dataset";

export interface PersonMonthCell {
  month: string;
  hours: number;
  billable: number;
  /** Billable hours ÷ the person's monthly capacity. */
  utilization: number;
}

export interface PersonUtilization {
  person: Person;
  months: PersonMonthCell[];
  total: { hours: number; billable: number; utilization: number };
}

/** Person × month utilization grid (drives the heatmap and the bench list). */
export function personUtilization(ds: Dataset, months: string[], team?: TeamId | "all"): PersonUtilization[] {
  // Pre-aggregate once so the grid is O(entries + people × months).
  const totals = new Map<string, { hours: number; billable: number }>();
  for (const e of ds.entries) {
    const key = `${e.personId}|${e.month}`;
    const t = totals.get(key) ?? { hours: 0, billable: 0 };
    t.hours += e.hours;
    t.billable += e.billableHours;
    totals.set(key, t);
  }

  return PEOPLE.filter((p) => isAllTeams(team) || p.team === team).map((person) => {
    const cells = months.map((month) => {
      const t = totals.get(`${person.id}|${month}`) ?? { hours: 0, billable: 0 };
      return { month, ...t, utilization: t.billable / person.capacity };
    });
    const hours = cells.reduce((s, c) => s + c.hours, 0);
    const billable = cells.reduce((s, c) => s + c.billable, 0);
    return {
      person,
      months: cells,
      total: { hours, billable, utilization: billable / (person.capacity * months.length) },
    };
  });
}
