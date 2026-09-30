"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Search,
  Users,
  Clock,
  Coins,
  ShieldCheck,
  TrendingUp,
  Building2,
  FileText,
  CheckCircle2,
  Eye,
  Sparkles,
  Printer,
  ChevronRight,
  ArrowUpRight,
  X,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import {
  exportTableAsCsv,
  exportTableAsExcel,
  exportTableAsPdf,
  type ExportColumn,
} from "@/lib/exportUtils";

export type ReportCategory = "Attendance & Leave" | "Payroll & Statutory" | "Employee Headcount" | "Grievance & Performance";
export type ExportFormat = "Excel (.xlsx)" | "PDF Document" | "CSV Spreadsheet";

export interface HRReportItem {
  id: string;
  code: string;
  name: string;
  category: ReportCategory;
  description: string;
  frequency: "Daily" | "Monthly" | "Quarterly" | "Annual" | "On-Demand";
  lastGenerated: string;
  recordCount: number;
  tags: string[];
}

export const INITIAL_HR_REPORTS: HRReportItem[] = [
  {
    id: "REP-001",
    code: "ATT-MON-01",
    name: "Monthly Attendance Summary",
    category: "Attendance & Leave",
    description: "Detailed employee-wise present days, absent days, late arrivals, half days, and total working hours for payroll calculation.",
    frequency: "Monthly",
    lastGenerated: "01/08/2026",
    recordCount: 142,
    tags: ["Attendance", "Punches", "Overtime"],
  },
  {
    id: "REP-002",
    code: "PAY-SUM-02",
    name: "Monthly Payroll Register & Summary",
    category: "Payroll & Statutory",
    description: "Comprehensive payroll register detailing Gross Earnings, Basic, HRA, Allowances, PF/ESI Deductions, TDS, and Net Salary Payouts.",
    frequency: "Monthly",
    lastGenerated: "31/07/2026",
    recordCount: 142,
    tags: ["Payroll", "Net Pay", "Gross CTC"],
  },
  {
    id: "REP-003",
    code: "STAT-PF-03",
    name: "EPF Monthly ECR Statement",
    category: "Payroll & Statutory",
    description: "Statutory Employee Provident Fund (EPF) Electronic Challan cum Return (ECR) monthly statement for EPFO portal upload.",
    frequency: "Monthly",
    lastGenerated: "05/08/2026",
    recordCount: 128,
    tags: ["EPFO", "ECR", "Statutory"],
  },
  {
    id: "REP-004",
    code: "STAT-ESI-04",
    name: "ESIC Monthly Contribution Report",
    category: "Payroll & Statutory",
    description: "Employees' State Insurance Corporation (ESIC) monthly wage contribution statement for online payment challan generation.",
    frequency: "Monthly",
    lastGenerated: "05/08/2026",
    recordCount: 94,
    tags: ["ESIC", "Insurance", "Statutory"],
  },
  {
    id: "REP-005",
    code: "LV-BAL-05",
    name: "Leave Balance & Accumulation Report",
    category: "Attendance & Leave",
    description: "Department-wise employee leave balances covering CL, EL/PL, SL quotas, leaves taken, and carry-forward balances.",
    frequency: "Monthly",
    lastGenerated: "01/08/2026",
    recordCount: 142,
    tags: ["Leave Quotas", "EL Encashment"],
  },
  {
    id: "REP-006",
    code: "EMP-HEAD-06",
    name: "Department-Wise Headcount & Demographics",
    category: "Employee Headcount",
    description: "Headcount breakdown across Front Office, F&B, Housekeeping, Kitchen, Finance, and HR by Employment Type and Grade.",
    frequency: "On-Demand",
    lastGenerated: "10/08/2026",
    recordCount: 142,
    tags: ["Headcount", "Departments", "Designations"],
  },
  {
    id: "REP-007",
    code: "OT-REG-07",
    name: "Overtime Hours & Payout Register",
    category: "Attendance & Leave",
    description: "Summary of approved overtime hours worked per employee with rate multipliers and total OT salary additions.",
    frequency: "Monthly",
    lastGenerated: "31/07/2026",
    recordCount: 48,
    tags: ["Overtime", "Extra Duty"],
  },
  {
    id: "REP-008",
    code: "GRV-LOG-08",
    name: "Grievance Incident & Resolution Log",
    category: "Grievance & Performance",
    description: "Summary of employee complaints, ticket categories, resolution turn-around times (SLA), and assigned officers.",
    frequency: "Quarterly",
    lastGenerated: "30/06/2026",
    recordCount: 26,
    tags: ["Grievances", "SLA Resolution"],
  },
];

type ReportExportRow = Record<string, string | number>;

