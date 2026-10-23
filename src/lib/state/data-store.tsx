"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ImportBatch } from "@/lib/domain/types";
import { availableMonths, type Dataset } from "@/lib/reporting";
import { SEED } from "@/lib/data/seed";

/**
 * Client-side data store for the demo.
 *
 * The dataset is the seeded history plus every committed import batch. Batches
 * persist to localStorage so a refresh keeps your uploads; "Reset demo" clears them.
 *
 * Production swap: this provider goes away. Pages become server components that
 * query PostgreSQL views, and imports POST to a route handler that writes
 * `import_batches` + fact rows in one transaction.
 */

const STORAGE_KEY = "meridian-demo-imports-v1";

interface StoreValue {
  dataset: Dataset;
  batches: ImportBatch[];
  addBatch: (batch: ImportBatch) => void;
  removeBatch: (id: string) => void;
  resetDemo: () => void;
  hydrated: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      if (raw) setBatches(JSON.parse(raw));
    } catch {
      /* ignore corrupt demo state */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
  }, [batches, hydrated]);

  const addBatch = useCallback((b: ImportBatch) => setBatches((prev) => [b, ...prev]), []);
  const removeBatch = useCallback(
    (id: string) => setBatches((prev) => prev.filter((b) => b.id !== id)),
    [],
  );
  const resetDemo = useCallback(() => setBatches([]), []);

  // Recomputed only when batches change; every report derives from this.
  const dataset = useMemo<Dataset>(
    () => ({
      entries: [...SEED.entries, ...batches.flatMap((b) => b.entries)],
      expenses: [...SEED.expenses, ...batches.flatMap((b) => b.expenses)],
    }),
    [batches],
  );

  const value = useMemo(
    () => ({ dataset, batches, addBatch, removeBatch, resetDemo, hydrated }),
    [dataset, batches, addBatch, removeBatch, resetDemo, hydrated],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useData() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

/** Months that have data, plus the most recent one (the default "as of" for every view). */
export function useAvailableMonths() {
  const { dataset } = useData();
  return useMemo(() => {
    const months = availableMonths(dataset);
    return { months, latest: months[months.length - 1] };
  }, [dataset]);
}
