import { INTERNAL_PROJECT, PEOPLE } from "@/lib/data/reference-data";
import { PROJECTS } from "@/lib/data/seed";
import { closestMatch } from "@/lib/utils/text";
import type { Mapping } from "./auto-map";
import { isBlank, parseBool, parseDate, parseNumber, toIsoDate } from "./coerce";
import type { RawRow } from "./parse-file";
import type { FieldDef, ImportSchema } from "./schemas";

/**
 * Row validation. Two severities:
 *   error   – the row can't be imported as-is (bad number, unknown project, …)
 *   warning – importable but worth a second look (13.5 h day, duplicate row, …)
 * Errors always block a row; warnings never do. The user decides whether to
 * fix the source file and re-upload or import the clean rows now.
 */

export interface Issue {
  field: string; // field key, or "_row" for row-level rules
  severity: "error" | "warning";
  message: string;
}

export interface ValidatedRow {
  /** Row number as the user sees it in Excel (header is row 1). */
  line: number;
  raw: RawRow;
  /** Coerced values keyed by field key (ids for project/person). */
  values: Record<string, unknown>;
  issues: Issue[];
  status: "valid" | "warning" | "error";
}

const MAX_HOURS_PER_DAY = 24;
const LONG_DAY_HOURS = 12;

// Reference lookups. In production these come from the DB for the uploader's org.
const projectsByCode = new Map([...PROJECTS, INTERNAL_PROJECT].map((p) => [p.code.toUpperCase(), p]));
const projectsByName = new Map(PROJECTS.map((p) => [p.name.toLowerCase(), p]));
const peopleByName = new Map(PEOPLE.map((p) => [p.name.toLowerCase(), p]));
const peopleByEmail = new Map(
  PEOPLE.map((p) => [
    `${p.name.normalize("NFD").replace(/[^a-zA-Z ]/g, "").toLowerCase().replace(" ", ".")}@meridian.co`,
    p,
  ]),
);

type Report = (field: string, message: string) => void;

/** Coerce and check one cell according to its field type. Returns the clean value (or undefined). */
function validateCell(field: FieldDef, raw: unknown, today: Date, error: Report, warn: Report): unknown {
  const text = String(raw).trim();

  switch (field.type) {
    case "date": {
      const d = parseDate(raw);
      if (!d) return error(field.key, `"${text}" is not a valid date`);
      if (d > today) warn(field.key, "Date is in the future");
      return toIsoDate(d);
    }
    case "hours": {
      const n = parseNumber(raw);
      if (n === null) return error(field.key, `"${text}" is not a number`);
      if (n <= 0 || n > MAX_HOURS_PER_DAY) return error(field.key, `${n} h is outside 0–${MAX_HOURS_PER_DAY}`);
      if (n > LONG_DAY_HOURS) warn(field.key, `${n} h in one day. Check for a typo`);
      return n;
    }
    case "money":
    case "number": {
      const n = parseNumber(raw);
      if (n === null) return error(field.key, `"${text}" is not a number`);
      if (field.type === "money" && n <= 0) {
        return error(field.key, "Amount must be positive (credit notes go in a separate import)");
      }
      return n;
    }
    case "boolean": {
      const b = parseBool(raw);
      if (b === null) warn(field.key, `"${text}" not recognised; treated as billable`);
      return b ?? true;
    }
    case "project": {
      const p = projectsByCode.get(text.toUpperCase()) ?? projectsByName.get(text.toLowerCase());
      if (!p) {
        const hint = closestMatch(text, [...projectsByCode.keys()]);
        return error(field.key, `Unknown project "${text}"${hint ? `. Did you mean ${hint}?` : ""}`);
      }
      if (p.percentComplete >= 100) warn(field.key, `${p.code} is marked complete`);
      return p.id;
    }
    case "person": {
      const p = peopleByName.get(text.toLowerCase()) ?? peopleByEmail.get(text.toLowerCase());
      if (!p) {
        const hint = closestMatch(text, PEOPLE.map((x) => x.name));
        return error(field.key, `"${text}" is not on the staff roster${hint ? `. Did you mean ${hint}?` : ""}`);
      }
      return p.id;
    }
    default:
      return text;
  }
}

export function validateRows(
  rows: RawRow[],
  mapping: Mapping,
  schema: ImportSchema,
  today = new Date(),
): ValidatedRow[] {
  // Signature of each clean row → first line it appeared on, for duplicate detection.
  const firstSeen = new Map<string, number>();

  return rows.map((raw, i) => {
    const line = i + 2;
    const values: Record<string, unknown> = {};
    const issues: Issue[] = [];
    const error: Report = (field, message) => void issues.push({ field, severity: "error", message });
    const warn: Report = (field, message) => void issues.push({ field, severity: "warning", message });

    // Cell-level rules.
    for (const field of schema.fields) {
      const column = mapping[field.key];
      const cell = column ? raw[column] : undefined;
      if (isBlank(cell)) {
        if (field.required) error(field.key, `${field.label} is required`);
        continue;
      }
      const value = validateCell(field, cell, today, error, warn);
      if (value !== undefined) values[field.key] = value;
    }

    // Row-level rules.
    if (schema.kind === "timesheet" && values.project) {
      if (values.billable === undefined) values.billable = values.project !== INTERNAL_PROJECT.id;
      if (values.project === INTERNAL_PROJECT.id && values.billable === true) {
        warn("billable", "Internal time marked billable; imported as non-billable");
        values.billable = false;
      }
    }
    if (!issues.some((x) => x.severity === "error")) {
      const signature = schema.fields.map((f) => String(values[f.key] ?? "")).join("|");
      const earlier = firstSeen.get(signature);
      if (earlier !== undefined) warn("_row", `Duplicate of row ${earlier}`);
      else firstSeen.set(signature, line);
    }

    const status = issues.some((x) => x.severity === "error") ? "error" : issues.length ? "warning" : "valid";
    return { line, raw, values, issues, status };
  });
}

export const isDuplicate = (row: ValidatedRow) => row.issues.some((x) => x.message.startsWith("Duplicate"));

export function countByStatus(rows: ValidatedRow[]) {
  return {
    total: rows.length,
    valid: rows.filter((r) => r.status === "valid").length,
    warning: rows.filter((r) => r.status === "warning").length,
    error: rows.filter((r) => r.status === "error").length,
  };
}
