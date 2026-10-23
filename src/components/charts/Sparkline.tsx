/**
 * Tiny trend line for stat tiles: history in a muted stroke, the current
 * period as an accent dot. Plain SVG, so no chart library cost for 5 tiles.
 */
export function Sparkline({ values, width = 96, height = 28 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const points = values.map((v, i) => [
    (i / (values.length - 1)) * (width - 10) + 5,
    height - 4 - ((v - min) / span) * (height - 8),
  ]);
  const path = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg width={width} height={height} aria-hidden className="shrink-0">
      <path d={path} fill="none" stroke="var(--axis)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={3.5} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
    </svg>
  );
}
