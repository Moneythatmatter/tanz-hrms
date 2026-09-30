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
  className?: string;
}

export function HREmployeeCell({
  name,
  id,
  avatar = "EMP",
  photoUrl,
  department,
  designation,
  className,
}: HREmployeeCellProps) {
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
          <span className="font-mono text-slate-400">{id}</span>
          {department && (
            <span className="text-slate-500 font-semibold">• {department}</span>
          )}
        </div>
      </div>
    </div>
  );
}
