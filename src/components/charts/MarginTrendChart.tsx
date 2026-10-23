"use client";

import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { pct, signedPts } from "@/lib/utils/format";
import { monthLabel } from "@/lib/utils/months";
import { ChartTooltip } from "./ChartTooltip";
import { ACTIVE_DOT, AXIS_PROPS, GRID_STROKE, SERIES } from "./chart-theme";

/** Gross margin % over time against the agreed target line. */
export function MarginTrendChart({
  data,
  target,
  height = 220,
}: {
  data: { month: string; marginPct: number }[];
  target: number;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 72, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="month" tickFormatter={(m) => monthLabel(m)} {...AXIS_PROPS} />
          <YAxis tickFormatter={(v) => pct(v)} {...AXIS_PROPS} axisLine={false} domain={[0, 0.6]} ticks={[0, 0.15, 0.3, 0.45, 0.6]} width={52} />
          <ReferenceLine
            y={target}
            stroke="var(--ink-3)"
            label={{ value: `Target ${pct(target)}`, position: "right", fill: "var(--ink-2)", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ stroke: "var(--axis)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as { month: string; marginPct: number };
              return (
                <ChartTooltip
                  title={monthLabel(d.month, true)}
                  rows={[
                    { label: "Gross margin", value: pct(d.marginPct, 1), color: SERIES.primary },
                    { label: "vs target", value: signedPts(d.marginPct - target), muted: true },
                  ]}
                />
              );
            }}
          />
          <Area dataKey="marginPct" stroke="none" fill={SERIES.primary} fillOpacity={0.1} />
          <Line dataKey="marginPct" stroke={SERIES.primary} strokeWidth={2} dot={false} activeDot={ACTIVE_DOT} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
