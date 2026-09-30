"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Timer,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AttendanceMonthSummaryPanel,
  ProfileCard,
  ProfileIconField,
} from "@/components/hr/shared/profileHelpers";
import {
  buildEmployeeAttendanceMonthGrid,
  clampAttendanceMonth,
  formatAttendanceMonthLabel,
  getCalendarCellClass,
  getWeekdayLabels,
  mergeAttendanceRecordsIntoGrid,
  parseEmployeeJoinDate,
  summarizeAttendanceMonth,
  type CalendarAttendanceOverlay,
  type EmployeeAttendanceDay,
  type EmployeeAttendanceStatus,
} from "@/lib/hr/employee-attendance";
import {
  hrAttendanceService,
  hrHolidayService,
  hrLeaveApplicationService,
  hrShiftAssignmentService,
} from "@/services/human-resources";
import { mapAttendanceFromApi } from "@/lib/hr/api-mappers";

const COMPACT_WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

const STATUS_BADGE: Record<EmployeeAttendanceStatus, string> = {
  Present: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Late: "bg-amber-100 text-amber-800 border-amber-200",
  Absent: "bg-rose-100 text-rose-800 border-rose-200",
  "Half Day": "bg-purple-100 text-purple-800 border-purple-200",
  "On Leave": "bg-blue-100 text-blue-800 border-blue-200",
  Holiday: "bg-violet-100 text-violet-800 border-violet-200",
  "Weekly Off": "bg-slate-200 text-slate-700 border-slate-300",
  Pending: "bg-amber-50 text-amber-900 border-amber-200",
  Future: "bg-slate-50 text-slate-400 border-slate-100",
  "Before Join": "bg-slate-50 text-slate-300 border-slate-100",
};

function StatusBadge({ status }: { status: EmployeeAttendanceStatus }) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-bold border",
        STATUS_BADGE[status],
      )}
    >
      {status}
    </span>
  );
}

export interface EmployeeAttendanceGridProps {
  employeeId: string;
  joinDate: string;
  shiftType: string;
  showLog?: boolean;
  showSummary?: boolean;
  /** Bump to reload attendance from API (e.g. after leave cancel). */
  refreshKey?: number;
  /** Sidebar / overview embed — tighter layout, less chrome. */
  compact?: boolean;
  /** Full tab — main content left, compact calendar right (matches overview). */
  sideCalendar?: boolean;
  /** Rendered above summary/log in the left column when sideCalendar is set. */
  leadingContent?: React.ReactNode;
  onViewFullAttendance?: () => void;
}

