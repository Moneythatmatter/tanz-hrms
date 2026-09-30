import type { ExportColumn } from "@/lib/exportUtils";
import {
  exportTableAsCsv,
  exportTableAsExcel,
  exportTableAsPdf,
} from "@/lib/exportUtils";

export type ReportExportFormat = "csv" | "excel" | "pdf";
export type ReportExportPeriod = "day" | "week" | "month" | "custom";

export interface ReportExportOptions {
  format: ReportExportFormat;
  period: ReportExportPeriod;
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

export function todayIsoDate(): string {
  return new Date().toLocaleDateString("en-CA");
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

export function resolveReportExportRange(
  period: ReportExportPeriod,
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

/** Parse DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD for range compare. */
export function normalizeToIsoDate(value?: string | null): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parts = value.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return null;
}

export function filterByIsoDateRange<T>(
  records: T[],
  getDate: (record: T) => string | null | undefined,
  fromDate: string,
  toDate: string,
): T[] {
  return records.filter((record) => {
    const iso = normalizeToIsoDate(getDate(record));
    if (!iso) return false;
    return iso >= fromDate && iso <= toDate;
  });
}

export function exportGenericReport<T extends Record<string, unknown>>(
  rows: T[],
  columns: ExportColumn<T>[],
  options: ReportExportOptions,
  reportName: string,
): void {
  if (rows.length === 0) {
    throw new Error("No records found for the selected period.");
  }

  const rangeLabel =
    options.fromDate === options.toDate
      ? options.fromDate
      : `${options.fromDate}_to_${options.toDate}`;
  const baseName = `${reportName}_${rangeLabel}`;
  const title = `${reportName.replace(/_/g, " ")} (${options.fromDate}${
    options.fromDate !== options.toDate ? ` → ${options.toDate}` : ""
  })`;

  if (options.format === "csv") {
    exportTableAsCsv(`${baseName}.csv`, columns, rows);
    return;
  }

  if (options.format === "excel") {
    exportTableAsExcel(`${baseName}.xls`, title, columns, rows);
    return;
  }

  exportTableAsPdf(title, columns, rows);
}
