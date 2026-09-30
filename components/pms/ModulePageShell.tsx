"use client";

import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FOSearchToolbar } from "@/components/frontoffice/ui/FOSearchToolbar";
import {
  AlertBanner,
  FOPageHeader,
  FormField,
  SelectInput,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

interface ModulePageShellProps {
  toast?: string | null;
  toastVariant?: "success" | "error";
  onDismissToast?: () => void;
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  primaryAction?: { label: string; onClick: () => void };
  secondaryActions?: React.ReactNode;
  actionButtons?: React.ReactNode;
  stats?: {
    label: string;
    value: string | number;
    accent?: string;
    icon?: LucideIcon;
    sublabel?: string;
  }[];
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterPills?: {
    active: string;
    onChange: (id: string) => void;
    options: { id: string; label: string }[];
  };
  sort?: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
  };
  resultCount?: { shown: number; total: number };
  hasActiveAdvancedFilters?: boolean;
  onClearAdvancedFilters?: () => void;
  advancedFilters?: React.ReactNode;
  selectionBar?: React.ReactNode;
  /** @deprecated Prefer beforeFilters for toolbar placement */
  contextSelector?: React.ReactNode;
  /** Rendered in the toolbar row before the Filters button */
  beforeFilters?: React.ReactNode;
  showFiltersButton?: boolean;
  aboveTable?: React.ReactNode;
  children: React.ReactNode;
  wrapChildren?: boolean;
}

export function ModulePageShell({
  toast,
  toastVariant = "success",
  onDismissToast,
  eyebrow = "Front Office",
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  actionButtons,
  stats,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filterPills,
  sort,
  resultCount,
  hasActiveAdvancedFilters,
  onClearAdvancedFilters,
  advancedFilters,
  selectionBar,
  contextSelector,
  beforeFilters,
  showFiltersButton,
  aboveTable,
  children,
  wrapChildren = true,
}: ModulePageShellProps) {
  const hasFilterControls = !!sort || !!advancedFilters;
  const builtAdvancedFilters =
    hasFilterControls || (showFiltersButton && (sort || resultCount || advancedFilters)) ? (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sort && (
          <FormField label="Sort By">
            <SelectInput value={sort.value} onChange={(e) => sort.onChange(e.target.value)}>
              {sort.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </SelectInput>
          </FormField>
        )}
        {resultCount && (
          <FormField label="Showing">
            <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
              {resultCount.shown} of {resultCount.total} records
            </div>
          </FormField>
        )}
        {advancedFilters}
      </div>
    ) : (
      advancedFilters
    );

  const showToolbar = search !== undefined && onSearchChange;

  return (
    <div className="space-y-5">
      {toast && onDismissToast && (
        <AlertBanner variant={toastVariant} message={toast} onDismiss={onDismissToast} />
      )}

      <FOPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        action={
          (primaryAction || secondaryActions || actionButtons) && (
            <div className="flex flex-wrap gap-2">
              {secondaryActions}
              {actionButtons}
              {primaryAction && (
                <Button
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800"
                  onClick={primaryAction.onClick}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {primaryAction.label}
                </Button>
              )}
            </div>
          )
        }
      />

      {contextSelector}

      {stats && stats.length > 0 && (
        <div
          className={cn(
            "grid gap-3 sm:gap-4",
            stats.length === 4
              ? "grid-cols-2 lg:grid-cols-4 lg:gap-6"
              : "grid-cols-1 sm:grid-cols-3",
          )}
        >
          {stats.map((s) => (
            <StatMiniCard
              key={s.label}
              label={s.label}
              value={s.value}
              accent={s.accent}
              icon={s.icon}
              sublabel={s.sublabel}
            />
          ))}
        </div>
      )}

      {aboveTable}

      {showToolbar && (
        <FOSearchToolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          beforeFilters={beforeFilters}
          filterPills={filterPills}
          advancedFilters={builtAdvancedFilters}
          hasActiveAdvancedFilters={hasActiveAdvancedFilters}
          onClearAdvancedFilters={onClearAdvancedFilters}
          selectionBar={selectionBar}
          showFiltersButton={showFiltersButton}
        />
      )}

      {wrapChildren ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
