"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { CURRENT_USER } from "@/lib/data/reference-data";
import type { ImportBatch, ImportKind } from "@/lib/domain/types";
import {
  type Mapping,
  type MatchQuality,
  type ParsedFile,
  type ValidatedRow,
  SCHEMAS,
  autoMap,
  buildBatch,
  parseFile,
  validateRows,
} from "@/lib/imports";
import { useData } from "@/lib/state/data-store";
import { StepIndicator, type WizardStep } from "./StepIndicator";
import { DoneStep } from "./steps/DoneStep";
import { MappingStep } from "./steps/MappingStep";
import { UploadStep } from "./steps/UploadStep";
import { ValidationStep } from "./steps/ValidationStep";

/**
 * Upload → map → validate → commit.
 *
 * Each step only receives what it needs and reports back through callbacks;
 * the wizard owns the state and the transitions. Nothing touches the dataset
 * until the user clicks Import, and that commit is a single batch that can be
 * undone from the history.
 */
export function ImportWizard() {
  const { addBatch } = useData();

  const [step, setStep] = useState<WizardStep>("upload");
  const [kind, setKind] = useState<ImportKind>("timesheet");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [quality, setQuality] = useState<Record<string, MatchQuality | "manual">>({});
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = SCHEMAS[kind];

  /** Parse, then pre-fill the mapping. Re-used when the user switches worksheet. */
  async function load(f: File, sheet?: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await parseFile(f, sheet);
      if (!result.rows.length) throw new Error("The file has headers but no data rows.");
      const suggestion = autoMap(result.headers, schema);
      setFile(f);
      setParsed(result);
      setMapping(suggestion.mapping);
      setQuality(suggestion.quality);
      setStep("map");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this file.");
    } finally {
      setBusy(false);
    }
  }

  function changeMapping(field: string, column: string | null) {
    setMapping((m) => {
      // A column can feed only one field: unmap it from wherever it was before.
      const next = Object.fromEntries(Object.entries(m).map(([k, v]) => [k, column && v === column ? null : v]));
      return { ...next, [field]: column };
    });
    setQuality((q) => ({ ...q, [field]: column ? "manual" : "none" }));
  }

  function validate() {
    if (!parsed) return;
    setRows(validateRows(parsed.rows, mapping, schema));
    setStep("validate");
  }

  function commit() {
    if (!parsed) return;
    const result = buildBatch({ kind, fileName: parsed.fileName, rows, skipDuplicates, importedBy: CURRENT_USER.name });
    addBatch(result);
    setBatch(result);
    setStep("done");
  }

  function reset() {
    setStep("upload");
    setFile(null);
    setParsed(null);
    setRows([]);
    setBatch(null);
    setError(null);
  }

  return (
    <Card title="New import" subtitle="Upload a month's export as-is; mapping and checks happen here, not in the spreadsheet.">
      <div className="mb-5 border-b border-line pb-4">
        <StepIndicator current={step} />
      </div>
      <div>
        {step === "upload" && (
          <UploadStep kind={kind} onKindChange={setKind} onFile={load} busy={busy} error={error} />
        )}
        {step === "map" && parsed && (
          <MappingStep
            parsed={parsed}
            schema={schema}
            mapping={mapping}
            quality={quality}
            onMappingChange={changeMapping}
            onSheetChange={(sheet) => file && load(file, sheet)}
            onBack={reset}
            onContinue={validate}
          />
        )}
        {step === "validate" && parsed && (
          <ValidationStep
            rows={rows}
            schema={schema}
            mapping={mapping}
            fileName={parsed.fileName}
            skipDuplicates={skipDuplicates}
            onSkipDuplicatesChange={setSkipDuplicates}
            onBack={() => setStep("map")}
            onImport={commit}
          />
        )}
        {step === "done" && batch && <DoneStep batch={batch} onAnother={reset} />}
      </div>
    </Card>
  );
}
