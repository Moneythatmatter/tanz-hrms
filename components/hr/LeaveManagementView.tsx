"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Calendar,
  Search,
  Filter,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  Printer,
  Info,
  CalendarDays,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  TrendingDown,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
  Wallet,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";
import { HrSearchFilterToolbar } from "@/components/hr/shared/HrSearchFilterToolbar";
import { ReportExportModal } from "@/components/shared/ReportExportModal";
import {
  ToolbarFilterGroup,
  ToolbarFilterSelect,
} from "@/components/shared/list-table";
import { employeeDepartmentFilterOptions } from "@/app/data/hr/employeeDepartmentOptions";
import { exportGenericReport, filterByIsoDateRange, normalizeToIsoDate, todayIsoDate, type ReportExportOptions } from "@/lib/hr/report-export";
import type { ExportColumn } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";
import {
  hrLeaveApplicationService,
  hrEmployeeService,
  hrLeaveTypeService,
  hrDepartmentService,
  hrDesignationService,
} from "@/services/human-resources";
import { mapLeaveApplicationFromApi, mapLeaveApplicationToApi, mapEmployeeFromApi } from "@/lib/hr/api-mappers";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";

export interface LeaveTypeMaster {
  id: string;
  code: string;
  name: string;
  annualQuota: number;
  isPaid: boolean;
  colorClass: string;
}

export interface EmployeeLeaveBalance {
  casualLeave: { total: number; used: number; remaining: number; pending: number; expires: string };
  sickLeave: { total: number; used: number; remaining: number; pending: number; expires: string };
  earnedLeave: { total: number; used: number; remaining: number; pending: number; expires: string };
  compOff: { remaining: number; used: number; pending: number; expires: string };
}

function defaultEmployeeLeaveBalance(emp?: EmployeeItem): EmployeeLeaveBalance {
  const casualRemaining = emp?.leaveBalance?.casual ?? 10;
  const sickRemaining = emp?.leaveBalance?.sick ?? 12;
  const earnedRemaining = emp?.leaveBalance?.earned ?? 15;
  return {
    casualLeave: {
      total: 10,
      used: Math.max(0, 10 - casualRemaining),
      remaining: casualRemaining,
      pending: 0,
      expires: "Dec 31",
    },
    sickLeave: {
      total: 12,
      used: Math.max(0, 12 - sickRemaining),
      remaining: sickRemaining,
      pending: 0,
      expires: "Dec 31",
    },
    earnedLeave: {
      total: 15,
      used: Math.max(0, 15 - earnedRemaining),
      remaining: earnedRemaining,
      pending: 0,
      expires: "Dec 31",
    },
    compOff: { remaining: 0, used: 0, pending: 0, expires: "—" },
  };
}

function resolveLeaveBalances(
  raw: LeaveApplication["balances"] | undefined,
  emp?: EmployeeItem,
): EmployeeLeaveBalance {
  if (raw?.casualLeave?.remaining != null) return raw;
  return defaultEmployeeLeaveBalance(emp);
}

function leaveTypeBadgeClass(code: string): string {
  const normalized = code.toUpperCase();
  if (normalized.includes("SL") || normalized.includes("SICK")) {
    return "bg-rose-100 text-rose-800 border-rose-200";
  }
  if (normalized.includes("EL") || normalized.includes("EARNED")) {
    return "bg-purple-100 text-purple-800 border-purple-200";
  }
  if (normalized.includes("COMP")) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (normalized.includes("LOP")) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  return "bg-blue-100 text-blue-800 border-blue-200";
}


export interface ApprovalStep {
  role: string;
  approverName: string;
  status: "Approved" | "Pending" | "Rejected";
  date?: string;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  isPaid: boolean;
  durationOption: "Full Day" | "First Half" | "Second Half";
  priority: "Normal" | "Urgent" | "Emergency";
  fromDate: string;
  toDate: string;
  fromDateIso?: string;
  toDateIso?: string;
  totalDays: number;
  effectiveDays?: number;
  calendarDays?: number;
  consumedDates?: string[];
  excludedDates?: Array<{ date: string; reason: string; holidayId?: string }>;
  reason: string;
  attachmentName?: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  appliedOn: string;
  approvedBy?: string;
  clarificationRequest?: string;
  approvalChain: ApprovalStep[];
  balances: EmployeeLeaveBalance;
}

const leaveStatusFilterOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "Cancelled", label: "Cancelled" },
] as const;

type LeaveExportRow = {
  employeeName: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  status: string;
};

const leaveExportColumns: ExportColumn<LeaveExportRow>[] = [
  { key: "employeeName", header: "Employee Name" },
  { key: "department", header: "Department" },
  { key: "leaveType", header: "Leave Type" },
  { key: "fromDate", header: "From Date" },
  { key: "toDate", header: "To Date" },
  { key: "totalDays", header: "Days" },
  { key: "status", header: "Status" },
];

function leaveCoversDate(app: LeaveApplication, iso: string): boolean {
  const from = normalizeToIsoDate(app.fromDateIso ?? app.fromDate);
  const to = normalizeToIsoDate(app.toDateIso ?? app.toDate);
  if (!from || !to) return true;
  return iso >= from && iso <= to;
}

