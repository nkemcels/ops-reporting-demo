import Link from "next/link";
import { Meter } from "@/components/ui";
import type { ProjectHealth } from "@/lib/reporting";
import { pct } from "@/lib/utils/format";

/** Shown in red when spend runs this far (in % points) ahead of progress. */
const GAP_HIGHLIGHT = 0.05;

/**
 * Budget spent (fill) vs work complete (marker) per project. A compact,
 * scannable version of earned value for people who don't think in CPI.
 */
export function BudgetBurnList({ items }: { items: ProjectHealth[] }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-[12px] text-ink-2">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3.5 rounded-full bg-series-1" /> Budget spent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded bg-ink" /> Work complete
        </span>
        <span className="text-ink-3">Fill past the marker = spending ahead of progress</span>
      </div>
      <ul className="space-y-3">
        {items.map((h) => {
          const gap = h.burn - h.percentComplete;
          const tone = h.status === "off-track" ? "critical" : h.status === "at-risk" ? "warning" : "brand";
          return (
            <li key={h.project.id}>
              <Link href={`/projects/${h.project.id}`} className="group block">
                <div className="mb-1 flex items-baseline justify-between gap-3 text-[12.5px]">
                  <span className="truncate font-medium group-hover:text-brand">
                    {h.project.name}
                    <span className="ml-1.5 font-normal text-ink-3">{h.project.code}</span>
                  </span>
                  <span className="tabular shrink-0 text-ink-2">
                    {pct(h.burn)} spent · {pct(h.percentComplete)} done
                    {gap > GAP_HIGHLIGHT && <span className="ml-1 text-[#a32626]">(+{Math.round(gap * 100)} pts)</span>}
                  </span>
                </div>
                <Meter value={h.burn} marker={h.percentComplete} tone={tone} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
