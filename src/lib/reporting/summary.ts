import { PEOPLE, TEAMS } from "@/lib/data/reference-data";
import { personById, projectById } from "@/lib/data/lookups";
import type { TeamId } from "@/lib/domain/types";
import { type Dataset, type Scope, isAllTeams } from "./dataset";

/**
 * Portfolio financials and utilization for a scope.
 *
 * Definitions (shown to users in tooltips and the report footnotes):
 *   revenue        = Σ billable hours × person bill rate        (client projects)
 *   delivery cost  = Σ hours × person loaded cost rate + project expenses
 *   gross margin   = revenue − delivery cost
 *   utilization    = billable hours ÷ capacity hours
 *
 * Team filtering is deliberately asymmetric: financials follow the team that
 * OWNS the project, utilization follows the team the PERSON belongs to. A
 * designer lent to an engineering project counts toward Design's utilization
 * but that project's cost stays with Platform Engineering.
 */
export interface Summary {
  revenue: number;
  laborCost: number;
  expenseCost: number;
  deliveryCost: number;
  grossMargin: number;
  marginPct: number;
  hours: number;
  billableHours: number;
  capacity: number;
  utilization: number;
}

const projectInTeam = (projectId: string, team?: TeamId | "all") =>
  isAllTeams(team) || projectById.get(projectId)?.team === team;

const personInTeam = (personId: string, team?: TeamId | "all") =>
  isAllTeams(team) || personById.get(personId)?.team === team;

export function summarize(ds: Dataset, scope: Scope): Summary {
  const months = new Set(scope.months);
  let revenue = 0;
  let laborCost = 0;
  let expenseCost = 0;
  let hours = 0;
  let billableHours = 0;

  for (const e of ds.entries) {
    if (!months.has(e.month)) continue;
    if (personInTeam(e.personId, scope.team)) {
      hours += e.hours;
      billableHours += e.billableHours;
    }
    // Internal time is overhead, not delivery cost.
    if (e.projectId !== "internal" && projectInTeam(e.projectId, scope.team)) {
      revenue += e.revenue;
      laborCost += e.cost;
    }
  }
  for (const x of ds.expenses) {
    if (months.has(x.month) && projectInTeam(x.projectId, scope.team)) expenseCost += x.amount;
  }

  const headcountCapacity = PEOPLE.filter((p) => isAllTeams(scope.team) || p.team === scope.team).reduce(
    (s, p) => s + p.capacity,
    0,
  );
  const capacity = headcountCapacity * scope.months.length;
  const deliveryCost = laborCost + expenseCost;
  const grossMargin = revenue - deliveryCost;

  return {
    revenue,
    laborCost,
    expenseCost,
    deliveryCost,
    grossMargin,
    marginPct: revenue ? grossMargin / revenue : 0,
    hours,
    billableHours,
    capacity,
    utilization: capacity ? billableHours / capacity : 0,
  };
}

/** One summary per month, for trend charts. */
export function monthlySeries(ds: Dataset, scope: Scope) {
  return scope.months.map((month) => ({ month, ...summarize(ds, { months: [month], team: scope.team }) }));
}

/** One summary per team, for the utilization comparison. */
export function teamSummaries(ds: Dataset, months: string[]) {
  return TEAMS.map((team) => ({ team: team.id, name: team.name, ...summarize(ds, { months, team: team.id }) }));
}