const REPORT_CATALOG_COLUMNS: ExportColumn<ReportExportRow>[] = [
  { key: "code", header: "Report Code" },
  { key: "name", header: "Report Name" },
  { key: "category", header: "Category" },
  { key: "frequency", header: "Frequency" },
  { key: "lastGenerated", header: "Last Generated" },
  { key: "recordCount", header: "Record Count" },
  { key: "tags", header: "Tags" },
  { key: "period", header: "Period" },
];

const SAMPLE_STAFF = [
  { empCode: "EMP-0101", name: "Rajesh Kumar", department: "Front Office" },
  { empCode: "EMP-0102", name: "Priya Patel", department: "Housekeeping" },
  { empCode: "EMP-0103", name: "Anjali Sharma", department: "F&B Service" },
  { empCode: "EMP-0104", name: "Arjun Verma", department: "Kitchen" },
  { empCode: "EMP-0105", name: "Vikramjit Singh", department: "Finance" },
  { empCode: "EMP-0106", name: "Meera Nair", department: "HR" },
  { empCode: "EMP-0107", name: "Suresh Iyer", department: "Maintenance" },
  { empCode: "EMP-0108", name: "Kavita Das", department: "Front Office" },
];

function buildCatalogRows(reports: HRReportItem[], period: string): ReportExportRow[] {
  return reports.map((report) => ({
    code: report.code,
    name: report.name,
    category: report.category,
    frequency: report.frequency,
    lastGenerated: report.lastGenerated,
    recordCount: report.recordCount,
    tags: report.tags.join(", "),
    period,
  }));
}

function buildReportDetailExport(report: HRReportItem, period: string) {
  const rowCount = Math.min(report.recordCount, SAMPLE_STAFF.length);
  const staff = SAMPLE_STAFF.slice(0, rowCount);

  if (report.category === "Payroll & Statutory") {
    const columns: ExportColumn<ReportExportRow>[] = [
      { key: "empCode", header: "Employee Code" },
      { key: "name", header: "Employee Name" },
      { key: "department", header: "Department" },
      { key: "basic", header: "Basic" },
      { key: "hra", header: "HRA" },
      { key: "gross", header: "Gross Earnings" },
      { key: "pf", header: "PF Deduction" },
      { key: "esi", header: "ESI Deduction" },
      { key: "tds", header: "TDS" },
      { key: "netPay", header: "Net Pay" },
      { key: "period", header: "Period" },
    ];
    const rows: ReportExportRow[] = staff.map((emp, index) => {
      const basic = 18000 + index * 1200;
      const hra = Math.round(basic * 0.4);
      const gross = basic + hra + 3500;
      const pf = Math.round(basic * 0.12);
      const esi = index % 2 === 0 ? Math.round(gross * 0.0075) : 0;
      const tds = index % 3 === 0 ? 1200 : 0;
      const netPay = gross - pf - esi - tds;
      return {
        empCode: emp.empCode,
        name: emp.name,
        department: emp.department,
        basic,
        hra,
        gross,
        pf,
        esi,
        tds,
        netPay,
        period,
      };
    });
    return { columns, rows, title: `${report.name} — ${period}` };
  }

  if (report.category === "Attendance & Leave") {
    const columns: ExportColumn<ReportExportRow>[] = [
      { key: "empCode", header: "Employee Code" },
      { key: "name", header: "Employee Name" },
      { key: "department", header: "Department" },
      { key: "presentDays", header: "Present Days" },
      { key: "absentDays", header: "Absent Days" },
      { key: "lateDays", header: "Late Arrivals" },
      { key: "halfDays", header: "Half Days" },
      { key: "totalHours", header: "Total Hours" },
      { key: "period", header: "Period" },
    ];
    const rows: ReportExportRow[] = staff.map((emp, index) => ({
      empCode: emp.empCode,
      name: emp.name,
      department: emp.department,
      presentDays: 24 - (index % 3),
      absentDays: index % 4,
      lateDays: index % 2,
      halfDays: index % 5 === 0 ? 1 : 0,
      totalHours: 192 - index * 2,
      period,
    }));
    return { columns, rows, title: `${report.name} — ${period}` };
  }

  if (report.category === "Employee Headcount") {
    const columns: ExportColumn<ReportExportRow>[] = [
      { key: "department", header: "Department" },
      { key: "headcount", header: "Headcount" },
      { key: "permanent", header: "Permanent" },
      { key: "contract", header: "Contract" },
      { key: "period", header: "Period" },
    ];
    const departments = [
      "Front Office",
      "F&B Service",
      "Housekeeping",
      "Kitchen",
      "Finance",
      "HR",
      "Maintenance",
    ];
    const rows: ReportExportRow[] = departments.map((department, index) => ({
      department,
      headcount: 12 + index * 3,
      permanent: 10 + index * 2,
      contract: 2 + (index % 3),
      period,
    }));
    return { columns, rows, title: `${report.name} — ${period}` };
  }

  const columns: ExportColumn<ReportExportRow>[] = [
    { key: "empCode", header: "Employee Code" },
    { key: "name", header: "Employee Name" },
    { key: "department", header: "Department" },
    { key: "metric", header: "Metric" },
    { key: "value", header: "Value" },
    { key: "period", header: "Period" },
  ];
  const rows: ReportExportRow[] = staff.map((emp, index) => ({
    empCode: emp.empCode,
    name: emp.name,
    department: emp.department,
    metric: report.tags[0] ?? report.category,
    value: report.recordCount - index,
    period,
  }));
  return { columns, rows, title: `${report.name} — ${period}` };
}

