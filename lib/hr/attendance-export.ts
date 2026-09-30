import type { EmployeeItem } from "@/app/data/hr/employeeListData";
import type { ExportColumn } from "@/lib/exportUtils";
import {
  exportTableAsCsv,
  exportTableAsExcel,
  exportTableAsPdf,
} from "@/lib/exportUtils";

export type AttendanceExportFormat = "csv" | "excel" | "pdf";
export type AttendanceExportPeriod = "day" | "week" | "month" | "custom";

export interface AttendanceExportRecord {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  shiftCode: string;
  shiftName: string;
  date: string;
  dayType?: "WORKING_DAY" | "HOLIDAY" | "WEEKLY_OFF";
  checkIn: string;
  checkOut: string;
  workedHours: number;
  extraHours?: number;
  holidayName?: string | null;
  leaveTypeName?: string | null;
  status: string;
}

export interface AttendanceExportOptions {
  format: AttendanceExportFormat;
  period: AttendanceExportPeriod;
  fromDate: string;
  toDate: string;
}

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

export function clampIsoDate(iso: string, maxIso: string): string {
  return iso > maxIso ? maxIso : iso;
}

export function shiftIsoDate(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function startOfWeek(iso: string): string {
  const date = parseIsoDate(iso);
  const weekday = date.getDay();
  const diff = weekday === 0 ? 6 : weekday - 1;
  date.setDate(date.getDate() - diff);
  return toIsoDate(date);
}

function endOfWeek(iso: string): string {
  const date = parseIsoDate(startOfWeek(iso));
  date.setDate(date.getDate() + 6);
  return toIsoDate(date);
}

function startOfMonth(iso: string): string {
  const [year, month] = iso.split("-");
  return `${year}-${month}-01`;
}

function endOfMonth(iso: string): string {
  const date = parseIsoDate(startOfMonth(iso));
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return toIsoDate(date);
}

export function resolveAttendanceExportRange(
  period: AttendanceExportPeriod,
  anchorDate: string,
  customFrom?: string,
  customTo?: string,
): { fromDate: string; toDate: string } {
  switch (period) {
    case "day":
      return { fromDate: anchorDate, toDate: anchorDate };
    case "week":
      return { fromDate: startOfWeek(anchorDate), toDate: endOfWeek(anchorDate) };
    case "month":
      return { fromDate: startOfMonth(anchorDate), toDate: endOfMonth(anchorDate) };
    case "custom":
      return {
        fromDate: customFrom || anchorDate,
        toDate: customTo || customFrom || anchorDate,
      };
    default:
      return { fromDate: anchorDate, toDate: anchorDate };
  }
}

function dayTypeLabel(dayType?: AttendanceExportRecord["dayType"]): string {
  switch (dayType) {
    case "HOLIDAY":
      return "Holiday";
    case "WEEKLY_OFF":
      return "Weekly Off";
    default:
      return "Working Day";
  }
}

export type AttendanceExportRow = {
  empCode: string;
  employeeName: string;
  department: string;
  designation: string;
  shift: string;
  date: string;
  dayType: string;
  punchIn: string;
  punchOut: string;
  workedHours: number;
  extraHours: number;
  holidayLeave: string;
  status: string;
};

export const attendanceExportColumns: ExportColumn<AttendanceExportRow>[] = [
  { key: "empCode", header: "Employee Code" },
  { key: "employeeName", header: "Employee Name" },
  { key: "department", header: "Department" },
  { key: "designation", header: "Designation" },
  { key: "shift", header: "Shift" },
  { key: "date", header: "Date" },
  { key: "dayType", header: "Day Type" },
  { key: "punchIn", header: "Punch In" },
  { key: "punchOut", header: "Punch Out" },
  { key: "workedHours", header: "Worked (h)" },
  { key: "extraHours", header: "Extra (h)" },
  { key: "holidayLeave", header: "Holiday / Leave" },
  { key: "status", header: "Status" },
];

export function buildAttendanceExportRows(
  records: AttendanceExportRecord[],
  employeeLookup: Map<string, EmployeeItem>,
): AttendanceExportRow[] {
  return records.map((record) => ({
    empCode: employeeLookup.get(record.employeeId)?.empCode ?? "—",
    employeeName: record.employeeName,
    department: record.department,
    designation: record.designation,
    shift: record.shiftName,
    date: record.date,
    dayType: dayTypeLabel(record.dayType),
    punchIn: record.checkIn,
    punchOut: record.checkOut,
    workedHours: record.workedHours,
    extraHours: record.extraHours ?? 0,
    holidayLeave: record.holidayName ?? record.leaveTypeName ?? "—",
    status: record.status,
  }));
}

export function filterAttendanceForExport(
  records: AttendanceExportRecord[],
  employeeLookup: Map<string, EmployeeItem>,
  filters: {
    searchTerm: string;
    department: string;
    shift: string;
    status: string;
  },
): AttendanceExportRecord[] {
  const term = filters.searchTerm.trim().toLowerCase();

  return records.filter((record) => {
    const empCode = employeeLookup.get(record.employeeId)?.empCode ?? "";
    const matchSearch =
      !term ||
      record.employeeName.toLowerCase().includes(term) ||
      empCode.toLowerCase().includes(term) ||
      record.shiftName.toLowerCase().includes(term);

    const matchDept = filters.department === "ALL" || record.department === filters.department;
    const matchShift =
      filters.shift === "ALL" || record.shiftCode.startsWith(filters.shift);
    const matchStatus =
      filters.status === "ALL" ||
      record.status === filters.status ||
      (filters.status === "On Leave" &&
        (record.status === "On Leave" ||
          record.status === "Weekly Off" ||
          record.status === "Holiday"));

    return matchSearch && matchDept && matchShift && matchStatus;
  });
}

export function exportAttendanceReport(
  rows: AttendanceExportRow[],
  options: AttendanceExportOptions,
): void {
  if (rows.length === 0) {
    throw new Error("No attendance records found for the selected period.");
  }

  const rangeLabel =
    options.fromDate === options.toDate
      ? options.fromDate
      : `${options.fromDate}_to_${options.toDate}`;
  const baseName = `Attendance_Report_${rangeLabel}`;
  const title = `Attendance Report (${options.fromDate}${
    options.fromDate !== options.toDate ? ` → ${options.toDate}` : ""
  })`;

  if (options.format === "csv") {
    exportTableAsCsv(`${baseName}.csv`, attendanceExportColumns, rows);
    return;
  }

  if (options.format === "excel") {
    exportTableAsExcel(`${baseName}.xls`, title, attendanceExportColumns, rows);
    return;
  }

  exportTableAsPdf(title, attendanceExportColumns, rows);
}
