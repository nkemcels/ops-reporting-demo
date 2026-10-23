import { Suspense } from "react";
import { ReportsView } from "@/features/reports/ReportsView";

export default function ReportsPage() {
  // ReportsView reads ?month= via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <ReportsView />
    </Suspense>
  );
}
