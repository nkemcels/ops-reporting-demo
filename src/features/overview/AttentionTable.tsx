import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import type { ProjectHealth } from "@/lib/reporting";
import { money, pct } from "@/lib/utils/format";

/** At-risk and off-track projects, worst forecast overrun first, with the reasons spelled out. */
export function AttentionTable({ items }: { items: ProjectHealth[] }) {
  const rows = [...items].sort((a, b) => a.vac - b.vac);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-[13px]">
        <thead>
          <tr className="border-y border-line bg-page text-left text-[11.5px] uppercase tracking-wide text-ink-3">
            <th className="px-5 py-2 font-medium">Project</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 text-right font-medium">Budget</th>
            <th className="px-3 py-2 text-right font-medium">Spent</th>
            <th className="px-3 py-2 text-right font-medium">Complete</th>
            <th className="px-3 py-2 text-right font-medium">CPI</th>
            <th className="px-3 py-2 text-right font-medium">Forecast overrun</th>
            <th className="px-5 py-2 font-medium">Why</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((h) => (
            <tr key={h.project.id} className="border-b border-line last:border-0 hover:bg-page">
              <td className="px-5 py-3">
                <Link href={`/projects/${h.project.id}`} className="font-medium hover:text-brand">
                  {h.project.name}
                </Link>
                <div className="text-[12px] text-ink-3">
                  {h.project.code} · {h.project.client}
                </div>
              </td>
              <td className="px-3 py-3">
                <StatusBadge status={h.status} />
              </td>
              <td className="tabular px-3 py-3 text-right">{money(h.project.budget)}</td>
              <td className="tabular px-3 py-3 text-right">{pct(h.burn)}</td>
              <td className="tabular px-3 py-3 text-right">{pct(h.percentComplete)}</td>
              <td className="tabular px-3 py-3 text-right">{h.cpi.toFixed(2)}</td>
              <td className="tabular px-3 py-3 text-right font-medium text-[#a32626]">{h.vac < 0 ? money(-h.vac) : "-"}</td>
              <td className="px-5 py-3 text-[12.5px] text-ink-2">{h.reasons.join(" · ")}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={8} className="px-5 py-8 text-center text-ink-3">
                Every active project is on track for this selection.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