export function EmployeeAttendanceGrid({
  employeeId,
  joinDate,
  shiftType,
  showLog = true,
  showSummary = true,
  compact = false,
  sideCalendar = false,
  leadingContent,
  refreshKey = 0,
  onViewFullAttendance,
}: EmployeeAttendanceGridProps) {
  const parsedJoinDate = useMemo(() => parseEmployeeJoinDate(joinDate), [joinDate]);
  const today = useMemo(() => new Date(), []);
  const weekdayLabels = getWeekdayLabels();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [recordsByDate, setRecordsByDate] = useState<Map<string, CalendarAttendanceOverlay>>(
    new Map(),
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [rows, holidays, leaveApps, shiftAssigns] = await Promise.all([
          hrAttendanceService.getForEmployee(employeeId).catch(() => []),
          hrHolidayService.list().catch(() => []),
          hrLeaveApplicationService.list().catch(() => []),
          hrShiftAssignmentService.list().catch(() => []),
        ]);
        if (cancelled) return;
        const map = new Map<string, CalendarAttendanceOverlay>();

        const parseToIso = (dStr: string) => {
          const s = dStr.trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
            const [d, m, y] = s.split("/");
            return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
          return "";
        };

        // 1. Overlay shift assignments for this employee
        for (const sa of shiftAssigns) {
          const rawEmpId = String((sa as Record<string, unknown>).employeeId || (sa as Record<string, unknown>).employee_id || "");
          if (rawEmpId !== employeeId) continue;
          const rawFrom = String((sa as Record<string, unknown>).effectiveFrom || (sa as Record<string, unknown>).effective_from || "");
          const rawTo = String((sa as Record<string, unknown>).effectiveTo || (sa as Record<string, unknown>).effective_to || "");
          const fromIso = parseToIso(rawFrom);
          const toIso = rawTo ? parseToIso(rawTo) : "2099-12-31";
          if (!fromIso) continue;

          const sName = String((sa as Record<string, unknown>).shiftName || (sa as Record<string, unknown>).shift_name || "Assigned Shift");
          const sTiming = (sa as Record<string, unknown>).startTime && (sa as Record<string, unknown>).endTime
            ? `${(sa as Record<string, unknown>).startTime} - ${(sa as Record<string, unknown>).endTime}`
            : "";
          const fullShiftLabel = sTiming ? `${sName} (${sTiming})` : sName;

          const cur = new Date(fromIso);
          const end = new Date(toIso || fromIso);
          while (cur <= end) {
            const dateKey = cur.toISOString().slice(0, 10);
            const existing = map.get(dateKey);
            if (existing) {
              existing.shiftName = fullShiftLabel;
            } else {
              map.set(dateKey, {
                status: "Pending",
                shiftName: fullShiftLabel,
                checkIn: "-",
                checkOut: "-",
                workedHours: 0,
              });
            }
            cur.setDate(cur.getDate() + 1);
          }
        }

        // 2. Map registered holidays
        for (const h of holidays) {
          const rawDate = String((h as Record<string, unknown>).holidayDate || (h as Record<string, unknown>).holiday_date || "").trim();
          const iso = parseToIso(rawDate);
          if (!iso) continue;
          const prev = map.get(iso);
          map.set(iso, {
            status: "Holiday",
            shiftName: prev?.shiftName || String((h as Record<string, unknown>).holidayName || (h as Record<string, unknown>).name || "Public Holiday"),
            checkIn: "-",
            checkOut: "-",
            workedHours: 0,
            leaveTypeName: String((h as Record<string, unknown>).holidayName || (h as Record<string, unknown>).name || "Holiday"),
            dayType: "Holiday",
          });
        }

        // 3. Overlay approved leaves for this employee
        for (const app of leaveApps) {
          const rawEmpId = String((app as Record<string, unknown>).employeeId || (app as Record<string, unknown>).employee_id || "");
          const status = String((app as Record<string, unknown>).status || "");
          if (rawEmpId !== employeeId || status.toLowerCase() !== "approved") continue;

          const rawFrom = String((app as Record<string, unknown>).fromDate || (app as Record<string, unknown>).from_date || "");
          const rawTo = String((app as Record<string, unknown>).toDate || (app as Record<string, unknown>).to_date || rawFrom);
          const fromIso = parseToIso(rawFrom);
          const toIso = parseToIso(rawTo);
          if (!fromIso) continue;

          const endIso = toIso || fromIso;
          const cur = new Date(fromIso);
          const end = new Date(endIso);

          const leaveName = String((app as Record<string, unknown>).leaveTypeName || (app as Record<string, unknown>).leave_type_name || "Leave");

          while (cur <= end) {
            const dateKey = cur.toISOString().slice(0, 10);
            if (!map.has(dateKey) || map.get(dateKey)?.status !== "Holiday") {
              const prev = map.get(dateKey);
              map.set(dateKey, {
                status: "On Leave",
                shiftName: leaveName || prev?.shiftName,
                checkIn: "-",
                checkOut: "-",
                workedHours: 0,
                leaveTypeName: leaveName,
                dayType: "Leave",
              });
            }
            cur.setDate(cur.getDate() + 1);
          }
        }

        // 4. Overlay individual attendance records
        for (const row of rows) {
          const mapped = mapAttendanceFromApi(row);
          const iso = String(row.attendanceDate ?? row.recordDate ?? "").slice(0, 10);
          if (!iso) continue;
          const prev = map.get(iso);
          map.set(iso, {
            status: mapped.status,
            shiftName: prev?.shiftName || mapped.shiftName,
            checkIn: mapped.checkIn,
            checkOut: mapped.checkOut,
            workedHours: mapped.workedHours,
            leaveTypeName: mapped.leaveTypeName,
            dayType: mapped.dayType,
          });
        }
        setRecordsByDate(map);
      } catch {
        if (!cancelled) setRecordsByDate(new Map());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId, refreshKey]);

  const monthGrid = useMemo(() => {
    const base = buildEmployeeAttendanceMonthGrid(
      employeeId,
      viewYear,
      viewMonth,
      parsedJoinDate,
      shiftType,
      today,
    );
    return mergeAttendanceRecordsIntoGrid(base, recordsByDate);
  }, [employeeId, viewYear, viewMonth, parsedJoinDate, shiftType, today, recordsByDate]);

  const monthSummary = useMemo(
    () => summarizeAttendanceMonth(monthGrid),
    [monthGrid],
  );

  const monthLog = useMemo(
    () =>
      monthGrid
        .filter(
          (d) =>
            d.inMonth &&
            d.status !== "Future" &&
            d.status !== "Before Join",
        )
        .slice()
        .sort((a, b) => b.iso.localeCompare(a.iso)),
    [monthGrid],
  );

  const selectedDay = useMemo(() => {
    if (!selectedDayIso) return null;
    return monthGrid.find((d) => d.iso === selectedDayIso) ?? null;
  }, [monthGrid, selectedDayIso]);

  useEffect(() => {
    const clamped = clampAttendanceMonth(
      today.getFullYear(),
      today.getMonth(),
      parsedJoinDate,
      today,
    );
    setViewYear(clamped.year);
    setViewMonth(clamped.month);
    setSelectedDayIso(null);
  }, [employeeId, joinDate, parsedJoinDate, today]);

  const joinLabel = parsedJoinDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const handleSelectDay = (day: EmployeeAttendanceDay) => {
    if (
      !day.inMonth ||
      day.status === "Future" ||
      day.status === "Before Join"
    ) {
      return;
    }
    setSelectedDayIso(day.iso);
  };

  const changeMonth = (year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
    setSelectedDayIso(null);
  };

  const fillHeight = compact && !showLog && !showSummary && !sideCalendar;
  const calendarRows = Math.ceil(monthGrid.length / 7);
  const calendarCompact = compact || sideCalendar;

  const summaryBlock = showSummary ? (
    <ProfileCard title="Monthly summary">
      <AttendanceMonthSummaryPanel summary={monthSummary} />
    </ProfileCard>
  ) : null;

  const selectedDayBlock =
    selectedDay && (sideCalendar || !calendarCompact) ? (
      <ProfileCard title="Punch details" dense>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 -mt-1">
          <p className="text-sm font-semibold text-slate-800">{selectedDay.label}</p>
          <StatusBadge status={selectedDay.status} />
        </div>
        <dl
          className={cn(
            "grid gap-x-5 gap-y-3",
            sideCalendar
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
          )}
        >
          <ProfileIconField icon={Clock} tone="amber" label="Shift" value={selectedDay.shift} />
          <ProfileIconField icon={LogIn} tone="emerald" label="In time" value={selectedDay.checkIn} />
          <ProfileIconField icon={LogOut} tone="slate" label="Out time" value={selectedDay.checkOut} />
          <ProfileIconField
            icon={Timer}
            tone="indigo"
            label="Total hours"
            value={`${selectedDay.workedHours.toFixed(1)} hrs`}
          />
        </dl>
      </ProfileCard>
    ) : null;

  const emptyDayHint = sideCalendar && !selectedDay ? (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
      <Calendar className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
      <p className="mt-2 text-sm font-medium text-slate-600">No date selected</p>
      <p className="mt-0.5 text-xs text-slate-400">
        Pick a day on the calendar to view punch details
      </p>
    </div>
  ) : null;

  const logBlock = showLog ? (
    <ProfileCard
      title={`Attendance log — ${formatAttendanceMonthLabel(viewYear, viewMonth)}`}
      className="text-xs"
    >
      <p className="text-xs text-slate-500 mb-3 -mt-1">
        Daily punch records for the selected month
      </p>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Shift</th>
              <th className="py-2.5 px-3">In time</th>
              <th className="py-2.5 px-3">Out time</th>
              <th className="py-2.5 px-3">Total hours</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {monthLog.map((row) => (
              <tr
                key={row.iso}
                className={cn(
                  "hover:bg-slate-50 transition-colors cursor-pointer",
                  selectedDayIso === row.iso && "bg-emerald-50/60",
                )}
                onClick={() => setSelectedDayIso(row.iso)}
              >
                <td className="py-2.5 px-3 font-semibold text-slate-800">{row.label}</td>
                <td className="py-2.5 px-3 text-slate-600">{row.shift}</td>
                <td className="py-2.5 px-3 text-slate-700 font-mono">{row.checkIn}</td>
                <td className="py-2.5 px-3 text-slate-700 font-mono">{row.checkOut}</td>
                <td className="py-2.5 px-3 text-slate-700 font-medium">
                  {row.workedHours.toFixed(1)} hrs
                </td>
                <td className="py-2.5 px-3">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProfileCard>
  ) : null;

  const calendarSection = (
    <CalendarPanel
      calendarCompact={calendarCompact}
      fillHeight={fillHeight}
      calendarRows={calendarRows}
      monthSummary={monthSummary}
      viewYear={viewYear}
      viewMonth={viewMonth}
      joinLabel={joinLabel}
      weekdayLabels={weekdayLabels}
      monthGrid={monthGrid}
      selectedDayIso={selectedDayIso}
      parsedJoinDate={parsedJoinDate}
      today={today}
      onChangeMonth={changeMonth}
      onSelectDay={handleSelectDay}
      showFullAttendanceLink={!showLog && !!onViewFullAttendance}
      onViewFullAttendance={onViewFullAttendance}
    />
  );

  if (sideCalendar) {
    return (
      <div
        className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] animate-in fade-in duration-200"
        role="tabpanel"
      >
        <div className="order-2 xl:order-1 space-y-4 min-w-0">
          {leadingContent}
          {summaryBlock}
          {selectedDayBlock ?? emptyDayHint}
          {logBlock}
        </div>

        <div className="order-1 xl:order-2 h-full min-h-0 xl:sticky xl:top-24 self-start">
          {calendarSection}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(showSummary || showLog ? "space-y-4" : "", fillHeight && "h-full")}>
      {summaryBlock}
      {calendarSection}
      {logBlock}
    </div>
  );
}

function CalendarPanel({
  calendarCompact,
  fillHeight,
  calendarRows,
  monthSummary,
  viewYear,
  viewMonth,
  joinLabel,
  weekdayLabels,
  monthGrid,
  selectedDayIso,
  parsedJoinDate,
  today,
  onChangeMonth,
  onSelectDay,
  showFullAttendanceLink,
  onViewFullAttendance,
}: {
  calendarCompact: boolean;
  fillHeight: boolean;
  calendarRows: number;
  monthSummary: ReturnType<typeof summarizeAttendanceMonth>;
  viewYear: number;
  viewMonth: number;
  joinLabel: string;
  weekdayLabels: readonly string[] | string[];
  monthGrid: EmployeeAttendanceDay[];
  selectedDayIso: string | null;
  parsedJoinDate: Date;
  today: Date;
  onChangeMonth: (year: number, month: number) => void;
  onSelectDay: (day: EmployeeAttendanceDay) => void;
  showFullAttendanceLink: boolean;
  onViewFullAttendance?: () => void;
}) {
  if (calendarCompact) {
    return (
      <ProfileCard
        className={cn("flex flex-col", fillHeight && "h-full")}
        dense
      >
        <div className={cn("space-y-3", fillHeight && "flex flex-col flex-1 min-h-0")}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Calendar className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-900">Attendance</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                {monthSummary.workingDays} working days · joined {joinLabel}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2">
            <MonthNav
              viewYear={viewYear}
              viewMonth={viewMonth}
              joinDate={parsedJoinDate}
              today={today}
              onChange={onChangeMonth}
              compact
            />
          </div>

          <div
            className={cn(
              "rounded-lg border border-slate-100 bg-white p-2",
              fillHeight && "flex flex-1 min-h-0 flex-col",
            )}
          >
            <div className="grid grid-cols-7 gap-1 mb-1 shrink-0">
              {COMPACT_WEEKDAY_LABELS.map((label, index) => (
                <div
                  key={`${label}-${index}`}
                  className="text-center text-[10px] font-semibold text-slate-400 py-0.5"
                >
                  {label}
                </div>
              ))}
            </div>

            <div
              className={cn("grid grid-cols-7 gap-1", fillHeight && "flex-1 min-h-0")}
              style={
                fillHeight
                  ? { gridTemplateRows: `repeat(${calendarRows}, minmax(0, 1fr))` }
                  : undefined
              }
            >
              {monthGrid.map((day) => (
                <CalendarCell
                  key={day.iso}
                  day={day}
                  selected={selectedDayIso === day.iso}
                  compact
                  onSelect={() => onSelectDay(day)}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 shrink-0">
            <LegendDot compact className="bg-emerald-600" label="Present" />
            <LegendDot compact className="bg-sky-300" label="Leave" />
            <LegendDot compact className="bg-amber-100 border border-amber-300" label="Pending" />
            <LegendDot compact className="bg-rose-300" label="Absent" />
            <LegendDot compact className="bg-violet-600" label="Holiday" />
          </div>

          {showFullAttendanceLink ? (
            <div className="text-center shrink-0 pt-2 border-t border-slate-100 mt-auto">
              <button
                type="button"
                onClick={onViewFullAttendance}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer py-1"
              >
                Full attendance →
              </button>
            </div>
          ) : null}
        </div>
      </ProfileCard>
    );
  }

  return (
    <ProfileCard title="Attendance calendar">
      <p className="text-xs text-slate-500 -mt-1 mb-3">
        {monthSummary.workingDays} working days in{" "}
        {formatAttendanceMonthLabel(viewYear, viewMonth)} · joined {joinLabel}
      </p>

      <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 mb-4">
        <MonthNav
          viewYear={viewYear}
          viewMonth={viewMonth}
          joinDate={parsedJoinDate}
          today={today}
          onChange={onChangeMonth}
        />
      </div>

      <div className="rounded-lg border border-slate-100 bg-white p-3">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {weekdayLabels.map((label) => (
            <div key={label} className="text-center text-[11px] font-semibold text-slate-400 py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {monthGrid.map((day) => (
            <CalendarCell
              key={day.iso}
              day={day}
              selected={selectedDayIso === day.iso}
              compact={false}
              onSelect={() => onSelectDay(day)}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
        <LegendDot className="bg-emerald-600" label="Present" />
        <LegendDot className="bg-emerald-400" label="Late" />
        <LegendDot className="bg-sky-300" label="Leave" />
        <LegendDot className="bg-amber-100 border border-amber-300" label="Pending" />
        <LegendDot className="bg-rose-300" label="Absent" />
        <LegendDot className="bg-violet-600" label="Holiday" />
        <LegendDot className="bg-slate-100 border border-slate-200" label="Weekly off" />
      </div>

      {showFullAttendanceLink ? (
        <div className="text-center pt-3 mt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onViewFullAttendance}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer py-1"
          >
            View full attendance log & shift history →
          </button>
        </div>
      ) : null}
    </ProfileCard>
  );
}

function CalendarCell({
  day,
  selected,
  compact,
  onSelect,
}: {
  day: EmployeeAttendanceDay;
  selected: boolean;
  compact: boolean;
  onSelect: () => void;
}) {
  if (!day.inMonth) {
    return (
      <span
        className={cn(
          "flex aspect-square w-full items-center justify-center rounded-md",
          compact ? "text-[10px]" : "text-sm",
        )}
        aria-hidden
      />
    );
  }

  const interactive = day.status !== "Future" && day.status !== "Before Join";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!interactive}
      title={
        interactive
          ? `${day.label} — ${day.status}${day.checkIn !== "-" ? ` · ${day.checkIn} – ${day.checkOut}` : ""}`
          : day.status === "Before Join"
            ? "Before joining date"
            : undefined
      }
      className={cn(
        "flex aspect-square w-full items-center justify-center rounded-md font-semibold transition-all",
        compact ? "text-[10px]" : "text-sm",
        getCalendarCellClass(day.status, day.inMonth),
        interactive ? "cursor-pointer hover:brightness-95 active:scale-95" : "cursor-default",
        selected && "ring-2 ring-emerald-600 ring-offset-1 shadow-sm",
      )}
    >
      {day.day}
    </button>
  );
}

function MonthNav({
  viewYear,
  viewMonth,
  joinDate,
  today,
  onChange,
  compact = false,
}: {
  viewYear: number;
  viewMonth: number;
  joinDate: Date;
  today: Date;
  onChange: (year: number, month: number) => void;
  compact?: boolean;
}) {
  const clamped = clampAttendanceMonth(viewYear, viewMonth, joinDate, today);
  const isCurrentMonth =
    clamped.year === today.getFullYear() && clamped.month === today.getMonth();
  const canPrev =
    clamped.year > joinDate.getFullYear() ||
    (clamped.year === joinDate.getFullYear() &&
      clamped.month > joinDate.getMonth());
  const canNext =
    clamped.year < today.getFullYear() ||
    (clamped.year === today.getFullYear() && clamped.month < today.getMonth());

  const go = (delta: number) => {
    let y = clamped.year;
    let m = clamped.month + delta;
    if (m < 0) {
      y -= 1;
      m = 11;
    } else if (m > 11) {
      y += 1;
      m = 0;
    }
    const next = clampAttendanceMonth(y, m, joinDate, today);
    onChange(next.year, next.month);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => go(-1)}
        disabled={!canPrev}
        className={cn(
          "inline-flex items-center justify-center rounded-md border border-slate-200 bg-white shrink-0 transition-colors",
          compact ? "h-7 w-7" : "h-8 w-8",
          canPrev ? "hover:bg-slate-50 cursor-pointer" : "opacity-40 cursor-not-allowed",
        )}
        aria-label="Previous month"
      >
        <ChevronLeft className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
      <span
        className={cn(
          "text-center font-semibold text-slate-900 flex-1 min-w-0 truncate",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {formatAttendanceMonthLabel(clamped.year, clamped.month)}
      </span>
      {!isCurrentMonth ? (
        <button
          type="button"
          onClick={() => onChange(today.getFullYear(), today.getMonth())}
          className={cn(
            "rounded-md border border-emerald-200 bg-emerald-50 font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shrink-0",
            compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
          )}
        >
          Today
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => go(1)}
        disabled={!canNext}
        className={cn(
          "inline-flex items-center justify-center rounded-md border border-slate-200 bg-white shrink-0 transition-colors",
          compact ? "h-7 w-7" : "h-8 w-8",
          canNext ? "hover:bg-slate-50 cursor-pointer" : "opacity-40 cursor-not-allowed",
        )}
        aria-label="Next month"
      >
        <ChevronRight className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
    </div>
  );
}

function LegendDot({
  className,
  label,
  compact = false,
}: {
  className: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-slate-500",
        compact ? "text-[10px]" : "text-[11px]",
      )}
    >
      <span className={cn(compact ? "h-2 w-2 rounded-full" : "h-2.5 w-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}
