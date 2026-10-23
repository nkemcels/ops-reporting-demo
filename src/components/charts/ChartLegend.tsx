export interface LegendItem {
  label: string;
  color: string;
  kind?: "box" | "line";
}

/** Legend placed above the plot; every multi-series chart has one. */
export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[12px] text-ink-2">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          {i.kind === "line" ? (
            <span className="h-0.5 w-3.5 rounded" style={{ background: i.color }} />
          ) : (
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} />
          )}
          {i.label}
        </span>
      ))}
    </div>
  );
}