export const MASTER_LEAVE_TYPES: LeaveTypeMaster[] = [
  { id: "lt-cl", code: "CL", name: "Casual Leave", annualQuota: 10, isPaid: true, colorClass: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "lt-sl", code: "SL", name: "Sick Leave", annualQuota: 12, isPaid: true, colorClass: "bg-rose-100 text-rose-800 border-rose-200" },
  { id: "lt-el", code: "EL", name: "Earned / Privilege Leave", annualQuota: 15, isPaid: true, colorClass: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "lt-co", code: "COMP", name: "Compensatory Off", annualQuota: 5, isPaid: true, colorClass: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { id: "lt-lop", code: "LOP", name: "Loss of Pay", annualQuota: 0, isPaid: false, colorClass: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "lt-ml", code: "ML", name: "Maternity / Paternity Leave", annualQuota: 90, isPaid: true, colorClass: "bg-pink-100 text-pink-800 border-pink-200" },
];

const isUuid = (val: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export function LeaveManagementView() {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeMaster[]>(MASTER_LEAVE_TYPES);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const loadApplications = async () => {
    try {
      const [rows, empRows, leaveTypeRows, deptRows, desigRows] = await Promise.all([
        hrLeaveApplicationService.list().catch(() => []),
        hrEmployeeService.list().catch(() => []),
        hrLeaveTypeService.list().catch(() => []),
        hrDepartmentService.list().catch(() => []),
        hrDesignationService.list().catch(() => []),
      ]);

      const deptMap = new Map<string, string>();
      for (const d of deptRows) {
        const id = String(d.id || "");
        const name = String(
          d.departmentName ||
            d.department_name ||
            d.name ||
            d.dept_name ||
            d.deptName ||
            d.dept_code ||
            "",
        );
        if (id && name) deptMap.set(id, name);
      }

      const desigMap = new Map<string, string>();
      for (const d of desigRows) {
        const id = String(d.id || "");
        const title = String(
          d.designationTitle ||
            d.designation_title ||
            d.designationName ||
            d.designation_name ||
            d.title ||
            d.name ||
            "",
        );
        if (id && title) desigMap.set(id, title);
      }

      const emps = empRows.map((raw) => {
        const mapped = mapEmployeeFromApi(raw);
        if (isUuid(mapped.department)) {
          mapped.department = deptMap.get(mapped.department) || mapped.department;
        }
        if (isUuid(mapped.designation)) {
          mapped.designation = desigMap.get(mapped.designation) || mapped.designation;
        }
        return mapped;
      });
      setEmployees(emps);
      const lookup = new Map(emps.map((e) => [e.id, e]));
      setApplications(
        rows.map((row) => {
          const mapped = mapLeaveApplicationFromApi(row, lookup.get(String(row.employeeId)));
          if (isUuid(mapped.department)) {
            mapped.department = deptMap.get(mapped.department) || mapped.department;
          }
          if (isUuid(mapped.designation)) {
            mapped.designation = desigMap.get(mapped.designation) || mapped.designation;
          }
          return mapped;
        }),
      );
      if (leaveTypeRows.length > 0) {
        setLeaveTypes(
          leaveTypeRows.map((row) => ({
            id: String(row.id),
            code: String(row.leaveCode ?? row.code ?? ""),
            name: String(row.leaveName ?? row.name ?? ""),
            annualQuota: Number(row.annualQuotaDays ?? row.annualQuota ?? 0),
            isPaid: String(row.payType ?? "Paid") === "Paid",
            colorClass: leaveTypeBadgeClass(String(row.leaveCode ?? row.code ?? "")),
          })),
        );
      }
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load leave applications");
      setApplications([]);
      setEmployees([]);
    }
  };

  useEffect(() => { void loadApplications(); }, []);



  // Single-Line Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedLeaveType, setSelectedLeaveType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState(todayIsoDate);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Modals & Side Drawer State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [viewingLeave, setViewingLeave] = useState<LeaveApplication | null>(null);
  const [cancelConfirmLeave, setCancelConfirmLeave] = useState<LeaveApplication | null>(null);
  const [modifyLeave, setModifyLeave] = useState<LeaveApplication | null>(null);
  const [modifyFromDate, setModifyFromDate] = useState("");
  const [modifyToDate, setModifyToDate] = useState("");
  const [modifyPreview, setModifyPreview] = useState<{
    effectiveDays: number;
    calendarDays: number;
    excluded: Array<{ date: string; reason: string }>;
  } | null>(null);
  const [modifyPreviewLoading, setModifyPreviewLoading] = useState(false);
  const [hoveredCalendarDay, setHoveredCalendarDay] = useState<{ empName: string; type: string; dates: string; status: string } | null>(null);

  // Apply Form State (With Unified Searchable Employee Combobox & Unselected Placeholders)
  const [applyEmpId, setApplyEmpId] = useState("");
  const [applyEmpQuery, setApplyEmpQuery] = useState("");
  const [isApplyEmpComboboxOpen, setIsApplyEmpComboboxOpen] = useState(false);
  const applyComboboxRef = useRef<HTMLDivElement>(null);
  const [applyLeaveTypeId, setApplyLeaveTypeId] = useState("");
  const [applyDuration, setApplyDuration] = useState<"Full Day" | "First Half" | "Second Half">("Full Day");
  const [applyPriority, setApplyPriority] = useState<"Normal" | "Urgent" | "Emergency">("Normal");
  const [applyFromDate, setApplyFromDate] = useState("");
  const [applyToDate, setApplyToDate] = useState("");
  const [applyReason, setApplyReason] = useState("");
  const [applyPreview, setApplyPreview] = useState<{
    effectiveDays: number;
    calendarDays: number;
    eligibleDates: string[];
    excluded: Array<{ date: string; reason: string }>;
  } | null>(null);
  const [applyPreviewLoading, setApplyPreviewLoading] = useState(false);

  useEffect(() => {
    if (!applyEmpId || !applyFromDate || !applyToDate || !isApplyModalOpen) {
      setApplyPreview(null);
      return;
    }
    let cancelled = false;
    setApplyPreviewLoading(true);
    hrLeaveApplicationService
      .previewDays({
        employeeId: applyEmpId,
        fromDate: applyFromDate,
        toDate: applyToDate,
        durationOption: applyDuration,
      })
      .then((result) => {
        if (cancelled) return;
        setApplyPreview({
          effectiveDays: Number(result.effectiveDays ?? 0),
          calendarDays: Number(result.calendarDays ?? 0),
          eligibleDates: (result.eligibleDates as string[]) ?? [],
          excluded: (result.excluded as Array<{ date: string; reason: string }>) ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) setApplyPreview(null);
      })
      .finally(() => {
        if (!cancelled) setApplyPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyEmpId, applyFromDate, applyToDate, applyDuration, isApplyModalOpen]);

  useEffect(() => {
    if (!modifyLeave || !modifyFromDate || !modifyToDate) {
      setModifyPreview(null);
      return;
    }
    let cancelled = false;
    setModifyPreviewLoading(true);
    hrLeaveApplicationService
      .previewDays({
        employeeId: modifyLeave.employeeId,
        fromDate: modifyFromDate,
        toDate: modifyToDate,
        durationOption: modifyLeave.durationOption,
      })
      .then((result) => {
        if (cancelled) return;
        setModifyPreview({
          effectiveDays: Number(result.effectiveDays ?? 0),
          calendarDays: Number(result.calendarDays ?? 0),
          excluded: (result.excluded as Array<{ date: string; reason: string }>) ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) setModifyPreview(null);
      })
      .finally(() => {
        if (!cancelled) setModifyPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [modifyLeave, modifyFromDate, modifyToDate]);

  // Close Employee Combobox Popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (applyComboboxRef.current && !applyComboboxRef.current.contains(event.target as Node)) {
        setIsApplyEmpComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [employees]);

  const employeeLookup = useMemo(
    () => new Map(employees.map((e) => [e.id, e])),
    [employees],
  );

  const viewingLeaveBalances = useMemo(() => {
    if (!viewingLeave) return null;
    return resolveLeaveBalances(
      viewingLeave.balances,
      employeeLookup.get(viewingLeave.employeeId),
    );
  }, [viewingLeave, employeeLookup]);

  const sortedApplications = useMemo(
    () =>
      [...applications].sort(
        (a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime(),
      ),
    [applications],
  );

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    return sortedApplications.filter((a) => {
      const empCode = employeeLookup.get(a.employeeId)?.empCode ?? "";
      const matchSearch =
        !searchTerm ||
        a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.leaveTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.leaveTypeCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDepartment === "ALL" || a.department === selectedDepartment;
      const matchType =
        selectedLeaveType === "ALL" ||
        a.leaveTypeId === selectedLeaveType ||
        a.leaveTypeCode === selectedLeaveType;
      const matchStatus = selectedStatus === "ALL" || a.status === selectedStatus;

      return matchSearch && matchDept && matchType && matchStatus;
    });
  }, [
    sortedApplications,
    employeeLookup,
    searchTerm,
    selectedDepartment,
    selectedLeaveType,
    selectedStatus,
  ]);

  // Metrics Dashboard
  const metrics = useMemo(() => {
    const pending = applications.filter((a) => a.status === "Pending").length;
    const approvedMonth = applications.filter((a) => a.status === "Approved").length;
    const rejectedMonth = applications.filter((a) => a.status === "Rejected").length;
    const cancelled = applications.filter((a) => a.status === "Cancelled").length;
    return { pending, approvedMonth, rejectedMonth, cancelled };
  }, [applications]);

  const leaveFilterPills = useMemo(
    () => [
      { id: "ALL", label: `All ${applications.length}` },
      { id: "Pending", label: `Pending ${metrics.pending}` },
      { id: "Approved", label: `Approved ${metrics.approvedMonth}` },
      { id: "Rejected", label: `Rejected ${metrics.rejectedMonth}` },
      { id: "Cancelled", label: `Cancelled ${metrics.cancelled}` },
    ],
    [applications.length, metrics],
  );

  const today = todayIsoDate();
  const hasActiveFilters =
    searchTerm !== "" ||
    selectedDepartment !== "ALL" ||
    selectedLeaveType !== "ALL" ||
    selectedStatus !== "ALL";

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("ALL");
    setSelectedLeaveType("ALL");
    setSelectedStatus("ALL");
    setSelectedDate(today);
  };

  const leaveTypeFilterOptions = useMemo(
    () => [
      { value: "ALL", label: "All leave types" },
      ...leaveTypes.map((lt) => ({ value: lt.id, label: `${lt.name} (${lt.code})` })),
    ],
    [leaveTypes],
  );

  const matchesLeaveBaseFilters = (a: LeaveApplication) => {
    const empCode = employeeLookup.get(a.employeeId)?.empCode ?? "";
    const matchSearch =
      !searchTerm ||
      a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.leaveTypeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDepartment === "ALL" || a.department === selectedDepartment;
    const matchType =
      selectedLeaveType === "ALL" ||
      a.leaveTypeId === selectedLeaveType ||
      a.leaveTypeCode === selectedLeaveType;
    const matchStatus = selectedStatus === "ALL" || a.status === selectedStatus;
    return matchSearch && matchDept && matchType && matchStatus;
  };

  const handleLeaveExport = async (options: ReportExportOptions) => {
    setExporting(true);
    try {
      const base = sortedApplications.filter(matchesLeaveBaseFilters);
      const ranged = base.filter((a) => {
        const from = normalizeToIsoDate(a.fromDateIso ?? a.fromDate);
        const to = normalizeToIsoDate(a.toDateIso ?? a.toDate);
        if (!from || !to) return false;
        return from <= options.toDate && to >= options.fromDate;
      });
      const rows: LeaveExportRow[] = ranged.map((a) => ({
        employeeName: a.employeeName,
        department: a.department,
        leaveType: `${a.leaveTypeName} (${a.leaveTypeCode})`,
        fromDate: a.fromDate,
        toDate: a.toDate,
        totalDays: a.effectiveDays ?? a.totalDays,
        status: a.status,
      }));
      exportGenericReport(rows, leaveExportColumns, options, "Leave_Log");
      setToastMessage(`Exported ${rows.length} leave record(s).`);
      setIsExportModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const renderLeaveFilters = () => (
    <ToolbarFilterGroup>
      <ToolbarFilterSelect value={selectedDepartment} onChange={setSelectedDepartment} options={[...employeeDepartmentFilterOptions]} ariaLabel="Filter by department" />
      <ToolbarFilterSelect value={selectedLeaveType} onChange={setSelectedLeaveType} options={leaveTypeFilterOptions} ariaLabel="Filter by leave type" />
      <ToolbarFilterSelect value={selectedStatus} onChange={setSelectedStatus} options={[...leaveStatusFilterOptions]} ariaLabel="Filter by status" />
    </ToolbarFilterGroup>
  );

  // Department Staffing Risk from applied/approved leave
  const departmentStaffingRisk = useMemo(() => {
    const validDepts = Array.from(
      new Set(
        employees
          .map((e) => e.department)
          .filter((d) => d && !isUuid(d) && d !== "—"),
      ),
    ).slice(0, 4);
    return validDepts.map((dept) => {
      const onLeave = applications.filter(
        (a) =>
          a.department === dept &&
          (a.status === "Approved" || a.status === "Pending"),
      ).length;
      const riskLevel =
        onLeave >= 3 ? "High Risk" : onLeave >= 2 ? "Moderate" : "Normal";
      return { dept, onLeave, riskLevel };
    });
  }, [applications, employees]);

  // Handlers
  const handleApprove = async (id: string, empName: string) => {
    setActionLoadingId(id);
    try {
      await hrLeaveApplicationService.approve(id, "Neha Mehta (HR Manager)");
      await loadApplications();
      if (viewingLeave?.id === id) {
        setViewingLeave((prev) =>
          prev
            ? { ...prev, status: "Approved", approvedBy: "Neha Mehta (HR Manager)" }
            : null,
        );
      }
      setToastMessage(`Approved leave application for ${empName}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to approve leave");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string, empName: string) => {
    setActionLoadingId(id);
    try {
      await hrLeaveApplicationService.update(id, {
        status: "Rejected",
        approvedBy: "Neha Mehta (HR Manager)",
      });
      await loadApplications();
      if (viewingLeave?.id === id) {
        setViewingLeave((prev) =>
          prev ? { ...prev, status: "Rejected", approvedBy: "Neha Mehta (HR Manager)" } : null,
        );
      }
      setToastMessage(`Rejected leave application for ${empName}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to reject leave");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelLeave = async (leave: LeaveApplication) => {
    setActionLoadingId(leave.id);
    try {
      await hrLeaveApplicationService.cancel(leave.id, {
        changedBy: "Neha Mehta (HR Manager)",
      });
      await loadApplications();
      setCancelConfirmLeave(null);
      if (viewingLeave?.id === leave.id) {
        setViewingLeave((prev) => (prev ? { ...prev, status: "Cancelled" } : null));
      }
      setToastMessage(
        `Cancelled approved leave for ${leave.employeeName}. Balance restored and attendance recalculated.`,
      );
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to cancel leave");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openModifyLeave = (leave: LeaveApplication) => {
    setModifyLeave(leave);
    setModifyFromDate(leave.fromDateIso ?? leave.fromDate);
    setModifyToDate(leave.toDateIso ?? leave.toDate);
    setModifyPreview(null);
  };

  const handleSaveModifyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyLeave || !modifyFromDate || !modifyToDate) return;
    if (modifyFromDate > modifyToDate) {
      setToastMessage("From date cannot be after to date.");
      return;
    }
    setActionLoadingId(modifyLeave.id);
    try {
      const result = await hrLeaveApplicationService.modify(modifyLeave.id, {
        fromDate: modifyFromDate,
        toDate: modifyToDate,
        changedBy: "Neha Mehta (HR Manager)",
        durationOption: modifyLeave.durationOption,
      });
      const [rows, empRows] = await Promise.all([
        hrLeaveApplicationService.list(),
        hrEmployeeService.list(),
      ]);
      const emps = empRows.map(mapEmployeeFromApi);
      const lookup = new Map(emps.map((e) => [e.id, e]));
      const mapped = rows.map((row) => mapLeaveApplicationFromApi(row, lookup.get(String(row.employeeId))));
      setApplications(mapped);
      const fresh = mapped.find((a) => a.id === modifyLeave.id);
      if (viewingLeave?.id === modifyLeave.id && fresh) {
        setViewingLeave(fresh);
      }
      setModifyLeave(null);
      setToastMessage(
        `Leave dates updated for ${modifyLeave.employeeName}. Effective days: ${result.newEffectiveDays ?? modifyPreview?.effectiveDays ?? "—"}.`,
      );
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to modify leave");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ltObj = leaveTypes.find((x) => x.id === applyLeaveTypeId);
    const empObj = employees.find((x) => x.id === applyEmpId);

    if (!applyEmpId || !applyLeaveTypeId || !applyFromDate || !applyToDate) {
      setToastMessage("Please fill employee, leave type, and dates.");
      return;
    }

    const totalDays =
      applyDuration === "Full Day"
        ? (applyPreview?.calendarDays ?? 1)
        : 0.5;

    setActionLoadingId("apply");
    try {
      await hrLeaveApplicationService.create(
        mapLeaveApplicationToApi({
          employeeId: applyEmpId,
          leaveTypeId: ltObj?.id,
          leaveTypeCode: ltObj?.code,
          leaveTypeName: ltObj?.name,
          isPaid: ltObj?.isPaid ?? true,
          durationOption: applyDuration,
          priority: applyPriority,
          fromDate: applyFromDate,
          toDate: applyToDate,
          totalDays,
          reason: applyReason || "Leave request submitted.",
          status: "Pending",
          appliedOn: new Date().toISOString(),
          approvalChain: [
            {
              role: "Dept Manager",
              approverName: "Dept Head",
              status: "Approved",
              date: new Date().toLocaleDateString("en-GB"),
            },
            { role: "HR Manager", approverName: "Neha Mehta", status: "Pending" },
          ],
          balances: defaultEmployeeLeaveBalance(empObj),
        }),
      );
      await loadApplications();
      setIsApplyModalOpen(false);
      setToastMessage(`Submitted ${ltObj?.code ?? "leave"} request for ${empObj?.name ?? "employee"}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to submit leave");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Attendance & Leave"
      title="Leave Management"
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Attendance & Leave" },
        { label: "Leave Management" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setApplyEmpId("");
              setApplyEmpQuery("");
              setIsApplyEmpComboboxOpen(false);
              setApplyLeaveTypeId("");
              setApplyFromDate("");
              setApplyToDate("");
              setApplyReason("");
              setIsApplyModalOpen(true);
            }}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Apply Leave
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "table" ? "calendar" : "table")}
            className="rounded-xl text-xs font-bold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 shadow-xs cursor-pointer"
          >
            <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            {viewMode === "table" ? "Leave Calendar ⭐" : "Table View"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Log
          </Button>
        </div>
      }
    >
      {/* Department staffing risk — compact inline strip */}
      {departmentStaffingRisk.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-2xs">
          <span className="inline-flex shrink-0 items-center gap-1.5 font-bold text-slate-700">
            <ShieldAlert className="h-3.5 w-3.5 text-emerald-700" />
            Staffing Risk
          </span>
          <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {departmentStaffingRisk.map((risk) => (
              <span
                key={risk.dept}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1"
                title={`${risk.dept}: ${risk.onLeave} on leave — ${risk.riskLevel}`}
              >
                <span className="max-w-[7rem truncate font-semibold text-slate-800 sm:max-w-none">
                  {risk.dept}
                </span>
                <span className="text-[10px] font-medium text-slate-500">{risk.onLeave} away</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wide border",
                    risk.riskLevel.includes("High")
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : risk.riskLevel.includes("Moderate")
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : "bg-emerald-100 text-emerald-800 border-emerald-200",
                  )}
                >
                  {risk.riskLevel.replace(/[^a-zA-Z ]/g, "").trim()}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <HrSearchFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search employee or leave type..."
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        maxDate={today}
        showDatePicker={viewMode === "calendar"}
        showFilterPanel={showFilterPanel}
        onToggleFilterPanel={() => setShowFilterPanel((v) => !v)}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
        onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
        filters={renderLeaveFilters()}
        extraFilters={renderLeaveFilters()}
        filterPills={{
          active: selectedStatus,
          onChange: setSelectedStatus,
          options: leaveFilterPills,
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5A: DESKTOP TABLE & MOBILE CARDS VIEW (Improvements #3 & #4)
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "table" ? (
        <>
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Applied Leave Requests</h3>
                <p className="text-[11px] text-slate-500">
                  {filteredApplications.length} record{filteredApplications.length === 1 ? "" : "s"}
                  {metrics.pending > 0 ? ` · ${metrics.pending} pending approval` : ""}
                </p>
              </div>
            </div>

            {filteredApplications.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <Calendar className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-700">No leave applications found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Apply leave or adjust filters to see records here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4">Date Range</th>
                      <th className="py-3 px-4">Days</th>
                      <th className="py-3 px-4">Applied On</th>
                      <th className="py-3 px-4">Approved By</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApplications.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => setViewingLeave(a)}
                        className="cursor-pointer transition hover:bg-slate-50/80"
                      >
                        <td className="py-3 px-4">
                          <HREmployeeCell
                            name={a.employeeName}
                            id={employeeLookup.get(a.employeeId)?.empCode ?? "—"}
                            avatar={a.avatar}
                            photoUrl={a.photoUrl}
                          />
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{a.department}</p>
                          <p className="text-[10px] text-slate-500">{a.designation}</p>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-lg text-xs font-bold border whitespace-nowrap",
                              leaveTypeBadgeClass(a.leaveTypeCode),
                            )}
                          >
                            {a.leaveTypeName}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                          {a.fromDate}
                          {a.fromDate !== a.toDate && ` → ${a.toDate}`}
                        </td>

                        <td className="py-3 px-4 font-black text-slate-900">{a.totalDays}</td>
                        <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap">
                          {a.appliedOn}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {a.approvedBy || "—"}
                        </td>

                        <td className="py-3 px-4">
                          <StatusBadge status={a.status} />
                        </td>

                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {a.status === "Pending" && (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={actionLoadingId === a.id}
                                  onClick={() => void handleApprove(a.id, a.employeeName)}
                                  className="h-7 px-2.5 text-[11px] rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={actionLoadingId === a.id}
                                  onClick={() => void handleReject(a.id, a.employeeName)}
                                  className="h-7 px-2.5 text-[11px] rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Mobile Cards View */}
          <div className="sm:hidden space-y-3">
            {filteredApplications.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                No leave applications found.
              </div>
            ) : (
              filteredApplications.map((a) => (
              <div
                key={a.id}
                onClick={() => setViewingLeave(a)}
                className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <HREmployeeCell
                    name={a.employeeName}
                    id={employeeLookup.get(a.employeeId)?.empCode ?? "—"}
                    avatar={a.avatar}
                    photoUrl={a.photoUrl}
                  />
                  <StatusBadge status={a.status} />
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Leave Type &amp; Dates</span>
                    <span className="font-bold text-slate-900">{a.leaveTypeName} ({a.fromDate} - {a.toDate})</span>
                  </div>
                  <span className="font-black text-emerald-800 text-sm self-center">{a.totalDays} Days</span>
                </div>

                <div
                  className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {a.status === "Pending" && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        disabled={actionLoadingId === a.id}
                        onClick={() => void handleApprove(a.id, a.employeeName)}
                        className="flex-1 bg-emerald-700 text-white text-xs font-bold"
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={actionLoadingId === a.id}
                        onClick={() => void handleReject(a.id, a.employeeName)}
                        className="flex-1 bg-rose-600 text-white text-xs font-bold"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
            )}
          </div>
        </>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            SECTION 5B: LEAVE CALENDAR MATRIX & MOBILE LIST (Improvement #5)
        ───────────────────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Leave Calendar Roster — August 2026</h3>
              <p className="text-xs text-slate-500">Departmental coverage visual matrix.</p>
            </div>
            {/* Color-Coded Calendar Legend (Improvement #5) */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300">
                🔵 CL (Casual)
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300">
                🔴 SL (Sick)
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300">
                🟣 EL (Earned)
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                🟢 COMP (Comp Off)
              </span>
            </div>
          </div>

          {/* Desktop Month Grid */}
          <div className="hidden sm:grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 border-b border-slate-200 pb-2">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          <div className="hidden sm:grid grid-cols-7 gap-2 text-xs min-h-[220px]">
            {Array.from({ length: 14 }).map((_, idx) => {
              const dayNum = idx + 7;
              return (
                <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-600 text-[11px] block">{dayNum} Aug</span>
                  {dayNum >= 10 && dayNum <= 12 && (
                    <span
                      title="Rajesh Kumar - Casual Leave | 10 Aug - 12 Aug | Pending"
                      className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-extrabold text-[10px] block cursor-pointer"
                    >
                      Rajesh (CL)
                    </span>
                  )}
                  {dayNum === 15 && (
                    <span
                      title="Anjali Sharma - Sick Leave | 15 Aug | Approved"
                      className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-900 font-extrabold text-[10px] block cursor-pointer"
                    >
                      Anjali (SL)
                    </span>
                  )}
                  {dayNum >= 18 && dayNum <= 22 && (
                    <span
                      title="Priya Patel - Earned Leave | 18 Aug - 22 Aug | Pending"
                      className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-900 font-extrabold text-[10px] block cursor-pointer"
                    >
                      Priya (EL)
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Agenda List View (Improvement #5 Mobile Optimization) */}
          <div className="sm:hidden space-y-2 text-xs">
            <span className="font-bold text-slate-800 uppercase block">August Roster Agenda:</span>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 block">10 Aug - 12 Aug</span>
                <span className="text-slate-600">Rajesh Kumar • Casual Leave</span>
              </div>
              <StatusBadge status="Pending" />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 block">15 Aug</span>
                <span className="text-slate-600">Anjali Sharma • Sick Leave</span>
              </div>
              <StatusBadge status="Approved" />
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: MULTI-LEVEL APPROVAL WORKFLOW (Improvement #5 Enterprise Approval)
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingLeave)}
        onClose={() => setViewingLeave(null)}
        title="Leave Application Details"
        icon={<Calendar className="h-5 w-5 text-emerald-700" />}
        footer={
          viewingLeave && viewingLeave.status === "Pending" ? (
            <div className="flex w-full flex-nowrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={actionLoadingId === viewingLeave.id}
                onClick={() => void handleApprove(viewingLeave.id, viewingLeave.employeeName)}
                className="inline-flex flex-1 items-center justify-center whitespace-nowrap bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold h-9"
              >
                <Check className="mr-1 h-4 w-4 shrink-0" /> Approve Leave
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={actionLoadingId === viewingLeave.id}
                onClick={() => void handleReject(viewingLeave.id, viewingLeave.employeeName)}
                className="inline-flex flex-1 items-center justify-center whitespace-nowrap text-rose-700 bg-white border-rose-300 hover:bg-rose-50 rounded-xl text-xs font-bold h-9"
              >
                <X className="mr-1 h-4 w-4 shrink-0" /> Reject Leave
              </Button>
            </div>
          ) : viewingLeave && viewingLeave.status === "Approved" ? (
            <div className="flex w-full flex-col gap-2">
              <div className="flex w-full flex-nowrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={actionLoadingId === viewingLeave.id}
                  onClick={() => openModifyLeave(viewingLeave)}
                  className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-xl text-xs font-bold h-9 border-slate-300"
                >
                  <CalendarDays className="mr-1 h-4 w-4 shrink-0" /> Modify Dates
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={actionLoadingId === viewingLeave.id}
                  onClick={() => setCancelConfirmLeave(viewingLeave)}
                  className="inline-flex flex-1 items-center justify-center whitespace-nowrap text-amber-800 bg-white border-amber-300 hover:bg-amber-50 rounded-xl text-xs font-bold h-9"
                >
                  <AlertTriangle className="mr-1 h-4 w-4 shrink-0" /> Cancel Leave
                </Button>
              </div>
              <p className="text-[10px] text-center text-slate-500 font-medium">
                Cancelling restores leave balance and recalculates attendance for affected dates.
              </p>
            </div>
          ) : (
            <div className="text-center w-full">
              <span className="text-xs font-bold text-slate-600">
                Status: {viewingLeave?.status} (Processed by {viewingLeave?.approvedBy || "HR Manager"})
              </span>
            </div>
          )
        }
      >
        {viewingLeave && (
          <>
            <HREmployeeCell
              name={viewingLeave.employeeName}
              id={employeeLookup.get(viewingLeave.employeeId)?.empCode ?? "—"}
              avatar={viewingLeave.avatar}
              photoUrl={viewingLeave.photoUrl}
              department={viewingLeave.department}
              designation={viewingLeave.designation}
            />

            {viewingLeaveBalances && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-800">
                  <Wallet className="h-4 w-4 text-emerald-700" />
                  Leave Quota Balance
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <span className="block text-[10px] font-bold uppercase text-slate-500">Casual (CL)</span>
                    <p className="mt-0.5 text-base font-extrabold text-slate-900">
                      {viewingLeaveBalances.casualLeave.remaining}
                      <span className="text-[11px] font-medium text-slate-400">
                        {" "}
                        / {viewingLeaveBalances.casualLeave.total} days
                      </span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <span className="block text-[10px] font-bold uppercase text-slate-500">Sick (SL)</span>
                    <p className="mt-0.5 text-base font-extrabold text-slate-900">
                      {viewingLeaveBalances.sickLeave.remaining}
                      <span className="text-[11px] font-medium text-slate-400">
                        {" "}
                        / {viewingLeaveBalances.sickLeave.total} days
                      </span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <span className="block text-[10px] font-bold uppercase text-slate-500">Earned (EL)</span>
                    <p className="mt-0.5 text-base font-extrabold text-slate-900">
                      {viewingLeaveBalances.earnedLeave.remaining}
                      <span className="text-[11px] font-medium text-slate-400">
                        {" "}
                        / {viewingLeaveBalances.earnedLeave.total} days
                      </span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <span className="block text-[10px] font-bold uppercase text-slate-500">Comp Off</span>
                    <p className="mt-0.5 text-base font-extrabold text-emerald-800">
                      {viewingLeaveBalances.compOff.remaining} days
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Requested Leave Type</span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {viewingLeave.leaveTypeName} ({viewingLeave.leaveTypeCode})
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {viewingLeave.status === "Approved" && viewingLeave.effectiveDays != null
                  ? `${viewingLeave.effectiveDays} eligible day(s)`
                  : `${viewingLeave.totalDays} day(s)`}{" "}
                ({viewingLeave.durationOption})
              </h3>
              {viewingLeave.status === "Approved" &&
                viewingLeave.effectiveDays != null &&
                viewingLeave.calendarDays != null &&
                viewingLeave.effectiveDays !== viewingLeave.calendarDays && (
                  <p className="text-xs text-slate-500 mt-1">
                    Calendar range: {viewingLeave.calendarDays} days (holidays/weekly offs excluded)
                  </p>
                )}
              <p className="text-xs text-slate-600 font-medium">
                Dates: {viewingLeave.fromDate} → {viewingLeave.toDate}
              </p>
            </div>

            {/* Multi-Level Approval Chain (Improvement #5 Enterprise Feature) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase block flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Multi-Level Approval Chain:
              </span>
              <div className="space-y-1.5 text-xs">
                {viewingLeave.approvalChain.map((step, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 block">{step.role}</span>
                      <span className="text-[11px] text-slate-500">{step.approverName}</span>
                    </div>
                    <StatusBadge status={step.status} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500">Reason</span>
              <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 italic">
                "{viewingLeave.reason}"
              </p>
            </div>
          </>
        )}
      </Drawer>

      {/* Cancel approved leave confirmation */}
      <Modal
        isOpen={Boolean(cancelConfirmLeave)}
        onClose={() => setCancelConfirmLeave(null)}
        title="Cancel Approved Leave"
        size="sm"
      >
        {cancelConfirmLeave && (
          <div className="space-y-4 text-sm">
            <p className="text-slate-700">
              Cancel approved leave for{" "}
              <strong>{cancelConfirmLeave.employeeName}</strong> (
              {cancelConfirmLeave.fromDate} → {cancelConfirmLeave.toDate})?
            </p>
            <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
              <li>Consumed leave balance will be restored (eligible days only).</li>
              <li>Attendance records will be recalculated — not deleted.</li>
              <li>Holidays and weekly offs in the range stay as HOLIDAY / WEEKLY_OFF.</li>
            </ul>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCancelConfirmLeave(null)}
                className="rounded-xl text-xs"
              >
                Keep Leave
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={actionLoadingId === cancelConfirmLeave.id}
                onClick={() => void handleCancelLeave(cancelConfirmLeave)}
                className="rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white"
              >
                Cancel Leave
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modify approved leave dates */}
      <Modal
        isOpen={Boolean(modifyLeave)}
        onClose={() => setModifyLeave(null)}
        title="Modify Approved Leave Dates"
        size="md"
      >
        {modifyLeave && (
          <form onSubmit={(e) => void handleSaveModifyLeave(e)} className="space-y-4 text-sm">
            <p className="text-xs text-slate-600">
              Employee: <strong>{modifyLeave.employeeName}</strong> · {modifyLeave.leaveTypeName}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={modifyFromDate}
                  onChange={(e) => setModifyFromDate(e.target.value)}
                  required
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={modifyToDate}
                  onChange={(e) => setModifyToDate(e.target.value)}
                  required
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
                />
              </div>
            </div>
            {modifyFromDate && modifyToDate && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs">
                {modifyPreviewLoading ? (
                  <p className="text-slate-600">Calculating eligible leave days…</p>
                ) : modifyPreview ? (
                  <>
                    <p className="font-bold text-emerald-900">
                      New eligible days: {modifyPreview.effectiveDays}
                      {modifyPreview.calendarDays !== modifyPreview.effectiveDays && (
                        <span className="font-medium text-emerald-700">
                          {" "}
                          (calendar: {modifyPreview.calendarDays})
                        </span>
                      )}
                    </p>
                    {modifyLeave.effectiveDays != null &&
                      modifyPreview.effectiveDays !== modifyLeave.effectiveDays && (
                        <p className="text-emerald-800 mt-1">
                          Was {modifyLeave.effectiveDays} eligible day(s) — balance will adjust
                          automatically.
                        </p>
                      )}
                    {modifyPreview.excluded.length > 0 && (
                      <p className="text-emerald-800 mt-1">
                        Excluded:{" "}
                        {modifyPreview.excluded
                          .map((x) => `${x.date} (${x.reason.replace("_", " ")})`)
                          .join(", ")}
                      </p>
                    )}
                  </>
                ) : null}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModifyLeave(null)}
                className="rounded-xl text-xs"
              >
                Close
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoadingId === modifyLeave.id}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: APPLY LEAVE MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply Leave Application"
        description="Submit a new leave application with auto-calculated duration and multi-level approval check."
        size="lg"
      >
        <form onSubmit={handleSaveApplyLeave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Employee <span className="text-rose-500">*</span>
              </label>

              {/* Single Unified Searchable Employee Combobox */}
              <div className="relative" ref={applyComboboxRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={applyEmpQuery}
                  onFocus={() => setIsApplyEmpComboboxOpen(true)}
                  onChange={(e) => {
                    setApplyEmpQuery(e.target.value);
                    setIsApplyEmpComboboxOpen(true);
                  }}
                  placeholder="Type name, ID or dept..."
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-7 text-xs font-semibold text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none"
                />
                {applyEmpQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setApplyEmpQuery("");
                      setApplyEmpId("");
                      setIsApplyEmpComboboxOpen(true);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                )}

                {/* Combobox Dropdown Results List */}
                {isApplyEmpComboboxOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl space-y-1 max-h-52 overflow-y-auto animate-in fade-in-50">
                    {employees.filter((staff) => {
                      if (!applyEmpQuery.trim()) return true;
                      const q = applyEmpQuery.toLowerCase().trim();
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
                        if (!applyEmpQuery.trim()) return true;
                        const q = applyEmpQuery.toLowerCase().trim();
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
                            setApplyEmpId(staff.id);
                            setApplyEmpQuery(`${staff.name} (${staff.id})`);
                            setIsApplyEmpComboboxOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors hover:bg-slate-100/80 border border-transparent",
                            applyEmpId === staff.id && "bg-emerald-50 text-emerald-900 border-emerald-200"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                              {staff.avatar}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-xs text-slate-900 truncate">
                                {staff.name} <span className="text-[10px] text-emerald-700">({staff.id})</span>
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">{staff.department}</p>
                            </div>
                          </div>
                          {applyEmpId === staff.id && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1" />}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Leave Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={applyLeaveTypeId}
                onChange={(e) => setApplyLeaveTypeId(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
              >
                <option value="">-- Select Leave Type --</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} ({lt.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>
              <input
                type="date"
                value={applyFromDate}
                onChange={(e) => setApplyFromDate(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
              <input
                type="date"
                value={applyToDate}
                onChange={(e) => setApplyToDate(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>
          </div>

          {applyFromDate && applyToDate && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs space-y-1">
              {applyPreviewLoading ? (
                <p className="text-slate-600 font-medium">Calculating eligible leave days…</p>
              ) : applyPreview ? (
                <>
                  <p className="font-bold text-emerald-900">
                    Eligible leave days: {applyPreview.effectiveDays}
                    {applyPreview.calendarDays !== applyPreview.effectiveDays && (
                      <span className="font-medium text-emerald-700">
                        {" "}
                        (calendar: {applyPreview.calendarDays}; holidays/weekly offs excluded)
                      </span>
                    )}
                  </p>
                  {applyPreview.excluded.length > 0 && (
                    <p className="text-emerald-800">
                      Excluded:{" "}
                      {applyPreview.excluded
                        .map((e) => `${e.date} (${e.reason.replace("_", " ")})`)
                        .join(", ")}
                    </p>
                  )}
                </>
              ) : null}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
            <textarea
              rows={3}
              placeholder="Provide reason for leave application..."
              value={applyReason}
              onChange={(e) => setApplyReason(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsApplyModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* MOBILE FILTERS BOTTOM SHEET MODAL */}
      {isMobileFilterOpen && (
        <Modal
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          title="Filter Leave Requests"
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
              <label className="block font-bold text-slate-700 mb-1">Leave Type</label>
              <select
                value={selectedLeaveType}
                onChange={(e) => setSelectedLeaveType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Leave Types</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} ({lt.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">🟡 Pending</option>
                <option value="Approved">🟢 Approved</option>
                <option value="Rejected">🔴 Rejected</option>
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
        onExport={handleLeaveExport}
        defaultDate={selectedDate}
        maxDate={today}
        title="Export leave log"
        description="Choose file type and time period. Current filters apply to the export."
        exporting={exporting}
      />
    </ModulePageShell>
  );
}
