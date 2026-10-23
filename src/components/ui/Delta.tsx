import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

/**
 * Period-over-period change. Color encodes good/bad, not up/down:
 * cost going up is red, revenue going up is green.
 */
export function Delta({
  value,
  format,
  goodWhenUp = true,
}: {
  value: number;
  format: (n: number) => string;
  goodWhenUp?: boolean;
}) {
  const flat = Math.abs(value) < 0.0005;
  const good = flat ? null : value > 0 === goodWhenUp;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 text-[12.5px] font-medium",
        good === null ? "text-ink-3" : good ? "text-good-text" : "text-[#b42318]",
      )}
    >
      {!flat && <Icon size={14} strokeWidth={2.2} />}
      {format(value)}
    </span>
  );
}
