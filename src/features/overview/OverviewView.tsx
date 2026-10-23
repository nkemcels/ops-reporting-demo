"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, FileText } from "lucide-react";
import { MarginTrendChart, RevenueCostChart, TeamUtilizationChart } from "@/components/charts";
import { Button, Card, Delta, PageHeader, Segmented, Select } from "@/components/ui";
import { OPEN_MONTH } from "@/lib/data/reference-data";
import { teamName } from "@/lib/data/lookups";
import {
  MARGIN_TARGET,
  UTILIZATION_TARGET,
  monthlySeries,
  portfolioHealth,
  summarize,
  teamSummaries,
} from "@/lib/reporting";
import { useAvailableMonths, useData } from "@/lib/state/data-store";
import { change, money, pct, signedPct, signedPts } from "@/lib/utils/format";
import { monthLabel } from "@/lib/utils/months";
import { WINDOW_OPTIONS, type WindowSize, describeWindow, previousWindow, windowMonths } from "@/lib/utils/period";
import { TEAM_OPTIONS, type TeamFilter, monthOptions } from "@/features/shared/filter-options";
import { AttentionTable } from "./AttentionTable";
import { BudgetBurnList } from "./BudgetBurnList";
import { MonthEndBanner } from "./MonthEndBanner";
import { StatTile } from "./StatTile";

/**
 * Management landing page: KPIs for the selected window vs the window before,
 * 12-month trends, team utilization, and the projects that need a conversation.
 */
export function OverviewView() {
  const { dataset } = useData();
  const { months, latest } = useAvailableMonths();

  const [endMonth, setEndMonth] = useState<string | null>(null);
  const [size, setSize] = useState<WindowSize>("3");
  const [team, setTeam] = useState<TeamFilter>("all");
  // Follow the newest month automatically (e.g. right after an import) unless the user picked one.
  const end = endMonth && months.includes(endMonth) ? endMonth : latest;

  const view = useMemo(() => {
    const period = windowMonths(end, size);
    const trendMonths = windowMonths(end, "12").filter((m) => months.includes(m));
    const health = portfolioHealth(dataset, end, period).filter((h) => team === "all" || h.project.team === team);
    return {
      period,
      current: summarize(dataset, { months: period, team }),
      previous: summarize(dataset, { months: previousWindow(end, size), team }),
      trend: monthlySeries(dataset, { months: trendMonths, team }),
      teams: teamSummaries(dataset, period),
      health,
      attention: health.filter((h) => h.status === "off-track" || h.status === "at-risk"),
    };
  }, [dataset, end, size, team, months]);

  const { current: cur, previous: prev, trend, health, attention } = view;
  const hasPrevious = prev.revenue > 0;
  const offTrack = attention.filter((h) => h.status === "off-track").length;
  const activeCount = health.filter((h) => h.status !== "complete").length;
  const biggestGaps = health
    .filter((h) => h.status !== "complete")
    .sort((a, b) => b.burn - b.percentComplete - (a.burn - a.percentComplete))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Portfolio overview"
        subtitle={
          <>
            {team === "all" ? "All teams" : teamName(team)} · {describeWindow(view.period)} · compared with the
            previous {size === "1" ? "month" : `${size} months`}
          </>
        }
        actions={
          <>
            <Segmented value={size} onChange={setSize} options={WINDOW_OPTIONS} />
            <Select label="Period ending" value={end} onChange={setEndMonth} options={monthOptions(months, "Ending ")} />
            <Select label="Team" value={team} onChange={(v) => setTeam(v as TeamFilter)} options={TEAM_OPTIONS} />
            <Link href={`/reports?month=${end}`}>
              <Button variant="primary">
                <FileText size={15} /> Generate report
              </Button>
            </Link>
          </>
        }
      />

      {!months.includes(OPEN_MONTH) && <MonthEndBanner month={OPEN_MONTH} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          label="Revenue"
          value={money(cur.revenue)}
          delta={hasPrevious && <Delta value={change(cur.revenue, prev.revenue)} format={signedPct} />}
          sub={hasPrevious ? "vs prior period" : "no prior period"}
          spark={trend.map((t) => t.revenue)}
          info="Billable hours × each person's bill rate, summed across client projects."
        />
        <StatTile
          label="Delivery cost"
          value={money(cur.deliveryCost)}
          delta={
            hasPrevious && (
              <Delta value={change(cur.deliveryCost, prev.deliveryCost)} goodWhenUp={false} format={signedPct} />
            )
          }
          sub={hasPrevious ? "vs prior period" : "no prior period"}
          spark={trend.map((t) => t.deliveryCost)}
          info="Project hours × loaded cost rate, plus project expenses. Internal time is overhead and excluded."
        />
        <StatTile
          label="Gross margin"
          value={pct(cur.marginPct, 1)}
          delta={hasPrevious && <Delta value={cur.marginPct - prev.marginPct} format={signedPts} />}
          sub={`target ${pct(MARGIN_TARGET)}`}
          spark={trend.map((t) => t.marginPct)}
          info={`(Revenue − delivery cost) ÷ revenue. ${money(cur.grossMargin)} this period.`}
        />
        <StatTile
          label="Billable utilization"
          value={pct(cur.utilization, 1)}
          delta={hasPrevious && <Delta value={cur.utilization - prev.utilization} format={signedPts} />}
          sub={`target ${pct(UTILIZATION_TARGET)}`}
          spark={trend.map((t) => t.utilization)}
          info="Billable hours ÷ capacity hours (each person's contracted hours per month)."
        />
        <StatTile
          label="Projects needing attention"
          value={`${attention.length} of ${activeCount}`}
          sub={`${offTrack} off track · ${attention.length - offTrack} at risk`}
          info="Off track: cost efficiency (CPI) below 0.85, budget exceeded, or past end date. At risk: CPI below 0.95."
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Revenue vs delivery cost" subtitle="Monthly, last 12 months. Hover a month for margin.">
          <RevenueCostChart data={trend} />
        </Card>
        <Card title="Billable utilization by team" subtitle={describeWindow(view.period)}>
          <TeamUtilizationChart data={view.teams} target={UTILIZATION_TARGET} />
          <Link href="/utilization" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline">
            Per-person breakdown <ArrowRight size={13} />
          </Link>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Budget spent vs work complete" subtitle={`Active projects as of ${monthLabel(end, true)}, biggest gap first`}>
          <BudgetBurnList items={biggestGaps} />
        </Card>
        <Card title="Gross margin trend" subtitle="Monthly gross margin %, last 12 months">
          <MarginTrendChart data={trend} target={MARGIN_TARGET} height={250} />
        </Card>
      </div>

      <Card
        className="mt-4"
        title="Projects needing attention"
        subtitle="Sorted by forecast overrun"
        action={
          <Link href="/projects" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline">
            All projects <ArrowRight size={13} />
          </Link>
        }
        bodyClassName="px-0 pb-2"
      >
        <AttentionTable items={attention} />
      </Card>
    </div>
  );
}
