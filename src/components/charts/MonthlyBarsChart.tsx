"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { monthLabel } from "@/lib/utils/months";
import { ChartTooltip } from "./ChartTooltip";
import { AXIS_PROPS, BAR_MAX_SIZE, BAR_RADIUS_TOP, GRID_STROKE, SERIES } from "./chart-theme";

/** Single-series monthly column chart (one color: the chart title names the measure). */
export function MonthlyBarsChart<T extends { month: string }>({
  data,
  dataKey,
  label,
  format,
  height = 180,
}: {
  data: T[];
  dataKey: keyof T & string;
  label: string;
  format: (n: number) => string;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="month" tickFormatter={(m) => monthLabel(String(m))} {...AXIS_PROPS} />
          <YAxis tickFormatter={(v) => format(v)} {...AXIS_PROPS} axisLine={false} width={56} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as T;
              return (
                <ChartTooltip
                  title={monthLabel(d.month, true)}
                  rows={[{ label, value: format(Number(d[dataKey])), color: SERIES.primary }]}
                />
              );
            }}
          />
          <Bar dataKey={dataKey as string} fill={SERIES.primary} radius={BAR_RADIUS_TOP} maxBarSize={BAR_MAX_SIZE} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
