import clsx from "clsx";
import { Fragment } from "react";
import { TEAMS } from "@/lib/data/reference-data";
import { UTILIZATION_BANDS, type PersonUtilization } from "@/lib/reporting";
import { num, pct } from "@/lib/utils/format";
import { monthLabel } from "@/lib/utils/months";

/**
 * One-hue sequential scale (light → dark blue), one step per utilization band.
 * Magnitude uses a single hue so "darker = busier" reads without a legend lookup.
 */
const BAND_FILLS = ["#e3eefc", "#b7d3f6", "#6da7ec", "#2a78d6", "#104281"];
/** Text on the darker steps switches to white to keep contrast. */
const BAND_TEXT = ["text-ink-2", "text-ink", "text-ink", "text-white", "text-white"];

const bandIndex = (u: number) => UTILIZATION_BANDS.findIndex((b) => u < b.max);

export function UtilizationLegend() {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink-2">
      <span className="mr-1">Billable utilization</span>
      {UTILIZATION_BANDS.map((b, i) => (
        <span key={b.label} className="flex items-center gap-1">
          <span className="h-3 w-5 rounded-[3px]" style={{ background: BAND_FILLS[i] }} />
          <span className="mr-2">{b.label}</span>
        </span>
      ))}
    </div>
  );
}

/** People × months grid, grouped by team, with a period average column. */
export function UtilizationHeatmap({ rows, months }: { rows: PersonUtilization[]; months: string[] }) {
  const teams = TEAMS.filter((t) => rows.some((r) => r.person.team === t.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-[3px] text-[12px]">
        <thead>
          <tr className="text-ink-3">
            <th className="sticky left-0 z-10 min-w-48 bg-surface px-2 py-1 text-left font-medium">Person</th>
            {months.map((m) => (
              <th key={m} className="min-w-14 px-1 py-1 text-center font-medium">
                {monthLabel(m)}
              </th>
            ))}
            <th className="min-w-16 px-1 py-1 text-center font-semibold text-ink-2">Avg</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <Fragment key={team.id}>
              <tr>
                <td colSpan={months.length + 2} className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                  {team.name}
                </td>
              </tr>
              {rows
                .filter((r) => r.person.team === team.id)
                .map((r) => (
                  <tr key={r.person.id}>
                    <td className="sticky left-0 z-10 bg-surface px-2 py-1">
                      <div className="font-medium text-ink">{r.person.name}</div>
                      <div className="text-[11px] text-ink-3">
                        {r.person.role}
                        {r.person.capacity < 160 && ` · ${r.person.capacity} h/mo`}
                      </div>
                    </td>
                    {r.months.map((c) => {
                      const band = bandIndex(c.utilization);
                      return (
                        <td
                          key={c.month}
                          title={`${r.person.name}, ${monthLabel(c.month, true)}: ${num(c.billable)} billable of ${num(c.hours)} logged hours (${pct(c.utilization, 1)})`}
                          className={clsx("tabular h-10 rounded-md text-center font-medium", BAND_TEXT[band])}
                          style={{ background: BAND_FILLS[band] }}
                        >
                          {pct(c.utilization)}
                        </td>
                      );
                    })}
                    <td className="tabular rounded-md bg-surface-2 text-center font-semibold">{pct(r.total.utilization)}</td>
                  </tr>
                ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
