import Link from "next/link";
import { ArrowRight, UploadCloud } from "lucide-react";
import { monthLabel } from "@/lib/utils/months";

/** Nudge shown while the current month-end close has no uploaded data yet. */
export function MonthEndBanner({ month }: { month: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-[#c9d6f7] bg-brand-soft px-4 py-3 text-[13.5px]">
      <UploadCloud size={18} className="text-brand" />
      <span>
        <b>{monthLabel(month, true)} month-end is open.</b>{" "}
        <span className="text-ink-2">Timesheets and expenses haven&apos;t been uploaded by 5 of 5 team leads yet.</span>
      </span>
      <Link href="/imports" className="ml-auto inline-flex items-center gap-1 font-medium text-brand hover:underline">
        Upload data <ArrowRight size={14} />
      </Link>
    </div>
  );
}
