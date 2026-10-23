import clsx from "clsx";
import { AlertTriangle, CheckCircle2, CircleCheckBig, OctagonAlert } from "lucide-react";
import type { HealthStatus } from "@/lib/domain/types";

/**
 * Project health badge. Status always pairs an icon with a label so it never
 * relies on color alone (color-blind users, grayscale print).
 */
const STATUS_STYLE: Record<HealthStatus, { label: string; icon: typeof CheckCircle2; iconColor: string; className: string }> = {
  "on-track": { label: "On track", icon: CheckCircle2, iconColor: "var(--good)", className: "bg-green-50 text-good-text" },
  "at-risk": { label: "At risk", icon: AlertTriangle, iconColor: "var(--warning)", className: "bg-amber-50 text-[#8a5a00]" },
  "off-track": { label: "Off track", icon: OctagonAlert, iconColor: "var(--critical)", className: "bg-red-50 text-[#a32626]" },
  complete: { label: "Complete", icon: CircleCheckBig, iconColor: "var(--ink-3)", className: "bg-surface-2 text-ink-2" },
};

export const statusLabel = (s: HealthStatus) => STATUS_STYLE[s].label;

export function StatusBadge({ status }: { status: HealthStatus }) {
  const { label, icon: Icon, iconColor, className } = STATUS_STYLE[status];
  return (
    <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-medium", className)}>
      <Icon size={13} color={iconColor} strokeWidth={2.4} />
      {label}
    </span>
  );
}
