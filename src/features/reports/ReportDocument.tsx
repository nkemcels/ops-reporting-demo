import clsx from "clsx";
import { RevenueCostChart } from "@/components/charts";
import { StatusBadge } from "@/components/ui";
import { teamName } from "@/lib/data/lookups";
import { MARGIN_TARGET, UTILIZATION_TARGET, type MonthlyReport } from "@/lib/reporting";
import { money, pct } from "@/lib/utils/format";
import { monthLabel } from "@/lib/utils/months";
import { formatChange, formatMetric } from "./report-format";

const th = "py-2 pr-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-3";
const td = "py-2 pr-3 tabular";

/**
 * The report as a document: an A4-proportioned sheet on screen that prints
 * cleanly to PDF (app chrome is hidden by the print stylesheet).
 */
export function ReportDocument({
  report,
  trend,
  sources,
  status,
}: {
  report: MonthlyReport;
  trend: Parameters<typeof RevenueCostChart>[0]["data"];
  sources: string[];
  status: "draft" | "published";
}) {
  const scope = report.team === "all" ? "All teams" : teamName(report.team);

  return (
    <article className="print-sheet mx-auto max-w-[900px] rounded-2xl border border-line bg-white px-12 py-10 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      {/* Masthead */}
      <header className="flex items-start justify-between border-b-2 border-ink pb-5">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-2">
            <span className="grid h-5 w-5 place-items-center rounded bg-brand text-[10px] text-white">M</span>
            Meridian · Delivery reporting
          </div>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight">Monthly delivery report</h1>
          <p className="mt-1 text-[15px] text-ink-2">
            {monthLabel(report.month, true)} · {scope}
          </p>
        </div>
        <div className="text-right text-[12px] text-ink-2">
          <span
            className={clsx(
              "inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              status === "published" ? "bg-green-50 text-good-text" : "bg-amber-50 text-[#8a5a00]",
            )}
          >
            {status === "published" ? "Published" : "Draft"}
          </span>
          <div className="mt-2">Prepared for the management team</div>
          <div>Generated {new Date(report.generatedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</div>
        </div>
      </header>

      <Section title="Summary">
        <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed">
          {report.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </Section>

      <Section title="Key metrics">
        <table className="w-full text-[13px]">
          <thead className="border-b border-line">
            <tr>
              <th className={th}>Metric</th>
              <th className={clsx(th, "text-right")}>{monthLabel(report.month)}</th>
              <th className={clsx(th, "text-right")}>{monthLabel(report.previousMonth)}</th>
              <th className={clsx(th, "text-right")}>Change</th>
              <th className={clsx(th, "text-right")}>Year to date</th>
            </tr>
          </thead>
          <tbody>
            {report.kpis.map((k) => {
              const delta = formatChange(k);
              const isSubRow = k.label.startsWith("  ");
              return (
                <tr key={k.label} className="border-b border-line last:border-0">
                  <td className={clsx("py-2 pr-3", isSubRow ? "pl-4 text-ink-2" : "font-medium")}>{k.label.trim()}</td>
                  <td className={clsx(td, "text-right font-medium")}>{formatMetric(k.format, k.current)}</td>
                  <td className={clsx(td, "text-right text-ink-2")}>{formatMetric(k.format, k.previous)}</td>
                  <td
                    className={clsx(
                      td,
                      "text-right",
                      delta.good === null ? "text-ink-3" : delta.good ? "text-good-text" : "text-[#b42318]",
                    )}
                  >
                    {delta.text}
                  </td>
                  <td className={clsx(td, "text-right text-ink-2")}>{formatMetric(k.format, k.yearToDate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      <Section title="Revenue vs delivery cost, last 6 months">
        <RevenueCostChart data={trend} height={190} />
      </Section>

      <Section title="Team performance">
        <table className="w-full text-[13px]">
          <thead className="border-b border-line">
            <tr>
              <th className={th}>Team</th>
              <th className={clsx(th, "text-right")}>Revenue</th>
              <th className={clsx(th, "text-right")}>Delivery cost</th>
              <th className={clsx(th, "text-right")}>Margin</th>
              <th className={clsx(th, "text-right")}>Utilization</th>
            </tr>
          </thead>
          <tbody>
            {report.teams.map((t) => (
              <tr key={t.id} className="border-b border-line last:border-0">
                <td className="py-2 pr-3 font-medium">{t.name}</td>
                <td className={clsx(td, "text-right")}>{money(t.revenue)}</td>
                <td className={clsx(td, "text-right")}>{money(t.deliveryCost)}</td>
                <td className={clsx(td, "text-right", t.revenue && t.marginPct < MARGIN_TARGET && "text-[#b42318]")}>
                  {t.revenue ? pct(t.marginPct, 1) : "n/a"}
                </td>
                <td className={clsx(td, "text-right", t.utilization < UTILIZATION_TARGET && "text-[#b42318]")}>
                  {pct(t.utilization, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[11.5px] text-ink-3">
          Red marks a figure below target (margin {pct(MARGIN_TARGET)}, utilization {pct(UTILIZATION_TARGET)}). Margin is
          n/a for teams whose projects this month were internal.
        </p>
      </Section>

      <Section title="Project status" breakBefore>
        <table className="w-full text-[12.5px]">
          <thead className="border-b border-line">
            <tr>
              <th className={th}>Project</th>
              <th className={th}>Status</th>
              <th className={clsx(th, "text-right")}>Month cost</th>
              <th className={clsx(th, "text-right")}>Budget used</th>
              <th className={clsx(th, "text-right")}>Complete</th>
              <th className={clsx(th, "text-right")}>CPI</th>
              <th className={clsx(th, "text-right")}>Forecast variance</th>
            </tr>
          </thead>
          <tbody>
            {report.projects.map((h) => (
              <tr key={h.project.id} className="border-b border-line align-top last:border-0">
                <td className="py-2 pr-3">
                  <div className="font-medium">{h.project.name}</div>
                  <div className="text-[11.5px] text-ink-3">
                    {h.project.code} · {h.project.client}
                  </div>
                  {h.reasons.length > 0 && <div className="mt-0.5 text-[11.5px] text-[#a32626]">{h.reasons.join(" · ")}</div>}
                </td>
                <td className="py-2 pr-3">
                  <StatusBadge status={h.status} />
                </td>
                <td className={clsx(td, "text-right")}>{money(h.periodCost)}</td>
                <td className={clsx(td, "text-right")}>{pct(h.burn)}</td>
                <td className={clsx(td, "text-right")}>{pct(h.percentComplete)}</td>
                <td className={clsx(td, "text-right")}>{h.cpi.toFixed(2)}</td>
                <td className={clsx(td, "text-right font-medium", h.vac < 0 ? "text-[#a32626]" : "text-good-text")}>
                  {h.vac < 0 ? "−" : "+"}
                  {money(Math.abs(h.vac))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <footer className="mt-8 border-t border-line pt-4 text-[11.5px] leading-relaxed text-ink-3">
        <p>
          <b className="text-ink-2">Definitions.</b> Revenue = billable hours × bill rate. Delivery cost = project hours ×
          loaded cost rate + project expenses (internal time excluded). Utilization = billable hours ÷ capacity hours.
          CPI = earned value (% complete × budget) ÷ actual cost. Forecast variance = budget − budget ÷ CPI.
        </p>
        <p className="mt-1.5">
          <b className="text-ink-2">Data sources.</b> {sources.join(" · ")}
        </p>
      </footer>
    </article>
  );
}

function Section({ title, children, breakBefore }: { title: string; children: React.ReactNode; breakBefore?: boolean }) {
  return (
    <section className={clsx("mt-7", breakBefore && "print-break")}>
      <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-2">{title}</h2>
      {children}
    </section>
  );
}
