/**
 * Horizontal progress meter with an optional marker. Used for "budget spent"
 * (fill) against "work complete" (marker): fill past the marker means
 * spending is ahead of progress.
 */
const TONES = {
  brand: { fill: "var(--series-1)", track: "#cde2fb" },
  warning: { fill: "var(--warning)", track: "#fdecc4" },
  critical: { fill: "var(--critical)", track: "#f6d8d8" },
};

export function Meter({
  value,
  marker,
  tone = "brand",
}: {
  value: number;
  marker?: number;
  tone?: keyof typeof TONES;
}) {
  const { fill, track } = TONES[tone];
  const clamp = (n: number) => Math.max(0, Math.min(100, n * 100));
  return (
    <div className="relative h-2 w-full rounded-full" style={{ background: track }}>
      <div className="h-2 rounded-full" style={{ width: `${clamp(value)}%`, background: fill }} />
      {marker !== undefined && (
        <div className="absolute -top-1 h-4 w-0.5 rounded bg-ink" style={{ left: `calc(${clamp(marker)}% - 1px)` }} />
      )}
    </div>
  );
}
