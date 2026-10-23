import { Bell, CircleHelp, Search } from "lucide-react";
import { CURRENT_USER } from "@/lib/data/reference-data";

/** Global header. Search and notifications are visual placeholders in the demo. */
export function Topbar() {
  return (
    <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-line bg-surface/85 px-6 backdrop-blur">
      <div className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-line bg-page px-3 py-1.5 text-sm text-ink-3">
        <Search size={15} />
        <span>Search projects, people, reports…</span>
        <kbd className="ml-auto rounded border border-line bg-surface px-1.5 text-[10px]">⌘K</kbd>
      </div>
      <div className="ml-auto flex items-center gap-1 text-ink-2">
        <button className="rounded-lg p-2 hover:bg-surface-2" aria-label="Help">
          <CircleHelp size={18} />
        </button>
        <button className="relative rounded-lg p-2 hover:bg-surface-2" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-critical" />
        </button>
        <div className="ml-2 flex items-center gap-2.5 border-l border-line pl-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
            {CURRENT_USER.initials}
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-[13px] font-medium text-ink">{CURRENT_USER.name}</div>
            <div className="text-[11px] text-ink-3">{CURRENT_USER.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
