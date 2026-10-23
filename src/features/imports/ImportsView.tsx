"use client";

import { RotateCcw } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { useData } from "@/lib/state/data-store";
import { ImportHistory } from "./ImportHistory";
import { ImportWizard } from "./ImportWizard";

export function ImportsView() {
  const { batches, resetDemo } = useData();
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Data imports"
        subtitle="Team leads upload timesheet and expense exports here at each month-end."
        actions={
          batches.length > 0 && (
            <Button variant="ghost" onClick={resetDemo}>
              <RotateCcw size={14} /> Reset demo data
            </Button>
          )
        }
      />
      <div className="space-y-4">
        <ImportWizard />
        <ImportHistory />
      </div>
    </div>
  );
}
