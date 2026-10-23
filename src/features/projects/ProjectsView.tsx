"use client";

import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Search } from "lucide-react";
import Papa from "papaparse";
import { Button, Card, Meter, PageHeader, Select, StatusBadge, statusLabel } from "@/components/ui";
import { personById, teamName } from "@/lib/data/lookups";
import type { HealthStatus } from "@/lib/domain/types";
import { type ProjectHealth, portfolioHealth } from "@/lib/reporting";
import { useAvailableMonths, useData } from "@/lib/state/data-store";
import { downloadCsv } from "@/lib/utils/download";
import { money, pct } from "@/lib/utils/format";
import { monthLabel } from "@/lib/utils/months";
import { TEAM_OPTIONS, type TeamFilter, monthOptions } from "@/features/shared/filter-options";

type SortKey = "name" | "budget" | "costToDate" | "burn" | "percentComplete" | "cpi" | "vac" | "status";

/** Worst first when sorting by status. */
const STATUS_ORDER: Record<HealthStatus, number> = { "off-track": 0, "at-risk": 1, "on-track": 2, complete: 3 };

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "off-track", label: "Off track" },
  { value: "at-risk", label: "At risk" },
  { value: "on-track", label: "On track" },
  { value: "complete", label: "Complete" },
];

function sortValue(h: ProjectHealth, key: SortKey): number | string {
  switch (key) {
    case "name":
      return h.project.name;
    case "budget":
      return h.project.budget;
    case "status":
      return STATUS_ORDER[h.status];
    default:
      return h[key];
  }
}

