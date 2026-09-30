"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownSelectOption {
  value: string;
  label: string;
  hint?: string;
  tag?: {
    label: string;
    className: string;
  };
}

export interface DropdownSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownSelectOption[];
  placeholder?: string;
  /** Filter options with a search field inside the panel. */
  searchable?: boolean;
  defaultValue?: string;
  "aria-label"?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  /** Emphasize the trigger when value differs from defaultValue. */
  highlightActive?: boolean;
}

export function DropdownSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchable = false,
  defaultValue,
  "aria-label": ariaLabel,
  className,
  triggerClassName,
  disabled = false,
  highlightActive = false,
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);
  const isActive = highlightActive && defaultValue !== undefined && value !== defaultValue;

  const filteredOptions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!searchable || !trimmed) return options;

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(trimmed) ||
        option.value.toLowerCase().includes(trimmed) ||
        option.hint?.toLowerCase().includes(trimmed) ||
        option.tag?.label.toLowerCase().includes(trimmed),
    );
  }, [options, query, searchable]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const close = () => {
    setIsOpen(false);
    setQuery("");
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    close();
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen((open) => !open);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100",
          isActive && "border-emerald-300 ring-1 ring-emerald-100",
          disabled && "cursor-not-allowed bg-slate-50 text-slate-500",
          triggerClassName,
        )}
      >
        <span className={cn("min-w-0 truncate", !selected && "text-slate-400")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {searchable && (
            <div className="border-b border-slate-100 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search…"
                  autoFocus
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-500">
                {query.trim() ? `No match for “${query.trim()}”` : "No options available"}
              </p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-emerald-50",
                      isSelected && "bg-emerald-50/70",
                    )}
                  >
                    <span className="min-w-0 truncate font-medium text-slate-900">{option.label}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {option.tag ? (
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                            option.tag.className,
                          )}
                        >
                          {option.tag.label}
                        </span>
                      ) : null}
                      {option.hint ? (
                        <span className="text-xs text-slate-500">{option.hint}</span>
                      ) : null}
                      {isSelected ? <Check className="h-4 w-4 text-emerald-600" /> : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
