import { Sparkline } from "@/components/charts";
import { InfoTip } from "@/components/ui";

/**
 * KPI tile: label, headline value, change vs prior period and a 12-month
 * sparkline. `info` explains how the number is calculated.
 */
export function StatTile({
  label,
  value,
  delta,
  sub,
  spark,
  info,
}: {
  label: string;
  value: string;
  delta?: React.ReactNode;
  sub?: React.ReactNode;
  spark?: number[];
  info?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-2">
        {label}
        {info && <InfoTip>{info}</InfoTip>}
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-2">
        <div className="text-[26px] font-semibold leading-none tracking-tight">{value}</div>
        {spark && <Sparkline values={spark} />}
      </div>
      <div className="mt-2.5 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-0.5">
        {delta}
        {sub && <span className="text-[12px] text-ink-3">{sub}</span>}
      </div>
    </div>
  );
}
