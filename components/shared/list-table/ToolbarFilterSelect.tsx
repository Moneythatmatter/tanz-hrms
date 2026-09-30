"use client";

import type { ReactNode } from "react";
import { DropdownSelect, type DropdownSelectOption } from "@/components/ui/DropdownSelect";
import { cn } from "@/lib/utils";

export type ToolbarFilterOption = DropdownSelectOption;

interface ToolbarFilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ToolbarFilterOption[];
  defaultValue?: string;
  ariaLabel: string;
  className?: string;
  searchable?: boolean;
}

export function ToolbarFilterGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
      {children}
    </div>
  );
}

export function ToolbarFilterSelect({
  value,
  onChange,
  options,
  defaultValue = "ALL",
  ariaLabel,
  className,
  searchable = false,
}: ToolbarFilterSelectProps) {
  const placeholder =
    options.find((option) => option.value === defaultValue)?.label ?? "Select…";

  return (
    <DropdownSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      defaultValue={defaultValue}
      aria-label={ariaLabel}
      highlightActive
      searchable={searchable}
      className={cn(
        "w-full min-w-[10.5rem] shrink-0 sm:w-auto sm:min-w-[11rem]",
        className,
      )}
    />
  );
}
