import clsx from "clsx";
import { Check } from "lucide-react";

export const WIZARD_STEPS = [
  { id: "upload", label: "Upload file" },
  { id: "map", label: "Map columns" },
  { id: "validate", label: "Review & validate" },
  { id: "done", label: "Imported" },
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number]["id"];

export function StepIndicator({ current }: { current: WizardStep }) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="flex flex-wrap items-center gap-2 text-[13px]">
      {WIZARD_STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={clsx(
                "grid h-6 w-6 place-items-center rounded-full text-[12px] font-semibold",
                done && "bg-brand text-white",
                active && "bg-ink text-white",
                !done && !active && "bg-surface-2 text-ink-3",
              )}
            >
              {done ? <Check size={13} strokeWidth={3} /> : i + 1}
            </span>
            <span className={clsx(active ? "font-semibold text-ink" : "text-ink-2")}>{step.label}</span>
            {i < WIZARD_STEPS.length - 1 && <span className="mx-1 h-px w-8 bg-line" />}
          </li>
        );
      })}
    </ol>
  );
}
