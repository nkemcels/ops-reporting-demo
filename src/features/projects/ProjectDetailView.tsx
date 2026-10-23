"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { CumulativeCostChart, MonthlyBarsChart } from "@/components/charts";
import { Card, InfoTip, Pill, StatusBadge } from "@/components/ui";
import { getProject, personById, teamName } from "@/lib/data/lookups";
import { progressAt, projectHealth, projectMonthlySeries } from "@/lib/reporting";
import { useAvailableMonths, useData } from "@/lib/state/data-store";
import { money, num, pct } from "@/lib/utils/format";
import { monthLabel, monthRange } from "@/lib/utils/months";
import { StatTile } from "@/features/overview/StatTile";

/** Single project: earned-value story, monthly effort, who worked on it and where the money went. */
export function ProjectDetailView({ id }: { id: string }) {
  const { dataset } = useData();
  const { latest } = useAvailableMonths();
  const project = getProject(id);

  const view = useMemo(() => {
    if (!project) return null;
    const asOf = latest;
    const months = monthRange(project.startMonth, project.endMonth < asOf ? project.endMonth : asOf);
    const health = projectHealth(dataset, project, asOf);

    // Running totals for the earned-value chart.
    let cumulative = 0;
    const series = projectMonthlySeries(dataset, project.id, months).map((m) => {
      cumulative += m.cost;
      return { ...m, cumulativeCost: cumulative, earnedValue: (progressAt(project, m.month) / 100) * project.budget };
    });

    // People: hours and cost to date, biggest contributors first.
    const byPerson = new Map<string, { hours: number; billable: number; cost: number }>();
    for (const e of dataset.entries) {
      if (e.projectId !== project.id || e.month > asOf) continue;
      const t = byPerson.get(e.personId) ?? { hours: 0, billable: 0, cost: 0 };
      t.hours += e.hours;
      t.billable += e.billableHours;
      t.cost += e.cost;
      byPerson.set(e.personId, t);
    }
    const people = [...byPerson.entries()]
      .map(([personId, t]) => ({ person: personById.get(personId)!, ...t }))
      .sort((a, b) => b.hours - a.hours);

    // Expenses by category.
    const byCategory = new Map<string, number>();
    for (const x of dataset.expenses) {
      if (x.projectId === project.id && x.month <= asOf) byCategory.set(x.category, (byCategory.get(x.category) ?? 0) + x.amount);
    }
    const expenses = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

    return { asOf, health, series, people, expenses };
  }, [dataset, project, latest]);

  if (!project || !view) {
    return (
      <div className="py-20 text-center text-ink-2">
        Project not found. <Link href="/projects" className="text-brand hover:underline">Back to projects</Link>
      </div>
    );
  }

  const { health: h, series, people, expenses, asOf } = view;
  const lead = personById.get(project.leadId);
  const laborCost = people.reduce((s, p) => s + p.cost, 0);
  const expenseTotal = expenses.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="mx-auto max-w-[1400px]">
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
        <ArrowLeft size={14} /> Projects
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-semibold tracking-tight">{project.name}</h1>
            <StatusBadge status={h.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
            <Pill>{project.code}</Pill>
            <span>{project.client}</span>·<span>{teamName(project.team)}</span>·<span>Lead: {lead?.name}</span>·
            <span>{project.contract}</span>·
            <span>
              {monthLabel(project.startMonth)} → {monthLabel(project.endMonth)}
            </span>
          </div>
          {h.reasons.length > 0 && <p className="mt-2 text-[13px] text-[#a32626]">{h.reasons.join(" · ")}</p>}
        </div>
        <div className="text-right text-[12px] text-ink-3">Figures to date, {monthLabel(asOf, true)} close</div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Budget" value={money(project.budget)} sub="labor + expenses" />
        <StatTile label="Cost to date" value={money(h.costToDate)} sub={`${pct(h.burn)} of budget`} />
        <StatTile label="Work complete" value={pct(h.percentComplete)} sub="reported by lead" />
        <StatTile
          label="Cost efficiency (CPI)"
          value={h.cpi.toFixed(2)}
          sub={h.cpi >= 1 ? "under plan" : "over plan"}
          info="Earned value ÷ actual cost. 1.00 means each dollar spent delivered a dollar of planned work."
        />
        <StatTile
          label="Forecast at completion"
          value={money(h.eac)}
          sub={`${h.vac < 0 ? "overrun" : "saving"} ${money(Math.abs(h.vac))}`}
          info="Budget ÷ CPI: where final cost lands if the current efficiency holds."
        />
        <StatTile
          label="Margin to date"
          value={h.revenueToDate ? pct(h.marginPct, 1) : "n/a"}
          sub={h.revenueToDate ? `${money(h.revenueToDate)} revenue` : "internal project"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title={
            <span className="flex items-center gap-1.5">
              Actual cost vs earned value
              <InfoTip>When the orange line runs above the blue one, the project is spending faster than it is delivering.</InfoTip>
            </span>
          }
          subtitle="Cumulative, by month"
        >
          <CumulativeCostChart data={series} budget={project.budget} />
        </Card>
        <Card title="Hours logged per month" subtitle="All team members">
          <MonthlyBarsChart data={series} dataKey="hours" label="Hours" format={(n) => num(n)} height={290} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Team on this project" subtitle={`${people.length} people · ${money(laborCost)} labor to date`} bodyClassName="px-0 pb-2">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-y border-line bg-page text-left text-[11.5px] uppercase tracking-wide text-ink-3">
                <th className="px-5 py-2 font-medium">Person</th>
                <th className="px-3 py-2 font-medium">Team</th>
                <th className="px-3 py-2 text-right font-medium">Hours</th>
                <th className="px-3 py-2 text-right font-medium">Billable</th>
                <th className="px-3 py-2 text-right font-medium">Cost rate</th>
                <th className="px-5 py-2 text-right font-medium">Labor cost</th>
              </tr>
            </thead>
            <tbody>
              {people.map(({ person, hours, billable, cost }) => (
                <tr key={person.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-2.5">
                    <div className="font-medium">{person.name}</div>
                    <div className="text-[12px] text-ink-3">{person.role}</div>
                  </td>
                  <td className="px-3 py-2.5 text-ink-2">{teamName(person.team)}</td>
                  <td className="tabular px-3 py-2.5 text-right">{num(hours)}</td>
                  <td className="tabular px-3 py-2.5 text-right">{hours ? pct(billable / hours) : "-"}</td>
                  <td className="tabular px-3 py-2.5 text-right">${person.costRate}/h</td>
                  <td className="tabular px-5 py-2.5 text-right">{money(cost, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Expenses by category" subtitle={`${money(expenseTotal)} to date`}>
          {expenses.length ? (
            <ul className="space-y-3">
              {expenses.map(([category, amount]) => (
                <li key={category}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span>{category}</span>
                    <span className="tabular font-medium">{money(amount, false)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2">
                    <div className="h-1.5 rounded-full bg-series-1" style={{ width: `${(amount / expenses[0][1]) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-ink-3">No expenses recorded.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
