"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, OctagonAlert, Rows3 } from "lucide-react";
import { Button, Segmented } from "@/components/ui";
import { getPerson, getProject } from "@/lib/data/lookups";
import { type ImportSchema, type ValidatedRow, buildIssueReport, countByStatus, isDuplicate } from "@/lib/imports";
import { downloadCsv } from "@/lib/utils/download";

type Filter = "issues" | "error" | "warning" | "all";

/** Large files are paged in the preview; validation itself always covers every row. */
const PREVIEW_LIMIT = 100;

/** Show the clean value where we have one (resolved project code, person name) and the raw cell otherwise. */
function displayValue(row: ValidatedRow, fieldKey: string, column: string | null): string {
  const v = row.values[fieldKey];
  if (v === undefined) return column ? String(row.raw[column] ?? "") : "";
  if (fieldKey === "project") return getProject(String(v))?.code ?? String(v);
  if (fieldKey === "person") return getPerson(String(v))?.name ?? String(v);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString();
  return String(v);
}

/** Step 3: every row checked; the user sees exactly what will and won't be imported. */
export function ValidationStep({
  rows,
  schema,
  mapping,
  fileName,
  skipDuplicates,
  onSkipDuplicatesChange,
  onBack,
  onImport,
}: {
  rows: ValidatedRow[];
  schema: ImportSchema;
  mapping: Record<string, string | null>;
  fileName: string;
  skipDuplicates: boolean;
  onSkipDuplicatesChange: (v: boolean) => void;
  onBack: () => void;
  onImport: () => void;
}) {
  const counts = countByStatus(rows);
  const [filter, setFilter] = useState<Filter>(counts.error + counts.warning > 0 ? "issues" : "all");

  const duplicates = rows.filter((r) => r.status !== "error" && isDuplicate(r)).length;
  const importable = counts.valid + counts.warning - (skipDuplicates ? duplicates : 0);

  const visible = useMemo(() => {
    const filtered = rows.filter((r) =>
      filter === "all" ? true : filter === "issues" ? r.status !== "valid" : r.status === filter,
    );
    return { total: filtered.length, rows: filtered.slice(0, PREVIEW_LIMIT) };
  }, [rows, filter]);

  const fields = schema.fields.filter((f) => mapping[f.key]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryTile icon={Rows3} label="Rows read" value={counts.total} tone="neutral" />
        <SummaryTile icon={CheckCircle2} label="Ready to import" value={counts.valid} tone="good" />
        <SummaryTile icon={AlertTriangle} label="Warnings (will import)" value={counts.warning} tone="warning" />
        <SummaryTile icon={OctagonAlert} label="Errors (will be skipped)" value={counts.error} tone="critical" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "issues", label: `Issues (${counts.error + counts.warning})` },
            { value: "error", label: `Errors (${counts.error})` },
            { value: "warning", label: `Warnings (${counts.warning})` },
            { value: "all", label: "All rows" },
          ]}
        />
        <Button size="sm" className="ml-auto" disabled={!counts.error && !counts.warning} onClick={() => downloadCsv(buildIssueReport(rows, schema), fileName.replace(/\.\w+$/, "") + "_issues.csv")}>
          <Download size={14} /> Download issue report
        </Button>
      </div>

      <div className="max-h-[460px] overflow-auto rounded-xl border border-line">
        <table className="w-full min-w-[900px] text-[12.5px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-line bg-page text-left text-[11px] uppercase tracking-wide text-ink-3">
              <th className="px-3 py-2 font-medium">Row</th>
              {fields.map((f) => (
                <th key={f.key} className="px-3 py-2 font-medium">
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-2 font-medium">Issues</th>
            </tr>
          </thead>
          <tbody>
            {visible.rows.map((r) => {
              const issueFields = new Map(r.issues.map((i) => [i.field, i.severity]));
              return (
                <tr key={r.line} className="border-b border-line last:border-0">
                  <td className="tabular px-3 py-2 text-ink-3">
                    <span className="flex items-center gap-1.5">
                      {r.status === "error" ? (
                        <OctagonAlert size={13} color="var(--critical)" />
                      ) : r.status === "warning" ? (
                        <AlertTriangle size={13} color="var(--warning)" />
                      ) : (
                        <CheckCircle2 size={13} color="var(--good)" />
                      )}
                      {r.line}
                    </span>
                  </td>
                  {fields.map((f) => {
                    const severity = issueFields.get(f.key);
                    return (
                      <td
                        key={f.key}
                        className={clsx(
                          "max-w-48 truncate px-3 py-2",
                          severity === "error" && "bg-red-50 font-medium text-[#a32626]",
                          severity === "warning" && "bg-amber-50 text-[#8a5a00]",
                        )}
                      >
                        {displayValue(r, f.key, mapping[f.key]) || <span className="italic text-ink-3">empty</span>}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-ink-2">{r.issues.map((i) => i.message).join(" · ")}</td>
                </tr>
              );
            })}
            {!visible.rows.length && (
              <tr>
                <td colSpan={fields.length + 2} className="px-3 py-8 text-center text-ink-3">
                  No rows in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {visible.total > PREVIEW_LIMIT && (
        <p className="text-[12px] text-ink-3">
          Showing first {PREVIEW_LIMIT} of {visible.total.toLocaleString()} rows. The issue report contains all of them.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <Button variant="ghost" onClick={onBack}>
          Back to mapping
        </Button>
        <div className="flex flex-wrap items-center gap-4">
          {duplicates > 0 && (
            <label className="flex items-center gap-2 text-[13px] text-ink-2">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => onSkipDuplicatesChange(e.target.checked)}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              Skip {duplicates} duplicate row{duplicates > 1 ? "s" : ""}
            </label>
          )}
          <Button variant="primary" disabled={importable === 0} onClick={onImport}>
            Import {importable.toLocaleString()} rows
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Rows3;
  label: string;
  value: number;
  tone: "neutral" | "good" | "warning" | "critical";
}) {
  const color = { neutral: "var(--ink-3)", good: "var(--good)", warning: "var(--warning)", critical: "var(--critical)" }[tone];
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-1.5 text-[12px] text-ink-2">
        <Icon size={14} color={color} />
        {label}
      </div>
      <div className="mt-1 text-[22px] font-semibold tabular">{value.toLocaleString()}</div>
    </div>
  );
}
