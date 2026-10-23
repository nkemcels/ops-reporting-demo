import Papa from "papaparse";
import * as XLSX from "xlsx";

/**
 * File parsing runs in the browser for instant feedback. The production build
 * re-parses the same file server-side before committing, so the database never
 * trusts client-side validation.
 */

/** One spreadsheet row keyed by its original header. */
export type RawRow = Record<string, unknown>;

export interface ParsedFile {
  fileName: string;
  fileType: "csv" | "xlsx";
  sheetName?: string;
  sheetNames: string[];
  headers: string[];
  rows: RawRow[];
}

/** Parse a CSV or Excel upload into headers + rows. For workbooks, `sheet` selects the tab. */
export async function parseFile(file: File, sheet?: string): Promise<ParsedFile> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv" || ext === "txt") {
    const text = await file.text();
    const result = Papa.parse<RawRow>(text, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
    });
    return {
      fileName: file.name,
      fileType: "csv",
      sheetNames: [],
      headers: (result.meta.fields ?? []).filter(Boolean),
      rows: result.data,
    };
  }
  if (ext === "xlsx" || ext === "xls") {
    // cellDates turns Excel date serials into Date objects; coercion handles both anyway.
    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
    const sheetName = sheet && wb.SheetNames.includes(sheet) ? sheet : wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: "", raw: true });
    const headerRow = (XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })[0] ?? []) as unknown[];
    return {
      fileName: file.name,
      fileType: "xlsx",
      sheetName,
      sheetNames: wb.SheetNames,
      headers: headerRow.map((h) => String(h ?? "").trim()).filter(Boolean),
      rows,
    };
  }
  throw new Error("Unsupported file type. Upload a .csv or .xlsx file.");
}
