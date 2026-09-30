"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Timer,
  Search,
  Users,
  Clock,
  CheckCircle2,
  Eye,
  Check,
  X,
  Printer,
  Info,
  Zap,
  Banknote,
  AlertTriangle,
  Trash2,
  Building2,
  SlidersHorizontal,
  Plus,
  ChevronDown,
  Edit3,
  FileCheck,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";
import { HrSearchFilterToolbar } from "@/components/hr/shared/HrSearchFilterToolbar";
import { ReportExportModal } from "@/components/shared/ReportExportModal";
import {
  ListSummaryCards,
  ToolbarFilterGroup,
  ToolbarFilterSelect,
} from "@/components/shared/list-table";
import { employeeDepartmentFilterOptions } from "@/app/data/hr/employeeDepartmentOptions";
import {
  exportGenericReport,
  filterByIsoDateRange,
  normalizeToIsoDate,
  todayIsoDate,
  type ReportExportOptions,
} from "@/lib/hr/report-export";
import type { ExportColumn } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";
import { hrOvertimeService, hrEmployeeService, hrAttendanceService } from "@/services/human-resources";
import { mapOvertimeFromApi, mapOvertimeToApi, mapEmployeeFromApi } from "@/lib/hr/api-mappers";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";

export type OvertimeType =
  | "Regular OT"
  | "Holiday OT"
  | "Weekly Off OT"
  | "Emergency Call-In OT"
  | "Night Differential OT";

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  shiftCode: string;
  shiftName: string;
  otType: OvertimeType;
  date: string;
  checkIn: string;
  checkOut: string;
  scheduledHours: number;
  breakHours: number;
  workedHours: number;
  overtimeHours: number;
  hourlyRate: number;
  otRateMultiplier: number;
  payableAmount: number; // Calculated: OT Hours * Multiplier * Base Hourly Rate
  reason?: string;
  status: "Pending" | "Approved" | "Rejected" | "Processed";
  approvedBy?: string;
  approvedOn?: string;
  approvalRemarks?: string;
}

const overtimeOtTypeFilterOptions = [
  { value: "ALL", label: "All OT types" },
  { value: "Regular OT", label: "Regular OT (1.5x)" },
  { value: "Holiday OT", label: "Holiday OT (2.0x)" },
  { value: "Weekly Off OT", label: "Weekly off OT (2.0x)" },
  { value: "Emergency Call-In OT", label: "Emergency call-in (2.0x)" },
  { value: "Night Differential OT", label: "Night differential (1.75x)" },
] as const;

const overtimeStatusFilterOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "Pending", label: "Pending Approval" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "Processed", label: "Processed" },
] as const;

type OvertimeExportRow = {
  employeeId: string;
  employeeName: string;
  department: string;
  otType: string;
  date: string;
  overtimeHours: number;
  payableAmount: number;
  status: string;
};

const overtimeExportColumns: ExportColumn<OvertimeExportRow>[] = [
  { key: "employeeId", header: "Employee ID" },
  { key: "employeeName", header: "Employee Name" },
  { key: "department", header: "Department" },
  { key: "otType", header: "OT Type" },
  { key: "date", header: "Date" },
  { key: "overtimeHours", header: "OT Hours" },
  { key: "payableAmount", header: "Payable (TZS)" },
  { key: "status", header: "Status" },
];

export function getMultiplierForType(type: OvertimeType | string): number {
  switch (type) {
    case "Regular OT":
      return 1.5;
    case "Weekly Off OT":
      return 2.0;
    case "Holiday OT":
      return 2.0;
    case "Emergency Call-In OT":
      return 2.0;
    case "Night Differential OT":
      return 1.75;
    default:
      return 1.5;
  }
}

