import type { Expense, Project, TimeEntry } from "@/lib/domain/types";
import { seededRandom } from "@/lib/utils/random";
import { monthRange } from "@/lib/utils/months";
import {
  EXPENSE_CATEGORIES,
  LAST_SEED_MONTH,
  OPEN_MONTH,
  PEOPLE,
  PROJECT_PLANS,
  SEED_MONTHS,
  type ProjectPlan,
} from "./reference-data";

/**
 * Generates twelve months of history (timesheets, expenses, progress reports)
 * standing in for what would already be in PostgreSQL. The generator shapes the
 * data so the dashboards have something realistic to say: ramp-ups, a couple of
 * over-burning fixed-fee projects, and people who can't exceed their capacity.
 */

const peopleById = new Map(PEOPLE.map((p) => [p.id, p]));

/** Max share of a person's capacity that client projects may consume in a month. */
const MAX_PROJECT_LOAD = 0.84;

function generateHistory(): { entries: TimeEntry[]; expenses: Expense[] } {
  const rand = seededRandom(20261023);
  const entries: TimeEntry[] = [];
  const expenses: Expense[] = [];

  // 1. Project work: hours per member per month, sized so spend tracks the budget.
  for (const plan of PROJECT_PLANS) {
    const activeMonths = SEED_MONTHS.filter((m) => m >= plan.startMonth && m <= plan.endMonth);
    const plannedMonths = monthRange(plan.startMonth, plan.endMonth).length;
    const plannedMonthlyCost = (plan.budget * 0.88) / plannedMonths;
    const avgCostRate =
      plan.members.reduce((s, id) => s + peopleById.get(id)!.costRate, 0) / plan.members.length;
    const plannedHoursPerMember = plannedMonthlyCost / avgCostRate / plan.members.length;

    activeMonths.forEach((month, i) => {
      // Teams ramp up over the first two months and taper in the final month.
      const ramp = i === 0 ? 0.55 : i === 1 ? 0.8 : month === plan.endMonth ? 0.6 : 1;
      for (const personId of plan.members) {
        const jitter = 0.82 + rand() * 0.36;
        const hours = Math.round(Math.min(plannedHoursPerMember * plan.burn * ramp * jitter, 150));
        if (hours > 0) entries.push(projectEntry(plan, personId, month, hours));
      }
      if (rand() > 0.35) {
        expenses.push({
          month,
          projectId: plan.id,
          category: EXPENSE_CATEGORIES[Math.floor(rand() * EXPENSE_CATEGORIES.length)],
          amount: Math.round((plannedMonthlyCost * (0.04 + rand() * 0.1)) / 10) * 10,
          source: "seed",
        });
      }
    });
  }

  // 2. Nobody can bill more than their month: scale over-allocated people back down.
  for (const person of PEOPLE) {
    for (const month of SEED_MONTHS) {
      const rows = entries.filter((e) => e.personId === person.id && e.month === month);
      const total = rows.reduce((s, e) => s + e.hours, 0);
      const ceiling = person.capacity * (MAX_PROJECT_LOAD + rand() * 0.1);
      if (total <= ceiling) continue;
      for (const row of rows) {
        const plan = PROJECT_PLANS.find((p) => p.id === row.projectId)!;
        Object.assign(row, projectEntry(plan, person.id, month, Math.round((row.hours * ceiling) / total)));
      }
    }
  }

  // 3. Remaining time is partly booked to internal work (training, pre-sales, admin).
  for (const person of PEOPLE) {
    for (const month of SEED_MONTHS) {
      const logged = entries
        .filter((e) => e.personId === person.id && e.month === month)
        .reduce((s, e) => s + e.hours, 0);
      const internal = Math.max(0, Math.round((person.capacity - logged) * (0.25 + rand() * 0.3)));
      if (internal > 0) {
        entries.push({
          month,
          projectId: "internal",
          personId: person.id,
          hours: internal,
          billableHours: 0,
          cost: internal * person.costRate,
          revenue: 0,
          source: "seed",
        });
      }
    }
  }

  return { entries, expenses };
}

/** Build a time entry with cost and revenue derived from the person's rates. */
function projectEntry(plan: ProjectPlan, personId: string, month: string, hours: number): TimeEntry {
  const person = peopleById.get(personId)!;
  const billableHours = plan.billableShare === 0 ? 0 : Math.round(hours * plan.billableShare);
  return {
    month,
    projectId: plan.id,
    personId,
    hours,
    billableHours,
    cost: hours * person.costRate,
    revenue: billableHours * person.billRate,
    source: "seed",
  };
}

export const SEED = generateHistory();

/**
 * Projects with their month-end progress history. Leads report % complete at
 * each close; here it is back-filled from spend × target CPI so earned-value
 * metrics tell a consistent story. The open month is projected from recent burn
 * so the sample import lands on realistic numbers.
 */
export const PROJECTS: Project[] = PROJECT_PLANS.map((plan) => {
  const { members: _m, burn: _b, billableShare: _s, targetCpi, completed, ...project } = plan;

  const monthCost = (m: string) =>
    SEED.entries.filter((e) => e.projectId === plan.id && e.month === m).reduce((s, e) => s + e.cost, 0) +
    SEED.expenses.filter((e) => e.projectId === plan.id && e.month === m).reduce((s, e) => s + e.amount, 0);

  const progress: Record<string, number> = {};
  let cumulative = 0;
  let lastMonthCost = 0;
  for (const m of [...SEED_MONTHS, OPEN_MONTH]) {
    const isOpenMonth = m === OPEN_MONTH;
    const active = m >= plan.startMonth && m <= plan.endMonth;
    const cost = isOpenMonth ? (active ? lastMonthCost : 0) : monthCost(m);
    if (!isOpenMonth && cost) lastMonthCost = cost;
    cumulative += cost;
    if (m < plan.startMonth) continue;
    progress[m] =
      completed && m >= plan.endMonth
        ? 100
        : Math.min(97, Math.round((cumulative / plan.budget) * targetCpi * 100));
  }

  return { ...project, progress, percentComplete: progress[LAST_SEED_MONTH] ?? 0 };
});
