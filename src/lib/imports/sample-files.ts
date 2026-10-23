import Papa from "papaparse";
import * as XLSX from "xlsx";
import { INTERNAL_PROJECT, LAST_SEED_MONTH, OPEN_MONTH, PEOPLE, PROJECT_PLANS } from "@/lib/data/reference-data";
import { PROJECTS, SEED } from "@/lib/data/seed";
import { monthRange } from "@/lib/utils/months";
import { seededRandom } from "@/lib/utils/random";

/**
 * Builds realistic "as exported from the timesheet tool / finance ERP" files
 * for the open month, generated in the browser so the demo needs no backend.
 * They deliberately use non-standard headers and contain the mistakes real
 * exports contain, so the mapping and validation steps have something to show.
 */

export const SAMPLE_MONTH = OPEN_MONTH;

function workingDays(month: string) {
  const [y, m] = month.split("-").map(Number);
  const days: string[] = [];
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCMonth() !== m - 1) break;
    const dow = dt.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    if (month.endsWith("-09") && d === 7) continue; // Labor Day
    days.push(dt.toISOString().slice(0, 10));
  }
  return days;
}

/** Daily timesheet lines for every person, shaped like their previous month's allocations. */
export function buildTimesheetCsv(): { name: string; csv: string } {
  const rand = seededRandom(9);
  const days = workingDays(SAMPLE_MONTH);
  const active = new Set(
    PROJECTS.filter((p) => p.endMonth >= SAMPLE_MONTH && p.startMonth <= SAMPLE_MONTH).map((p) => p.id),
  );
  active.add("internal");
  const code = (id: string) => (id === "internal" ? INTERNAL_PROJECT.code : PROJECTS.find((p) => p.id === id)!.code);
  // Internal projects (billable share 0) are never billed; client work occasionally isn't either.
  const isBillableProject = (id: string) => (PROJECT_PLANS.find((p) => p.id === id)?.billableShare ?? 0) > 0;

  const rows: Record<string, string>[] = [];
  for (const person of PEOPLE) {
    const allocations = SEED.entries.filter(
      (e) => e.personId === person.id && e.month === LAST_SEED_MONTH && active.has(e.projectId),
    );
    for (const day of days) {
      for (const a of allocations) {
        const daily = (a.hours / 21) * (0.8 + rand() * 0.4);
        const hours = Math.round(daily * 2) / 2;
        if (hours < 0.5) continue;
        const usFormat = rand() < 0.15;
        const [y, m, d] = day.split("-");
        rows.push({
          "Work Date": usFormat ? `${m}/${d}/${y}` : day,
          "Proj Code": code(a.projectId),
          Resource: person.name,
          Hrs: String(hours),
          "Billable?": !isBillableProject(a.projectId) || rand() < 0.04 ? "No" : "Yes",
          Comments: a.projectId === "internal" ? ["Training", "Pre-sales", "Admin", "1:1s"][Math.floor(rand() * 4)] : "",
        });
      }
    }
  }

  // Plant the mistakes that show up in real month-end exports (one of each rule).
  const at = (n: number) => rows[Math.min(n, rows.length - 1)];
  at(14)["Proj Code"] = "PRJ-1099";
  at(87).Hrs = "eight";
  at(152).Resource = "";
  at(203).Hrs = "26";
  at(260)["Work Date"] = "2026-09-31";
  at(318).Hrs = "13.5";
  at(377).Resource = "Jordan Blake";
  at(431)["Billable?"] = "maybe";
  at(502).Resource = "Daniel Brookes";
  rows.splice(560, 0, { ...at(559) });
  rows.splice(640, 0, {
    "Work Date": `${SAMPLE_MONTH}-04`,
    "Proj Code": "PRJ-1058",
    Resource: "Grace Kim",
    Hrs: "2",
    "Billable?": "No",
    Comments: "Design system hand-off questions",
  });

  return { name: "timesheets_sept_2026_export.csv", csv: Papa.unparse(rows) };
}

/** Expense workbook with a second "Info" sheet, to exercise the sheet picker. */
export function buildExpensesXlsx(): { name: string; data: ArrayBuffer } {
  const rand = seededRandom(21);
  const vendors: Record<string, string[]> = {
    "Software & licences": ["Atlassian", "JetBrains", "Figma", "Datadog"],
    "Cloud hosting": ["AWS", "Azure", "Cloudflare"],
    Contractors: ["Northwind Contracting", "Kestrel QA Ltd"],
    Travel: ["Delta Air Lines", "Marriott", "Uber"],
  };
  const cats = Object.keys(vendors);
  const approvers = ["J. Ellis", "A. Okafor", "P. Nair", "M. Johnson"];
  const rows: Record<string, unknown>[] = [];
  const active = PROJECTS.filter((p) => p.endMonth >= SAMPLE_MONTH && p.startMonth <= SAMPLE_MONTH);

  for (const p of active) {
    // Size expenses like the seeded history: a few percent of the project's planned monthly spend.
    const plannedMonthly = (p.budget * 0.88) / monthRange(p.startMonth, p.endMonth).length;
    const n = rand() < 0.4 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const cat = cats[Math.floor(rand() * cats.length)];
      const amount = Math.round(plannedMonthly * (0.03 + rand() * 0.05) * 100) / 100;
      rows.push({
        "Invoice Date": new Date(2026, 8, 1 + Math.floor(rand() * 29)),
        "Cost Centre": p.code,
        "Expense Type": cat,
        "Net Amount": rand() < 0.4 ? `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : amount,
        Supplier: vendors[cat][Math.floor(rand() * vendors[cat].length)],
        "Approved By": approvers[Math.floor(rand() * approvers.length)],
      });
    }
  }
  rows[3]["Net Amount"] = -450;
  rows[7]["Cost Centre"] = "PRJ-1O64";
  rows[11]["Expense Type"] = "";

  const ws = XLSX.utils.json_to_sheet(rows, { cellDates: true });
  ws["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 22 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sept 2026");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Exported from Finance ERP"], ["Period", "2026-09"]]), "Info");
  const data = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return { name: "project_expenses_sept_2026.xlsx", data };
}

/** The sample as a File object, so it goes through exactly the same path as a user upload. */
export function sampleFile(kind: "timesheet" | "expenses"): File {
  if (kind === "timesheet") {
    const { name, csv } = buildTimesheetCsv();
    return new File([csv], name, { type: "text/csv" });
  }
  const { name, data } = buildExpensesXlsx();
  return new File([data], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
