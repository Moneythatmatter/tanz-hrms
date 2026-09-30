"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type HRKPIGridColumns = 2 | 3 | 4 | 5 | 6;

const columnClasses: Record<HRKPIGridColumns, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
  6: "grid-cols-2 md:grid-cols-3 xl:grid-cols-6",
};

export interface HRKPIGridProps {
  children: React.ReactNode;
  columns?: HRKPIGridColumns;
  className?: string;
}

export function HRKPIGrid({ children, columns = 4, className }: HRKPIGridProps) {
  return (
    <div className={cn("mb-5 grid gap-3 sm:gap-4", columnClasses[columns], className)}>
      {children}
    </div>
  );
}
