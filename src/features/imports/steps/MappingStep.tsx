"use client";

import clsx from "clsx";
import { ArrowRight, FileSpreadsheet } from "lucide-react";
import { Button, Pill, Select } from "@/components/ui";
import { type ImportSchema, type Mapping, type MatchQuality, type ParsedFile, missingRequired } from "@/lib/imports";

const NOT_MAPPED = "__none__";

const QUALITY_BADGE: Record<MatchQuality | "manual", { label: string; className: string }> = {
  exact: { label: "Exact match", className: "bg-green-50 text-good-text" },
  alias: { label: "Auto-matched", className: "bg-green-50 text-good-text" },
  fuzzy: { label: "Best guess. Check", className: "bg-amber-50 text-[#8a5a00]" },
  manual: { label: "Set manually", className: "bg-brand-soft text-brand" },
  none: { label: "Not mapped", className: "bg-surface-2 text-ink-3" },
};

/** First few non-empty values from a column, so the user can confirm the mapping by eye. */
function preview(parsed: ParsedFile, column: string | null): string[] {
  if (!column) return [];
  const out: string[] = [];
  for (const row of parsed.rows) {
    const v = row[column];
    if (v === "" || v === null || v === undefined) continue;
    out.push(v instanceof Date ? v.toISOString().slice(0, 10) : String(v));
    if (out.length === 3) break;
  }
  return out;
}

/** Step 2: map file columns onto the fields the reports need. */
export function MappingStep({
  parsed,
  schema,
  mapping,
  quality,
  onMappingChange,
  onSheetChange,
  onBack,
  onContinue,
}: {
  parsed: ParsedFile;
  schema: ImportSchema;
  mapping: Mapping;
  quality: Record<string, MatchQuality | "manual">;
  onMappingChange: (field: string, column: string | null) => void;
  onSheetChange: (sheet: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const missing = missingRequired(mapping, schema);
  const used = new Set(Object.values(mapping).filter(Boolean));
  const ignored = parsed.headers.filter((h) => !used.has(h));
  const columnOptions = [
    { value: NOT_MAPPED, label: "Not mapped" },
    ...parsed.headers.map((h) => ({ value: h, label: h })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-page px-4 py-3 text-[13px]">
        <FileSpreadsheet size={18} className="text-ink-2" />
        <span className="font-medium">{parsed.fileName}</span>
        <Pill>{parsed.rows.length.toLocaleString()} rows</Pill>
        <Pill>{parsed.headers.length} columns</Pill>
        {parsed.sheetNames.length > 1 && (
          <span className="ml-auto flex items-center gap-2 text-ink-2">
            Sheet
            <Select
              label="Worksheet"
              value={parsed.sheetName ?? parsed.sheetNames[0]}
              onChange={onSheetChange}
              options={parsed.sheetNames.map((s) => ({ value: s, label: s }))}
            />
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead>
            <tr className="border-b border-line bg-page text-left text-[11.5px] uppercase tracking-wide text-ink-3">
              <th className="px-4 py-2 font-medium">Report field</th>
              <th className="w-8" />
              <th className="px-3 py-2 font-medium">Column in your file</th>
              <th className="px-3 py-2 font-medium">Match</th>
              <th className="px-4 py-2 font-medium">Sample values</th>
            </tr>
          </thead>
          <tbody>
            {schema.fields.map((field) => {
              const column = mapping[field.key];
              const q = quality[field.key] ?? "none";
              const badge = !column && field.required
                ? { label: "Required", className: "bg-red-50 text-[#a32626]" }
                : QUALITY_BADGE[q];
              return (
                <tr key={field.key} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {field.label}
                      {field.required && <span className="ml-0.5 text-[#a32626]">*</span>}
                    </div>
                    <div className="text-[12px] text-ink-3">{field.description}</div>
                  </td>
                  <td className="text-ink-3">
                    <ArrowRight size={14} className="rotate-180" />
                  </td>
                  <td className="px-3 py-3">
                    <Select
                      label={`Column for ${field.label}`}
                      className="w-52"
                      value={column ?? NOT_MAPPED}
                      onChange={(v) => onMappingChange(field.key, v === NOT_MAPPED ? null : v)}
                      options={columnOptions}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <span className={clsx("whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11.5px] font-medium", badge.className)}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {preview(parsed, column).map((v, i) => (
                        <code key={i} className="rounded bg-surface-2 px-1.5 py-0.5 text-[11.5px] text-ink-2">
                          {v}
                        </code>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {ignored.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-2">
          Ignored columns:
          {ignored.map((h) => (
            <Pill key={h}>{h}</Pill>
          ))}
          <span className="text-ink-3">(kept in the raw upload for audit, not used in reports)</span>
        </div>
      )}

      <label className="flex items-center gap-2 text-[13px] text-ink-2">
        <input type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--brand)]" />
        Remember this mapping for future files with the same columns
      </label>

      <div className="flex items-center justify-between border-t border-line pt-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <div className="flex items-center gap-3">
          {missing.length > 0 && (
            <span className="text-[12.5px] text-[#a32626]">Map required: {missing.map((f) => f.label).join(", ")}</span>
          )}
          <Button variant="primary" disabled={missing.length > 0} onClick={onContinue}>
            Validate {parsed.rows.length.toLocaleString()} rows <ArrowRight size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
