/**
 * Reporting periods are calendar months encoded as "YYYY-MM" strings.
 * That keeps them sortable with plain string comparison and matches the
 * `date_trunc('month', …)` grain used by the database views.
 */

const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

/** Inclusive list of months from `from` to `to`. */
export function monthRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m);
  return out;
}

/** "Sep 26" by default, "September 2026" when `long` is set. */
export function monthLabel(month: string, long = false): string {
  const [y, m] = month.split("-").map(Number);
  return long ? `${LONG[m - 1]} ${y}` : `${SHORT[m - 1]} ${String(y).slice(2)}`;
}
