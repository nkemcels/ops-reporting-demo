export interface TooltipRow {
  label: string;
  value: string;
  /** Swatch color; identity is carried by the swatch, never by colored text. */
  color?: string;
  muted?: boolean;
}

/** Tooltip body shared by all charts (rendered via Recharts' `content` prop). */
export function ChartTooltip({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="min-w-44 rounded-lg border border-line bg-surface px-3 py-2.5 text-[12.5px] shadow-lg">
      <div className="mb-1.5 font-semibold">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-5 py-0.5">
          <span className="flex items-center gap-1.5 text-ink-2">
            {r.color && <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className={r.muted ? "tabular text-ink-2" : "tabular font-medium"}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}
