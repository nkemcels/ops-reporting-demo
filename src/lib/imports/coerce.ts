/**
 * Turn loosely typed spreadsheet cells into clean values. Each function returns
 * null when the input can't be interpreted, and the validator turns that into
 * a row-level error the user can see and fix.
 */

export function isBlank(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

/**
 * Accepts Date objects (from Excel), Excel serial numbers, ISO dates, and
 * US / European slash dates. Returns a UTC-midnight Date, or null when the
 * date doesn't exist (e.g. 2026-09-31).
 */
export function parseDate(v: unknown): Date | null {
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    // SheetJS returns local-midnight dates, sometimes a few seconds early.
    // Snap to the nearest calendar day so timezones can't shift the date.
    const r = new Date(v.getTime() + 12 * 3600 * 1000);
    return new Date(Date.UTC(r.getFullYear(), r.getMonth(), r.getDate()));
  }
  if (typeof v === "number" && v > 20000 && v < 80000) {
    // Excel serial (1900 date system): days since 1899-12-30.
    return new Date(Math.round((v - 25569) * 86400 * 1000));
  }

  const s = String(v).trim();
  let y: number, m: number, d: number;
  let match = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) {
    const a = Number(match[1]);
    const b = Number(match[2]);
    // Prefer US month/day; switch to day/month only when the first part can't be a month.
    // Production would make the convention a per-template setting instead of guessing.
    [m, d] = a > 12 ? [b, a] : [a, b];
    y = Number(match[3]);
  } else {
    const t = Date.parse(s);
    if (isNaN(t)) return null;
    const dt = new Date(t);
    [y, m, d] = [dt.getFullYear(), dt.getMonth() + 1, dt.getDate()];
  }

  // Round-trip check rejects impossible dates that Date() would silently roll over.
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

/** Numbers with currency symbols, thousands separators, or accounting-style (negatives). */
export function parseNumber(v: unknown): number | null {
  if (typeof v === "number") return isFinite(v) ? v : null;
  let s = String(v).trim();
  const accountingNegative = /^\(.*\)$/.test(s);
  s = s.replace(/[()$€£,\s]/g, "").replace(/usd$/i, "");
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  const n = Number(s);
  return accountingNegative ? -n : n;
}

const TRUE_VALUES = ["yes", "y", "true", "1", "billable", "x"];
const FALSE_VALUES = ["no", "n", "false", "0", "non-billable", "nonbillable", "internal"];

export function parseBool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (TRUE_VALUES.includes(s)) return true;
  if (FALSE_VALUES.includes(s)) return false;
  return null;
}

export const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);
