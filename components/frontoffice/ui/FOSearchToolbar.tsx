"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface FOSearchToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Placed between search and the Filters button (e.g. outlet select). */
  beforeFilters?: React.ReactNode;
  filterPills?: {
    active: string;
    onChange: (id: string) => void;
    options: { id: string; label: string }[];
  };
  advancedFilters?: React.ReactNode;
  hasActiveAdvancedFilters?: boolean;
  onClearAdvancedFilters?: () => void;
  selectionBar?: React.ReactNode;
  showFiltersButton?: boolean;
}

export function FOSearchToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  beforeFilters,
  filterPills,
  advancedFilters,
  hasActiveAdvancedFilters = false,
  onClearAdvancedFilters,
  selectionBar,
  showFiltersButton,
}: FOSearchToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const showFilters = showFiltersButton ?? !!advancedFilters;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <div className="relative h-10 min-w-0 flex-1 basis-full sm:basis-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        {beforeFilters}
        {showFilters && (
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-10 shrink-0 gap-1.5",
              filtersOpen && "border-emerald-300 bg-emerald-50 text-emerald-800",
            )}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveAdvancedFilters && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-semibold text-white">
                !
              </span>
            )}
          </Button>
        )}
      </div>

      {filterPills && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {filterPills.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => filterPills.onChange(opt.id)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all sm:px-3 sm:text-xs cursor-pointer",
                filterPills.active === opt.id
                  ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {filtersOpen && advancedFilters && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Filters
            </p>
            {hasActiveAdvancedFilters && onClearAdvancedFilters && (
              <button
                type="button"
                onClick={onClearAdvancedFilters}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
          {advancedFilters}
        </div>
      )}

      {selectionBar}
    </div>
  );
}
