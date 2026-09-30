"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FileCode,
  FileSpreadsheet,
  FileText,
  CalendarRange,
} from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  clampIsoDate,
  resolveReportExportRange,
  type ReportExportFormat,
  type ReportExportPeriod,
} from "@/lib/hr/report-export";

const formatOptions: {
  id: ReportExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "csv",
    label: "CSV",
    description: "Comma-separated spreadsheet",
    icon: <FileText className="h-4 w-4 text-blue-700" />,
  },
  {
    id: "excel",
    label: "Excel",
    description: "Microsoft Excel workbook (.xls)",
    icon: <FileSpreadsheet className="h-4 w-4 text-emerald-700" />,
  },
  {
    id: "pdf",
    label: "PDF",
    description: "Print or save as PDF",
    icon: <FileCode className="h-4 w-4 text-rose-600" />,
  },
];

const periodOptions: { id: ReportExportPeriod; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "custom", label: "Custom range" },
];

export interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: {
    format: ReportExportFormat;
    period: ReportExportPeriod;
    fromDate: string;
    toDate: string;
  }) => void | Promise<void>;
  defaultDate: string;
  maxDate?: string;
  title?: string;
  description?: string;
  exporting?: boolean;
}

function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function ReportExportModal({
  isOpen,
  onClose,
  onExport,
  defaultDate,
  maxDate,
  title = "Export report",
  description = "Choose file type and time period for the export.",
  exporting = false,
}: ReportExportModalProps) {
  const today = maxDate ?? new Date().toLocaleDateString("en-CA");
  const [format, setFormat] = useState<ReportExportFormat>("excel");
  const [period, setPeriod] = useState<ReportExportPeriod>("day");
  const [anchorDate, setAnchorDate] = useState(defaultDate);
  const [customFrom, setCustomFrom] = useState(defaultDate);
  const [customTo, setCustomTo] = useState(defaultDate);

  useEffect(() => {
    if (!isOpen) return;
    setFormat("excel");
    setPeriod("day");
    setAnchorDate(defaultDate);
    setCustomFrom(defaultDate);
    setCustomTo(defaultDate);
  }, [isOpen, defaultDate]);

  const resolvedRange = useMemo(
    () =>
      resolveReportExportRange(
        period,
        clampIsoDate(anchorDate, today),
        clampIsoDate(customFrom, today),
        clampIsoDate(customTo, today),
      ),
    [period, anchorDate, customFrom, customTo, today],
  );

  const periodSummary = useMemo(() => {
    if (period === "day") {
      return formatDisplayDate(resolvedRange.fromDate);
    }
    if (period === "week" || period === "month" || period === "custom") {
      return `${formatDisplayDate(resolvedRange.fromDate)} → ${formatDisplayDate(resolvedRange.toDate)}`;
    }
    return "";
  }, [period, resolvedRange]);

  const handleExport = () => {
    const fromDate =
      period === "custom"
        ? clampIsoDate(customFrom, today)
        : resolvedRange.fromDate;
    const toDate =
      period === "custom"
        ? clampIsoDate(customTo >= fromDate ? customTo : fromDate, today)
        : resolvedRange.toDate;

    void onExport({
      format,
      period,
      fromDate: fromDate <= toDate ? fromDate : toDate,
      toDate: toDate >= fromDate ? toDate : fromDate,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            File type
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {formatOptions.map((option) => {
              const selected = format === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFormat(option.id)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    selected
                      ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span className="text-sm font-bold text-slate-900">{option.label}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Time period
          </p>
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPeriod(option.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
                  period === option.id
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            {period === "day" && (
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Select day</label>
                <input
                  type="date"
                  value={anchorDate}
                  max={today}
                  onChange={(e) => setAnchorDate(clampIsoDate(e.target.value, today))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                />
              </div>
            )}

            {(period === "week" || period === "month") && (
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  {period === "week" ? "Week containing" : "Month containing"}
                </label>
                <input
                  type="date"
                  value={anchorDate}
                  max={today}
                  onChange={(e) => setAnchorDate(clampIsoDate(e.target.value, today))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                />
              </div>
            )}

            {period === "custom" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    max={today}
                    onChange={(e) => setCustomFrom(clampIsoDate(e.target.value, today))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">To</label>
                  <input
                    type="date"
                    value={customTo}
                    max={today}
                    min={customFrom}
                    onChange={(e) => setCustomTo(clampIsoDate(e.target.value, today))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              <CalendarRange className="h-4 w-4 shrink-0" />
              <span>
                Export range: <strong>{periodSummary}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={exporting}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="rounded-xl bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800"
          >
            {exporting ? "Exporting…" : "Export report"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
