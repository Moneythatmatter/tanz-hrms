"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type KPITone = "emerald" | "amber" | "blue" | "purple" | "rose" | "slate";

const toneStyles: Record<KPITone, { bg: string; border: string; text: string; iconBg: string; iconText: string }> = {
  emerald: {
    bg: "bg-white",
    border: "border-slate-200",
    text: "text-emerald-950",
    iconBg: "bg-emerald-50 border-emerald-200",
    iconText: "text-emerald-700",
  },
  amber: {
    bg: "bg-white",
    border: "border-slate-200",
    text: "text-amber-950",
    iconBg: "bg-amber-50 border-amber-200",
    iconText: "text-amber-700",
  },
  blue: {
    bg: "bg-white",
    border: "border-slate-200",
    text: "text-blue-950",
    iconBg: "bg-blue-50 border-blue-200",
    iconText: "text-blue-700",
  },
  purple: {
    bg: "bg-white",
    border: "border-slate-200",
    text: "text-purple-950",
    iconBg: "bg-purple-50 border-purple-200",
    iconText: "text-purple-700",
  },
  rose: {
    bg: "bg-white",
    border: "border-slate-200",
    text: "text-rose-950",
    iconBg: "bg-rose-50 border-rose-200",
    iconText: "text-rose-700",
  },
  slate: {
    bg: "bg-white",
    border: "border-slate-200",
    text: "text-slate-900",
    iconBg: "bg-slate-100 border-slate-300",
    iconText: "text-slate-600",
  },
};

export interface HRKPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: KPITone;
  className?: string;
}

export function HRKPICard({
  label,
  value,
  subtitle,
  icon,
  tone = "emerald",
  className,
}: HRKPICardProps) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-3 rounded-2xl border p-3.5 shadow-xs sm:p-4",
        styles.bg,
        styles.border,
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
          {label}
        </p>
        <h4 className={cn("mt-1 truncate text-xl font-black sm:text-2xl", styles.text)}>{value}</h4>
        {subtitle && (
          <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold text-slate-500 sm:text-[11px]">
            {subtitle}
          </p>
        )}
      </div>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border sm:h-10 sm:w-10",
          styles.iconBg,
          styles.iconText,
        )}
      >
        {icon}
      </div>
    </div>
  );
}
