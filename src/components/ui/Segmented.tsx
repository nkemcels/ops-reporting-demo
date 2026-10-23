import clsx from "clsx";

/** Small toggle group for mutually exclusive options (e.g. Month / Quarter / 12 months). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="radiogroup" className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
            value === o.value ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
