"use client";

import { useMemo, useState } from "react";
import { Card, Meter, PageHeader, Segmented, Select } from "@/components/ui";
import { teamName } from "@/lib/data/lookups";
import { UTILIZATION_TARGET, personUtilization, teamSummaries } from "@/lib/reporting";
import { useAvailableMonths, useData } from "@/lib/state/data-store";
import { num, pct, signedPts } from "@/lib/utils/format";
import { monthLabel } from "@/lib/utils/months";
import { type WindowSize, describeWindow, windowMonths } from "@/lib/utils/period";
import { TEAM_OPTIONS, type TeamFilter } from "@/features/shared/filter-options";
import { UtilizationHeatmap, UtilizationLegend } from "./UtilizationHeatmap";

/** Below this in the latest month, a person is flagged as having bench capacity. */
const BENCH_THRESHOLD = 0.6;
/** Above this, a person is flagged as at risk of burnout / delivery slippage. */
const OVERLOAD_THRESHOLD = 0.85;

const HEATMAP_WINDOWS: { value: WindowSize; label: string }[] = [
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "12", label: "12 months" },
];

/** Who is busy, who has room, and how each team tracks against the utilization target. */
export function UtilizationView() {
  const { dataset } = useData();
  const { months, latest } = useAvailableMonths();
  const [size, setSize] = useState<WindowSize>("6");
  const [team, setTeam] = useState<TeamFilter>("all");

  const view = useMemo(() => {
    const period = windowMonths(latest, size).filter((m) => months.includes(m));
    const people = personUtilization(dataset, period, team);
    const latestOf = (r: (typeof people)[number]) => r.months[r.months.length - 1];
    return {
      period,
      people,
      teams: teamSummaries(dataset, period),
      bench: people
        .filter((r) => latestOf(r).utilization < BENCH_THRESHOLD)
        .sort((a, b) => latestOf(a).utilization - latestOf(b).utilization),
      overloaded: people
        .filter((r) => latestOf(r).utilization >= OVERLOAD_THRESHOLD)
        .sort((a, b) => latestOf(b).utilization - latestOf(a).utilization),
    };
  }, [dataset, latest, size, team, months]);

  const latestCell = (r: (typeof view.people)[number]) => r.months[r.months.length - 1];

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Team utilization"
        subtitle={`Billable hours ÷ capacity hours · ${describeWindow(view.period)} · target ${pct(UTILIZATION_TARGET)}`}
        actions={
          <>
            <Segmented value={size} onChange={setSize} options={HEATMAP_WINDOWS} />
            <Select label="Team" value={team} onChange={(v) => setTeam(v as TeamFilter)} options={TEAM_OPTIONS} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {view.teams.map((t) => {
          const gap = t.utilization - UTILIZATION_TARGET;
          return (
            <button
              key={t.team}
              onClick={() => setTeam(team === t.team ? "all" : t.team)}
              className={`rounded-2xl border bg-surface p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:border-brand ${team === t.team ? "border-brand ring-2 ring-brand-soft" : "border-line"}`}
            >
              <div className="text-[12.5px] font-medium text-ink-2">{t.name}</div>
              <div className="mt-2 text-[24px] font-semibold leading-none tracking-tight">{pct(t.utilization, 1)}</div>
              <div className={`mt-1.5 text-[12px] font-medium ${gap >= 0 ? "text-good-text" : "text-[#b42318]"}`}>
                {signedPts(gap)} vs target
              </div>
              <div className="mt-3">
                <Meter value={t.utilization} marker={UTILIZATION_TARGET} tone={gap < -0.1 ? "warning" : "brand"} />
              </div>
              <div className="mt-2 text-[11.5px] text-ink-3">
                {num(t.billableHours)} billable of {num(t.capacity)} h capacity
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-4">
        <Card
          className="xl:col-span-3"
          title={`People × month${team === "all" ? "" : ` · ${teamName(team)}`}`}
          subtitle="Hover a cell for billable vs logged hours"
          action={<UtilizationLegend />}
        >
          <UtilizationHeatmap rows={view.people} months={view.period} />
        </Card>

        <div className="space-y-4">
          <Card title="Available capacity" subtitle={`Below ${pct(BENCH_THRESHOLD)} in ${monthLabel(latest, true)}`}>
            <PersonList
              rows={view.bench.map((r) => ({
                id: r.person.id,
                name: r.person.name,
                detail: `${r.person.role} · ${teamName(r.person.team)}`,
                value: pct(latestCell(r).utilization),
                note: `~${num(r.person.capacity * (UTILIZATION_TARGET - latestCell(r).utilization))} h free to target`,
              }))}
              empty="Nobody is under-utilized this month."
            />
          </Card>
          <Card title="Running hot" subtitle={`${pct(OVERLOAD_THRESHOLD)}+ in ${monthLabel(latest, true)}`}>
            <PersonList
              rows={view.overloaded.map((r) => ({
                id: r.person.id,
                name: r.person.name,
                detail: `${r.person.role} · ${teamName(r.person.team)}`,
                value: pct(latestCell(r).utilization),
              }))}
              empty={`Nobody is above ${pct(OVERLOAD_THRESHOLD)} this month.`}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function PersonList({
  rows,
  empty,
}: {
  rows: { id: string; name: string; detail: string; value: string; note?: string }[];
  empty: string;
}) {
  if (!rows.length) return <p className="text-[13px] text-ink-3">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium">{r.name}</div>
            <div className="truncate text-[11.5px] text-ink-3">{r.note ?? r.detail}</div>
          </div>
          <span className="tabular text-[13px] font-semibold">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
