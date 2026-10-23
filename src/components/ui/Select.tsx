import clsx from "clsx";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

/** Native <select> (accessible and mobile-friendly) with app styling. */
export function Select({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  /** Screen-reader label; filters sit in toolbars without visible labels. */
  label: string;
}) {
  return (
    <label className={clsx("relative inline-flex items-center", className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-line bg-surface py-2 pl-3 pr-8 text-[13.5px] text-ink outline-none hover:bg-surface-2 focus:border-brand"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-2.5 text-ink-3" />
    </label>
  );
}