function SortableHeader({
  column,
  label,
  sort,
  onSort,
  align = "right",
  className,
}: {
  column: SortKey;
  label: string;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sort.key === column;
  return (
    <th
      className={clsx("px-3 py-2 font-medium", align === "right" && "text-right", className)}
      aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
    >
      <button className={clsx("inline-flex items-center gap-1 uppercase hover:text-ink", active && "text-ink")} onClick={() => onSort(column)}>
        {label}
        {active && (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  );
}

/** Project register with live health metrics: filter, sort, export. */
export function ProjectsView() {
  const { dataset } = useData();
  const { months, latest } = useAvailableMonths();
  const [asOfChoice, setAsOf] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState<TeamFilter>("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "status", dir: 1 });

  const asOf = asOfChoice && months.includes(asOfChoice) ? asOfChoice : latest;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return portfolioHealth(dataset, asOf)
      .filter((h) => team === "all" || h.project.team === team)
      .filter((h) => status === "all" || h.status === status)
      .filter((h) => !q || [h.project.name, h.project.code, h.project.client].some((s) => s.toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = sortValue(a, sort.key);
        const bv = sortValue(b, sort.key);
        return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
      });
  }, [dataset, asOf, team, status, query, sort]);

  const totals = rows.reduce(
    (t, h) => ({ budget: t.budget + h.project.budget, cost: t.cost + h.costToDate, eac: t.eac + h.eac }),
    { budget: 0, cost: 0, eac: 0 },
  );

  const exportCsv = () =>
    downloadCsv(
      Papa.unparse(
        rows.map((h) => ({
          Code: h.project.code,
          Project: h.project.name,
          Client: h.project.client,
          Team: teamName(h.project.team),
          Contract: h.project.contract,
          Budget: h.project.budget,
          "Cost to date": Math.round(h.costToDate),
          "Budget spent %": (h.burn * 100).toFixed(1),
          "% complete": (h.percentComplete * 100).toFixed(0),
          CPI: h.cpi.toFixed(2),
          EAC: Math.round(h.eac),
          VAC: Math.round(h.vac),
          Status: statusLabel(h.status),
        })),
      ),
      `projects_${asOf}.csv`,
    );

  const onSort = (key: SortKey) =>
    setSort((s) => ({
      key,
      // Re-click flips direction; a new column starts with its most useful order.
      dir: s.key === key ? ((-s.dir) as 1 | -1) : key === "name" || key === "status" ? 1 : -1,
    }));
  const sortProps = { sort, onSort };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Projects"
        subtitle={`${rows.length} projects · figures to date as of ${monthLabel(asOf, true)} close`}
        actions={
          <>
            <Select label="As of" value={asOf} onChange={setAsOf} options={monthOptions(months, "As of ")} />
            <Button onClick={exportCsv}>
              <Download size={15} /> Export CSV
            </Button>
          </>
        }
      />

      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
          <label className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] focus-within:border-brand">
            <Search size={15} className="text-ink-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by project, code or client"
              className="w-full bg-transparent outline-none placeholder:text-ink-3"
            />
          </label>
          <Select label="Team" value={team} onChange={(v) => setTeam(v as TeamFilter)} options={TEAM_OPTIONS} />
          <Select label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-[13px]">
            <thead>
              <tr className="border-b border-line bg-page text-left text-[11.5px] tracking-wide text-ink-3">
                <SortableHeader column="name" label="Project" align="left" className="px-5" {...sortProps} />
                <th className="px-3 py-2 font-medium uppercase">Lead · Team</th>
                <SortableHeader column="budget" label="Budget" {...sortProps} />
                <SortableHeader column="costToDate" label="Cost to date" {...sortProps} />
                <th className="w-44 px-3 py-2 font-medium uppercase">Spent vs complete</th>
                <SortableHeader column="cpi" label="CPI" {...sortProps} />
                <SortableHeader column="vac" label="Forecast variance" {...sortProps} />
                <SortableHeader column="status" label="Status" align="left" {...sortProps} />
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => {
                const lead = personById.get(h.project.leadId);
                return (
                  <tr key={h.project.id} className="border-b border-line last:border-0 hover:bg-page">
                    <td className="px-5 py-3">
                      <Link href={`/projects/${h.project.id}`} className="font-medium hover:text-brand">
                        {h.project.name}
                      </Link>
                      <div className="text-[12px] text-ink-3">
                        {h.project.code} · {h.project.client} · {h.project.contract}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div>{lead?.name}</div>
                      <div className="text-[12px] text-ink-3">{teamName(h.project.team)}</div>
                    </td>
                    <td className="tabular px-3 py-3 text-right">{money(h.project.budget)}</td>
                    <td className="tabular px-3 py-3 text-right">{money(h.costToDate)}</td>
                    <td className="px-3 py-3">
                      <Meter
                        value={h.burn}
                        marker={h.percentComplete}
                        tone={h.status === "off-track" ? "critical" : h.status === "at-risk" ? "warning" : "brand"}
                      />
                      <div className="tabular mt-1 text-[11.5px] text-ink-3">
                        {pct(h.burn)} spent · {pct(h.percentComplete)} done
                      </div>
                    </td>
                    <td className="tabular px-3 py-3 text-right">{h.cpi.toFixed(2)}</td>
                    <td className={clsx("tabular px-3 py-3 text-right font-medium", h.vac < 0 ? "text-[#a32626]" : "text-good-text")}>
                      {h.vac < 0 ? "−" : "+"}
                      {money(Math.abs(h.vac))}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={h.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-line bg-page text-[12.5px] font-medium">
                <td className="px-5 py-3" colSpan={2}>
                  Total ({rows.length})
                </td>
                <td className="tabular px-3 py-3 text-right">{money(totals.budget)}</td>
                <td className="tabular px-3 py-3 text-right">{money(totals.cost)}</td>
                <td />
                <td />
                <td className="tabular px-3 py-3 text-right">
                  {totals.budget - totals.eac < 0 ? "−" : "+"}
                  {money(Math.abs(totals.budget - totals.eac))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
      <p className="mt-3 text-[12px] text-ink-3">
        CPI = earned value ÷ actual cost. Forecast variance = budget − (budget ÷ CPI); negative means a forecast overrun.
      </p>
    </div>
  );
}
