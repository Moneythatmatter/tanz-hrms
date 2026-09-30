"use client";

import { useMemo } from "react";
import { SearchSelect as BaseSearchSelect, type SearchOption } from "@/components/ui/SearchSelect";

export interface SearchSelectOption {
  id: string;
  label: string;
  hint?: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  selectedId?: string | null;
  onSelect: (option: SearchSelectOption) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Allow committing typed text that is not in the options list. */
  allowCustom?: boolean;
  /** When a selection exists, lock the input (clear via X only). */
  lockInputWhenSelected?: boolean;
  disabled?: boolean;
}

export function SearchSelect({
  options,
  selectedId,
  onSelect,
  onClear,
  placeholder = "Search…",
  className,
  inputClassName,
  allowCustom = false,
  lockInputWhenSelected = false,
  disabled = false,
}: SearchSelectProps) {
  const searchOptions: SearchOption[] = useMemo(
    () =>
      options.map((o) => ({
        id: o.id,
        label: o.label,
        hint: o.hint,
        data: o,
      })),
    [options]
  );

  return (
    <BaseSearchSelect
      options={searchOptions}
      selectedId={selectedId}
      onSelect={(opt) =>
        onSelect((opt.data as SearchSelectOption) ?? { id: opt.id, label: opt.label, hint: opt.hint })
      }
      onClear={onClear}
      placeholder={placeholder}
      className={className}
      inputClassName={inputClassName}
      allowCustom={allowCustom}
      lockInputWhenSelected={lockInputWhenSelected}
      disabled={disabled}
    />
  );
}
