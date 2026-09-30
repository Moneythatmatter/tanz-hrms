"use client";

import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ListTableRowMenuItem {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ListTableRowMenuProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  items: ListTableRowMenuItem[];
  ariaLabel?: string;
}

export function ListTableRowMenu({
  open,
  onToggle,
  onClose,
  items,
  ariaLabel = "More actions",
}: ListTableRowMenuProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        aria-label={ariaLabel}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10"
            onClick={onClose}
            aria-label="Close menu"
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {items.map(({ icon: Icon, label, onClick, danger }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  onClick();
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                  danger ? "text-red-600 hover:bg-red-50" : "text-slate-700",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
