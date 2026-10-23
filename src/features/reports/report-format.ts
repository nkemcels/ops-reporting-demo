import Papa from "papaparse";
import { teamName } from "@/lib/data/lookups";
import type { KpiRow, MetricFormat, MonthlyReport } from "@/lib/reporting";
import { change, money, num, pct, signedPct, signedPts } from "@/lib/utils/format";
import { statusLabel } from "@/components/ui";

/** Formatting shared by the on-screen report and its exports. */

export function formatMetric(format: MetricFormat, value: number): string {
  if (format === "money") return money(value, false);
  if (format === "pct") return pct(value, 1);
  return num(value);
}

export function formatChange(row: KpiRow): { text: string; good: boolean | null } {
  const delta = row.changeKind === "points" ? row.current - row.previous : change(row.current, row.previous);
  if (!row.previous || Math.abs(delta) < 0.0005) return { text: "–", good: null };
  return {
    text: row.changeKind === "points" ? signedPts(delta) : signedPct(delta),
    good: delta > 0 === row.goodWhenUp,
  };
}

/** Flat CSV with one section per table, for finance teams who want to re-cut the numbers. */
export function reportToCsv(report: MonthlyReport): string {
  const kpis = Papa.unparse(
    report.kpis.map((k) => ({
      Metric: k.label.trim(),
      [report.month]: formatMetric(k.format, k.current),
      [report.previousMonth]: formatMetric(k.format, k.previous),
      Change: formatChange(k).text,
      "Year to date": formatMetric(k.format, k.yearToDate),
    })),
  );
  const projects = Papa.unparse(
    report.projects.map((h) => ({
      Code: h.project.code,
      Project: h.project.name,
      Team: teamName(h.project.team),
      Status: statusLabel(h.status),
      "Month cost": Math.round(h.periodCost),
      "Cost to date": Math.round(h.costToDate),
      Budget: h.project.budget,
      "% complete": Math.round(h.percentComplete * 100),
      CPI: h.cpi.toFixed(2),
      "Forecast variance": Math.round(h.vac),
    })),
  );
  return `Key metrics\n${kpis}\n\nProjects\n${projects}\n`;
}
