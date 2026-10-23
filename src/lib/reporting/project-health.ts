import { PROJECTS } from "@/lib/data/seed";
import type { HealthStatus, Project } from "@/lib/domain/types";
import type { Dataset } from "./dataset";
import { CPI_AT_RISK, CPI_OFF_TRACK } from "./targets";

/**
 * Project health using earned value, the standard way to compare money spent
 * against work done. It catches a fixed-fee project that is 60% spent but
 * only 45% complete long before the budget actually runs out.
 *
 *   earned value (EV) = % complete × budget
 *   CPI               = EV ÷ actual cost        (1.0 = on plan, < 1 = overspending)
 *   EAC               = budget ÷ CPI            (forecast final cost at current efficiency)
 *   VAC               = budget − EAC            (negative = forecast overrun)
 */
export interface ProjectHealth {
  project: Project;
  costToDate: number;
  revenueToDate: number;
  hoursToDate: number;
  /** Cost and revenue inside the selected period only. */
  periodCost: number;
  periodRevenue: number;
  /** Actual cost ÷ budget. */
  burn: number;
  percentComplete: number;
  earnedValue: number;
  cpi: number;
  eac: number;
  vac: number;
  marginPct: number;
  status: HealthStatus;
  /** Plain-language reasons behind the status, shown next to the badge. */
  reasons: string[];
}

/** Latest % complete reported at or before the given month close. */
export function progressAt(project: Project, month: string): number {
  const reported = Object.keys(project.progress).filter((m) => m <= month).sort();
  return reported.length ? project.progress[reported[reported.length - 1]] : 0;
}

export function projectHealth(ds: Dataset, project: Project, asOf: string, period: string[] = []): ProjectHealth {
  const inPeriod = new Set(period);
  let costToDate = 0;
  let revenueToDate = 0;
  let hoursToDate = 0;
  let periodCost = 0;
  let periodRevenue = 0;

  for (const e of ds.entries) {
    if (e.projectId !== project.id || e.month > asOf) continue;
    costToDate += e.cost;
    revenueToDate += e.revenue;
    hoursToDate += e.hours;
    if (inPeriod.has(e.month)) {
      periodCost += e.cost;
      periodRevenue += e.revenue;
    }
  }
  for (const x of ds.expenses) {
    if (x.projectId !== project.id || x.month > asOf) continue;
    costToDate += x.amount;
    if (inPeriod.has(x.month)) periodCost += x.amount;
  }

  const percentComplete = progressAt(project, asOf) / 100;
  const earnedValue = percentComplete * project.budget;
  const cpi = costToDate ? earnedValue / costToDate : 1;
  const eac = cpi ? project.budget / cpi : project.budget;
  const { status, reasons } = classify(project, asOf, percentComplete, cpi, costToDate);

  return {
    project,
    costToDate,
    revenueToDate,
    hoursToDate,
    periodCost,
    periodRevenue,
    burn: project.budget ? costToDate / project.budget : 0,
    percentComplete,
    earnedValue,
    cpi,
    eac,
    vac: project.budget - eac,
    marginPct: revenueToDate ? (revenueToDate - costToDate) / revenueToDate : 0,
    status,
    reasons,
  };
}

function classify(
  project: Project,
  asOf: string,
  percentComplete: number,
  cpi: number,
  costToDate: number,
): { status: HealthStatus; reasons: string[] } {
  if (percentComplete >= 1) return { status: "complete", reasons: [] };

  const reasons: string[] = [];
  const overBudget = costToDate > project.budget;
  const pastEnd = project.endMonth < asOf;

  if (cpi < CPI_OFF_TRACK) reasons.push(`Cost efficiency ${cpi.toFixed(2)} (below ${CPI_OFF_TRACK})`);
  else if (cpi < CPI_AT_RISK) reasons.push(`Cost efficiency ${cpi.toFixed(2)} (below ${CPI_AT_RISK})`);
  if (overBudget) reasons.push("Budget already exceeded");
  if (pastEnd) reasons.push("Past planned end date");

  const status: HealthStatus =
    cpi < CPI_OFF_TRACK || overBudget || pastEnd ? "off-track" : cpi < CPI_AT_RISK ? "at-risk" : "on-track";
  return { status, reasons };
}

/** Health for every project that had started by `asOf`. */
export function portfolioHealth(ds: Dataset, asOf: string, period?: string[]): ProjectHealth[] {
  return PROJECTS.filter((p) => p.startMonth <= asOf).map((p) => projectHealth(ds, p, asOf, period));
}

/** Month-by-month cost, revenue and hours for one project. */
export function projectMonthlySeries(ds: Dataset, projectId: string, months: string[]) {
  return months.map((month) => {
    let cost = 0;
    let revenue = 0;
    let hours = 0;
    for (const e of ds.entries) {
      if (e.projectId === projectId && e.month === month) {
        cost += e.cost;
        revenue += e.revenue;
        hours += e.hours;
      }
    }
    for (const x of ds.expenses) {
      if (x.projectId === projectId && x.month === month) cost += x.amount;
    }
    return { month, cost, revenue, hours };
  });
}
