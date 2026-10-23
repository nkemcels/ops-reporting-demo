/**
 * Domain model. These mirror the PostgreSQL tables one-to-one (see the
 * "How it's built" page for the schema), so swapping the demo data source
 * for the real database does not change any component.
 */

export type TeamId = "platform" | "data" | "design" | "qa" | "cloud";

export interface Team {
  id: TeamId;
  name: string;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  team: TeamId;
  /** Fully loaded internal cost per hour (salary + overhead). */
  costRate: number;
  /** Rate charged to the client per billable hour. */
  billRate: number;
  /** Available working hours per month. */
  capacity: number;
}

export type ContractType = "Fixed fee" | "Time & materials";

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  team: TeamId;
  leadId: string;
  contract: ContractType;
  /** Delivery cost budget (labor + expenses). */
  budget: number;
  startMonth: string; // YYYY-MM
  endMonth: string; // YYYY-MM
  /** % complete as reported by the team lead at the latest month close. */
  percentComplete: number;
  /** % complete reported at each month close (YYYY-MM → 0–100). */
  progress: Record<string, number>;
}

/** One row per person × project × month (imports aggregate into this grain). */
export interface TimeEntry {
  month: string; // YYYY-MM
  projectId: string;
  personId: string;
  hours: number;
  billableHours: number;
  cost: number;
  revenue: number;
  source: string; // "seed" | import batch id
}

export interface Expense {
  month: string;
  projectId: string;
  category: string;
  amount: number;
  source: string;
}

export interface ImportBatch {
  id: string;
  kind: ImportKind;
  fileName: string;
  importedAt: string; // ISO
  importedBy: string;
  rowsRead: number;
  rowsImported: number;
  rowsSkipped: number;
  warnings: number;
  months: string[];
  entries: TimeEntry[];
  expenses: Expense[];
}

export type ImportKind = "timesheet" | "expenses";

export type HealthStatus = "on-track" | "at-risk" | "off-track" | "complete";