function sanitizeFilename(value: string) {
  return value.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_");
}

function downloadReportExport(
  report: HRReportItem,
  period: string,
  format: ExportFormat,
): string {
  const { columns, rows, title } = buildReportDetailExport(report, period);
  const dateStamp = new Date().toISOString().split("T")[0];
  const baseName = sanitizeFilename(`${report.code}_${report.name}_${dateStamp}`);

  if (format === "CSV Spreadsheet") {
    exportTableAsCsv(`${baseName}.csv`, columns, rows);
    return `"${report.name}" exported to CSV.`;
  }

  if (format === "PDF Document") {
    exportTableAsPdf(title, columns, rows);
    return `"${report.name}" opened for PDF export.`;
  }

  exportTableAsExcel(`${baseName}.xls`, title, columns, rows);
  return `"${report.name}" exported to Excel.`;
}

export function HRReportsView() {
  const [reports] = useState<HRReportItem[]>(INITIAL_HR_REPORTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [frequencyFilter, setFrequencyFilter] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState("August 2026");

  // Drawer / Modal State
  const [viewingReport, setViewingReport] = useState<HRReportItem | null>(null);
  const [exportModalReport, setExportModalReport] = useState<HRReportItem | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("Excel (.xlsx)");
  const [isExporting, setIsExporting] = useState(false);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = reports.length;
    const payroll = reports.filter((r) => r.category === "Payroll & Statutory").length;
    const attendance = reports.filter((r) => r.category === "Attendance & Leave").length;
    const headcount = reports.filter((r) => r.category === "Employee Headcount").length;
    return { total, payroll, attendance, headcount };
  }, [reports]);

  // Filtered List
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = categoryFilter === "ALL" || r.category === categoryFilter;
      const matchFrequency = frequencyFilter === "ALL" || r.frequency === frequencyFilter;

      return matchSearch && matchCategory && matchFrequency;
    });
  }, [reports, searchTerm, categoryFilter, frequencyFilter]);

  const handleExportCatalogExcel = () => {
    if (filteredReports.length === 0) {
      setToastMessage("No reports available to export.");
      return;
    }

    try {
      const dateStamp = new Date().toISOString().split("T")[0];
      const rows = buildCatalogRows(filteredReports, selectedMonth);
      const title = `HR Reports Catalog (${filteredReports.length}) — ${selectedMonth}`;
      exportTableAsExcel(`HR_Reports_Catalog_${dateStamp}.xls`, title, REPORT_CATALOG_COLUMNS, rows);
      setToastMessage(`Exported ${filteredReports.length} reports to Excel.`);
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : "Excel export failed. Please try again.",
      );
    }
  };

  const handleQuickExcelExport = (report: HRReportItem) => {
    try {
      const message = downloadReportExport(report, selectedMonth, "Excel (.xlsx)");
      setToastMessage(message);
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : "Excel export failed. Please try again.",
      );
    }
  };

  const handleTriggerExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportModalReport) return;

    setIsExporting(true);
    try {
      const message = downloadReportExport(
        exportModalReport,
        selectedMonth,
        exportFormat,
      );
      setExportModalReport(null);
      setToastMessage(message);
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : "Export failed. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource"
      title="HR & Payroll Reports"
      description="Generate, view, and export operational attendance registers, statutory EPF/ESIC statements, monthly payroll registers, and headcount analytics."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Reports" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold rounded-xl border border-slate-200 py-2 px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
          >
            <option value="August 2026">📅 Period: August 2026</option>
            <option value="July 2026">📅 Period: July 2026</option>
            <option value="June 2026">📅 Period: June 2026</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCatalogExcel}
            className="rounded-xl text-xs font-semibold"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-700" />
            Export Excel
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: REUSABLE KPI DASHBOARD CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Total HR Reports"
          value={`${stats.total}`}
          subtitle="Standard Catalog"
          tone="blue"
          icon={<FileSpreadsheet className="h-5 w-5" />}
        />
        <HRKPICard
          label="Payroll & Statutory"
          value={`${stats.payroll}`}
          subtitle="PF, ESI & Tax Registers"
          tone="emerald"
          icon={<Coins className="h-5 w-5" />}
        />
        <HRKPICard
          label="Attendance & Leave"
          value={`${stats.attendance}`}
          subtitle="Duty & Leave Tracking"
          tone="purple"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Headcount Analytics"
          value={`${stats.headcount}`}
          subtitle="Staff Demographics"
          tone="amber"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SEARCH & FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Report Name, Code, or Tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50 font-medium text-slate-800"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
            >
              <option value="ALL">All Categories</option>
              <option value="Attendance & Leave">Attendance &amp; Leave</option>
              <option value="Payroll & Statutory">Payroll &amp; Statutory</option>
              <option value="Employee Headcount">Employee Headcount</option>
              <option value="Grievance & Performance">Grievance &amp; Performance</option>
            </select>

            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
            >
              <option value="ALL">All Frequencies</option>
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="On-Demand">On-Demand</option>
            </select>

            {(searchTerm || categoryFilter !== "ALL" || frequencyFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("ALL");
                  setFrequencyFilter("ALL");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: REPORT CARDS GRID (DESKTOP & MOBILE)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2.5 rounded-xl font-bold text-xs ${
                        report.category === "Payroll & Statutory"
                          ? "bg-emerald-50 text-emerald-700"
                          : report.category === "Attendance & Leave"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold block">
                        {report.code}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{report.name}</h3>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                    {report.frequency}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {report.description}
                </p>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {report.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Last generated: <strong className="text-slate-700">{report.lastGenerated}</strong> ({report.recordCount} records)
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingReport(report)}
                    className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> Preview
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickExcelExport(report)}
                    className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setExportModalReport(report)}
                    className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Export
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No HR reports match your search criteria.
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EXPORT / GENERATE REPORT
      ───────────────────────────────────────────────────────────── */}
      {exportModalReport && (
        <Modal
          isOpen={Boolean(exportModalReport)}
          onClose={() => setExportModalReport(null)}
          title={`Generate ${exportModalReport.name}`}
          description="Select export file format and reporting parameters to generate the statement."
          size="sm"
        >
          <form onSubmit={handleTriggerExport} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block">{exportModalReport.code}</span>
              <p className="font-bold text-slate-900 text-xs">{exportModalReport.name}</p>
              <p className="text-[11px] text-slate-500">Period: <strong>{selectedMonth}</strong></p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Export File Format</label>
              <div className="space-y-2">
                {(["Excel (.xlsx)", "PDF Document", "CSV Spreadsheet"] as ExportFormat[]).map((fmt) => (
                  <label
                    key={fmt}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      exportFormat === fmt
                        ? "border-emerald-600 bg-emerald-50/40 text-emerald-950 font-bold"
                        : "border-slate-200 bg-white text-slate-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="exportFmt"
                        checked={exportFormat === fmt}
                        onChange={() => setExportFormat(fmt)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{fmt}</span>
                    </div>
                    {fmt.includes("Excel") && <FileSpreadsheet className="h-4 w-4 text-emerald-700" />}
                    {fmt.includes("PDF") && <FileText className="h-4 w-4 text-rose-600" />}
                    {fmt.includes("CSV") && <FileText className="h-4 w-4 text-blue-600" />}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExportModalReport(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isExporting}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white min-w-[110px]"
              >
                {isExporting ? "Generating..." : "Download File"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: REPORT PREVIEW
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingReport)}
        onClose={() => setViewingReport(null)}
        title="Report Overview & Preview"
        icon={<BarChart3 className="h-5 w-5 text-emerald-700" />}
      >
        {viewingReport && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block">{viewingReport.code}</span>
              <h3 className="text-base font-black text-amber-400">{viewingReport.name}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                {viewingReport.category}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-extrabold text-slate-900 block uppercase text-[11px]">Report Metadata</span>
              <div className="flex justify-between">
                <span className="text-slate-600">Generation Frequency:</span>
                <strong className="text-slate-900">{viewingReport.frequency}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Last Execution Date:</span>
                <strong className="text-slate-900">{viewingReport.lastGenerated}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Audited Record Count:</span>
                <strong className="text-blue-900">{viewingReport.recordCount} Employee Entries</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="font-extrabold text-slate-900 block uppercase text-[11px]">Description &amp; Scope</span>
              <p className="text-slate-700 leading-relaxed">{viewingReport.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickExcelExport(viewingReport)}
                className="font-bold rounded-xl py-2.5 flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                Export Excel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const r = viewingReport;
                  setViewingReport(null);
                  setExportModalReport(r);
                }}
                className="font-bold bg-emerald-700 text-white rounded-xl py-2.5 flex items-center justify-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                More Formats
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
