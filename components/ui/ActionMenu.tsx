"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionMenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  variant?: "default" | "danger" | "success" | "primary" | "warning";
  disabled?: boolean;
  divider?: boolean;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  trigger?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  menuWidth?: string;
}

export function ActionMenu({
  items,
  trigger,
  align = "right",
  className,
  menuWidth = "w-44",
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={menuRef}>
      <div onClick={(e) => e.stopPropagation()}>
        {trigger ? (
          <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300",
              isOpen && "bg-slate-100 text-slate-900 border-slate-200"
            )}
            title="More actions"
            aria-label="More actions"
            aria-expanded={isOpen}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute z-50 mt-1 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100",
            menuWidth,
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return <div key={`divider-${idx}`} className="my-1 border-t border-slate-100" />;
            }
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setIsOpen(false);
                  if (item.onClick) item.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none",
                  item.variant === "danger"
                    ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    : item.variant === "success"
                    ? "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    : item.variant === "primary"
                    ? "text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    : item.variant === "warning"
                    ? "text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
