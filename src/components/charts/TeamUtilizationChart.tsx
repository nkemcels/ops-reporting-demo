"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { num, pct } from "@/lib/utils/format";
import { ChartTooltip } from "./ChartTooltip";
import { AXIS_PROPS, BAR_RADIUS_RIGHT, GRID_STROKE, SERIES } from "./chart-theme";

interface TeamRow {
  name: string;
  utilization: number;
  billableHours: number;
  capacity: number;
}

/** Horizontal bars per team with the utilization target as a reference line. */
export function TeamUtilizationChart({ data, target }: { data: TeamRow[]; target: number }) {
  return (
    <div style={{ height: 36 * data.length + 36 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 14, right: 40, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
          <XAxis type="number" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tickFormatter={(v) => pct(v)} {...AXIS_PROPS} />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            {...AXIS_PROPS}
            axisLine={false}
            tick={{ fill: "var(--ink-2)", fontSize: 12, width: 160 }}
          />
          <ReferenceLine
            x={target}
            stroke="var(--ink)"
            label={{ value: `Target ${pct(target)}`, position: "top", fill: "var(--ink-2)", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as TeamRow;
              return (
                <ChartTooltip
                  title={d.name}
                  rows={[
                    { label: "Billable utilization", value: pct(d.utilization, 1), color: SERIES.primary },
                    { label: "Billable hours", value: num(d.billableHours), muted: true },
                    { label: "Capacity hours", value: num(d.capacity), muted: true },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="utilization"
            fill={SERIES.primary}
            radius={BAR_RADIUS_RIGHT}
            maxBarSize={18}
            label={{ position: "right", formatter: (v: unknown) => pct(Number(v)), fill: "var(--ink-2)", fontSize: 11.5 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
