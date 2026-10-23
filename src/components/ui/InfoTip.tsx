import clsx from "clsx";
import { Info } from "lucide-react";

/**
 * Hover/focus explanation, used to show the formula behind each metric so
 * managers can trust (and challenge) the numbers.
 */
export function InfoTip({ children, align = "center" }: { children: React.ReactNode; align?: "center" | "end" }) {
  return (
    <span className="group relative inline-flex" tabIndex={0}>
      <Info size={13} className="cursor-help text-ink-3" />
      <span
        role="tooltip"
        className={clsx(
          "pointer-events-none invisible absolute top-5 z-30 w-64 rounded-lg bg-ink px-3 py-2 text-[12px] font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100",
          align === "center" ? "left-1/2 -translate-x-1/2" : "right-0",
        )}
      >
        {children}
      </span>
    </span>
  );
}
