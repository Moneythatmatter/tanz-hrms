"use client";

import React, { useMemo } from "react";
import {
  ListSummaryCards,
  type ListSummaryStat,
} from "@/components/shared/list-table";

export interface AttendanceMetrics {
  present: number;
  late: number;
  absent: number;
  pending: number;
  onLeave: number;
}

export interface AttendanceStatsCardsProps {
  metrics: AttendanceMetrics;
  onFilterStatus?: (status: string) => void;
  activeStatus?: string;
}

export function AttendanceStatsCards({
  metrics,
  onFilterStatus,
  activeStatus,
}: AttendanceStatsCardsProps) {
  const stats = useMemo<ListSummaryStat[]>(
    () => [
      {
        label: "Total Present",
        value: metrics.present,
        color: "#16a34a",
        icon: "check-circle",
        filterId: "Present",
      },
      {
        label: "Late / Early Out",
        value: metrics.late,
        color: "#f59e0b",
        icon: "alert-triangle",
        filterId: "Late",
      },
      {
        label: "Absent",
        value: metrics.absent,
        color: "#e11d48",
        icon: "x-circle",
        filterId: "Absent",
      },
      {
        label: "Pending",
        value: metrics.pending,
        color: "#64748b",
        icon: "clock",
        filterId: "Pending",
      },
      {
        label: "On Leave / Weekly Off",
        value: metrics.onLeave,
        color: "#0284c7",
        icon: "calendar-off",
        filterId: "On Leave",
      },
    ],
    [metrics],
  );

  return (
    <ListSummaryCards
      stats={stats}
      columns={5}
      activeFilterId={activeStatus ?? ""}
      onFilterClick={onFilterStatus}
      className="mb-5"
    />
  );
}
