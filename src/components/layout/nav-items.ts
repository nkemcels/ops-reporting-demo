import { Blocks, FileText, FolderKanban, LayoutDashboard, Upload, Users } from "lucide-react";

/** Primary navigation. Order follows the monthly workflow: review → upload → report. */
export const PRIMARY_NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/utilization", label: "Team utilization", icon: Users },
  { href: "/imports", label: "Data imports", icon: Upload },
  { href: "/reports", label: "Monthly reports", icon: FileText },
];

export const SECONDARY_NAV = [{ href: "/architecture", label: "How it's built", icon: Blocks }];
