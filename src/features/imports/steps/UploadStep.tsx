"use client";

import clsx from "clsx";
import { useRef, useState } from "react";
import { Clock, Download, FileSpreadsheet, Receipt, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui";
import type { ImportKind } from "@/lib/domain/types";
import { SCHEMAS } from "@/lib/imports";
import { sampleFile } from "@/lib/imports/sample-files";
import { downloadFile } from "@/lib/utils/download";

const KIND_ICONS: Record<ImportKind, typeof Clock> = { timesheet: Clock, expenses: Receipt };

const SAMPLE_DESCRIPTIONS: Record<ImportKind, string> = {
  timesheet: "CSV · ~1,400 daily lines · non-standard headers · 11 planted issues",
  expenses: "Excel · 2 sheets · currency strings · 3 planted issues",
};

/** Step 1: choose what is being imported, then drop a file (or use a bundled sample). */
export function UploadStep({
  kind,
  onKindChange,
  onFile,
  busy,
  error,
}: {
  kind: ImportKind;
  onKindChange: (kind: ImportKind) => void;
  onFile: (file: File) => void;
  busy: boolean;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-[13px] font-semibold">1. What are you uploading?</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(Object.keys(SCHEMAS) as ImportKind[]).map((k) => {
            const Icon = KIND_ICONS[k];
            const schema = SCHEMAS[k];
            return (
              <button
                key={k}
                onClick={() => onKindChange(k)}
                className={clsx(
                  "flex gap-3 rounded-xl border p-4 text-left transition-colors",
                  kind === k ? "border-brand bg-brand-soft/60 ring-2 ring-brand-soft" : "border-line hover:bg-page",
                )}
              >
                <span className={clsx("grid h-9 w-9 shrink-0 place-items-center rounded-lg", kind === k ? "bg-brand text-white" : "bg-surface-2 text-ink-2")}>
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-[14px] font-semibold">{schema.title}</span>
                  <span className="mt-0.5 block text-[12.5px] text-ink-2">{schema.description}</span>
                  <span className="mt-2 block text-[11.5px] text-ink-3">
                    Required: {schema.fields.filter((f) => f.required).map((f) => f.label).join(", ")}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-[13px] font-semibold">2. Add the file</h3>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={clsx(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-brand bg-brand-soft/50" : "border-[#d9d8d2] bg-page",
          )}
        >
          <UploadCloud size={28} className="text-ink-3" />
          <p className="mt-3 text-[14px] font-medium">Drag a CSV or Excel file here</p>
          <p className="mt-1 text-[12.5px] text-ink-3">.csv, .xlsx or .xls · up to 50 MB · first row must be headers</p>
          <Button variant="primary" className="mt-4" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? "Reading file…" : "Choose file"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = ""; // allow re-selecting the same file
            }}
          />
        </div>
        {error && <p className="mt-2 text-[13px] text-[#a32626]">{error}</p>}
      </div>

      {/* Samples let a reviewer exercise the full flow without having data to hand. */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-page px-4 py-3">
        <FileSpreadsheet size={18} className="text-ink-2" />
        <div className="mr-auto">
          <div className="text-[13px] font-medium">No file handy? Use the September sample export</div>
          <div className="text-[12px] text-ink-3">{SAMPLE_DESCRIPTIONS[kind]}</div>
        </div>
        <Button size="sm" onClick={() => {
            const file = sampleFile(kind);
            downloadFile(file, file.name);
          }}>
          <Download size={14} /> Download
        </Button>
        <Button size="sm" variant="primary" disabled={busy} onClick={() => onFile(sampleFile(kind))}>
          Use sample
        </Button>
      </div>
    </div>
  );
}
