import type { ImportKind } from "@/lib/domain/types";

/**
 * Import targets. Each schema lists the fields the reporting model needs, which
 * are required, how values are coerced, and the header spellings team leads
 * actually use. Adding a new import type (e.g. budgets, forecasts) means adding
 * a schema here plus a commit step in build-batch.ts; the wizard UI is generic.
 */

export type FieldType = "date" | "project" | "person" | "number" | "hours" | "boolean" | "text" | "money";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  description: string;
  /** Header spellings seen in the wild; used by auto-mapping. */
  aliases: string[];
}

export interface ImportSchema {
  kind: ImportKind;
  title: string;
  description: string;
  fields: FieldDef[];
}

export const SCHEMAS: Record<ImportKind, ImportSchema> = {
  timesheet: {
    kind: "timesheet",
    title: "Timesheet hours",
    description: "Hours logged per person, per project, per day. Drives utilization, labor cost and revenue.",
    fields: [
      { key: "date", label: "Work date", type: "date", required: true, description: "Day the work was done", aliases: ["date", "work date", "day", "entry date", "worked on", "timesheet date"] },
      { key: "project", label: "Project code", type: "project", required: true, description: "PRJ code or exact project name", aliases: ["project", "project code", "proj code", "proj", "job", "job code", "project id", "engagement"] },
      { key: "person", label: "Employee", type: "person", required: true, description: "Full name or work email", aliases: ["employee", "name", "resource", "staff", "person", "consultant", "team member", "email"] },
      { key: "hours", label: "Hours", type: "hours", required: true, description: "Decimal hours (0–24)", aliases: ["hours", "hrs", "time", "duration", "qty", "hours logged"] },
      { key: "billable", label: "Billable", type: "boolean", required: false, description: "Yes / No. Defaults to Yes for client projects", aliases: ["billable", "billable?", "is billable", "bill", "chargeable"] },
      { key: "notes", label: "Notes", type: "text", required: false, description: "Free text, kept for audit", aliases: ["notes", "comments", "comment", "description", "task"] },
    ],
  },
  expenses: {
    kind: "expenses",
    title: "Project expenses",
    description: "Non-labor delivery costs: licences, hosting, contractors, travel.",
    fields: [
      { key: "date", label: "Expense date", type: "date", required: true, description: "Invoice or transaction date", aliases: ["date", "invoice date", "transaction date", "expense date", "posted"] },
      { key: "project", label: "Project code", type: "project", required: true, description: "PRJ code or exact project name", aliases: ["project", "project code", "proj code", "job", "cost centre", "cost center"] },
      { key: "category", label: "Category", type: "text", required: true, description: "Expense category", aliases: ["category", "type", "expense type", "gl category", "account"] },
      { key: "amount", label: "Amount", type: "money", required: true, description: "Positive amount in USD", aliases: ["amount", "amount (usd)", "total", "cost", "value", "net amount"] },
      { key: "vendor", label: "Vendor", type: "text", required: false, description: "Supplier name", aliases: ["vendor", "supplier", "payee", "merchant"] },
    ],
  },
};
