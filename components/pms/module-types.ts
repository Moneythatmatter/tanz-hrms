import type { LucideIcon } from "lucide-react";

export type ModuleStatusStyle = "pill" | "live";

export interface ModuleOutletOption {
  id: string;
  name: string;
}

export interface ModuleStat {
  label: string;
  value: string | number;
  accent?: string;
  sublabel?: string;
  icon?: LucideIcon;
}

export interface ModuleColumn {
  key: string;
  header: string;
  format?: "currency" | "percent";
  render?: (row: any) => React.ReactNode;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  className?: string;
  inputType?: "text" | "number" | "select" | "searchSelect" | "currency" | "tel" | "time" | "date";
  options?: { value: string; label: string }[] | string[];
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  pattern?: string;
  patternMessage?: string;
}

export interface ModuleRow {
  id: string;
  status?: string;
  outletId?: string;
  [key: string]: string | number | undefined;
}

export interface ModuleFilterOption {
  id: string;
  label: string;
}

export interface ModuleSortOption {
  value: string;
  label: string;
}

export interface ModuleListDefinition {
  title: string;
  description: string;
  eyebrow?: string;
  stats: ModuleStat[];
  columns: ModuleColumn[];
  rows: ModuleRow[];
  searchPlaceholder: string;
  filterOptions?: ModuleFilterOption[];
  sortOptions?: ModuleSortOption[];
  actionLabel?: string;
  secondaryActions?: string[];
  statusStyle?: ModuleStatusStyle;
  outletLabel?: string;
  outlets?: ModuleOutletOption[];
  /** Keys used for filter matching beyond status */
  filterKeys?: string[];
  /** Optional API-backed CRUD. When set, Add/Edit/Delete persist via these handlers. */
  crud?: ModuleCrudHandlers;
  /** Physical tables for Merge/Split when this page is not the Tables list. */
  tableInventory?: ModuleRow[];
  /** Persist merge/split against the tables API. */
  tableCrud?: ModuleCrudHandlers;
}

export interface ModuleCrudHandlers {
  create?: (row: ModuleRow) => Promise<ModuleRow>;
  update?: (id: string, row: Partial<ModuleRow>) => Promise<ModuleRow>;
  remove?: (id: string) => Promise<void>;
}

export const DEFAULT_STATUS_CLASSES: Record<string, string> = {
  Available: "bg-emerald-50 text-emerald-700",
  Reserved: "bg-orange-50 text-orange-700",
  Occupied: "bg-red-50 text-red-700",
  Billing: "bg-violet-50 text-violet-700",
  Open: "bg-emerald-50 text-emerald-800",
  Confirmed: "bg-emerald-50 text-emerald-800",
  Seated: "bg-emerald-50 text-emerald-700",
  "No Show": "bg-slate-100 text-slate-600",
  Cancelled: "bg-red-50 text-red-700",
  Pending: "bg-amber-50 text-amber-700",
  Preparing: "bg-amber-50 text-amber-700",
  Ready: "bg-emerald-50 text-emerald-700",
  Served: "bg-slate-100 text-slate-600",
  Settled: "bg-emerald-50 text-emerald-700",
  Closed: "bg-slate-100 text-slate-600",
  Active: "bg-emerald-50 text-emerald-700",
  Inactive: "bg-slate-100 text-slate-600",
  Booked: "bg-sky-50 text-sky-700",
  Draft: "bg-slate-100 text-slate-600",
  Approved: "bg-emerald-50 text-emerald-700",
  Issued: "bg-emerald-50 text-emerald-800",
  Received: "bg-emerald-50 text-emerald-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Posted: "bg-emerald-50 text-emerald-700",
  Paid: "bg-emerald-50 text-emerald-700",
  Partial: "bg-amber-50 text-amber-700",
  Dirty: "bg-orange-50 text-orange-700",
  Clean: "bg-emerald-50 text-emerald-700",
  Balanced: "bg-emerald-50 text-emerald-700",
  Exception: "bg-red-50 text-red-700",
  Vacant: "bg-emerald-50 text-emerald-700",
  Online: "bg-emerald-50 text-emerald-700",
  Offline: "bg-red-50 text-red-700",
  "Low Stock": "bg-red-50 text-red-700",
  Over: "bg-red-50 text-red-700",
  Under: "bg-emerald-50 text-emerald-700",
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
  Queued: "bg-slate-100 text-slate-600",
  Scheduled: "bg-emerald-50 text-emerald-800",
  "Dine In": "bg-emerald-50 text-emerald-800",
  Takeaway: "bg-violet-50 text-violet-700",
  "Room Service": "bg-amber-50 text-amber-700",
};

export const LIVE_STATUS_META: Record<string, { dot: string; className: string }> = {
  Available: { dot: "bg-emerald-500", className: "bg-emerald-50 text-emerald-800" },
  Reserved: { dot: "bg-orange-500", className: "bg-orange-50 text-orange-800" },
  Occupied: { dot: "bg-red-500", className: "bg-red-50 text-red-800" },
  Billing: { dot: "bg-violet-500", className: "bg-violet-50 text-violet-800" },
};

export function moduleStatusClass(status: string, map?: Record<string, string>) {
  return (map ?? DEFAULT_STATUS_CLASSES)[status] ?? "bg-slate-100 text-slate-600";
}

export function moduleLiveStatusMeta(status: string) {
  return LIVE_STATUS_META[status] ?? { dot: "bg-slate-400", className: "bg-slate-100 text-slate-600" };
}
