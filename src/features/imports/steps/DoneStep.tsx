import Link from "next/link";
import { CheckCircle2, FileText, LayoutDashboard, Plus } from "lucide-react";
import { Button } from "@/components/ui";
import type { ImportBatch } from "@/lib/domain/types";
import { money, num } from "@/lib/utils/format";
import { monthLabel } from "@/lib/utils/months";

/** Step 4: confirm what changed and point to where it shows up. */
export function DoneStep({ batch, onAnother }: { batch: ImportBatch; onAnother: () => void }) {
  const hours = batch.entries.reduce((s, e) => s + e.hours, 0);
  // Same definition as the dashboards: internal time is overhead, not delivery cost.
  const projectLabor = batch.entries.filter((e) => e.projectId !== "internal").reduce((s, e) => s + e.cost, 0);
  const expenseTotal = batch.expenses.reduce((s, e) => s + e.amount, 0);
  const revenue = batch.entries.reduce((s, e) => s + e.revenue, 0);
  const month = batch.months[batch.months.length - 1];

  const stats =
    batch.kind === "timesheet"
      ? [
          { label: "Hours added", value: num(hours) },
          { label: "Project labor cost", value: money(projectLabor) },
          { label: "Revenue", value: money(revenue) },
        ]
      : [
          { label: "Expense lines", value: num(batch.expenses.length) },
          { label: "Expenses added", value: money(expenseTotal) },
          { label: "Projects affected", value: num(new Set(batch.expenses.map((e) => e.projectId)).size) },
        ];

  return (
    <div className="py-4 text-center">
      <CheckCircle2 size={40} className="mx-auto" color="var(--good)" />
      <h3 className="mt-3 text-[18px] font-semibold">{num(batch.rowsImported)} rows imported</h3>
      <p className="mt-1 text-[13.5px] text-ink-2">
        {batch.fileName} · {batch.months.map((m) => monthLabel(m, true)).join(", ")}
        {batch.rowsSkipped > 0 && ` · ${batch.rowsSkipped} rows skipped`}
      </p>

      <div className="mx-auto mt-6 grid max-w-xl grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-page px-3 py-3">
            <div className="text-[12px] text-ink-2">{s.label}</div>
            <div className="mt-1 text-[20px] font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-5 max-w-lg text-[12.5px] text-ink-3">
        Every dashboard and report already reflects this upload. If something looks wrong, undo the batch from the
        import history below: it removes exactly these rows and nothing else.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/">
          <Button>
            <LayoutDashboard size={15} /> View overview
          </Button>
        </Link>
        {month && (
          <Link href={`/reports?month=${month}`}>
            <Button>
              <FileText size={15} /> {monthLabel(month, true)} report
            </Button>
          </Link>
        )}
        <Button variant="primary" onClick={onAnother}>
          <Plus size={15} /> Import another file
        </Button>
      </div>
    </div>
  );
}
