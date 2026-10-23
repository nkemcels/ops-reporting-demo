"use client";

import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/utils/format";
import { monthLabel } from "@/lib/utils/months";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip } from "./ChartTooltip";
import { ACTIVE_DOT, AXIS_PROPS, GRID_STROKE, SERIES } from "./chart-theme";

interface Point {
  month: string;
  cumulativeCost: number;
  earnedValue: number;
}

/**
 * Earned-value chart: cumulative actual cost vs. value of work completed.
 * The gap between the two lines is the overrun (or saving) to date.
 */
export function CumulativeCostChart({ data, budget }: { data: Point[]; budget: number }) {
  return (
    <div>
      <ChartLegend
        items={[
          { label: "Actual cost (cumulative)", color: SERIES.secondary, kind: "line" },
          { label: "Earned value (% complete × budget)", color: SERIES.primary, kind: "line" },
        ]}
      />
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="month" tickFormatter={(m) => monthLabel(m)} {...AXIS_PROPS} />
            <YAxis
              tickFormatter={(v) => money(v)}
              {...AXIS_PROPS}
              axisLine={false}
              width={64}
              domain={[0, (max: number) => Math.max(max, budget) * 1.08]}
            />
            <ReferenceLine
              y={budget}
              stroke="var(--ink)"
              label={{ value: `Budget ${money(budget)}`, position: "insideTopLeft", fill: "var(--ink-2)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ stroke: "var(--axis)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as Point;
                return (
                  <ChartTooltip
                    title={monthLabel(d.month, true)}
                    rows={[
                      { label: "Actual cost", value: money(d.cumulativeCost, false), color: SERIES.secondary },
                      { label: "Earned value", value: money(d.earnedValue, false), color: SERIES.primary },
                      { label: "CPI", value: d.cumulativeCost ? (d.earnedValue / d.cumulativeCost).toFixed(2) : "-", muted: true },
                    ]}
                  />
                );
              }}
            />
            <Line dataKey="cumulativeCost" stroke={SERIES.secondary} strokeWidth={2} dot={false} activeDot={ACTIVE_DOT} />
            <Line dataKey="earnedValue" stroke={SERIES.primary} strokeWidth={2} dot={false} activeDot={ACTIVE_DOT} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
