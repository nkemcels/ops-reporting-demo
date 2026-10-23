"use client";

import { Undo2 } from "lucide-react";
import { Button, Card, Pill } from "@/components/ui";
import { SCHEMAS } from "@/lib/imports";
import { useData } from "@/lib/state/data-store";
import { num } from "@/lib/utils/format";
import { monthLabel } from "@/lib/utils/months";

/**
 * Illustrative history from earlier month-ends so the table doesn't start
 * empty. Real batches from this session appear above these and can be undone.
 */
const PAST_UPLOADS = [
  { file: "timesheets_aug_2026_export.csv", kind: "timesheet", by: "Amara Okafor", at: "2026-09-03T09:12:00Z", rows: 1268, skipped: 4, month: "2026-08" },
  { file: "project_expenses_aug_2026.xlsx", kind: "expenses", by: "Finance (auto)", at: "2026-09-02T17:40:00Z", rows: 21, skipped: 0, month: "2026-08" },
  { file: "data_team_hours_aug.xlsx", kind: "timesheet", by: "Priya Nair", at: "2026-09-02T11:05:00Z", rows: 512, skipped: 1, month: "2026-08" },
  { file: "timesheets_jul_2026_export.csv", kind: "timesheet", by: "Amara Okafor", at: "2026-08-04T08:58:00Z", rows: 1240, skipped: 2, month: "2026-07" },
] as const;

const formatTimestamp = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function ImportHistory() {
  const { batches, removeBatch } = useData();

  return (
    <Card title="Import history" subtitle="Every upload is kept as a batch with who, when and what changed" bodyClassName="px-0 pb-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead>
            <tr className="border-y border-line bg-page text-left text-[11.5px] uppercase tracking-wide text-ink-3">
              <th className="px-5 py-2 font-medium">File</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Period</th>
              <th className="px-3 py-2 font-medium">Uploaded by</th>
              <th className="px-3 py-2 text-right font-medium">Imported</th>
              <th className="px-3 py-2 text-right font-medium">Skipped</th>
              <th className="px-5 py-2 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id} className="border-b border-line bg-brand-soft/30">
                <td className="px-5 py-3">
                  <div className="font-medium">{b.fileName}</div>
                  <div className="text-[12px] text-ink-3">{formatTimestamp(b.importedAt)} · this session</div>
                </td>
                <td className="px-3 py-3">
                  <Pill tone="brand">{SCHEMAS[b.kind].title}</Pill>
                </td>
                <td className="px-3 py-3">{b.months.map((m) => monthLabel(m)).join(", ")}</td>
                <td className="px-3 py-3">{b.importedBy}</td>
                <td className="tabular px-3 py-3 text-right">{num(b.rowsImported)}</td>
                <td className="tabular px-3 py-3 text-right">{num(b.rowsSkipped)}</td>
                <td className="px-5 py-3 text-right">
                  <Button size="sm" variant="danger" onClick={() => removeBatch(b.id)}>
                    <Undo2 size={13} /> Undo
                  </Button>
                </td>
              </tr>
            ))}
            {PAST_UPLOADS.map((u) => (
              <tr key={u.file} className="border-b border-line last:border-0">
                <td className="px-5 py-3">
                  <div className="font-medium">{u.file}</div>
                  <div className="text-[12px] text-ink-3">{formatTimestamp(u.at)}</div>
                </td>
                <td className="px-3 py-3">
                  <Pill>{SCHEMAS[u.kind].title}</Pill>
                </td>
                <td className="px-3 py-3">{monthLabel(u.month)}</td>
                <td className="px-3 py-3">{u.by}</td>
                <td className="tabular px-3 py-3 text-right">{num(u.rows)}</td>
                <td className="tabular px-3 py-3 text-right">{num(u.skipped)}</td>
                <td className="px-5 py-3 text-right text-[12px] text-ink-3">Month closed</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
