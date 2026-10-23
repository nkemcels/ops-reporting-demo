import { TEAMS } from "@/lib/data/reference-data";
import type { TeamId } from "@/lib/domain/types";
import { money, pct, signedPts } from "@/lib/utils/format";
import { addMonths, monthLabel, monthRange } from "@/lib/utils/months";
import type { Dataset } from "./dataset";
import { type ProjectHealth, portfolioHealth } from "./project-health";
import { type Summary, summarize } from "./summary";
import { MARGIN_TARGET, UTILIZATION_TARGET } from "./targets";

/**
 * The monthly management report as data. The same model renders the on-screen
 * preview, the printable PDF and the CSV export, so the three can never disagree.
 * It is a pure function of (dataset, month, team): re-running it for a closed
 * month always reproduces the published numbers.
 */

export type MetricFormat = "money" | "pct" | "hours";

export interface KpiRow {
  label: string;
  format: MetricFormat;
  current: number;
  previous: number;
  yearToDate: number;
  /** Whether an increase is good news (drives the colour of the change). */
  goodWhenUp: boolean;
  /** "relative" = % change, "points" = percentage-point difference. */
  changeKind: "relative" | "points";
}

export interface MonthlyReport {
  month: string;
  previousMonth: string;
  team: TeamId | "all";
  current: Summary;
  previous: Summary;
  kpis: KpiRow[];
  teams: ({ id: TeamId; name: string } & Summary)[];
  projects: ProjectHealth[];
  highlights: string[];
  generatedAt: string;
}

export function buildMonthlyReport(ds: Dataset, month: string, team: TeamId | "all" = "all"): MonthlyReport {
  const previousMonth = addMonths(month, -1);
  const ytdMonths = monthRange(`${month.slice(0, 4)}-01`, month);

  const current = summarize(ds, { months: [month], team });
  const previous = summarize(ds, { months: [previousMonth], team });
  const ytd = summarize(ds, { months: ytdMonths, team });

  const kpi = (
    label: string,
    pick: (s: Summary) => number,
    format: MetricFormat,
    goodWhenUp = true,
    changeKind: KpiRow["changeKind"] = "relative",
  ): KpiRow => ({
    label,
    format,
    goodWhenUp,
    changeKind,
    current: pick(current),
    previous: pick(previous),
    yearToDate: pick(ytd),
  });

  const kpis = [
    kpi("Revenue", (s) => s.revenue, "money"),
    kpi("Delivery cost", (s) => s.deliveryCost, "money", false),
    kpi("  Labor", (s) => s.laborCost, "money", false),
    kpi("  Expenses", (s) => s.expenseCost, "money", false),
    kpi("Gross margin", (s) => s.grossMargin, "money"),
    kpi("Gross margin %", (s) => s.marginPct, "pct", true, "points"),
    kpi("Billable hours", (s) => s.billableHours, "hours"),
    kpi("Billable utilization", (s) => s.utilization, "pct", true, "points"),
  ];

  const teams = TEAMS.filter((t) => team === "all" || t.id === team).map((t) => ({
    id: t.id,
    name: t.name,
    ...summarize(ds, { months: [month], team: t.id }),
  }));

  const projects = portfolioHealth(ds, month, [month])
    .filter((h) => (team === "all" || h.project.team === team) && h.project.endMonth >= addMonths(month, -1))
    .sort((a, b) => a.vac - b.vac);

  return {
    month,
    previousMonth,
    team,
    current,
    previous,
    kpis,
    teams,
    projects,
    highlights: writeHighlights(month, previousMonth, current, previous, teams, projects),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Executive summary bullets generated from the numbers, with rule-based
 * phrasing rather than AI, so every sentence is traceable to a figure in the tables below.
 */
function writeHighlights(
  month: string,
  previousMonth: string,
  cur: Summary,
  prev: Summary,
  teams: MonthlyReport["teams"],
  projects: ProjectHealth[],
): string[] {
  const out: string[] = [];
  const prevLabel = monthLabel(previousMonth, true);

  if (prev.revenue) {
    const revenueChange = cur.revenue / prev.revenue - 1;
    out.push(
      `Revenue of ${money(cur.revenue)} was ${revenueChange >= 0 ? "up" : "down"} ${pct(Math.abs(revenueChange), 1)} on ${prevLabel}, ` +
        `with gross margin at ${pct(cur.marginPct, 1)} (${signedPts(cur.marginPct - prev.marginPct)}; target ${pct(MARGIN_TARGET)}).`,
    );
  } else {
    out.push(`Revenue of ${money(cur.revenue)} with gross margin at ${pct(cur.marginPct, 1)} (target ${pct(MARGIN_TARGET)}).`);
  }

  const ranked = [...teams].sort((a, b) => b.utilization - a.utilization);
  const below = ranked.filter((t) => t.utilization < UTILIZATION_TARGET);
  if (ranked.length > 1) {
    out.push(
      `Billable utilization was ${pct(cur.utilization, 1)} against a ${pct(UTILIZATION_TARGET)} target. ` +
        `${ranked[0].name} led at ${pct(ranked[0].utilization)}` +
        (below.length ? `; ${below.map((t) => `${t.name} (${pct(t.utilization)})`).join(", ")} ${below.length > 1 ? "are" : "is"} below target.` : "; every team is at or above target."),
    );
  } else {
    out.push(`Billable utilization was ${pct(cur.utilization, 1)} against a ${pct(UTILIZATION_TARGET)} target.`);
  }

  const offTrack = projects.filter((p) => p.status === "off-track");
  const atRisk = projects.filter((p) => p.status === "at-risk");
  if (offTrack.length || atRisk.length) {
    const names = (list: ProjectHealth[]) => list.map((p) => p.project.name).join(", ");
    out.push(
      `${offTrack.length + atRisk.length} of ${projects.filter((p) => p.status !== "complete").length} active projects need attention` +
        (offTrack.length ? `. Off track: ${names(offTrack)}` : "") +
        (atRisk.length ? `. At risk: ${names(atRisk)}` : "") +
        ".",
    );
    const worst = projects[0];
    if (worst && worst.vac < 0) {
      out.push(
        `Largest forecast overrun is ${worst.project.name} (${worst.project.client}): ${money(-worst.vac)} over its ` +
          `${money(worst.project.budget)} budget at the current cost efficiency of ${worst.cpi.toFixed(2)}.`,
      );
    }
  } else {
    out.push("All active projects are tracking within budget.");
  }

  const finishing = projects.filter((p) => p.project.endMonth === month);
  if (finishing.length) {
    out.push(`${finishing.map((p) => p.project.name).join(", ")} ${finishing.length > 1 ? "are" : "is"} scheduled to close this month.`);
  }
  return out;
}
