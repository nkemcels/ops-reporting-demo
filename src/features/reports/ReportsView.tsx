"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, Download, Printer, Send } from "lucide-react";
import { Button, Select } from "@/components/ui";
import { buildMonthlyReport, monthlySeries } from "@/lib/reporting";
import { useAvailableMonths, useData } from "@/lib/state/data-store";
import { downloadCsv } from "@/lib/utils/download";
import { monthLabel } from "@/lib/utils/months";
import { windowMonths } from "@/lib/utils/period";
import { TEAM_OPTIONS, type TeamFilter, monthOptions } from "@/features/shared/filter-options";
import { ReportDocument } from "./ReportDocument";
import { reportToCsv } from "./report-format";

/** Months whose reports were already published before this demo session. */
const PUBLISHED_BEFORE = new Set(["2026-06", "2026-07", "2026-08"]);

/**
 * Generate, review and publish the monthly report. Generation is instant and
 * deterministic; publishing would snapshot the report and notify recipients.
 */
export function ReportsView() {
  const { dataset, batches } = useData();
  const { months, latest } = useAvailableMonths();
  const requested = useSearchParams().get("month");

  const [monthChoice, setMonthChoice] = useState<string | null>(null);
  const [team, setTeam] = useState<TeamFilter>("all");
  const [publishedNow, setPublishedNow] = useState<Set<string>>(new Set());

  // Priority: explicit selection → ?month= deep link → latest month with data.
  const month = [monthChoice, requested, latest].find((m): m is string => !!m && months.includes(m))!;

  const report = useMemo(() => buildMonthlyReport(dataset, month, team), [dataset, month, team]);
  const trend = useMemo(
    () => monthlySeries(dataset, { months: windowMonths(month, "6").filter((m) => months.includes(m)), team }),
    [dataset, month, team, months],
  );

  const sources = useMemo(() => {
    const uploads = batches.filter((b) => b.months.includes(month)).map((b) => `${b.fileName} (${b.importedBy})`);
    return uploads.length ? uploads : [`Month-end uploads for ${monthLabel(month, true)} (closed)`];
  }, [batches, month]);

  const key = `${month}|${team}`;
  const isPublished = PUBLISHED_BEFORE.has(month) || publishedNow.has(key);

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Monthly reports</h1>
          <p className="mt-1 text-sm text-ink-2">
            The same structure every month, generated from the uploaded data. Nothing is typed in by hand.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select label="Report month" value={month} onChange={setMonthChoice} options={monthOptions(months)} />
          <Select label="Scope" value={team} onChange={(v) => setTeam(v as TeamFilter)} options={TEAM_OPTIONS} />
          <Button onClick={() => downloadCsv(reportToCsv(report), `delivery_report_${month}.csv`)}>
            <Download size={15} /> CSV
          </Button>
          <Button onClick={() => window.print()}>
            <Printer size={15} /> Print / PDF
          </Button>
          <Button
            variant="primary"
            disabled={isPublished}
            onClick={() => setPublishedNow((s) => new Set(s).add(key))}
          >
            {isPublished ? <CheckCircle2 size={15} /> : <Send size={15} />}
            {isPublished ? "Published" : "Publish to leadership"}
          </Button>
        </div>
      </div>

      {publishedNow.has(key) && (
        <div className="no-print mx-auto mb-4 max-w-[900px] rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-good-text">
          Report locked and shared with 6 recipients. In the full build, a snapshot is stored so later corrections are
          tracked as a revision rather than silently changing a published report.
        </div>
      )}

      <ReportDocument report={report} trend={trend} sources={sources} status={isPublished ? "published" : "draft"} />
    </div>
  );
}
