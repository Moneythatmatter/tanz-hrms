"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type ModuleSelectionAction = {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "outline";
  icon?: React.ReactNode;
};

export function ModuleSelectionBar({
  count,
  noun = "item",
  actions,
  onClear,
  className,
}: {
  count: number;
  noun?: string;
  actions: ModuleSelectionAction[];
  onClear: () => void;
  className?: string;
}) {
  if (count <= 0) return null;

  const label = `${count} ${noun}${count === 1 ? "" : "s"} selected`;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3",
        className,
      )}
    >
      <span className="text-sm font-medium text-emerald-900">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) =>
          action.variant === "danger" ? (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              {action.label}
            </button>
          ) : (
            <Button
              key={action.label}
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 bg-white"
              onClick={action.onClick}
            >
              {action.icon}
              {action.label}
            </Button>
          ),
        )}
        <button
          type="button"
          className="text-xs font-medium text-emerald-700 hover:underline"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
