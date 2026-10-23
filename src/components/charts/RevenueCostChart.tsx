"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, pct } from "@/lib/utils/format";
import { monthLabel } from "@/lib/utils/months";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip } from "./ChartTooltip";
import { AXIS_PROPS, BAR_MAX_SIZE, BAR_RADIUS_TOP, GRID_STROKE, SERIES } from "./chart-theme";

interface Point {
  month: string;
  revenue: number;
  deliveryCost: number;
  grossMargin: number;
  marginPct: number;
}

/**
 * Revenue and delivery cost side by side per month. Both are dollars, so they
 * share one axis; margin % lives in the tooltip and its own chart rather than
 * on a misleading second axis.
 */
export function RevenueCostChart({ data, height = 260 }: { data: Point[]; height?: number }) {
  return (
    <div>
      <ChartLegend
        items={[
          { label: "Revenue", color: SERIES.primary },
          { label: "Delivery cost", color: SERIES.secondary },
        ]}
      />
      <div style={{ height }} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="month" tickFormatter={(m) => monthLabel(m)} {...AXIS_PROPS} />
            <YAxis tickFormatter={(v) => money(v)} {...AXIS_PROPS} axisLine={false} width={64} />
            <Tooltip
              cursor={{ fill: "var(--surface-2)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as Point;
                return (
                  <ChartTooltip
                    title={monthLabel(d.month, true)}
                    rows={[
                      { label: "Revenue", value: money(d.revenue, false), color: SERIES.primary },
                      { label: "Delivery cost", value: money(d.deliveryCost, false), color: SERIES.secondary },
                      { label: "Gross margin", value: `${money(d.grossMargin, false)} · ${pct(d.marginPct, 1)}`, muted: true },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="revenue" fill={SERIES.primary} radius={BAR_RADIUS_TOP} maxBarSize={BAR_MAX_SIZE} />
            <Bar dataKey="deliveryCost" fill={SERIES.secondary} radius={BAR_RADIUS_TOP} maxBarSize={BAR_MAX_SIZE} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
