"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "info";

const toneStyles: Record<BadgeTone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200 border-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200 border-rose-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200 border-slate-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200 border-sky-200",
};

const statusToneMap: Record<string, BadgeTone> = {
  // Success / Positive
  Active: "success",
  Confirmed: "success",
  "Checked In": "success",
  Clean: "success",
  Inspected: "success",
  Passed: "success",
  Paid: "success",
  Completed: "success",
  Settled: "success",
  Success: "success",
  Posted: "success",
  Resolved: "success",
  "Vacant Ready": "success",
  Closed: "success",

  // Warning / In-Progress
  Pending: "warning",
  "In Progress": "warning",
  "In Transit": "warning",
  Partial: "warning",
  Open: "warning",
  Stored: "warning",
  Scheduled: "warning",
  "Awaiting Verification": "warning",
  Warning: "warning",

  // Danger / Negative
  Inactive: "danger",
  Cancelled: "danger",
  Refunded: "danger",
  Rejected: "danger",
  Dirty: "danger",
  "Vacant Dirty": "danger",
  "Occupied Dirty": "danger",
  "Out of Order": "danger",
  OOO: "danger",
  "Out of Service": "danger",
  OOS: "danger",
  Critical: "danger",
  Failed: "danger",
  Exception: "danger",
  Overdue: "danger",

  // Info
  "Checked Out": "info",
  Occupied: "info",
  Reserved: "info",
  Vacant: "info",
  Info: "info",

  // Neutral
  Draft: "neutral",
  Archived: "neutral",
  Normal: "neutral",
  Low: "neutral",
  Medium: "neutral",
};

export interface StatusBadgeProps {
  status?: string;
  label?: string;
  tone?: BadgeTone;
  className?: string;
}

export function StatusBadge({ status, label, tone, className }: StatusBadgeProps) {
  const badgeText = label ?? status ?? "";
  const effectiveTone = tone ?? (status ? statusToneMap[status] : undefined) ?? "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors",
        toneStyles[effectiveTone],
        className
      )}
    >
      {badgeText}
    </span>
  );
}
