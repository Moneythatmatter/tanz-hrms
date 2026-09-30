"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  clampIsoDate,
  shiftIsoDate,
  todayIsoDate,
} from "@/lib/hr/report-export";
import { cn } from "@/lib/utils";

export interface HrSearchFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  maxDate?: string;
  showDatePicker?: boolean;
  showFilterPanel?: boolean;
  onToggleFilterPanel?: () => void;
  extraFilters?: React.ReactNode;
  filterPills?: {
    active: string;
    onChange: (id: string) => void;
    options: { id: string; label: string }[];
  };
  hasActiveFilters?: boolean;
  onReset?: () => void;
  onOpenMobileFilters?: () => void;
  trailing?: React.ReactNode;
  className?: string;
}

export function HrSearchFilterToolbar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
  selectedDate,
  onDateChange,
  maxDate,
  showDatePicker = false,
  showFilterPanel = false,
  onToggleFilterPanel,
  extraFilters,
  filterPills,
  hasActiveFilters = false,
  onReset,
  onOpenMobileFilters,
  trailing,
  className,
}: HrSearchFilterToolbarProps) {
  const today = maxDate ?? todayIsoDate();
  const dateValue = selectedDate ?? today;
  const isAtToday = dateValue >= today;

  return (
    <div className={cn("mb-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs", className)}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-8 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters ? (
            <div className="hidden md:contents">{filters}</div>
          ) : null}

          {showDatePicker && onDateChange ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDateChange(shiftIsoDate(dateValue, -1))}
                aria-label="Previous day"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="date"
                value={dateValue}
                max={today}
                onChange={(e) => onDateChange(clampIsoDate(e.target.value, today))}
                className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={() => onDateChange(clampIsoDate(shiftIsoDate(dateValue, 1), today))}
                disabled={isAtToday}
                aria-label="Next day"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {onToggleFilterPanel ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleFilterPanel}
              className="hidden rounded-full border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 md:inline-flex"
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
              Filters
            </Button>
          ) : null}

          {trailing}

          {hasActiveFilters && onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="hidden text-xs font-bold text-emerald-700 hover:underline sm:inline"
            >
              Reset
            </button>
          ) : null}

          {onOpenMobileFilters ? (
            <button
              type="button"
              onClick={onOpenMobileFilters}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 md:hidden"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-4 w-4 text-emerald-700" />
            </button>
          ) : null}
        </div>
      </div>

      {filterPills && filterPills.options.length > 0 ? (
        <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 pt-3 scrollbar-none">
          {filterPills.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => filterPills.onChange(opt.id)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all sm:px-3 sm:text-xs",
                filterPills.active === opt.id
                  ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}

      {showFilterPanel && extraFilters ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs animate-in fade-in-50">
          {extraFilters}
          {hasActiveFilters && onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="font-bold text-emerald-700 hover:underline"
            >
              Reset filters
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
