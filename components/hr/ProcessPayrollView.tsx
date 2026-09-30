"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Search,
  Users,
  DollarSign,
  CheckCircle2,
  Lock,
  Eye,
  Edit,
  Play,
  Printer,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  Building2,
  AlertCircle,
  PauseCircle,
  Unlock,
  CreditCard,
  Calculator,
  ChevronRight,
  ChevronDown,
  Send,
  MoreVertical,
  CheckSquare,
  Square,
  AlertTriangle,
  History,
  ShieldAlert,
  FileText,
  CheckCircle,
  HelpCircle,
  Check,
  RefreshCw,
  Landmark,
  FileCode,
  Download,
  Mail,
  Plus,
  Clock,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";
import { HrSearchFilterToolbar } from "@/components/hr/shared/HrSearchFilterToolbar";
import {
  ListSummaryCards,
  ToolbarFilterGroup,
  ToolbarFilterSelect,
} from "@/components/shared/list-table";
import { hrPayrollService, hrPayslipService } from "@/services/human-resources";
import { mapAuditFromApi, mapPayrollFromApi } from "@/lib/hr/api-mappers";
import { MONTH_NAME_TO_NUMBER } from "@/lib/hr/useHrList";
import { cn } from "@/lib/utils";

export type PayrollStatus =
  | "Draft"
  | "Calculated"
  | "Verified"
  | "Approved"
  | "Partially Paid"
  | "Paid"
  | "Locked"
  | "On Hold";

export interface EmployeePayrollRecord {
  id: string;
  employeeId: string;
  payrollMonth: number;
  payrollYear: number;

  grossSalary: number;
  earningsTotal: number;
  deductionsTotal: number;
  netSalary: number;

  status: PayrollStatus;
  calculatedAt?: string;
  verifiedAt?: string;
  approvedAt?: string;
  isLocked?: boolean;
  createdAt: string;
  updatedAt: string;

  payrollId: string;
  employeeName: string;
  empCode?: string;
  department: string;
  designation: string;
  employmentType?: string;
  avatar: string;
  photoUrl?: string;

  // Earnings breakdown
  basicSalary: number;
  hra: number;
  allowances: number;
  overtimePay: number;
  holidayPay: number;
  incentives: number;
  bonus: number;
  otherEarnings: number;

  // Deductions breakdown
  leaveDeduction: number;
  pfDeduction: number;
  esiDeduction: number;
  ptDeduction: number;
  tdsDeduction: number;
  otherDeductions: number;

  isOnHold?: boolean;
  paymentDate?: string;
  paymentRefNo?: string;
  bankRefNo?: string;
  payslipGenerated?: boolean;

  // Validation flags
  hasAttendanceIssue?: boolean;
  missingBankDetails?: boolean;
  missingSalaryStructure?: boolean;
  missingPan?: boolean;
  pendingLeaveApproval?: boolean;
  pendingOtApproval?: boolean;
}

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatPayrollPeriod(month: number, year: number) {
  return `${MONTH_NAMES[month] ?? month} ${year}`;
}

