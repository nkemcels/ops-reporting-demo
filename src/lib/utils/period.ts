import { addMonths, monthLabel, monthRange } from "./months";

/** Rolling reporting window, in months, ending at a selected month. */
export type WindowSize = "1" | "3" | "6" | "12";

export const WINDOW_OPTIONS: { value: WindowSize; label: string }[] = [
  { value: "1", label: "Month" },
  { value: "3", label: "Quarter" },
  { value: "6", label: "6 months" },
  { value: "12", label: "12 months" },
];

export function windowMonths(end: string, size: WindowSize): string[] {
  return monthRange(addMonths(end, -(Number(size) - 1)), end);
}

/** The equally sized window immediately before, used for period-over-period deltas. */
export function previousWindow(end: string, size: WindowSize): string[] {
  return windowMonths(addMonths(end, -Number(size)), size);
}

export function describeWindow(months: string[]): string {
  if (months.length === 1) return monthLabel(months[0], true);
  return `${monthLabel(months[0])} – ${monthLabel(months[months.length - 1])}`;
}
