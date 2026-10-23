# Meridian: Delivery Reporting (preview)

An internal reporting tool that gives management one view of **project performance, team utilization and delivery cost**, replacing the spreadsheets and hand-maintained monthly reports.

This is a **front-end preview** built to show the product and the approach. It runs entirely in the browser on realistic generated data, so it can be clicked through without a backend. The production build adds PostgreSQL, authentication and server-side imports; see *Preview vs full build* below.

## What to try

1. **Overview** (`/`): KPIs vs the prior period, 12-month trends, utilization by team, budget-burn vs progress, and the projects that need attention. Hover the ⓘ icons to see how each number is calculated.
2. **Data imports** (`/imports`): click **Use sample** to load September's timesheet export (CSV, ~1,400 rows with deliberately messy headers and 11 planted problems). Walk through column mapping → validation → import. Then switch to **Project expenses** and import the Excel sample.
3. Go back to the **Overview**: September now appears and every figure includes it. **Undo** in the import history removes exactly that batch.
4. **Monthly reports** (`/reports`): the September report, with an executive summary written from the numbers. Export to CSV or **Print / PDF**.
5. **How it's built** (`/architecture`): pipeline, metric definitions and the PostgreSQL schema.

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to out/ (every page is pre-rendered)
```

Deployment notes (nginx, deploy script, clean removal) are in [`deploy/README.md`](deploy/README.md).

Requires Node 20+.

## Project structure

```
src/
├── app/                      Routes only. Each page renders a feature view.
├── features/                 One folder per screen: the view + its components
│   ├── overview/
│   ├── projects/
│   ├── utilization/
│   ├── imports/              Import wizard: steps/, history, step indicator
│   ├── reports/              Report document, CSV export formatting
│   ├── architecture/
│   └── shared/               Filter options used by several screens
├── components/
│   ├── ui/                   Design-system primitives (Card, Button, Select, StatusBadge…)
│   ├── charts/               Recharts wrappers with a shared theme
│   └── layout/               App shell: sidebar, top bar
└── lib/                      Framework-free TypeScript (no React)
    ├── domain/types.ts       Domain model, mirrors the database tables
    ├── data/                 Reference data + deterministic seed generator (demo only)
    ├── reporting/            ALL business calculations (see below)
    ├── imports/              Parse → auto-map → coerce → validate → build batch
    ├── state/                Client store (demo stand-in for the database)
    └── utils/                Months, formatting, text matching, downloads
```

**Rule of thumb:** UI components never calculate business numbers. They call `lib/reporting`, which is pure and framework-free, so the same functions can back API routes, be unit-tested, or be swapped for SQL views without touching the UI.

## How data imports work

`src/lib/imports/` runs the same pipeline the wizard shows:

| Stage | File | What it does |
|---|---|---|
| Parse | `parse-file.ts` | CSV via PapaParse, Excel via SheetJS (sheet picker for multi-sheet workbooks) |
| Map | `auto-map.ts` | Matches file headers to report fields: exact → known alias (`Hrs`, `Proj Code`) → fuzzy (one typo, substring). The user can override any match. |
| Coerce | `coerce.ts` | Dates (ISO, US/EU, Excel serials, timezone-safe), numbers with `$`/`,`/accounting negatives, yes/no flags |
| Validate | `validate-rows.ts` | Required fields, ranges (0–24 h), unknown projects/people with *"did you mean…?"* suggestions, duplicates, future dates, closed projects. **Errors** block a row; **warnings** don't. |
| Commit | `build-batch.ts` | Rolls daily lines up to person × project × month, prices them at the person's rates, and tags every row with its batch id so an import can be undone as a unit |

Import types are declared in `schemas.ts`. Adding a new one (budgets, forecasts) means adding a schema plus a commit function; the wizard UI is generic.

## How reporting calculations work

`src/lib/reporting/` holds one definition per metric, used by every screen, the report and the exports:

| Metric | Definition |
|---|---|
| Revenue | billable hours × bill rate |
| Delivery cost | project hours × loaded cost rate + project expenses (internal time excluded) |
| Gross margin % | (revenue − delivery cost) ÷ revenue |
| Billable utilization | billable hours ÷ capacity hours |
| Earned value | % complete × budget |
| CPI | earned value ÷ actual cost |
| Forecast at completion | budget ÷ CPI |

Thresholds (margin and utilization targets, CPI risk bands) live in `targets.ts`. Reports are computed from raw rows every time, never from stored totals, so corrections and rolled-back imports flow through immediately and a closed month always reproduces its published numbers.

## Preview vs full build

| In this preview | In the production build |
|---|---|
| Data generated in the browser; uploads saved to `localStorage` | PostgreSQL (schema on the *How it's built* page); imports committed in one transaction |
| Validation runs client-side | Same rules re-run server-side before commit |
| No login | SSO with roles: Admin, Team lead (uploads for own team), Viewer |
| "Publish" is simulated | Report snapshots, revision history, email distribution |
| Reference data is hard-coded | Admin screens for people, rates, projects, targets |