function formatTimestamp(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type PayrollStage = "Draft" | "Calculated" | "Verified" | "Approved" | "Paid" | "Payslip Generated";

function derivePayrollStage(records: EmployeePayrollRecord[]): PayrollStage {
  if (records.length === 0) return "Draft";
  if (records.every((r) => r.status === "Paid" || r.status === "Locked")) {
    return records.every((r) => r.payslipGenerated) ? "Payslip Generated" : "Paid";
  }
  if (records.some((r) => r.status === "Partially Paid" || r.status === "Paid")) return "Paid";
  if (records.every((r) => ["Approved", "Partially Paid", "Paid", "Locked"].includes(r.status))) return "Approved";
  if (records.some((r) => r.status === "Verified")) return "Verified";
  if (records.some((r) => r.status !== "Draft")) return "Calculated";
  return "Draft";
}

const PAYROLL_WORKFLOW_STEPS: {
  stage: PayrollStage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { stage: "Draft", label: "Draft", icon: FileText },
  { stage: "Calculated", label: "Calculated", icon: Calculator },
  { stage: "Verified", label: "Verified", icon: CheckCircle2 },
  { stage: "Approved", label: "Approved", icon: CheckSquare },
  { stage: "Paid", label: "Paid", icon: Landmark },
  { stage: "Payslip Generated", label: "Payslips sent", icon: Send },
];

const PAYROLL_STAGE_ORDER: PayrollStage[] = [
  "Draft",
  "Calculated",
  "Verified",
  "Approved",
  "Paid",
  "Payslip Generated",
];

export interface PayrollAuditEntry {
  id: string;
  action: string;
  changedBy: string;
  changedOn: string;
  overrideReason?: string;
  auditNotes?: string;
}

export type SalaryPaymentMode = "Bank Transfer" | "NEFT" | "RTGS" | "UPI" | "Cheque" | "Cash";
export type SalaryPaymentStatus = "Completed" | "Pending" | "Failed";

export interface SalaryPayment {
  id: string;
  payrollId: string;
  employeeId: string;
  amount: number;
  paymentDate: string;
  paymentMode: SalaryPaymentMode;
  transactionReference: string;
  status: SalaryPaymentStatus;
  remarks: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

const PAYROLL_RECORDED_BY = "Neha Mehta (HR Manager)";

export function ProcessPayrollView() {
  const [records, setRecords] = useState<EmployeePayrollRecord[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [auditLogs, setAuditLogs] = useState<PayrollAuditEntry[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Step 1: Period Selection Controls
  const [selectedMonth, setSelectedMonth] = useState("August");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedEmpType, setSelectedEmpType] = useState("ALL");
  const [processAllOption, setProcessAllOption] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingPayslips, setIsSendingPayslips] = useState(false);
  
  // Status Flow: Draft -> Calculated -> Verified -> Approved -> Paid
  const [overallPayrollStage, setOverallPayrollStage] = useState<PayrollStage>("Draft");

  // Selection & Row Expansion
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [expandedRecordIds, setExpandedRecordIds] = useState<string[]>([]);

  // Drawers & Modals & Export Popover
  const [viewingRecord, setViewingRecord] = useState<EmployeePayrollRecord | null>(null);
  const [viewingPayslipRecord, setViewingPayslipRecord] = useState<EmployeePayrollRecord | null>(null);
  const [recordingPaymentRecord, setRecordingPaymentRecord] = useState<EmployeePayrollRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<EmployeePayrollRecord | null>(null);
  const [activeActionDropdownId, setActiveActionDropdownId] = useState<string | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [isValidationCenterOpen, setIsValidationCenterOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(target)) {
        setIsExportOpen(false);
      }
      if (target instanceof Element && !target.closest("[data-payroll-action-menu]")) {
        setActiveActionDropdownId(null);
        setActionMenuAnchor(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!activeActionDropdownId) return;
    const closeMenu = () => {
      setActiveActionDropdownId(null);
      setActionMenuAnchor(null);
    };
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [activeActionDropdownId]);

  const closeActionMenu = useCallback(() => {
    setActiveActionDropdownId(null);
    setActionMenuAnchor(null);
  }, []);

  const toggleActionMenu = useCallback((recordId: string, button: HTMLButtonElement) => {
    if (activeActionDropdownId === recordId) {
      closeActionMenu();
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuWidth = 192;
    const menuHeight = 196;
    let top = rect.bottom + 4;
    let left = rect.right - menuWidth;

    if (top + menuHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - menuHeight - 4);
    }
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    setActiveActionDropdownId(recordId);
    setActionMenuAnchor({ top, left });
  }, [activeActionDropdownId, closeActionMenu]);

  const loadPayrollData = async () => {
    setLoadingPayroll(true);
    try {
      const month = MONTH_NAME_TO_NUMBER[selectedMonth];
      const year = Number(selectedYear);
      const [payrollRows, auditRows] = await Promise.all([
        hrPayrollService.listRecords(month, year),
        hrPayrollService.listAuditLogs(),
      ]);
      const mapped = payrollRows.map(mapPayrollFromApi);
      setRecords(mapped);
      setAuditLogs(auditRows.map(mapAuditFromApi));

      setOverallPayrollStage(derivePayrollStage(mapped));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load payroll data");
      setRecords([]);
      setAuditLogs([]);
      setOverallPayrollStage("Draft");
    } finally {
      setLoadingPayroll(false);
    }
  };

  useEffect(() => {
    void loadPayrollData();
  }, [selectedMonth, selectedYear]);

  // Edit Adjustments Form State
  const [editBasic, setEditBasic] = useState(0);
  const [editHra, setEditHra] = useState(0);
  const [editAllowances, setEditAllowances] = useState(0);
  const [editOT, setEditOT] = useState(0);
  const [editHolidayPay, setEditHolidayPay] = useState(0);
  const [editIncentives, setEditIncentives] = useState(0);
  const [editBonus, setEditBonus] = useState(0);
  const [editOtherEarnings, setEditOtherEarnings] = useState(0);
  
  const [editLeaveDed, setEditLeaveDed] = useState(0);
  const [editPf, setEditPf] = useState(0);
  const [editEsi, setEditEsi] = useState(0);
  const [editPt, setEditPt] = useState(0);
  const [editTds, setEditTds] = useState(0);
  const [editOtherDeductions, setEditOtherDeductions] = useState(0);
  const [overrideReason, setOverrideReason] = useState("");

  // salary_payments form state (Record Payment action)
  const [salaryPaymentForm, setSalaryPaymentForm] = useState({
    amount: 0,
    paymentDate: "",
    paymentMode: "Bank Transfer" as SalaryPaymentMode,
    transactionReference: "",
    status: "Completed" as SalaryPaymentStatus,
    remarks: "",
  });

  const departmentOptions = useMemo(() => {
    const depts = [...new Set(records.map((r) => r.department).filter(Boolean))].sort();
    return [
      { value: "ALL", label: "All departments" },
      ...depts.map((d) => ({ value: d, label: d })),
    ];
  }, [records]);

  const hasActiveFilters =
    selectedDept !== "ALL" ||
    selectedEmpType !== "ALL" ||
    selectedStatus !== "ALL" ||
    searchTerm.trim() !== "";

  const resetFilters = () => {
    setSelectedDept("ALL");
    setSelectedEmpType("ALL");
    setSelectedStatus("ALL");
    setSearchTerm("");
  };

  // Filtered Table Records
  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return records.filter((r) => {
      const matchSearch =
        !query ||
        r.employeeName.toLowerCase().includes(query) ||
        (r.empCode ?? "").toLowerCase().includes(query) ||
        r.employeeId.toLowerCase().includes(query) ||
        r.department.toLowerCase().includes(query);

      const matchDept = selectedDept === "ALL" || r.department === selectedDept;
      const matchEmpType =
        selectedEmpType === "ALL" ||
        (r.employmentType ?? "").toLowerCase() === selectedEmpType.toLowerCase();
      const matchStatus = selectedStatus === "ALL" || r.status === selectedStatus;

      return matchSearch && matchDept && matchEmpType && matchStatus;
    });
  }, [records, searchTerm, selectedDept, selectedEmpType, selectedStatus]);

  // Summary Cards Metrics (8 Comprehensive Cards)
  const metrics = useMemo(() => {
    const totalEmployees = records.length;
    const processedEmployees = records.filter((r) => r.status !== "Draft").length;
    const pendingEmployees = records.filter((r) => r.status === "Draft" || r.status === "Calculated").length;
    const approvedEmployees = records.filter((r) =>
      ["Approved", "Partially Paid", "Paid"].includes(r.status),
    ).length;
    const payslipsGenerated = records.filter((r) => r.payslipGenerated).length;
    const paidEmployees = records.filter((r) => r.status === "Paid" || r.status === "Locked").length;
    const partiallyPaidEmployees = records.filter((r) => r.status === "Partially Paid").length;

    const grossPayroll = records.reduce((sum, r) => sum + r.grossSalary, 0);
    const totalDeductions = records.reduce((sum, r) => sum + r.deductionsTotal, 0);
    const netPayroll = records.reduce((sum, r) => sum + r.netSalary, 0);

    return {
      totalEmployees,
      processedEmployees,
      pendingEmployees,
      approvedEmployees,
      payslipsGenerated,
      paidEmployees,
      partiallyPaidEmployees,
      grossPayroll,
      totalDeductions,
      netPayroll,
    };
  }, [records]);

  const summaryStats = useMemo(
    () => [
      {
        label: "Total employees",
        value: metrics.totalEmployees,
        color: "text-blue-700 bg-blue-50 border-blue-200",
        icon: "users" as const,
      },
      {
        label: "Processed",
        value: metrics.processedEmployees,
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
        icon: "check-circle" as const,
      },
      {
        label: "Pending",
        value: metrics.pendingEmployees,
        color: "text-amber-700 bg-amber-50 border-amber-200",
        icon: "clock" as const,
      },
      {
        label: "Approved",
        value: metrics.approvedEmployees,
        color: "text-violet-700 bg-violet-50 border-violet-200",
        icon: "user-check" as const,
      },
      {
        label: "Paid",
        value: metrics.paidEmployees,
        color: "text-emerald-800 bg-emerald-50 border-emerald-300",
        icon: "banknote" as const,
      },
      {
        label: "Gross payroll",
        value: formatMoneyCompactTotal(metrics.grossPayroll),
        color: "text-purple-700 bg-purple-50 border-purple-200",
        icon: "banknote" as const,
      },
      {
        label: "Deductions",
        value: formatMoneyCompactTotal(metrics.totalDeductions),
        color: "text-rose-700 bg-rose-50 border-rose-200",
        icon: "banknote" as const,
      },
      {
        label: "Net payroll",
        value: formatMoneyCompactTotal(metrics.netPayroll),
        color: "text-teal-700 bg-teal-50 border-teal-200",
        icon: "banknote" as const,
      },
    ],
    [metrics],
  );

  const currentStageIndex = PAYROLL_STAGE_ORDER.indexOf(overallPayrollStage);

  const renderPayrollFilters = () => (
    <ToolbarFilterGroup>
      <ToolbarFilterSelect
        value={selectedMonth}
        onChange={setSelectedMonth}
        ariaLabel="Payroll month"
        defaultValue="August"
        options={MONTH_NAMES.filter(Boolean).map((m) => ({ value: m, label: m }))}
      />
      <ToolbarFilterSelect
        value={selectedYear}
        onChange={setSelectedYear}
        ariaLabel="Payroll year"
        defaultValue="2026"
        options={[
          { value: "2026", label: "2026" },
          { value: "2025", label: "2025" },
        ]}
      />
      <ToolbarFilterSelect
        value={selectedDept}
        onChange={setSelectedDept}
        ariaLabel="Department"
        options={departmentOptions}
        searchable
      />
      <ToolbarFilterSelect
        value={selectedStatus}
        onChange={setSelectedStatus}
        ariaLabel="Payroll status"
        options={[
          { value: "ALL", label: "All statuses" },
          { value: "Draft", label: "Draft" },
          { value: "Calculated", label: "Calculated" },
          { value: "Verified", label: "Verified" },
          { value: "Approved", label: "Approved" },
          { value: "Partially Paid", label: "Partially Paid" },
          { value: "Paid", label: "Paid" },
        ]}
      />
    </ToolbarFilterGroup>
  );

  const payrollMonth = MONTH_NAME_TO_NUMBER[selectedMonth];
  const payrollYear = Number(selectedYear);

  const handleCalculatePayroll = async (employeeIds?: string[]) => {
    if (!payrollMonth || !payrollYear) {
      setToastMessage("Please select a valid month and year.");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await hrPayrollService.calculatePayroll({
        month: payrollMonth,
        year: payrollYear,
        employeeIds,
        changedBy: PAYROLL_RECORDED_BY,
      });
      await loadPayrollData();
      const calculatedCount = Number(result.calculatedCount ?? 0);
      const skippedCount = Number(result.skippedCount ?? 0);
      const lockedCount = (result.results as { skipped?: string }[] | undefined)?.filter((r) =>
        r.skipped?.includes("locked"),
      ).length ?? 0;

      if (calculatedCount === 0 && skippedCount > 0) {
        setToastMessage(
          lockedCount > 0
            ? `No records recalculated — ${skippedCount} employee(s) are approved/locked. Unlock payroll first to recalculate.`
            : `No records calculated — assign salary structures to employees in Salary Structure module (${skippedCount} skipped).`,
        );
      } else {
        setToastMessage(
          skippedCount > 0
            ? `Calculated ${calculatedCount} employee(s). ${skippedCount} skipped (no structure or locked).`
            : `Payroll calculated and saved for ${calculatedCount} employees (${selectedMonth} ${selectedYear}).`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to calculate payroll";
      setToastMessage(
        message.includes("unreachable")
          ? `${message} Check admin/.env.local — backend should be NEXT_PUBLIC_API_URL=http://localhost:5002`
          : message,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerifyAll = async () => {
    setIsGenerating(true);
    try {
      const result = await hrPayrollService.verifyBatch({
        month: payrollMonth,
        year: payrollYear,
        changedBy: PAYROLL_RECORDED_BY,
      });
      await loadPayrollData();
      setToastMessage(`Verified ${Number(result.verifiedCount ?? 0)} payroll record(s).`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to verify payroll");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveAll = async () => {
    setIsGenerating(true);
    try {
      const result = await hrPayrollService.approveBatch({
        month: payrollMonth,
        year: payrollYear,
        changedBy: PAYROLL_RECORDED_BY,
      });
      await loadPayrollData();
      setToastMessage(
        `Approved ${Number(result.approvedCount ?? 0)} payroll record(s). Payslips generated automatically.`,
      );
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to approve payroll");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendAllPayslips = async () => {
    setIsSendingPayslips(true);
    try {
      const result = await hrPayslipService.sendBatch({
        month: payrollMonth,
        year: payrollYear,
        sentBy: PAYROLL_RECORDED_BY,
      });
      setToastMessage(`Sent ${Number(result.sentCount ?? 0)} payslip(s) to employees.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to send payslips");
    } finally {
      setIsSendingPayslips(false);
    }
  };

  const handleBulkCalculate = async () => {
    if (selectedRecordIds.length === 0) return;
    const employeeIds = records
      .filter((r) => selectedRecordIds.includes(r.id))
      .map((r) => r.employeeId);
    await handleCalculatePayroll(employeeIds);
    setSelectedRecordIds([]);
  };

  const handleBulkVerify = async () => {
    if (selectedRecordIds.length === 0) return;
    setIsGenerating(true);
    try {
      const result = await hrPayrollService.verifyBatch({
        recordIds: selectedRecordIds,
        changedBy: PAYROLL_RECORDED_BY,
      });
      await loadPayrollData();
      setSelectedRecordIds([]);
      setToastMessage(`Verified ${Number(result.verifiedCount ?? 0)} selected record(s).`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to verify selected records");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRecordIds.length === 0) return;
    setIsGenerating(true);
    try {
      const result = await hrPayrollService.approveBatch({
        recordIds: selectedRecordIds,
        changedBy: PAYROLL_RECORDED_BY,
      });
      await loadPayrollData();
      setSelectedRecordIds([]);
      setToastMessage(`Approved ${Number(result.approvedCount ?? 0)} selected record(s). Payslips generated.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to approve selected records");
    } finally {
      setIsGenerating(false);
    }
  };

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    if (selectedRecordIds.length === filteredRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(filteredRecords.map((r) => r.id));
    }
  };

  const handleToggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleExpandRow = (id: string) => {
    setExpandedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Edit Modal
  const handleOpenEditModal = (r: EmployeePayrollRecord) => {
    if (r.isLocked || ["Approved", "Partially Paid", "Paid"].includes(r.status)) return;
    setEditingRecord(r);
    setEditBasic(r.basicSalary);
    setEditHra(r.hra);
    setEditAllowances(r.allowances);
    setEditOT(r.overtimePay);
    setEditHolidayPay(r.holidayPay);
    setEditIncentives(r.incentives);
    setEditBonus(r.bonus);
    setEditOtherEarnings(r.otherEarnings);

    setEditLeaveDed(r.leaveDeduction);
    setEditPf(r.pfDeduction);
    setEditEsi(r.esiDeduction);
    setEditPt(r.ptDeduction);
    setEditTds(r.tdsDeduction);
    setEditOtherDeductions(r.otherDeductions);

    setOverrideReason("Special attendance / Incentive adjustment");
    closeActionMenu();
  };

  const handleVerifyRecord = async (r: EmployeePayrollRecord) => {
    if (r.isLocked || r.status !== "Calculated") return;
    try {
      await hrPayrollService.verifyRecord(r.id, PAYROLL_RECORDED_BY);
      await loadPayrollData();
      closeActionMenu();
      setToastMessage(`Payroll verified for ${r.employeeName}.`);
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to verify payroll");
    }
  };

  const handleApproveRecord = async (r: EmployeePayrollRecord) => {
    if (r.isLocked || ["Approved", "Partially Paid", "Paid", "Locked"].includes(r.status)) return;
    try {
      await hrPayrollService.approveRecord(r.id, PAYROLL_RECORDED_BY);
      await loadPayrollData();
      closeActionMenu();
      setToastMessage(
        `Payroll approved for ${r.employeeName}. Payslip generated automatically.`,
      );
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to approve payroll");
    }
  };

  const handleUnlockRecord = async (r: EmployeePayrollRecord) => {
    const reason = window.prompt(`Unlock payroll for ${r.employeeName}? Enter reason:`);
    if (!reason?.trim()) return;
    try {
      await hrPayrollService.unlockRecord(r.id, reason.trim(), PAYROLL_RECORDED_BY);
      await loadPayrollData();
      closeActionMenu();
      setToastMessage(`Payroll unlocked for ${r.employeeName}.`);
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to unlock payroll");
    }
  };

  const handleOpenRecordPayment = (r: EmployeePayrollRecord) => {
    if (!["Approved", "Partially Paid"].includes(r.status)) {
      setToastMessage(`Approve payroll for ${r.employeeName} before recording payment.`);
      closeActionMenu();
      return;
    }
    setRecordingPaymentRecord(r);
    setSalaryPaymentForm({
      amount: r.netSalary,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMode: "Bank Transfer",
      transactionReference: "",
      status: "Completed",
      remarks: "",
    });
    closeActionMenu();
  };

  const handleSinglePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingPaymentRecord) return;
    if (!["Approved", "Partially Paid"].includes(recordingPaymentRecord.status)) {
      setToastMessage("Payroll must be approved before recording payment.");
      return;
    }

    try {
      await hrPayrollService.recordPayment(recordingPaymentRecord.id, {
        amount: salaryPaymentForm.amount,
        paymentDate: salaryPaymentForm.paymentDate,
        paymentMode: salaryPaymentForm.paymentMode,
        transactionReference: salaryPaymentForm.transactionReference,
        status: salaryPaymentForm.status,
        remarks: salaryPaymentForm.remarks,
        recordedBy: PAYROLL_RECORDED_BY,
      });
      await loadPayrollData();
      setRecordingPaymentRecord(null);
      setToastMessage(
        `Salary payment recorded for ${recordingPaymentRecord.employeeName} — ${formatMoney(salaryPaymentForm.amount)} (${salaryPaymentForm.status}).`
      );
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to record payment");
    }
  };

  const handleViewPayslip = (r: EmployeePayrollRecord) => {
    setViewingPayslipRecord(r);
    closeActionMenu();
  };

  const handleOpenPayrollDetail = async (r: EmployeePayrollRecord) => {
    closeActionMenu();
    setViewingRecord(r);
    try {
      const rows = await hrPayrollService.listPayments(r.id);
      setSalaryPayments(
        rows.map((p) => ({
          id: String(p.id),
          payrollId: String(p.payrollId ?? r.id),
          employeeId: String(p.employeeId ?? r.employeeId),
          amount: Number(p.amount ?? 0),
          paymentDate: String(p.paymentDate ?? ""),
          paymentMode: (p.paymentMode as SalaryPaymentMode) ?? "Bank Transfer",
          transactionReference: String(p.transactionReference ?? ""),
          status: (p.status as SalaryPaymentStatus) ?? "Completed",
          remarks: String(p.remarks ?? ""),
          recordedBy: String(p.recordedBy ?? ""),
          createdAt: String(p.createdAt ?? ""),
          updatedAt: String(p.updatedAt ?? ""),
        })),
      );
    } catch {
      setSalaryPayments([]);
    }
  };

  const activeActionRecord = useMemo(
    () => filteredRecords.find((r) => r.id === activeActionDropdownId) ?? null,
    [filteredRecords, activeActionDropdownId],
  );

  const renderPayrollActionMenu = (r: EmployeePayrollRecord) => (
    <div data-payroll-action-menu>
      <button
        type="button"
        aria-label="Payroll actions"
        aria-expanded={activeActionDropdownId === r.id}
        onClick={(e) => {
          e.stopPropagation();
          toggleActionMenu(r.id, e.currentTarget);
        }}
        className="rounded-xl border border-slate-200 p-1.5 font-bold text-slate-600 hover:bg-slate-100"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );

  const renderPayrollActionMenuPortal = () => {
    if (typeof document === "undefined" || !activeActionRecord || !actionMenuAnchor) return null;

    const r = activeActionRecord;
    const canVerify = !r.isLocked && r.status === "Calculated";
    const canApprove =
      !r.isLocked && ["Calculated", "Verified"].includes(r.status);
    const canUnlock = r.isLocked || ["Approved", "Partially Paid"].includes(r.status);
    const canRecordPayment = ["Approved", "Partially Paid"].includes(r.status);

    return createPortal(
      <>
        <button
          type="button"
          className="fixed inset-0 z-[60] cursor-default bg-transparent"
          aria-label="Close menu"
          onClick={closeActionMenu}
        />
        <div
          data-payroll-action-menu
          className="fixed z-[70] w-48 rounded-2xl border border-slate-200 bg-white p-1.5 text-left text-xs shadow-xl animate-in fade-in"
          style={{ top: actionMenuAnchor.top, left: actionMenuAnchor.left }}
        >
          <button
            type="button"
            onClick={() => handleOpenPayrollDetail(r)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" /> View Payroll
          </button>

          <button
            type="button"
            onClick={() => handleViewPayslip(r)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" /> View Payslip
          </button>

          <button
            type="button"
            disabled={!canVerify}
            onClick={() => handleVerifyRecord(r)}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold",
              canVerify ? "text-blue-800 hover:bg-blue-50" : "cursor-not-allowed text-slate-300",
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Verify Payroll
          </button>

          <button
            type="button"
            disabled={!canApprove}
            onClick={() => handleApproveRecord(r)}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold",
              canApprove
                ? "text-emerald-800 hover:bg-emerald-50"
                : "cursor-not-allowed text-slate-300",
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Approve Payroll
          </button>

          <button
            type="button"
            disabled={!canUnlock}
            onClick={() => handleUnlockRecord(r)}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold",
              canUnlock ? "text-amber-800 hover:bg-amber-50" : "cursor-not-allowed text-slate-300",
            )}
          >
            <Unlock className="h-3.5 w-3.5 text-amber-600" /> Unlock Payroll
          </button>

          <button
            type="button"
            disabled={!canRecordPayment}
            title={canRecordPayment ? undefined : "Approve payroll first"}
            onClick={() => handleOpenRecordPayment(r)}
            className={cn(
              "mt-0.5 flex w-full items-center gap-2 rounded-xl border-t border-slate-100 px-3 py-2 pt-2 font-semibold",
              canRecordPayment
                ? "text-blue-800 hover:bg-blue-50"
                : "cursor-not-allowed text-slate-300",
            )}
          >
            <Landmark className="h-3.5 w-3.5 text-blue-600" /> Record Payment
            {!canRecordPayment && r.status !== "Paid" && r.status !== "Locked" && (
              <span className="ml-auto text-[10px] font-normal text-slate-400">Approve first</span>
            )}
          </button>
        </div>
      </>,
      document.body,
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const gross = editBasic + editHra + editAllowances + editOT + editHolidayPay + editIncentives + editBonus + editOtherEarnings;
    const totalDed = editLeaveDed + editPf + editEsi + editPt + editTds + editOtherDeductions;
    const net = gross - totalDed;

    try {
      await hrPayrollService.updateRecord(editingRecord.id, {
        basicSalary: editBasic,
        hra: editHra,
        allowances: editAllowances,
        overtimePay: editOT,
        holidayPay: editHolidayPay,
        incentives: editIncentives,
        bonus: editBonus,
        otherEarnings: editOtherEarnings,
        grossSalary: gross,
        earningsTotal: gross,
        leaveDeduction: editLeaveDed,
        pfDeduction: editPf,
        esiDeduction: editEsi,
        ptDeduction: editPt,
        tdsDeduction: editTds,
        otherDeductions: editOtherDeductions,
        deductionsTotal: totalDed,
        netSalary: net,
        status: "Calculated",
      });
      await loadPayrollData();
      setEditingRecord(null);
      setToastMessage(
        `Adjustments saved for ${editingRecord.employeeName}. Net salary: ${formatMoney(net)}.`,
      );
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save adjustments");
    }
  };

  return (
    <ModulePageShell
      wrapChildren={false}
      eyebrow="Human Resource / Payroll"
      title="Process Payroll"
      description="Compile attendance, leaves, overtime, holiday pay, and salary structures into final monthly salary calculations, reviews, and payslips."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Payroll" },
        { label: "Process Payroll" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAuditModalOpen(true)}
            className="rounded-xl text-xs font-semibold bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <History className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Audit History
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleVerifyAll}
            disabled={isGenerating || loadingPayroll}
            className="rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-xs"
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Verify All
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleApproveAll}
            disabled={isGenerating || loadingPayroll}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Approve All
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSendAllPayslips}
            disabled={isSendingPayslips || loadingPayroll}
            className="rounded-xl text-xs font-bold bg-violet-700 hover:bg-violet-800 text-white shadow-xs"
          >
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            {isSendingPayslips ? "Sending…" : "Send Payslips"}
          </Button>

          {/* Export Options Dropdown Popover */}
          <div className="relative" ref={exportDropdownRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="rounded-xl text-xs font-semibold bg-white text-slate-700 border-slate-300 shadow-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
              Export Reports
              <ChevronDown className="h-3.5 w-3.5 ml-1 text-slate-400" />
            </Button>

            {isExportOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 space-y-1 text-xs animate-in fade-in-50">
                <button
                  type="button"
                  onClick={() => {
                    setIsExportOpen(false);
                    setToastMessage("Exported Payroll Summary to Excel Sheet (.xlsx).");
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-100 font-semibold text-slate-800 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" /> Excel Sheet (.xlsx)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExportOpen(false);
                    setToastMessage("Exported Payroll Report to PDF (.pdf).");
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-100 font-semibold text-slate-800 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FileCode className="h-3.5 w-3.5 text-rose-600" /> PDF Report (.pdf)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExportOpen(false);
                    setToastMessage("Exported Monthly Salary Register Report.");
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-100 font-semibold text-slate-800 flex items-center justify-between border-t border-slate-100 pt-1.5"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-blue-700" /> Salary Register
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExportOpen(false);
                    setToastMessage("Generated Bank Transfer Direct Salary Disbursement Sheet.");
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-100 font-semibold text-slate-800 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Landmark className="h-3.5 w-3.5 text-purple-700" /> Bank Transfer Sheet
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <RefreshCw className="h-3.5 w-3.5 text-emerald-700" />
            Payroll workflow · {selectedMonth} {selectedYear}
          </div>
          <span className="inline-flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-600">
            <span>{metrics.approvedEmployees} approved</span>
            <span>·</span>
            <span>{metrics.payslipsGenerated} payslips</span>
            <span>·</span>
            <span>{metrics.paidEmployees} paid</span>
            {metrics.partiallyPaidEmployees > 0 ? (
              <>
                <span>·</span>
                <span className="text-amber-700">{metrics.partiallyPaidEmployees} partial</span>
              </>
            ) : null}
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {PAYROLL_WORKFLOW_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const stepIndex = PAYROLL_STAGE_ORDER.indexOf(step.stage);
            const isComplete = currentStageIndex > stepIndex;
            const isCurrent = overallPayrollStage === step.stage;

            return (
              <React.Fragment key={step.stage}>
                <div
                  className={cn(
                    "flex min-w-[7.5rem] shrink-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left",
                    isCurrent
                      ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/20"
                      : isComplete
                        ? "border-slate-200 bg-slate-50"
                        : "border-slate-200 bg-white opacity-60",
                  )}
                >
                  <StepIcon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      isCurrent ? "text-emerald-700" : isComplete ? "text-slate-500" : "text-slate-400",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      isCurrent ? "text-emerald-900" : "text-slate-600",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < PAYROLL_WORKFLOW_STEPS.length - 1 ? (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <ListSummaryCards stats={summaryStats} columns={4} className="mb-5" />

      <HrSearchFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search employee, code, or department..."
        showFilterPanel={showFilterPanel}
        onToggleFilterPanel={() => setShowFilterPanel((v) => !v)}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
        filters={renderPayrollFilters()}
        extraFilters={
          <ToolbarFilterSelect
            value={selectedEmpType}
            onChange={setSelectedEmpType}
            ariaLabel="Employment type"
            options={[
              { value: "ALL", label: "All employment types" },
              { value: "Permanent", label: "Permanent" },
              { value: "Contractual", label: "Contractual" },
              { value: "Probation", label: "Probation" },
              { value: "Trainee", label: "Trainee" },
            ]}
          />
        }
        trailing={
          <Button
            type="button"
            size="sm"
            disabled={isGenerating || loadingPayroll}
            onClick={() => void handleCalculatePayroll()}
            className="rounded-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
          >
            <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
            {isGenerating ? "Processing..." : "Calculate payroll"}
          </Button>
        }
      />

      {selectedRecordIds.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-900 p-3 text-xs text-white shadow-xl animate-in fade-in">
          <span className="flex items-center gap-1.5 font-extrabold text-amber-400">
            <CheckSquare className="h-4 w-4 text-emerald-400" />
            {selectedRecordIds.length} employees selected
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void handleBulkCalculate()}
              className="h-8 rounded-xl border border-slate-700 bg-slate-800 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
            >
              <Calculator className="mr-1 h-3.5 w-3.5 text-blue-400" />
              Calculate selected
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleBulkVerify()}
              className="h-8 rounded-xl bg-blue-700 py-1.5 text-[11px] font-bold text-white hover:bg-blue-800"
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-blue-200" />
              Verify selected
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleBulkApprove()}
              className="h-8 rounded-xl bg-emerald-700 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-800"
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-200" />
              Approve selected
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-xs">
          <span className="font-semibold text-slate-800">
            {loadingPayroll
              ? "Loading payroll records..."
              : `${filteredRecords.length} of ${records.length} employees`}
          </span>
          {!loadingPayroll && hasActiveFilters && filteredRecords.length !== records.length ? (
            <button
              type="button"
              onClick={resetFilters}
              className="font-semibold text-emerald-700 hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="w-10 px-3 py-3 text-center">
                  <button type="button" onClick={handleSelectAll} className="text-slate-500" aria-label="Select all">
                    {selectedRecordIds.length === filteredRecords.length && filteredRecords.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-emerald-700" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Employee</th>
                <th className="hidden px-4 py-3 md:table-cell">Department</th>
                <th className="hidden px-4 py-3 lg:table-cell">Gross salary</th>
                <th className="px-4 py-3">Earnings</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">Net salary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingPayroll ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`loading-${index}`} className="animate-pulse">
                    <td className="px-3 py-4" colSpan={9}>
                      <div className="h-4 rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">No payroll records found</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {hasActiveFilters
                        ? "Try adjusting your filters or search term."
                        : `Run calculate payroll for ${selectedMonth} ${selectedYear} to get started.`}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isExpanded = expandedRecordIds.includes(r.id);
                  const isSelected = selectedRecordIds.includes(r.id);

                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        className={cn(
                          "cursor-pointer transition hover:bg-slate-50/80",
                          isSelected && "bg-emerald-50/40",
                        )}
                        onClick={() => handleOpenPayrollDetail(r)}
                      >
                        <td className="px-3 py-3.5 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleToggleSelectRecord(r.id)}
                            className="text-slate-500"
                            aria-label={isSelected ? "Deselect row" : "Select row"}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-emerald-700" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleExpandRow(r.id);
                              }}
                              className="rounded-md p-1 text-slate-500 hover:bg-slate-200"
                              aria-label={isExpanded ? "Collapse details" : "Expand details"}
                            >
                              <ChevronDown
                                className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")}
                              />
                            </button>
                            <HREmployeeCell
                              name={r.employeeName}
                              id={r.empCode || r.employeeId}
                              avatar={r.avatar}
                              photoUrl={r.photoUrl}
                            />
                          </div>
                        </td>

                        <td className="hidden px-4 py-3.5 align-middle md:table-cell">
                          <p className="font-semibold text-slate-800">{r.department || "—"}</p>
                          {r.designation ? (
                            <p className="mt-0.5 text-[11px] text-slate-500">{r.designation}</p>
                          ) : null}
                        </td>

                        <td className="hidden px-4 py-3.5 align-middle font-bold text-slate-900 lg:table-cell">
                          {r.missingSalaryStructure ? "—" : formatMoney(r.grossSalary)}
                        </td>

                        <td className="px-4 py-3.5 align-middle font-bold text-emerald-800">
                          {r.missingSalaryStructure ? "—" : formatMoney(r.earningsTotal)}
                        </td>

                        <td className="px-4 py-3.5 align-middle font-bold text-rose-700">
                          {r.missingSalaryStructure ? "—" : `-${formatMoney(r.deductionsTotal)}`}
                        </td>

                        <td className="px-4 py-3.5 align-middle">
                          <span className="text-sm font-black text-emerald-800">
                            {r.missingSalaryStructure ? "—" : formatMoney(r.netSalary)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 align-middle">
                          {r.missingSalaryStructure ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              No salary structure
                            </span>
                          ) : (
                            <StatusBadge
                              status={r.status}
                              tone={
                                r.status === "Approved" || r.status === "Paid"
                                  ? "success"
                                  : r.status === "Verified" || r.status === "Calculated"
                                    ? "info"
                                    : r.status === "Draft"
                                      ? "neutral"
                                      : r.status === "Locked"
                                        ? "warning"
                                        : undefined
                              }
                            />
                          )}
                        </td>

                        <td
                          className="relative px-4 py-3.5 text-right align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {renderPayrollActionMenu(r)}
                        </td>
                      </tr>

                      {isExpanded ? (
                        <tr className="border-b border-slate-200 bg-slate-50/90">
                          <td colSpan={9} className="p-4">
                            {r.missingSalaryStructure ? (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                                <p className="font-semibold">Salary structure not assigned</p>
                                <p className="mt-1 text-amber-800">
                                  Assign a salary structure in{" "}
                                  <strong>Payroll → Salary Structure</strong> before calculating this employee&apos;s
                                  payroll.
                                </p>
                              </div>
                            ) : (
                            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 md:grid-cols-4">
                              <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <span className="mb-1 block font-extrabold text-slate-900">Base earnings</span>
                                <p className="flex justify-between"><span>Basic salary</span> <strong>{formatMoney(r.basicSalary)}</strong></p>
                                <p className="flex justify-between"><span>HRA</span> <strong>{formatMoney(r.hra)}</strong></p>
                                <p className="flex justify-between"><span>Allowances</span> <strong>{formatMoney(r.allowances)}</strong></p>
                              </div>

                              <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-3">
                                <span className="mb-1 block font-extrabold text-emerald-950">Variable earnings</span>
                                <p className="flex justify-between"><span>Overtime</span> <strong className="text-emerald-800">+{formatMoney(r.overtimePay)}</strong></p>
                                <p className="flex justify-between"><span>Holiday pay</span> <strong className="text-emerald-800">+{formatMoney(r.holidayPay)}</strong></p>
                                <p className="flex justify-between"><span>Incentives &amp; bonus</span> <strong className="text-emerald-800">+{formatMoney((r.incentives + r.bonus))}</strong></p>
                              </div>

                              <div className="rounded-xl border border-rose-200 bg-rose-50/20 p-3">
                                <span className="mb-1 block font-extrabold text-rose-950">Deductions</span>
                                <p className="flex justify-between"><span>Leave</span> <strong className="text-rose-700">{formatMoney(r.leaveDeduction)}</strong></p>
                                <p className="flex justify-between"><span>PF &amp; ESI</span> <strong className="text-rose-700">{formatMoney((r.pfDeduction + r.esiDeduction))}</strong></p>
                                <p className="flex justify-between"><span>PT &amp; TDS</span> <strong className="text-rose-700">{formatMoney((r.ptDeduction + r.tdsDeduction))}</strong></p>
                              </div>

                              <div className="flex flex-col justify-between rounded-xl bg-slate-900 p-3 text-white">
                                <div>
                                  <span className="block text-[10px] font-bold uppercase text-slate-400">Net payable</span>
                                  <span className="text-xl font-black text-amber-400">{formatMoney(r.netSalary)}</span>
                                </div>
                                <p className="text-[10px] text-slate-400">Status: {r.status}</p>
                              </div>
                            </div>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDIT ADJUSTMENTS MODAL
      ───────────────────────────────────────────────────────────── */}
      {editingRecord && (
        <Modal
          isOpen={Boolean(editingRecord)}
          onClose={() => setEditingRecord(null)}
          title={`Edit Payroll Adjustments: ${editingRecord.employeeName}`}
          description={`Override earnings or deductions for ${selectedMonth} ${selectedYear}.`}
          size="lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <HREmployeeCell
                name={editingRecord.employeeName}
                id={editingRecord.employeeId}
                avatar={editingRecord.avatar}
                photoUrl={editingRecord.photoUrl}
                department={editingRecord.department}
              />
            </div>

            {/* Earnings Breakdown */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <span className="font-extrabold text-emerald-950 block uppercase">Earnings Components (TZS)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Basic Salary</label>
                  <input type="number" value={editBasic} onChange={(e) => setEditBasic(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">HRA</label>
                  <input type="number" value={editHra} onChange={(e) => setEditHra(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Allowances</label>
                  <input type="number" value={editAllowances} onChange={(e) => setEditAllowances(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Overtime Pay (OT)</label>
                  <input type="number" value={editOT} onChange={(e) => setEditOT(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Incentives</label>
                  <input type="number" value={editIncentives} onChange={(e) => setEditIncentives(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bonus</label>
                  <input type="number" value={editBonus} onChange={(e) => setEditBonus(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
              <span className="font-extrabold text-rose-950 block uppercase">Deduction Components (TZS)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Leave Deduction</label>
                  <input type="number" value={editLeaveDed} onChange={(e) => setEditLeaveDed(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Provident Fund (PF)</label>
                  <input type="number" value={editPf} onChange={(e) => setEditPf(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Professional Tax (PT)</label>
                  <input type="number" value={editPt} onChange={(e) => setEditPt(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">TDS / Income Tax</label>
                  <input type="number" value={editTds} onChange={(e) => setEditTds(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingRecord(null)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white">
                Save Adjustments
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* AUDIT LOG MODAL */}
      {isAuditModalOpen && (
        <Modal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          title="Payroll Audit History"
          size="lg"
        >
          <div className="space-y-3 max-h-[65vh] overflow-y-auto text-xs pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">{log.action}</span>
                  <span className="text-[10px] font-mono text-slate-400">{log.changedOn}</span>
                </div>
                <p className="text-slate-600">By: <strong>{log.changedBy}</strong></p>
                {log.auditNotes && <p className="text-slate-500 italic">"{log.auditNotes}"</p>}
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* VIEW PAYROLL DRAWER */}
      <Drawer
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="View Payroll"
        icon={<Calculator className="h-5 w-5 text-emerald-700" />}
      >
        {viewingRecord && (
          <div className="space-y-4 text-xs">
            <HREmployeeCell
              name={viewingRecord.employeeName}
              id={viewingRecord.employeeId}
              avatar={viewingRecord.avatar}
              photoUrl={viewingRecord.photoUrl}
              department={viewingRecord.department}
              designation={viewingRecord.designation}
            />

            <div className="grid grid-cols-2 gap-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Record ID</span>
                <p className="font-mono font-bold text-slate-900">{viewingRecord.id}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Employee ID</span>
                <p className="font-mono font-bold text-slate-900">{viewingRecord.employeeId}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Payroll Month</span>
                <p className="font-bold text-slate-900">{viewingRecord.payrollMonth}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Payroll Year</span>
                <p className="font-bold text-slate-900">{viewingRecord.payrollYear}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Status</span>
                <p className="font-bold text-slate-900">{viewingRecord.status}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Period</span>
                <p className="font-bold text-slate-900">
                  {formatPayrollPeriod(viewingRecord.payrollMonth, viewingRecord.payrollYear)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Calculated At</span>
                <p className="font-semibold text-slate-700">{formatTimestamp(viewingRecord.calculatedAt)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Approved At</span>
                <p className="font-semibold text-slate-700">{formatTimestamp(viewingRecord.approvedAt)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Created At</span>
                <p className="font-semibold text-slate-700">{formatTimestamp(viewingRecord.createdAt)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Updated At</span>
                <p className="font-semibold text-slate-700">{formatTimestamp(viewingRecord.updatedAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] font-bold uppercase text-slate-500">Gross Salary</span>
                <p className="text-lg font-black text-slate-900">{formatMoney(viewingRecord.grossSalary)}</p>
              </div>
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Earnings Total</span>
                <p className="text-lg font-black text-emerald-900">{formatMoney(viewingRecord.earningsTotal)}</p>
              </div>
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/40">
                <span className="text-[10px] font-bold uppercase text-rose-700">Deductions Total</span>
                <p className="text-lg font-black text-rose-900">{formatMoney(viewingRecord.deductionsTotal)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 text-white">
                <span className="text-[10px] font-bold uppercase text-slate-400">Net Salary</span>
                <p className="text-lg font-black text-amber-400">{formatMoney(viewingRecord.netSalary)}</p>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1.5">
              <div className="flex justify-between items-center border-b border-emerald-200 pb-1">
                <span className="font-extrabold text-emerald-950 uppercase text-[11px]">Earnings Breakdown</span>
                <span className="font-extrabold text-emerald-900 text-xs">{formatMoney(viewingRecord.earningsTotal)}</span>
              </div>
              <p className="flex justify-between text-slate-600"><span>Basic Salary:</span> <strong>{formatMoney(viewingRecord.basicSalary)}</strong></p>
              <p className="flex justify-between text-slate-600"><span>HRA:</span> <strong>{formatMoney(viewingRecord.hra)}</strong></p>
              <p className="flex justify-between text-slate-600"><span>Allowances:</span> <strong>{formatMoney(viewingRecord.allowances)}</strong></p>
              <p className="flex justify-between text-emerald-800"><span>Overtime:</span> <strong>+{formatMoney(viewingRecord.overtimePay)}</strong></p>
              <p className="flex justify-between text-emerald-800"><span>Holiday Pay:</span> <strong>+{formatMoney(viewingRecord.holidayPay)}</strong></p>
              <p className="flex justify-between text-emerald-800"><span>Incentives:</span> <strong>+{formatMoney(viewingRecord.incentives)}</strong></p>
              {viewingRecord.bonus > 0 && (
                <p className="flex justify-between text-emerald-800"><span>Bonus:</span> <strong>+{formatMoney(viewingRecord.bonus)}</strong></p>
              )}
            </div>

            {/* Deductions Breakdown */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1.5">
              <div className="flex justify-between items-center border-b border-rose-200 pb-1">
                <span className="font-extrabold text-rose-950 uppercase text-[11px]">Deductions Breakdown</span>
                <span className="font-extrabold text-rose-900 text-xs">-{formatMoney(viewingRecord.deductionsTotal)}</span>
              </div>
              <p className="flex justify-between text-slate-600"><span>PF (Provident Fund):</span> <strong>{formatMoney(viewingRecord.pfDeduction)}</strong></p>
              <p className="flex justify-between text-slate-600"><span>ESI Insurance:</span> <strong>{formatMoney(viewingRecord.esiDeduction)}</strong></p>
              <p className="flex justify-between text-slate-600"><span>Professional Tax (PT):</span> <strong>{formatMoney(viewingRecord.ptDeduction)}</strong></p>
              <p className="flex justify-between text-slate-600"><span>TDS (Income Tax):</span> <strong>{formatMoney(viewingRecord.tdsDeduction)}</strong></p>
              <p className="flex justify-between text-rose-800"><span>Leave Deductions:</span> <strong>{formatMoney(viewingRecord.leaveDeduction)}</strong></p>
            </div>

            {salaryPayments.filter((p) => p.payrollId === viewingRecord.id).length > 0 && (
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                <span className="font-extrabold text-blue-950 uppercase text-[11px] block">Salary Payments</span>
                {salaryPayments
                  .filter((p) => p.payrollId === viewingRecord.id)
                  .map((payment) => (
                    <div key={payment.id} className="p-2.5 rounded-lg bg-white border border-blue-100 space-y-1">
                      <div className="flex justify-between">
                        <span className="font-mono font-bold text-slate-900">{payment.id}</span>
                        <span className="font-bold text-blue-800">{payment.status}</span>
                      </div>
                      <p className="flex justify-between"><span>Amount:</span> <strong>{formatMoney(payment.amount)}</strong></p>
                      <p className="flex justify-between"><span>Payment Date:</span> <strong>{payment.paymentDate}</strong></p>
                      <p className="flex justify-between"><span>Mode:</span> <strong>{payment.paymentMode}</strong></p>
                      <p className="flex justify-between"><span>Transaction Ref:</span> <strong className="font-mono">{payment.transactionReference}</strong></p>
                      {payment.remarks && <p className="text-slate-600 italic">"{payment.remarks}"</p>}
                      <p className="text-[10px] text-slate-500">Recorded by {payment.recordedBy} · {formatTimestamp(payment.createdAt)}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* VIEW PAYSLIP MODAL */}
      {viewingPayslipRecord && (
        <Modal
          isOpen={Boolean(viewingPayslipRecord)}
          onClose={() => setViewingPayslipRecord(null)}
          title={`Payslip: ${viewingPayslipRecord.employeeName}`}
          description={`${formatPayrollPeriod(viewingPayslipRecord.payrollMonth, viewingPayslipRecord.payrollYear)} · ${viewingPayslipRecord.payrollId}`}
          size="xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-6 rounded-2xl border border-slate-300 bg-white space-y-4 shadow-sm">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">GRAND PALACE HOTEL &amp; RESORT</h2>
                  <p className="text-slate-500 text-[11px]">101 Beachfront Boulevard, Goa, India</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-900 text-amber-400 font-extrabold rounded-lg text-xs block">
                    PAYSLIP
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block pt-1">{viewingPayslipRecord.payrollId}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <p><strong className="text-slate-900">Employee:</strong> {viewingPayslipRecord.employeeName}</p>
                  <p><strong className="text-slate-900">Employee ID:</strong> {viewingPayslipRecord.employeeId}</p>
                  <p><strong className="text-slate-900">Department:</strong> {viewingPayslipRecord.department}</p>
                  <p><strong className="text-slate-900">Designation:</strong> {viewingPayslipRecord.designation}</p>
                </div>
                <div className="space-y-1">
                  <p><strong className="text-slate-900">Pay Period:</strong> {formatPayrollPeriod(viewingPayslipRecord.payrollMonth, viewingPayslipRecord.payrollYear)}</p>
                  <p><strong className="text-slate-900">Record ID:</strong> {viewingPayslipRecord.id}</p>
                  <p><strong className="text-slate-900">Status:</strong> {viewingPayslipRecord.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-xl overflow-hidden">
                <div className="border-r border-slate-200">
                  <div className="bg-emerald-100/70 p-2 font-extrabold text-emerald-950 uppercase border-b border-slate-200">
                    Earnings
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex justify-between"><span>Basic Salary</span><span className="font-bold">{formatMoney(viewingPayslipRecord.basicSalary)}</span></div>
                    <div className="flex justify-between"><span>HRA</span><span className="font-bold">{formatMoney(viewingPayslipRecord.hra)}</span></div>
                    <div className="flex justify-between"><span>Allowances</span><span className="font-bold">{formatMoney(viewingPayslipRecord.allowances)}</span></div>
                    <div className="flex justify-between"><span>Overtime</span><span className="font-bold">+{formatMoney(viewingPayslipRecord.overtimePay)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-black">
                      <span>Total Earnings</span>
                      <span>{formatMoney(viewingPayslipRecord.earningsTotal)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="bg-rose-100/70 p-2 font-extrabold text-rose-950 uppercase border-b border-slate-200">
                    Deductions
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex justify-between"><span>PF &amp; ESI</span><span className="font-bold">{formatMoney((viewingPayslipRecord.pfDeduction + viewingPayslipRecord.esiDeduction))}</span></div>
                    <div className="flex justify-between"><span>PT &amp; TDS</span><span className="font-bold">{formatMoney((viewingPayslipRecord.ptDeduction + viewingPayslipRecord.tdsDeduction))}</span></div>
                    <div className="flex justify-between"><span>Leave</span><span className="font-bold">{formatMoney(viewingPayslipRecord.leaveDeduction)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-black">
                      <span>Total Deductions</span>
                      <span>{formatMoney(viewingPayslipRecord.deductionsTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Net Salary Payable</span>
                <span className="text-2xl font-black text-amber-400">{formatMoney(viewingPayslipRecord.netSalary)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* RECORD PAYMENT MODAL (salary_payments) */}
      {recordingPaymentRecord && (
        <Modal
          isOpen={Boolean(recordingPaymentRecord)}
          onClose={() => setRecordingPaymentRecord(null)}
          title={`Record Payment: ${recordingPaymentRecord.employeeName}`}
          description={`Create a salary_payments entry for ${formatPayrollPeriod(recordingPaymentRecord.payrollMonth, recordingPaymentRecord.payrollYear)}.`}
          size="md"
        >
          <form onSubmit={handleSinglePaymentSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <HREmployeeCell
                name={recordingPaymentRecord.employeeName}
                id={recordingPaymentRecord.employeeId}
                avatar={recordingPaymentRecord.avatar}
                photoUrl={recordingPaymentRecord.photoUrl}
                department={recordingPaymentRecord.department}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/80">
              <div>
                <label className="block font-bold text-slate-500 mb-1 uppercase text-[10px]">Payroll ID</label>
                <input
                  type="text"
                  readOnly
                  value={recordingPaymentRecord.id}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-700 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1 uppercase text-[10px]">Employee ID</label>
                <input
                  type="text"
                  readOnly
                  value={recordingPaymentRecord.employeeId}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-700 bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-bold text-slate-500 mb-1 uppercase text-[10px]">Recorded By</label>
                <input
                  type="text"
                  readOnly
                  value={PAYROLL_RECORDED_BY}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-700 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Amount (TZS)</label>
              <input
                type="number"
                required
                min={0}
                step={1}
                value={salaryPaymentForm.amount}
                onChange={(e) =>
                  setSalaryPaymentForm((prev) => ({ ...prev, amount: Number(e.target.value) }))
                }
                className="w-full rounded-xl border border-slate-200 p-2.5 font-black text-slate-900"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Net salary payable: {formatMoney(recordingPaymentRecord.netSalary)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={salaryPaymentForm.paymentDate}
                  onChange={(e) =>
                    setSalaryPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  required
                  value={salaryPaymentForm.paymentMode}
                  onChange={(e) =>
                    setSalaryPaymentForm((prev) => ({
                      ...prev,
                      paymentMode: e.target.value as SalaryPaymentMode,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Transaction Reference</label>
              <input
                type="text"
                required
                placeholder="e.g. HDFC-TXN-987654321"
                value={salaryPaymentForm.transactionReference}
                onChange={(e) =>
                  setSalaryPaymentForm((prev) => ({ ...prev, transactionReference: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                required
                value={salaryPaymentForm.status}
                onChange={(e) =>
                  setSalaryPaymentForm((prev) => ({
                    ...prev,
                    status: e.target.value as SalaryPaymentStatus,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Remarks</label>
              <textarea
                rows={3}
                placeholder="Optional notes about this disbursement..."
                value={salaryPaymentForm.remarks}
                onChange={(e) =>
                  setSalaryPaymentForm((prev) => ({ ...prev, remarks: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 resize-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 font-medium">
              Workflow: <strong>Approve Payroll</strong> first, then record payment here. Payroll moves to{" "}
              <strong>Paid</strong> only when payment status is <strong>Completed</strong>.
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setRecordingPaymentRecord(null)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white">
                Record Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {renderPayrollActionMenuPortal()}
    </ModulePageShell>
  );
}
