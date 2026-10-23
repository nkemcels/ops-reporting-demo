import Papa from "papaparse";
import { personById } from "@/lib/data/lookups";
import type { Expense, ImportBatch, ImportKind, TimeEntry } from "@/lib/domain/types";
import type { ImportSchema } from "./schemas";
import { isDuplicate, type ValidatedRow } from "./validate-rows";

/**
 * Turn validated rows into an import batch, the unit that is committed (and can
 * be rolled back) as a whole. Every resulting row carries the batch id as its
 * `source`, so deleting a batch removes exactly what it added.
 *
 * Production: one PostgreSQL transaction inserts `import_batches` + the fact
 * rows; re-uploading the same file for the same month replaces the previous
 * batch instead of double counting.
 */
export function buildBatch(opts: {
  kind: ImportKind;
  fileName: string;
  rows: ValidatedRow[];
  skipDuplicates: boolean;
  importedBy: string;
}): ImportBatch {
  const id = `imp_${Date.now().toString(36)}`;
  const accepted = opts.rows.filter((r) => r.status !== "error" && !(opts.skipDuplicates && isDuplicate(r)));

  const { entries, expenses } =
    opts.kind === "timesheet"
      ? { entries: rollUpTimesheet(accepted, id), expenses: [] }
      : { entries: [], expenses: toExpenses(accepted, id) };

  const months = new Set([...entries, ...expenses].map((x) => x.month));

  return {
    id,
    kind: opts.kind,
    fileName: opts.fileName,
    importedAt: new Date().toISOString(),
    importedBy: opts.importedBy,
    rowsRead: opts.rows.length,
    rowsImported: accepted.length,
    rowsSkipped: opts.rows.length - accepted.length,
    warnings: accepted.filter((r) => r.status === "warning").length,
    months: [...months].sort(),
    entries,
    expenses,
  };
}

/**
 * Daily timesheet lines roll up to the person × project × month grain used by
 * all reports. Cost and revenue are priced at import time with the person's
 * current rates, so later rate changes don't silently rewrite closed months.
 */
function rollUpTimesheet(rows: ValidatedRow[], batchId: string): TimeEntry[] {
  const byKey = new Map<string, TimeEntry>();
  for (const r of rows) {
    const month = String(r.values.date).slice(0, 7);
    const personId = String(r.values.person);
    const projectId = String(r.values.project);
    const hours = Number(r.values.hours);
    const person = personById.get(personId)!;

    const key = `${month}|${projectId}|${personId}`;
    const entry = byKey.get(key) ?? {
      month, projectId, personId, hours: 0, billableHours: 0, cost: 0, revenue: 0, source: batchId,
    };
    entry.hours += hours;
    entry.cost += hours * person.costRate;
    if (r.values.billable === true) {
      entry.billableHours += hours;
      entry.revenue += hours * person.billRate;
    }
    byKey.set(key, entry);
  }
  return [...byKey.values()];
}

function toExpenses(rows: ValidatedRow[], batchId: string): Expense[] {
  return rows.map((r) => ({
    month: String(r.values.date).slice(0, 7),
    projectId: String(r.values.project),
    category: String(r.values.category),
    amount: Number(r.values.amount),
    source: batchId,
  }));
}

/** CSV of every row with issues, plus the original columns, for sending back to the uploader. */
export function buildIssueReport(rows: ValidatedRow[], schema: ImportSchema): string {
  const withIssues = rows.filter((r) => r.issues.length);
  const fieldLabel = (key: string) => schema.fields.find((f) => f.key === key)?.label ?? "Row";
  return Papa.unparse(
    withIssues.map((r) => ({
      Row: r.line,
      Status: r.status,
      Issues: r.issues.map((i) => `${fieldLabel(i.field)}: ${i.message}`).join(" | "),
      ...r.raw,
    })),
  );
}
