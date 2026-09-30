"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface ExportMenuOption {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
}

interface ExportMenuProps {
  label?: string;
  options: ExportMenuOption[];
  onExport: (optionId: string) => void;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: "left" | "right";
  disabled?: boolean;
}

export function ExportMenu({
  label = "Export",
  options,
  onExport,
  className,
  buttonClassName,
  menuClassName,
  align = "right",
  disabled = false,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionId: string) => {
    setIsOpen(false);
    onExport(optionId);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "rounded-xl text-xs font-medium bg-white shadow-xs",
          buttonClassName,
        )}
      >
        <Download className="mr-1 h-3.5 w-3.5 text-slate-500" />
        {label}
        <ChevronDown
          className={cn(
            "ml-1 h-3.5 w-3.5 text-slate-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </Button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full z-50 mt-1 min-w-[13rem] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl",
            align === "right" ? "right-0" : "left-0",
            menuClassName,
          )}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(option.id)}
              className="flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition hover:bg-slate-100"
            >
              {option.icon ? <span className="mt-0.5 shrink-0">{option.icon}</span> : null}
              <span className="min-w-0">
                <span className="block font-semibold text-slate-800">{option.label}</span>
                {option.description ? (
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
