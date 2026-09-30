"use client";

import { cn } from "@/lib/utils";

export interface ListTableStatusBadgeProps {
  label: string;
  tone?: "emerald" | "sky" | "amber" | "rose" | "slate" | "violet" | "blue";
  className?: string;
}

const toneStyles: Record<NonNullable<ListTableStatusBadgeProps["tone"]>, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-red-50 text-red-700 ring-red-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
};

export function ListTableStatusBadge({
  label,
  tone = "slate",
  className,
}: ListTableStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneStyles[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
