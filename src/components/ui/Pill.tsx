import clsx from "clsx";

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "brand" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11.5px] font-medium",
        tone === "brand" ? "bg-brand-soft text-brand" : "bg-surface-2 text-ink-2",
      )}
    >
      {children}
    </span>
  );
}
