"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface HREmployeeCellProps {
  name: string;
  id: string;
  avatar?: string;
  photoUrl?: string;
  department?: string;
  designation?: string;
  /** When "department", the subtitle shows department instead of employee id. */
  secondaryLine?: "id" | "department";
  className?: string;
}

export function HREmployeeCell({
  name,
  id,
  avatar = "EMP",
  photoUrl,
  department,
  designation,
  secondaryLine = "id",
  className,
}: HREmployeeCellProps) {
  const subtitle =
    secondaryLine === "department"
      ? department?.trim() || "—"
      : id;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="h-8 w-8 rounded-xl object-cover border border-slate-200 shrink-0"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold text-xs shrink-0">
          {avatar}
        </div>
      )}
      <div>
        <p className="font-bold text-slate-900 leading-tight">{name}</p>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span
            className={
              secondaryLine === "department"
                ? "text-slate-500 font-semibold"
                : "font-mono text-slate-400"
            }
          >
            {subtitle}
          </span>
          {secondaryLine === "id" && department && (
            <span className="text-slate-500 font-semibold">• {department}</span>
          )}
        </div>
      </div>
    </div>
  );
}
