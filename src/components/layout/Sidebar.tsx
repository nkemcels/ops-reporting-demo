"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { availableMonths } from "@/lib/reporting";
import { useData } from "@/lib/state/data-store";
import { monthLabel } from "@/lib/utils/months";
import { PRIMARY_NAV, SECONDARY_NAV } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const { dataset, batches } = useData();
  const months = availableMonths(dataset);
  const latest = months[months.length - 1];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const navLink = ({ href, label, icon: Icon }: (typeof PRIMARY_NAV)[number]) => (
    <Link
      key={href}
      href={href}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors",
        isActive(href) ? "bg-brand-soft font-medium text-brand" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
      )}
    >
      <Icon size={17} strokeWidth={isActive(href) ? 2.2 : 1.8} />
      {label}
      {href === "/imports" && batches.length > 0 && (
        <span className="ml-auto rounded-full bg-surface-2 px-1.5 text-[11px] text-ink-2">{batches.length}</span>
      )}
    </Link>
  );

  return (
    <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white">M</div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold">Meridian</div>
          <div className="text-[11px] text-ink-3">Delivery reporting</div>
        </div>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-3">
        {PRIMARY_NAV.map(navLink)}
        <div className="mx-3 my-3 h-px bg-line" />
        {SECONDARY_NAV.map(navLink)}
      </nav>

      {/* Data freshness: management should always know which month-end they're looking at. */}
      <div className="m-3 rounded-xl border border-line bg-page p-3">
        <div className="text-[11px] font-medium uppercase tracking-wide text-ink-3">Data through</div>
        <div className="mt-0.5 text-sm font-semibold">{latest ? monthLabel(latest, true) : "-"}</div>
        <div className="mt-1 text-[11.5px] text-ink-2">
          {batches.length ? `${batches.length} upload${batches.length > 1 ? "s" : ""} this session` : "Seed data only"}
        </div>
      </div>
    </aside>
  );
}
