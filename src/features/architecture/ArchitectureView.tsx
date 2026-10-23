import { ArrowRight, Check, Clock } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { CPI_AT_RISK, CPI_OFF_TRACK, MARGIN_TARGET, UTILIZATION_TARGET } from "@/lib/reporting";
import { pct } from "@/lib/utils/format";
import { DB_SCHEMA_SQL, REPORTING_VIEW_SQL } from "./schema-sql";

const STACK = [
  { layer: "App", choice: "Next.js (App Router) + TypeScript", why: "One codebase for UI and API routes; server components query the database directly." },
  { layer: "Database", choice: "PostgreSQL + Drizzle ORM", why: "Typed queries and migrations; reporting logic lives in SQL views close to the data." },
  { layer: "Imports", choice: "SheetJS + PapaParse + Zod", why: "Reads .xlsx/.csv; the same validation rules run in the browser (instant feedback) and on the server (trust boundary)." },
  { layer: "Charts", choice: "Recharts", why: "Composable SVG charts; prints cleanly into PDF reports." },
  { layer: "Auth", choice: "Auth.js with company SSO", why: "Roles: Admin, Team lead (upload for own team), Viewer (management)." },
  { layer: "PDF", choice: "Print stylesheet → headless Chrome", why: "The report page is the template, so on-screen and PDF never drift." },
];

const PIPELINE = [
  { title: "Upload", detail: "CSV / Excel, any column names" },
  { title: "Map", detail: "Auto-match headers, user confirms; mapping saved per template" },
  { title: "Validate", detail: "Types, required fields, reference checks, duplicates" },
  { title: "Stage", detail: "Raw rows + issues kept in import_rows for audit" },
  { title: "Commit", detail: "One transaction per batch; re-upload replaces, undo deletes" },
  { title: "Report", detail: "SQL views → dashboards, monthly report, exports" },
];

const METRICS = [
  { name: "Revenue", formula: "Σ billable hours × person bill rate", note: "Rates captured at import time, so closed months don't change." },
  { name: "Delivery cost", formula: "Σ project hours × loaded cost rate + project expenses", note: "Internal / non-billable time is overhead, not delivery cost." },
  { name: "Gross margin %", formula: "(revenue − delivery cost) ÷ revenue", note: `Target ${pct(MARGIN_TARGET)}.` },
  { name: "Billable utilization", formula: "billable hours ÷ capacity hours", note: `Capacity = contracted hours per person per month. Target ${pct(UTILIZATION_TARGET)}.` },
  { name: "Earned value (EV)", formula: "% complete × budget", note: "% complete is reported by the team lead at each month-end." },
  { name: "CPI", formula: "EV ÷ actual cost to date", note: `At risk below ${CPI_AT_RISK}, off track below ${CPI_OFF_TRACK}.` },
  { name: "Forecast at completion", formula: "budget ÷ CPI", note: "Forecast variance = budget − forecast; negative is an overrun." },
];

const DEMO_STATUS = [
  { done: true, item: "Dashboards, project health, utilization heatmap and drill-downs" },
  { done: true, item: "CSV / Excel parsing, column auto-mapping, row validation, issue report, undo" },
  { done: true, item: "Monthly report with auto-written summary, CSV export and print-to-PDF" },
  { done: true, item: "All calculations as isolated, typed functions (src/lib/reporting)" },
  { done: false, item: "PostgreSQL schema, migrations and server-side commit (data is in-browser in this preview)" },
  { done: false, item: "Authentication, roles and per-team upload permissions" },
  { done: false, item: "Saved mapping templates, report snapshots and email distribution" },
  { done: false, item: "Admin screens for people, rates, projects and targets" },
];

/** Static explainer page: architecture, import pipeline, metric definitions, schema. */
export function ArchitectureView() {
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        title="How it's built"
        subtitle="Architecture, import pipeline and calculation rules behind this preview, and how it maps to the production build."
      />

      <Card title="Import pipeline" subtitle="From a team lead's spreadsheet to a number on the dashboard">
        <ol className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {PIPELINE.map((s, i) => (
            <li key={s.title} className="relative rounded-xl border border-line bg-page p-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-[11px] text-white">{i + 1}</span>
                {s.title}
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-ink-2">{s.detail}</p>
              {i < PIPELINE.length - 1 && (
                <ArrowRight size={14} className="absolute -right-3 top-4 z-10 hidden text-ink-3 xl:block" />
              )}
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Stack" bodyClassName="pt-1">
          <ul className="divide-y divide-line">
            {STACK.map((s) => (
              <li key={s.layer} className="py-2.5">
                <div className="flex items-baseline gap-2 text-[13px]">
                  <span className="w-20 shrink-0 text-ink-3">{s.layer}</span>
                  <span className="font-medium">{s.choice}</span>
                </div>
                <p className="mt-0.5 pl-22 text-[12px] text-ink-2">{s.why}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Preview vs full build">
          <ul className="space-y-2.5">
            {DEMO_STATUS.map((s) => (
              <li key={s.item} className="flex gap-2.5 text-[13px]">
                {s.done ? (
                  <Check size={16} className="mt-0.5 shrink-0" color="var(--good)" />
                ) : (
                  <Clock size={16} className="mt-0.5 shrink-0 text-ink-3" />
                )}
                <span className={s.done ? "" : "text-ink-2"}>{s.item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4" title="Metric definitions" subtitle="One definition per metric, used by every screen and report" bodyClassName="px-0 pb-2">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-y border-line bg-page text-left text-[11.5px] uppercase tracking-wide text-ink-3">
              <th className="px-5 py-2 font-medium">Metric</th>
              <th className="px-3 py-2 font-medium">Formula</th>
              <th className="px-5 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => (
              <tr key={m.name} className="border-b border-line last:border-0">
                <td className="px-5 py-2.5 font-medium">{m.name}</td>
                <td className="px-3 py-2.5">
                  <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[12px]">{m.formula}</code>
                </td>
                <td className="px-5 py-2.5 text-ink-2">{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="PostgreSQL schema (core tables)" subtitle="Facts at person × project × month grain; every row traces to an import batch">
          <CodeBlock code={DB_SCHEMA_SQL} />
        </Card>
        <Card title="Reporting view" subtitle="Dashboards read views like this, never ad-hoc spreadsheet logic">
          <CodeBlock code={REPORTING_VIEW_SQL} />
        </Card>
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-xl bg-[#14151a] p-4 text-[12px] leading-relaxed text-[#e6e6e1]">
      <code>{code.trim()}</code>
    </pre>
  );
}
