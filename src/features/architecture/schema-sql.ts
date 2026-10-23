/** SQL shown on the "How it's built" page: the planned production schema. */

export const DB_SCHEMA_SQL = `
-- Reference data
create table teams (
  id          text primary key,
  name        text not null
);

create table people (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       citext unique not null,
  team_id     text not null references teams(id),
  capacity_h  numeric(5,1) not null default 160   -- hours per month
);

-- Rates change over time; imports price hours at the rate valid that month
create table person_rates (
  person_id   uuid references people(id),
  valid_from  date not null,
  cost_rate   numeric(8,2) not null,
  bill_rate   numeric(8,2) not null,
  primary key (person_id, valid_from)
);

create table projects (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,              -- PRJ-1051
  name        text not null,
  client      text not null,
  team_id     text not null references teams(id),
  lead_id     uuid references people(id),
  contract    text check (contract in ('fixed_fee','time_materials')),
  budget      numeric(12,2) not null,
  start_month date not null,
  end_month   date not null
);

create table project_progress (                  -- % complete per month-end
  project_id  uuid references projects(id),
  month       date not null,
  pct_complete numeric(5,2) not null check (pct_complete between 0 and 100),
  primary key (project_id, month)
);

-- Imports: every fact row points at the batch that created it
create table import_batches (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('timesheet','expenses')),
  file_name   text not null,
  uploaded_by uuid not null references people(id),
  uploaded_at timestamptz not null default now(),
  mapping     jsonb not null,                    -- column mapping used
  rows_read   int not null,
  rows_imported int not null,
  status      text not null default 'committed'  -- committed | rolled_back
);

create table import_rows (                       -- raw rows + issues, for audit
  batch_id    uuid references import_batches(id) on delete cascade,
  line        int not null,
  raw         jsonb not null,
  issues      jsonb not null default '[]',
  primary key (batch_id, line)
);

-- Facts
create table time_entries (
  id          bigint generated always as identity primary key,
  batch_id    uuid not null references import_batches(id) on delete cascade,
  work_date   date not null,
  person_id   uuid not null references people(id),
  project_id  uuid not null references projects(id),
  hours       numeric(5,2) not null check (hours > 0 and hours <= 24),
  billable    boolean not null,
  cost        numeric(10,2) not null,            -- hours × cost rate at import
  revenue     numeric(10,2) not null             -- billable hours × bill rate
);
create index on time_entries (project_id, work_date);
create index on time_entries (person_id, work_date);

create table expenses (
  id          bigint generated always as identity primary key,
  batch_id    uuid not null references import_batches(id) on delete cascade,
  expense_date date not null,
  project_id  uuid not null references projects(id),
  category    text not null,
  vendor      text,
  amount      numeric(12,2) not null check (amount > 0)
);
`;

export const REPORTING_VIEW_SQL = `
-- Monthly financials per project. Dashboards, the monthly
-- report and exports all read from this one definition.
create view v_project_month as
with labor as (
  select project_id,
         date_trunc('month', work_date)::date as month,
         sum(hours)                            as hours,
         sum(hours) filter (where billable)    as billable_hours,
         sum(cost)                             as labor_cost,
         sum(revenue)                          as revenue
  from time_entries
  group by 1, 2
),
spend as (
  select project_id,
         date_trunc('month', expense_date)::date as month,
         sum(amount) as expense_cost
  from expenses
  group by 1, 2
),
months as (
  select project_id, month from labor
  union
  select project_id, month from spend
)
select p.id as project_id, p.code, p.team_id, m.month,
       coalesce(l.hours, 0)                          as hours,
       coalesce(l.billable_hours, 0)                 as billable_hours,
       coalesce(l.revenue, 0)                        as revenue,
       coalesce(l.labor_cost, 0)
         + coalesce(s.expense_cost, 0)               as delivery_cost
from months m
join projects p     on p.id = m.project_id
left join labor l   on l.project_id = m.project_id and l.month = m.month
left join spend s   on s.project_id = m.project_id and s.month = m.month;

-- Earned value per project at each month-end
create view v_project_health as
with running as (
  select project_id, month,
         sum(delivery_cost) over (partition by project_id
                                  order by month)   as cost_to_date
  from v_project_month
)
select r.project_id, r.month, r.cost_to_date,
       pr.pct_complete / 100 * p.budget              as earned_value,
       (pr.pct_complete / 100 * p.budget)
         / nullif(r.cost_to_date, 0)                 as cpi,
       p.budget / nullif((pr.pct_complete / 100 * p.budget)
         / nullif(r.cost_to_date, 0), 0)             as forecast_at_completion
from running r
join projects p          on p.id = r.project_id
join project_progress pr on pr.project_id = r.project_id
                        and pr.month = r.month;
`;
