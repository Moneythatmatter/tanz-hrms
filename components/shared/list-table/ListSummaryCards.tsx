"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarOff,
  CheckCircle2,
  Clock,
  Banknote,
  Repeat,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ListSummaryIcon =
  | "users"
  | "user-check"
  | "briefcase"
  | "building"
  | "check-circle"
  | "alert-triangle"
  | "x-circle"
  | "clock"
  | "calendar-off"
  | "banknote"
  | "repeat";

export interface ListSummaryStat {
  label: string;
  value: string | number;
  color: string;
  icon: ListSummaryIcon;
  filterId?: string;
}

const iconMap: Record<ListSummaryIcon, LucideIcon> = {
  users: Users,
  "user-check": UserCheck,
  briefcase: Briefcase,
  building: Building2,
  "check-circle": CheckCircle2,
  "alert-triangle": AlertTriangle,
  "x-circle": XCircle,
  clock: Clock,
  "calendar-off": CalendarOff,
  "banknote": Banknote,
  repeat: Repeat,
};

const columnClasses = {
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
} as const;

interface ListSummaryCardsProps {
  stats: ListSummaryStat[];
  activeFilterId?: string;
  onFilterClick?: (filterId: string) => void;
  columns?: 4 | 5;
  className?: string;
}

export function ListSummaryCards({
  stats,
  activeFilterId = "all",
  onFilterClick,
  columns = 4,
  className,
}: ListSummaryCardsProps) {
  return (
    <div className={cn("grid gap-3", columnClasses[columns], className)}>
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon];
        const filterId = stat.filterId ?? "all";
        const isActive = activeFilterId === filterId;
        const isClickable = Boolean(onFilterClick);

        return (
          <button
            key={stat.label}
            type="button"
            onClick={() => onFilterClick?.(filterId)}
            disabled={!isClickable}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-200",
              isClickable && "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
              isActive
                ? "border-emerald-300 ring-2 ring-emerald-100"
                : "border-slate-200/80",
            )}
          >
            <div
              className="absolute inset-0 opacity-30 transition-opacity group-hover:opacity-50"
              style={{ background: `linear-gradient(135deg, ${stat.color}12, transparent)` }}
            />
            <div className="relative flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                </p>
              </div>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
                style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