export function OvertimeManagementView() {
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);

  const loadOvertime = async () => {
    setLoading(true);
    try {
      const [rows, empRows] = await Promise.all([
        hrOvertimeService.list(),
        hrEmployeeService.list(),
      ]);
      const emps = empRows.map(mapEmployeeFromApi);
      setEmployees(emps);
      const lookup = new Map(emps.map((e) => [e.id, e]));
      setRecords(rows.map((row) => mapOvertimeFromApi(row, lookup.get(String(row.employeeId || row.employee_id)))));
      if (emps[0]) setReqEmpId(emps[0].id);
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load overtime records");
      setRecords([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOvertime();
  }, []);

  // Single-Line Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedOtType, setSelectedOtType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState(todayIsoDate);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Modals & Side Drawer
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<OvertimeRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Manager Review & Modification State
  const [reviewOtHours, setReviewOtHours] = useState<string>("0");
  const [reviewOtType, setReviewOtType] = useState<OvertimeType>("Regular OT");
  const [reviewRemarks, setReviewRemarks] = useState<string>("");
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Synchronize review form state whenever viewingRecord changes
  useEffect(() => {
    if (viewingRecord) {
      setReviewOtHours(String(viewingRecord.overtimeHours));
      setReviewOtType(viewingRecord.otType);
      setReviewRemarks(viewingRecord.approvalRemarks || "");
    }
  }, [viewingRecord]);

  // Request OT Form State
  const [reqEmpId, setReqEmpId] = useState("");
  const [reqEmpQuery, setReqEmpQuery] = useState("");
  const [isReqEmpComboboxOpen, setIsReqEmpComboboxOpen] = useState(false);
  const reqComboboxRef = useRef<HTMLDivElement>(null);
  const [reqOtType, setReqOtType] = useState<OvertimeType | "">("Regular OT");
  const [reqDate, setReqDate] = useState("");
  const [reqHours, setReqHours] = useState<string>("2.0");
  const [reqReason, setReqReason] = useState("");

  // Close Employee Combobox Popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (reqComboboxRef.current && !reqComboboxRef.current.contains(event.target as Node)) {
        setIsReqEmpComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matchesBaseFilters = (r: OvertimeRecord) => {
    const matchSearch =
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.shiftName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDepartment === "ALL" || r.department === selectedDepartment;
    const matchOtType = selectedOtType === "ALL" || r.otType === selectedOtType;
    const matchStatus = selectedStatus === "ALL" || r.status === selectedStatus;
    return matchSearch && matchDept && matchOtType && matchStatus;
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (!matchesBaseFilters(r)) return false;
      const iso = normalizeToIsoDate(r.date);
      return iso === selectedDate;
    });
  }, [records, searchTerm, selectedDepartment, selectedOtType, selectedStatus, selectedDate]);

  // Meaningful KPI Metrics
  const metrics = useMemo(() => {
    const pendingCount = records.filter((r) => r.status === "Pending").length;
    const approvedHours = records
      .filter((r) => r.status === "Approved" || r.status === "Processed")
      .reduce((sum, r) => sum + r.overtimeHours, 0);

    const totalCostPayable = records
      .filter((r) => r.status === "Approved" || r.status === "Processed")
      .reduce((sum, r) => sum + r.payableAmount, 0);

    const uniqueEmployees = new Set(
      records.filter((r) => r.status === "Approved" || r.status === "Pending").map((r) => r.employeeId)
    ).size;

    return {
      pendingCount,
      approvedHours: approvedHours.toFixed(1),
      totalCostPayable,
      uniqueEmployees,
    };
  }, [records]);

  const summaryStats = useMemo(
    () => [
      {
        label: "Pending Approval",
        value: metrics.pendingCount,
        color: "#f59e0b",
        icon: "clock" as const,
        filterId: "Pending",
      },
      {
        label: "Approved Hours",
        value: metrics.approvedHours,
        color: "#16a34a",
        icon: "check-circle" as const,
        filterId: "Approved",
      },
      {
        label: "OT Cost Impact",
        value: formatMoney(metrics.totalCostPayable),
        color: "#0284c7",
        icon: "banknote" as const,
      },
      {
        label: "Employees with OT",
        value: metrics.uniqueEmployees,
        color: "#64748b",
        icon: "users" as const,
      },
    ],
    [metrics],
  );

  const today = todayIsoDate();
  const hasActiveFilters =
    searchTerm !== "" ||
    selectedDepartment !== "ALL" ||
    selectedOtType !== "ALL" ||
    selectedStatus !== "ALL" ||
    selectedDate !== today;

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("ALL");
    setSelectedOtType("ALL");
    setSelectedStatus("ALL");
    setSelectedDate(today);
  };

  const handleStatFilter = (status: string) => {
    setSelectedStatus((prev) => (prev === status ? "ALL" : status));
  };

  const handleOvertimeExport = async (options: ReportExportOptions) => {
    setExporting(true);
    try {
      const base = records.filter(matchesBaseFilters);
      const ranged = filterByIsoDateRange(base, (r) => r.date, options.fromDate, options.toDate);
      const rows: OvertimeExportRow[] = ranged.map((r) => ({
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        department: r.department,
        otType: r.otType,
        date: r.date,
        overtimeHours: r.overtimeHours,
        payableAmount: r.payableAmount,
        status: r.status,
      }));
      exportGenericReport(rows, overtimeExportColumns, options, "Overtime_Report");
      setToastMessage(`Exported ${rows.length} overtime record(s).`);
      setIsExportModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  // Live calculation values for Review Drawer
  const parsedReviewHours = Math.max(0, parseFloat(reviewOtHours) || 0);
  const currentMultiplier = getMultiplierForType(reviewOtType);
  const currentHourlyRate = viewingRecord?.hourlyRate || 300;
  const livePayableAmount = Math.round(parsedReviewHours * currentMultiplier * currentHourlyRate);

  // Approve Handler with Modification capability
  const handleApprove = async (
    record: OvertimeRecord,
    approvedHours: number,
    approvedType: OvertimeType,
    payable: number,
    remarks: string
  ) => {
    setIsProcessingApproval(true);
    const todayStr = new Date().toISOString().split("T")[0];
    const multiplier = getMultiplierForType(approvedType);

    const updatePayload = {
      overtime_hours: approvedHours,
      ot_type: approvedType,
      ot_rate_multiplier: multiplier,
      payable_amount: payable,
      status: "Approved",
      approved_by: "HR Administrator",
      approved_on: todayStr,
      approval_remarks: remarks || "Approved by HR / Manager.",
    };

    try {
      await hrOvertimeService.update(record.id, updatePayload);
      setRecords((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? {
                ...r,
                overtimeHours: approvedHours,
                otType: approvedType,
                otRateMultiplier: multiplier,
                payableAmount: payable,
                status: "Approved",
                approvedBy: "HR Administrator",
                approvedOn: todayStr,
                approvalRemarks: remarks || "Approved by HR / Manager.",
              }
            : r
        )
      );

      if (viewingRecord?.id === record.id) {
        setViewingRecord((prev) =>
          prev
            ? {
                ...prev,
                overtimeHours: approvedHours,
                otType: approvedType,
                otRateMultiplier: multiplier,
                payableAmount: payable,
                status: "Approved",
                approvedBy: "HR Administrator",
                approvedOn: todayStr,
                approvalRemarks: remarks || "Approved by HR / Manager.",
              }
            : null
        );
      }

      setToastMessage(
        `Overtime Approved: ${approvedHours} hrs for ${record.employeeName} (${formatMoney(payable)}) added to official records & Payroll.`
      );
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to approve overtime record");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Reject Handler
  const handleReject = async (record: OvertimeRecord, remarks?: string) => {
    setIsProcessingApproval(true);
    const todayStr = new Date().toISOString().split("T")[0];
    const updatePayload = {
      status: "Rejected",
      payable_amount: 0,
      approved_by: "HR Administrator",
      approved_on: todayStr,
      approval_remarks: remarks || "Rejected by HR / Manager.",
    };

    try {
      await hrOvertimeService.update(record.id, updatePayload);
      setRecords((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? {
                ...r,
                status: "Rejected",
                payableAmount: 0,
                approvedBy: "HR Administrator",
                approvedOn: todayStr,
                approvalRemarks: remarks || "Rejected by HR / Manager.",
              }
            : r
        )
      );

      if (viewingRecord?.id === record.id) {
        setViewingRecord((prev) =>
          prev
            ? {
                ...prev,
                status: "Rejected",
                payableAmount: 0,
                approvedBy: "HR Administrator",
                approvedOn: todayStr,
                approvalRemarks: remarks || "Rejected by HR / Manager.",
              }
            : null
        );
      }

      setToastMessage(`Overtime Rejected for ${record.employeeName}. Excluded from Payroll calculations.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to reject overtime record");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    try {
      await hrOvertimeService.remove(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (viewingRecord?.id === id) setViewingRecord(null);
      setDeleteTargetId(null);
      setToastMessage("Deleted overtime record.");
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to delete record");
    }
  };

  // Manual Assign Overtime (Creates Pending Request)
  const handleSaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqEmpId) {
      setToastMessage("Please select an employee.");
      return;
    }

    const empObj = employees.find((x) => x.id === reqEmpId);
    const parsedHours = parseFloat(reqHours) || 2.0;
    const actualOtType = (reqOtType || "Regular OT") as OvertimeType;
    const multiplier = getMultiplierForType(actualOtType);
    const hourlyRate = 300;
    const payable = Math.round(parsedHours * multiplier * hourlyRate);
    const targetDate = reqDate || selectedDate || todayIsoDate();

    const newPayload = {
      employee_id: reqEmpId,
      shift_code: "MS-01",
      shift_name: "Morning Shift (A)",
      ot_type: actualOtType,
      record_date: targetDate,
      check_in: "07:00 AM",
      check_out: "07:30 PM",
      scheduled_hours: 8.0,
      break_hours: 0.75,
      worked_hours: 8.0 + parsedHours,
      overtime_hours: parsedHours,
      hourly_rate: hourlyRate,
      ot_rate_multiplier: multiplier,
      payable_amount: payable,
      reason: reqReason || "Overtime request submitted via HR.",
      status: "Pending", // Generated as Pending Request for Manager review
    };

    try {
      await hrOvertimeService.create(newPayload);
      await loadOvertime();
      setIsRequestModalOpen(false);
      setToastMessage(
        `Overtime Request submitted for ${empObj?.name || reqEmpId} (${parsedHours} Hrs). Pending Manager Review & Approval.`
      );
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to create overtime request");
    }
  };

  // Auto-Detect OT from Punch-In / Punch-Out logs
  const handleAutoDetectOt = async () => {
    setIsDetecting(true);
    try {
      const dailyAttendances = await hrAttendanceService.getDaily(selectedDate).catch(() => []);
      let detectedCount = 0;

      for (const att of dailyAttendances) {
        const worked = Number(att.worked_hours ?? att.workedHours ?? 0);
        const scheduled = Number(att.scheduled_hours ?? att.scheduledHours ?? 8);
        const empId = String(att.employee_id ?? att.employeeId ?? "");

        if (worked > scheduled && empId) {
          const alreadyExists = records.some(
            (r) => r.employeeId === empId && normalizeToIsoDate(r.date) === selectedDate
          );

          if (!alreadyExists) {
            const extraHours = Math.round((worked - scheduled) * 10) / 10;
            const rateMultiplier = 1.5;
            const hourlyRate = 300;
            const payable = Math.round(extraHours * rateMultiplier * hourlyRate);

            const payload = {
              employee_id: empId,
              shift_code: String(att.shift_code ?? att.shiftCode ?? "MS-01"),
              shift_name: String(att.shift_name ?? att.shiftName ?? "Scheduled Shift"),
              ot_type: "Regular OT",
              record_date: selectedDate,
              check_in: String(att.check_in ?? att.checkIn ?? "09:00 AM"),
              check_out: String(att.check_out ?? att.checkOut ?? "07:00 PM"),
              scheduled_hours: scheduled,
              break_hours: Number(att.break_hours ?? att.breakHours ?? 0.5),
              worked_hours: worked,
              overtime_hours: extraHours,
              hourly_rate: hourlyRate,
              ot_rate_multiplier: rateMultiplier,
              payable_amount: payable,
              reason: `System auto-detected ${extraHours} hrs from punch records (${att.check_in || "09:00 AM"} - ${att.check_out || "07:00 PM"}). Awaiting manager approval.`,
              status: "Pending", // Important: Auto-detected OT is ALWAYS Pending!
            };

            await hrOvertimeService.create(payload);
            detectedCount++;
          }
        }
      }

      await loadOvertime();
      if (detectedCount > 0) {
        setToastMessage(`Auto-detected ${detectedCount} new Overtime Request(s) with status 'Pending'. Awaiting Manager Review.`);
      } else {
        setToastMessage("Attendance scan completed. No new unrecorded overtime detected for this date.");
      }
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Auto-detection scan failed");
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Attendance & Leave"
      title="Overtime Management"
      description="Review, modify, and approve overtime hours detected from punch logs. Overtime requests require explicit Manager Approval before adding to employee records and Payroll."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Attendance & Leave" },
        { label: "Overtime Management" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setReqEmpId("");
              setReqEmpQuery("");
              setIsReqEmpComboboxOpen(false);
              setReqOtType("Regular OT");
              setReqHours("2.0");
              setReqReason("");
              setIsRequestModalOpen(true);
            }}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Assign Overtime
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDetecting}
            onClick={handleAutoDetectOt}
            className="rounded-xl text-xs font-bold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 shadow-xs cursor-pointer"
          >
            <Zap className={cn("mr-1.5 h-3.5 w-3.5 text-emerald-600", isDetecting && "animate-spin")} />
            {isDetecting ? "Scanning Punches..." : "Auto-Detect OT"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Report
          </Button>
        </div>
      }
    >
      <ListSummaryCards
        stats={summaryStats}
        className="mb-5"
        activeFilterId={selectedStatus === "ALL" ? "" : selectedStatus}
        onFilterClick={handleStatFilter}
      />

      <HrSearchFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search employee or shift..."
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        maxDate={today}
        showDatePicker
        showFilterPanel={showFilterPanel}
        onToggleFilterPanel={() => setShowFilterPanel((v) => !v)}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
        onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
        filters={
          <ToolbarFilterGroup>
            <ToolbarFilterSelect
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              options={[...employeeDepartmentFilterOptions]}
              ariaLabel="Filter by department"
            />
            <ToolbarFilterSelect
              value={selectedOtType}
              onChange={setSelectedOtType}
              options={[...overtimeOtTypeFilterOptions]}
              ariaLabel="Filter by OT type"
            />
            <ToolbarFilterSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[...overtimeStatusFilterOptions]}
              ariaLabel="Filter by status"
            />
          </ToolbarFilterGroup>
        }
        extraFilters={
          <ToolbarFilterGroup>
            <ToolbarFilterSelect
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              options={[...employeeDepartmentFilterOptions]}
              ariaLabel="Filter by department"
            />
            <ToolbarFilterSelect
              value={selectedOtType}
              onChange={setSelectedOtType}
              options={[...overtimeOtTypeFilterOptions]}
              ariaLabel="Filter by OT type"
            />
            <ToolbarFilterSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[...overtimeStatusFilterOptions]}
              ariaLabel="Filter by status"
            />
          </ToolbarFilterGroup>
        }
      />

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: MAIN DESKTOP TABLE & MOBILE CARD LAYOUT
      ───────────────────────────────────────────────────────────── */}
      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">OT Classification</th>
                <th className="py-3 px-4">Date &amp; Punch Times</th>
                <th className="py-3 px-4">OT Hours</th>
                <th className="py-3 px-4">Payable Amount (TZS)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Clock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-sm text-slate-600">No overtime records found for this filter.</p>
                    <p className="text-xs text-slate-400 mt-1">Use "Auto-Detect OT" to scan attendance punches or "Assign Overtime" to submit a request.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingRecord(r)}
                  >
                    <td className="py-3 px-4">
                      <HREmployeeCell
                        name={r.employeeName}
                        id={r.employeeId}
                        avatar={r.avatar}
                        photoUrl={r.photoUrl}
                      />
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{r.department}</p>
                      <p className="text-[10px] text-slate-500">{r.designation}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {r.otType} ({r.otRateMultiplier}x)
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      <p className="font-bold text-slate-900">{r.date}</p>
                      <p className="text-[10px] text-slate-500">{r.checkIn} → {r.checkOut}</p>
                    </td>

                    <td className="py-3 px-4 font-black text-slate-900">
                      + {r.overtimeHours} Hrs
                      <span className="block text-[10px] font-normal text-slate-400">Worked: {r.workedHours}h</span>
                    </td>

                    <td className="py-3 px-4 font-black text-emerald-800 text-xs">
                      {formatMoney(r.payableAmount)}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} />
                    </td>

                    <td className="py-3 px-4">
                      {r.status === "Pending" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingRecord(r);
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold px-3 py-1 cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="h-3 w-3" />
                          Review &amp; Approve
                        </Button>
                      ) : (
                        <div className="text-slate-600 text-[11px]">
                          <p className="font-semibold text-slate-800">{r.approvedBy || "—"}</p>
                          <p className="text-[10px] text-slate-400">{r.approvedOn || "—"}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredRecords.map((r) => (
          <div
            key={r.id}
            onClick={() => setViewingRecord(r)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <HREmployeeCell name={r.employeeName} id={r.employeeId} avatar={r.avatar} photoUrl={r.photoUrl} />
              <StatusBadge status={r.status} />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
              <div>
                <span className="text-slate-400 text-[10px] block">{r.otType} • {r.date}</span>
                <span className="font-bold text-slate-900">+{r.overtimeHours} Hours ({r.otRateMultiplier}x)</span>
                <span className="text-[10px] text-slate-500 block">Punches: {r.checkIn} - {r.checkOut}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Payable</span>
                <span className="font-black text-emerald-800 text-sm">{formatMoney(r.payableAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingRecord(r);
                }}
                className="flex-1 text-xs"
              >
                {r.status === "Pending" ? "Review / Modify" : "View Details"}
              </Button>
              {r.status === "Pending" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingRecord(r);
                  }}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  <Edit3 className="mr-1 h-3 w-3" /> Review
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: OVERTIME REVIEW, MODIFICATION & APPROVAL WORKFLOW
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title={viewingRecord?.status === "Pending" ? "Review & Approve Overtime Request" : "Overtime Record Details"}
        icon={<Timer className="h-5 w-5 text-emerald-700" />}
        footer={
          viewingRecord && viewingRecord.status === "Pending" ? (
            <div className="space-y-2 w-full">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isProcessingApproval}
                  onClick={() =>
                    handleApprove(
                      viewingRecord,
                      parsedReviewHours,
                      reviewOtType,
                      livePayableAmount,
                      reviewRemarks
                    )
                  }
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold h-10 cursor-pointer shadow-sm"
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  {isProcessingApproval ? "Approving..." : `Approve (${parsedReviewHours}h • ${formatMoney(livePayableAmount)})`}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isProcessingApproval}
                  onClick={() => handleReject(viewingRecord, reviewRemarks)}
                  className="flex-1 text-rose-700 bg-white border-rose-200 hover:bg-rose-50 rounded-xl text-xs font-bold h-10 cursor-pointer"
                >
                  <X className="mr-1.5 h-4 w-4" /> Reject OT
                </Button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(viewingRecord.id)}
                  className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Delete record
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center w-full space-y-2">
              <span className="text-xs font-bold text-slate-600">
                Status: {viewingRecord?.status} {viewingRecord?.approvedBy ? `(Approved by ${viewingRecord.approvedBy} on ${viewingRecord.approvedOn || "—"})` : ""}
              </span>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => viewingRecord && setDeleteTargetId(viewingRecord.id)}
                  className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Delete record
                </button>
              </div>
            </div>
          )
        }
      >
        {viewingRecord && (
          <div className="space-y-4">
            <HREmployeeCell
              name={viewingRecord.employeeName}
              id={viewingRecord.employeeId}
              avatar={viewingRecord.avatar}
              photoUrl={viewingRecord.photoUrl}
              department={viewingRecord.department}
              designation={viewingRecord.designation}
            />

            {/* Attendance Punch & Shift Details */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="font-bold text-slate-800 uppercase text-[11px]">Shift &amp; Attendance Log</span>
                <span className="font-semibold text-slate-500">{viewingRecord.date}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Assigned Shift</span>
                  <span className="font-bold text-slate-800">{viewingRecord.shiftName}</span>
                  <span className="text-[10px] text-slate-500 block">Sched: {viewingRecord.scheduledHours}h</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Actual Punch Times</span>
                  <span className="font-bold text-slate-800">{viewingRecord.checkIn} → {viewingRecord.checkOut}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Worked: {viewingRecord.workedHours}h</span>
                </div>
              </div>
            </div>

            {/* If Pending: Manager Modification Form */}
            {viewingRecord.status === "Pending" ? (
              <div className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50/50 space-y-3.5 text-xs">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-amber-700" />
                  <span className="font-bold text-amber-900 text-xs uppercase">Manager Review &amp; Hour Modification</span>
                </div>

                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Punch logs detected <strong>{viewingRecord.overtimeHours} hrs</strong> extra time. As Manager, you can adjust approved hours and OT type before forwarding to Payroll.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Approved OT Hours <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="16"
                      value={reviewOtHours}
                      onChange={(e) => setReviewOtHours(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      OT Rate Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={reviewOtType}
                      onChange={(e) => setReviewOtType(e.target.value as OvertimeType)}
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="Regular OT">Regular OT (1.5x)</option>
                      <option value="Weekly Off OT">Weekly Off OT (2.0x)</option>
                      <option value="Holiday OT">Holiday OT (2.0x)</option>
                      <option value="Emergency Call-In OT">Emergency Call-In (2.0x)</option>
                      <option value="Night Differential OT">Night Differential (1.75x)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Approval / Modification Note
                  </label>
                  <textarea
                    rows={2}
                    value={reviewRemarks}
                    onChange={(e) => setReviewRemarks(e.target.value)}
                    placeholder="e.g. Approved 2.0 hrs for extended banquet setup..."
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Dynamic Payroll Calculation Preview */}
                <div className="p-3 rounded-xl bg-white border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Calculated Payroll Impact</span>
                    <span className="text-[11px] text-slate-600">
                      {formatMoney(currentHourlyRate)}/hr × {currentMultiplier}x × {parsedReviewHours} hrs
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-800 text-base">
                      {formatMoney(livePayableAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* If already Approved or Rejected: Readonly Impact card */
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase">Payroll Impact</span>
                  <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Rate: {viewingRecord.otRateMultiplier}x ({viewingRecord.otType})
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Approved OT Hours</span>
                    <span className="font-extrabold text-slate-900 text-base">+{viewingRecord.overtimeHours} Hours</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Payable Amount</span>
                    <span className="font-black text-emerald-800 text-base">{formatMoney(viewingRecord.payableAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Audit Trail Details */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase block text-[11px]">Audit Details</span>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Classification:</span>
                <span className="font-bold text-slate-900">{viewingRecord.otType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Shift Code:</span>
                <span className="font-bold text-slate-900">{viewingRecord.shiftName} ({viewingRecord.shiftCode})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Approved By:</span>
                <span className="font-bold text-slate-900">{viewingRecord.approvedBy || "Pending Review"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Approval Date:</span>
                <span className="font-semibold text-slate-800">{viewingRecord.approvedOn || "Pending"}</span>
              </div>
              {viewingRecord.approvalRemarks && (
                <div className="pt-1">
                  <span className="text-slate-500 font-semibold block mb-0.5">Approval Remarks:</span>
                  <p className="italic text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">"{viewingRecord.approvalRemarks}"</p>
                </div>
              )}
              {viewingRecord.reason && (
                <div className="pt-1">
                  <span className="text-slate-500 font-semibold block mb-0.5">Original Log Note / Reason:</span>
                  <p className="italic text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">"{viewingRecord.reason}"</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: REQUEST OVERTIME MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Assign Overtime Request"
        description="Submit an overtime request. Requests will enter 'Pending' status until approved by a Manager."
        size="md"
      >
        <form onSubmit={handleSaveRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Employee <span className="text-rose-500">*</span>
            </label>

            {/* Single Unified Searchable Employee Combobox */}
            <div className="relative" ref={reqComboboxRef}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={reqEmpQuery}
                onFocus={() => setIsReqEmpComboboxOpen(true)}
                onChange={(e) => {
                  setReqEmpQuery(e.target.value);
                  setIsReqEmpComboboxOpen(true);
                }}
                placeholder="Type employee name, ID or department to search..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none"
              />
              {reqEmpQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setReqEmpQuery("");
                    setReqEmpId("");
                    setIsReqEmpComboboxOpen(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              )}

              {/* Combobox Dropdown Results List */}
              {isReqEmpComboboxOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl space-y-1 max-h-56 overflow-y-auto animate-in fade-in-50">
                  {employees.filter((staff) => {
                    if (!reqEmpQuery.trim()) return true;
                    const q = reqEmpQuery.toLowerCase().trim();
                    return (
                      staff.name.toLowerCase().includes(q) ||
                      staff.id.toLowerCase().includes(q) ||
                      staff.department.toLowerCase().includes(q) ||
                      staff.designation.toLowerCase().includes(q)
                    );
                  }).length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 font-medium">
                      No matching employee found.
                    </div>
                  ) : (
                    employees.filter((staff) => {
                      if (!reqEmpQuery.trim()) return true;
                      const q = reqEmpQuery.toLowerCase().trim();
                      return (
                        staff.name.toLowerCase().includes(q) ||
                        staff.id.toLowerCase().includes(q) ||
                        staff.department.toLowerCase().includes(q) ||
                        staff.designation.toLowerCase().includes(q)
                      );
                    }).map((staff) => (
                      <div
                        key={staff.id}
                        onClick={() => {
                          setReqEmpId(staff.id);
                          setReqEmpQuery(`${staff.name} (${staff.id}) - ${staff.department}`);
                          setIsReqEmpComboboxOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors hover:bg-slate-100/80 border border-transparent",
                          reqEmpId === staff.id && "bg-emerald-50 text-emerald-900 border-emerald-200"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                            {staff.avatar}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-xs text-slate-900 truncate">
                              {staff.name} <span className="text-[10px] font-semibold text-emerald-700">({staff.id})</span>
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">{staff.designation} • {staff.department}</p>
                          </div>
                        </div>
                        {reqEmpId === staff.id && <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Overtime Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={reqOtType}
                onChange={(e) => setReqOtType(e.target.value as OvertimeType)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
              >
                <option value="Regular OT">Regular OT (1.5x)</option>
                <option value="Weekly Off OT">Weekly Off OT (2.0x)</option>
                <option value="Holiday OT">Holiday OT (2.0x)</option>
                <option value="Emergency Call-In OT">Emergency Call-In (2.0x)</option>
                <option value="Night Differential OT">Night Differential (1.75x)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                OT Hours <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                placeholder="e.g. 2.0"
                value={reqHours}
                onChange={(e) => setReqHours(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={reqDate || selectedDate}
              onChange={(e) => setReqDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Event Note</label>
            <textarea
              rows={2}
              placeholder="e.g. Extended banquet event coverage..."
              value={reqReason}
              onChange={(e) => setReqReason(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRequestModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Submit Overtime Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: DELETE CONFIRMATION MODAL */}
      {deleteTargetId && (
        <Modal
          isOpen={Boolean(deleteTargetId)}
          onClose={() => setDeleteTargetId(null)}
          title="Delete Overtime Record"
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-700 font-medium">
              Are you sure you want to delete this overtime record? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTargetId(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleDelete(deleteTargetId)}
                className="rounded-xl text-xs font-bold bg-rose-700 text-white"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MOBILE FILTERS BOTTOM SHEET MODAL */}
      {isMobileFilterOpen && (
        <Modal
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          title="Filter Overtime Requests"
          size="sm"
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">OT Type</label>
              <select
                value={selectedOtType}
                onChange={(e) => setSelectedOtType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All OT Types</option>
                <option value="Regular OT">Regular OT</option>
                <option value="Weekly Off OT">Weekly Off OT</option>
                <option value="Emergency Call-In OT">Emergency Call-In</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-emerald-700 text-white rounded-xl font-bold"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleOvertimeExport}
        defaultDate={selectedDate}
        maxDate={today}
        title="Export overtime report"
        description="Choose file type and time period. Current filters apply to the export."
        exporting={exporting}
      />
    </ModulePageShell>
  );
}
