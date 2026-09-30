"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  User,
  Building2,
  Briefcase,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  CreditCard,
  FileText,
  Printer,
  Edit2,
  ArrowLeft,
  ChevronDown,
  Gift,
  Award,
  CheckCircle2,
  AlertTriangle,
  Download,
  Wallet,
  MessageSquareWarning,
  History,
  IdCard,
  Search,
  Users,
  Sparkles,
  Check,
  X,
  MapPin,
  Heart,
  Landmark,
  Shield,
  FileCheck,
  CheckSquare,
  XCircle,
  Eye,
  Upload,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ModulePageShell } from "@/components/pms";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";
import {
  hrEmployeeService,
  hrDepartmentService,
  hrDesignationService,
  hrEmploymentTypeService,
  hrShiftTypeService,
  hrShiftAssignmentService,
  hrWeeklyOffService,
  hrLeaveApplicationService,
  hrOvertimeService,
  hrAttendanceService,
  hrComplaintService,
} from "@/services/human-resources";
import { mapEmployeeFromApi } from "@/lib/hr/api-mappers";
import { EmployeeAttendanceGrid } from "@/components/hr/shared/EmployeeAttendanceGrid";
import { EmployeeLeaveTab } from "@/components/hr/shared/EmployeeLeaveTab";
import { EmployeePayrollTab } from "@/components/hr/shared/EmployeePayrollTab";
import {
  ProfileCard,
  ProfileField,
  PersonalContactPanel,
  EmploymentPanel,
  CurrentShiftPanel,
  LeaveBalancePanel,
  LeaveHistoryPanel,
  DocumentCategoryPanel,
  GrievancesPanel,
  ActivityLogPanel,
  ProfileIconField,
  ProfileSection,
  type LeaveBalanceItem,
  type LeaveHistoryRow,
} from "@/components/hr/shared/profileHelpers";
import { cn } from "@/lib/utils";

type ProfileTab =
  | "overview"
  | "employment"
  | "attendance"
  | "leave"
  | "payroll"
  | "documents"
  | "grievances"
  | "activity";

const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "employment", label: "Employment" },
  { id: "attendance", label: "Attendance" },
  { id: "leave", label: "Leave" },
  { id: "payroll", label: "Payroll" },
  { id: "documents", label: "Documents" },
  { id: "grievances", label: "Grievances" },
  { id: "activity", label: "Activity" },
];

function ProfileHighlightBadge({
  icon: Icon,
  children,
  tone = "emerald",
  mono = false,
  variant = "soft",
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  tone?: "emerald" | "indigo";
  mono?: boolean;
  variant?: "soft" | "solid";
}) {
  const softTones = {
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200/80 ring-emerald-100",
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-200/80 ring-indigo-100",
  };
  const solidTones = {
    emerald: "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20",
    indigo: "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        variant === "solid" ? solidTones[tone] : cn("ring-1 ring-inset", softTones[tone]),
        mono && "font-mono tracking-wide",
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", variant === "solid" ? "opacity-95" : "opacity-80")} />
      {children}
    </span>
  );
}

function EmployeeProfileSummaryCard({
  employee,
  weeklyOffText,
}: {
  employee: EmployeeItem;
  weeklyOffText?: string;
}) {
  const isActive = employee.status === "Active";

  const stats = [
    { label: "Manager", value: employee.reportingManager || "—", icon: User, tone: "slate" as const },
    { label: "Joined", value: employee.joinDate, icon: Calendar, tone: "slate" as const },
    { label: "Employment", value: employee.employmentType, icon: Briefcase, tone: "emerald" as const },
    { label: "Weekly off", value: weeklyOffText || "Sunday", icon: Calendar, tone: "violet" as const },
    {
      label: "Status",
      value: employee.status,
      icon: CheckCircle2,
      tone: isActive ? ("emerald" as const) : ("amber" as const),
    },
    {
      label: "Leave balance",
      value: employee.leaveBalance
        ? `CL ${employee.leaveBalance.casual} · SL ${employee.leaveBalance.sick}`
        : "—",
      icon: Clock,
      tone: "amber" as const,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative shrink-0">
              {employee.photoUrl ? (
                <img
                  src={employee.photoUrl}
                  alt={employee.name}
                  className="h-16 w-16 sm:h-[72px] sm:w-[72px] rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 sm:h-[72px] sm:w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-lg font-bold text-white shadow-sm ring-2 ring-slate-100">
                  {employee.avatar}
                </div>
              )}
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm",
                  isActive ? "bg-emerald-500" : "bg-amber-400",
                )}
                aria-hidden
              />
            </div>

            <div className="min-w-0 space-y-2 pt-0.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
                {employee.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2">
                <ProfileHighlightBadge icon={Briefcase} tone="emerald">
                  {employee.designation}
                </ProfileHighlightBadge>
                <ProfileHighlightBadge icon={IdCard} tone="indigo" mono>
                  {employee.empCode}
                </ProfileHighlightBadge>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end sm:pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 sm:justify-end">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              {employee.department}
            </span>

            <div className="flex gap-2">
            <a
              href={`tel:${employee.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              <Phone className="h-4 w-4 shrink-0" />
              Call
            </a>
            <a
              href={`mailto:${employee.email}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Mail className="h-4 w-4 shrink-0 text-slate-500" />
              Email
            </a>
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-5 gap-y-4">
          {stats.map((item) => (
            <ProfileIconField
              key={item.label}
              icon={item.icon}
              tone={item.tone}
              label={item.label}
              value={item.value}
            />
          ))}
        </dl>
      </div>
    </div>
  );
}

function AttendanceScoreRing({ value, size = 56 }: { value: number; size?: number }) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div
      className="relative shrink-0 rounded-full bg-white/70 p-0.5 shadow-sm ring-1 ring-emerald-100/80"
      style={{ width: size + 4, height: size + 4 }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-emerald-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-emerald-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums text-emerald-800">
        {value}
      </span>
    </div>
  );
}

function formatProfileDate(iso: string) {
  const d = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return iso;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function formatSalaryPeriod(from: string | null | undefined, to: string | null | undefined) {
  if (!from) return "—";
  const start = formatProfileDate(from);
  if (!to) return `${start} → Present`;
  return `${start} → ${formatProfileDate(to)}`;
}

function EmployeeProfileQuickMetrics({
  employee,
  compensationRefreshKey = 0,
}: {
  employee: EmployeeItem;
  compensationRefreshKey?: number;
}) {
  const [compGross, setCompGross] = useState<number | null>(null);
  const [compPeriod, setCompPeriod] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { hrCompensationService } = await import("@/services/human-resources");
        const summary = await hrCompensationService.getSummary(employee.id);
        if (cancelled) return;
        const gross = Number(summary.currentGross ?? 0);
        setCompGross(gross > 0 ? gross : null);
        setCompPeriod(
          formatSalaryPeriod(
            summary.currentEffectiveFrom as string | undefined,
            summary.currentEffectiveTo as string | undefined,
          ),
        );
      } catch {
        if (!cancelled) {
          setCompGross(null);
          setCompPeriod(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employee.id, compensationRefreshKey]);

  const score = employee.attendanceRate ?? 96;
  const displayGross = compGross ?? employee.structureGrossSalary ?? 0;
  const scoreLabel =
    score >= 95 ? "Excellent" : score >= 85 ? "Good" : score >= 75 ? "Fair" : "Low";
  const scoreBadgeClass =
    score >= 95
      ? "bg-emerald-100 text-emerald-700 ring-emerald-200/60"
      : score >= 85
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200/50"
        : score >= 75
          ? "bg-amber-50 text-amber-700 ring-amber-200/60"
          : "bg-rose-50 text-rose-700 ring-rose-200/60";

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="group relative flex flex-1 items-center gap-3.5 overflow-hidden rounded-2xl border border-emerald-100/90 bg-gradient-to-r from-emerald-50/90 via-white to-white p-3.5 shadow-sm ring-1 ring-inset ring-white/80">
        <AttendanceScoreRing value={score} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">Attendance score</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-2xl font-bold tabular-nums tracking-tight text-emerald-950">
              {score}
              <span className="text-lg font-semibold text-emerald-700/80">%</span>
            </p>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                scoreBadgeClass,
              )}
            >
              {scoreLabel}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-400">Last 30 days</p>
        </div>
      </div>

      <div className="group relative flex flex-1 items-center gap-3.5 overflow-hidden rounded-2xl border border-indigo-100/90 bg-gradient-to-r from-indigo-50/90 via-white to-white p-3.5 shadow-sm ring-1 ring-inset ring-white/80">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 shadow-sm ring-1 ring-indigo-100/80">
          <Wallet className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">Current salary</p>
          {displayGross > 0 ? (
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-indigo-950">
              {formatMoney(displayGross)}
              <span className="ml-1 text-sm font-semibold text-indigo-700/80">gross / month</span>
            </p>
          ) : (
            <p className="mt-1 text-lg font-bold text-indigo-950">Not set</p>
          )}
          <p className="mt-1 text-xs font-medium text-indigo-900/90">
            {employee.salaryStructureName || "No salary structure"}
          </p>
          {compPeriod && (
            <p className="mt-0.5 text-[10px] font-medium text-slate-500">
              Effective {compPeriod}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmployeeProfileHeader({
  employee,
  weeklyOffText,
  compensationRefreshKey,
}: {
  employee: EmployeeItem;
  weeklyOffText?: string;
  compensationRefreshKey?: number;
}) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(240px,280px)]">
      <EmployeeProfileSummaryCard employee={employee} weeklyOffText={weeklyOffText} />
      <EmployeeProfileQuickMetrics
        employee={employee}
        compensationRefreshKey={compensationRefreshKey}
      />
    </div>
  );
}

const LEAVE_BALANCES: LeaveBalanceItem[] = [
  { label: "Casual leave (CL)", remaining: 8, allocated: 10, used: 2, icon: Calendar, tone: "blue" },
  { label: "Sick leave (SL)", remaining: 9, allocated: 12, used: 3, icon: Heart, tone: "rose" },
  { label: "Earned leave (EL)", remaining: 10, allocated: 15, used: 5, icon: Gift, tone: "violet" },
  { label: "Compensatory off", remaining: 2, allocated: 2, used: 0, icon: Clock, tone: "emerald" },
];

const LEAVE_HISTORY: LeaveHistoryRow[] = [
  {
    type: "Casual Leave (CL)",
    dates: "10 Aug – 12 Aug 2026",
    days: "3 days",
    reason: "Family commitment",
    status: "Pending",
    approvedBy: "Pending HR review",
  },
  {
    type: "Sick Leave (SL)",
    dates: "15 Jul 2026",
    days: "1 day",
    reason: "Viral fever recovery",
    status: "Approved",
    approvedBy: "Neha Mehta (HR)",
  },
  {
    type: "Earned Leave (EL)",
    dates: "10 Jun – 14 Jun 2026",
    days: "5 days",
    reason: "Annual family vacation",
    status: "Approved",
    approvedBy: "Neha Mehta (HR)",
  },
  {
    type: "Comp off (COMP)",
    dates: "02 May 2026",
    days: "1 day",
    reason: "Worked Sunday banquet shift",
    status: "Approved",
    approvedBy: "F&B Manager",
  },
];

const DOCUMENT_CATEGORIES = [
  "Identity Proof",
  "Education",
  "Employment",
  "Financial",
  "Medical",
  "Compliance",
] as const;

const DOCUMENT_CATEGORY_LABELS: Record<(typeof DOCUMENT_CATEGORIES)[number], string> = {
  "Identity Proof": "Identity proof",
  Education: "Education & qualifications",
  Employment: "Employment & contracts",
  Financial: "Financial & tax",
  Medical: "Medical fitness",
  Compliance: "Compliance & declarations",
};

// Categorized Document Model for Section 8
interface CategorizedDoc {
  id: string;
  name: string;
  category: "Identity Proof" | "Education" | "Employment" | "Financial" | "Medical" | "Compliance";
  status: "Verified" | "Uploaded" | "Expiring Soon" | "Expired" | "Missing" | "Pending Review";
  uploadDate?: string;
  fileSize?: string;
}

const CATEGORIZED_DOCUMENTS: CategorizedDoc[] = [
  // Identity Proof
  { id: "d1", name: "Aadhaar Card", category: "Identity Proof", status: "Verified", uploadDate: "15 Jan 2022", fileSize: "1.8 MB" },
  { id: "d2", name: "PAN Card", category: "Identity Proof", status: "Verified", uploadDate: "15 Jan 2022", fileSize: "850 KB" },
  { id: "d3", name: "Passport", category: "Identity Proof", status: "Expiring Soon", uploadDate: "20 Aug 2021", fileSize: "2.4 MB" },
  
  // Education
  { id: "d4", name: "10th Marksheet & Certificate", category: "Education", status: "Verified", uploadDate: "10 Jan 2022", fileSize: "1.2 MB" },
  { id: "d5", name: "12th Marksheet & Certificate", category: "Education", status: "Verified", uploadDate: "10 Jan 2022", fileSize: "1.4 MB" },
  { id: "d6", name: "Degree / Diploma Certificate (BHM)", category: "Education", status: "Verified", uploadDate: "12 Jan 2022", fileSize: "3.5 MB" },
  
  // Employment
  { id: "d7", name: "Updated Resume / CV", category: "Employment", status: "Verified", uploadDate: "05 Jan 2022", fileSize: "920 KB" },
  { id: "d8", name: "Offer Letter", category: "Employment", status: "Verified", uploadDate: "15 Jan 2022", fileSize: "1.1 MB" },
  { id: "d9", name: "Appointment Letter", category: "Employment", status: "Verified", uploadDate: "20 Jan 2022", fileSize: "1.5 MB" },
  { id: "d10", name: "Service Agreement & NDA", category: "Employment", status: "Verified", uploadDate: "20 Jan 2022", fileSize: "2.1 MB" },
  
  // Financial
  { id: "d11", name: "Bank Passbook / Cancelled Cheque", category: "Financial", status: "Verified", uploadDate: "18 Jan 2022", fileSize: "1.3 MB" },
  { id: "d12", name: "UAN & PF Allotment Letter", category: "Financial", status: "Verified", uploadDate: "22 Jan 2022", fileSize: "640 KB" },
  { id: "d13", name: "Form 16 / Tax Declaration", category: "Financial", status: "Pending Review", uploadDate: "01 Aug 2026", fileSize: "2.9 MB" },

  // Medical
  { id: "d14", name: "Pre-Employment Medical Fitness", category: "Medical", status: "Expired", uploadDate: "10 Jul 2024", fileSize: "1.7 MB" },

  // Compliance
  { id: "d15", name: "NDA Sign-off Document", category: "Compliance", status: "Verified", uploadDate: "20 Jan 2022", fileSize: "800 KB" },
  { id: "d16", name: "POSH Policy Acknowledgement", category: "Compliance", status: "Verified", uploadDate: "20 Jan 2022", fileSize: "750 KB" },
  { id: "d17", name: "Code of Conduct Declaration", category: "Compliance", status: "Verified", uploadDate: "20 Jan 2022", fileSize: "680 KB" },
];

interface GrievanceRecord {
  id: string;
  ticketNo: string;
  subject: string;
  category: string;
  date: string;
  status: "Open" | "Resolved" | "Escalated" | "Closed";
  resolutionNote?: string;
}

const SAMPLE_GRIEVANCES: Record<string, GrievanceRecord[]> = {
  "emp-101": [],
  "emp-102": [
    {
      id: "g1",
      ticketNo: "#GR-402",
      subject: "Shift Swap Approval Delay",
      category: "Shift Schedule",
      date: "02 Aug 2026",
      status: "Open",
      resolutionNote: "Under review by Housekeeping Department Head.",
    },
    {
      id: "g2",
      ticketNo: "#GR-280",
      subject: "Overtime Payment Reconciliation",
      category: "Payroll",
      date: "14 May 2026",
      status: "Resolved",
      resolutionNote: "Difference of TSh 1,400 credited in June payroll cycle.",
    },
  ],
};

interface ActivityLogItem {
  id: string;
  timestamp: string;
  category: "Attendance" | "Leave" | "Payroll" | "Documents" | "Profile";
  timeframe: "Today" | "Yesterday" | "Last Week" | "Older";
  actor: string;
  description: string;
}



export function EmployeeProfileView({ initialEmpId }: { initialEmpId?: string }) {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(initialEmpId ?? null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);
  const [compensationRefreshKey, setCompensationRefreshKey] = useState(0);

  const notifyPayrollToast = useCallback((message: string) => {
    setToastMessage(message);
    setCompensationRefreshKey((k) => k + 1);
  }, []);
  const tabPanelRef = useRef<HTMLDivElement>(null);

  // Activity Log Filter States
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>("ALL");
  const [activityTimeframeFilter, setActivityTimeframeFilter] = useState<string>("ALL");

  // Search Combobox State
  const [comboboxQuery, setComboboxQuery] = useState("");
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  const [shiftAssignments, setShiftAssignments] = useState<Record<string, unknown>[]>([]);
  const [weeklyOffs, setWeeklyOffs] = useState<Record<string, unknown>[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<Record<string, unknown>[]>([]);
  const [overtimeRecords, setOvertimeRecords] = useState<Record<string, unknown>[]>([]);
  const [employeeAttendance, setEmployeeAttendance] = useState<Record<string, unknown>[]>([]);
  const [complaints, setComplaints] = useState<Record<string, unknown>[]>([]);

  const reloadEmployees = useCallback(async () => {
    try {
      const [
        rows,
        deptRows,
        desigRows,
        empTypeRows,
        shiftRows,
        assignRows,
        woRows,
        leaveRows,
        otRows,
        compRows,
      ] = await Promise.all([
        hrEmployeeService.list().catch(() => []),
        hrDepartmentService.list().catch(() => []),
        hrDesignationService.list().catch(() => []),
        hrEmploymentTypeService.list().catch(() => []),
        hrShiftTypeService.list().catch(() => []),
        hrShiftAssignmentService.list().catch(() => []),
        hrWeeklyOffService.list().catch(() => []),
        hrLeaveApplicationService.list().catch(() => []),
        hrOvertimeService.list().catch(() => []),
        hrComplaintService.list().catch(() => []),
      ]);
      setShiftAssignments(assignRows as Record<string, unknown>[]);
      setWeeklyOffs(woRows as Record<string, unknown>[]);
      setLeaveApplications(leaveRows as Record<string, unknown>[]);
      setOvertimeRecords(otRows as Record<string, unknown>[]);
      setComplaints(compRows as Record<string, unknown>[]);

      const deptMap = new Map((deptRows as Record<string, unknown>[]).map((d) => [
        String(d.id),
        String(d.departmentName || d.department_name || d.name || d.dept_name || "").trim(),
      ]));
      const desigMap = new Map((desigRows as Record<string, unknown>[]).map((d) => [
        String(d.id),
        String(d.designationTitle || d.designation_title || d.designationName || d.designation_name || d.title || d.name || "").trim(),
      ]));
      const empTypeMap = new Map((empTypeRows as Record<string, unknown>[]).map((t) => [
        String(t.id),
        String(t.typeName || t.type_name || t.name || t.workingTerm || "").trim(),
      ]));
      const shiftMap = new Map((shiftRows as Record<string, unknown>[]).map((s) => [
        String(s.id),
        String(s.shiftName || s.shift_name || s.name || "").trim(),
      ]));

      const isUuid = (val?: string) =>
        typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

      const mapped = (rows as Record<string, unknown>[]).map((r) => {
        const emp = mapEmployeeFromApi(r);
        const rawDeptId = String(r.departmentId || r.department_id || "");
        const rawDesigId = String(r.designationId || r.designation_id || "");
        const rawEmpTypeId = String(r.employmentTypeId || r.employment_type_id || "");
        const rawShiftId = String(r.shiftTypeId || r.shift_type_id || "");

        if (!emp.department || isUuid(emp.department)) {
          emp.department = (isUuid(emp.department) ? deptMap.get(emp.department) : "") || deptMap.get(rawDeptId) || (isUuid(emp.department) ? "" : emp.department) || "General";
        }
        if (!emp.designation || isUuid(emp.designation)) {
          emp.designation = (isUuid(emp.designation) ? desigMap.get(emp.designation) : "") || desigMap.get(rawDesigId) || (isUuid(emp.designation) ? "" : emp.designation) || "Staff";
        }
        if (!emp.employmentType || isUuid(emp.employmentType)) {
          emp.employmentType = ((isUuid(emp.employmentType) ? empTypeMap.get(emp.employmentType) : "") || empTypeMap.get(rawEmpTypeId) || (isUuid(emp.employmentType) ? "Permanent" : emp.employmentType) || "Permanent") as EmployeeItem["employmentType"];
        }
        if (!emp.shiftType || isUuid(emp.shiftType)) {
          emp.shiftType = ((isUuid(emp.shiftType) ? shiftMap.get(emp.shiftType) : "") || shiftMap.get(rawShiftId) || (isUuid(emp.shiftType) ? "General Shift" : emp.shiftType) || "General Shift") as EmployeeItem["shiftType"];
        }
        return emp;
      });

      setEmployees(mapped);
      return mapped;
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load employees");
      setEmployees([]);
      return [];
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const mapped = await reloadEmployees();
      if (initialEmpId) {
        setSelectedEmpId(initialEmpId);
      } else if (mapped[0]) {
        setSelectedEmpId(mapped[0].id);
      }
    })();
  }, [initialEmpId, reloadEmployees]);

  // Active Selected Employee
  const employee = selectedEmpId ? employees.find((e) => e.id === selectedEmpId) || null : null;

  // Fetch real punch logs for selected employee
  useEffect(() => {
    if (!employee?.id) {
      setEmployeeAttendance([]);
      return;
    }
    let cancelled = false;
    hrAttendanceService
      .getForEmployee(employee.id)
      .then((rows) => {
        if (!cancelled && Array.isArray(rows)) {
          setEmployeeAttendance(rows as Record<string, unknown>[]);
        }
      })
      .catch(() => {
        if (!cancelled) setEmployeeAttendance([]);
      });
    return () => {
      cancelled = true;
    };
  }, [employee?.id, attendanceRefreshKey]);

  // Active Weekly Off
  const activeWeeklyOff = useMemo(() => {
    if (!employee) return "Sunday";
    const matched = weeklyOffs.filter((wo) => {
      const empId = String(wo.employeeId || wo.employee_id || "");
      return empId === employee.id;
    });
    if (matched.length > 0) {
      const latest = matched[matched.length - 1];
      return String(latest.weeklyOffDay || latest.weekly_off_day || latest.day || "Sunday");
    }
    return "Sunday";
  }, [employee, weeklyOffs]);

  // Upcoming Shift Change for active employee
  const upcomingShiftChange = useMemo(() => {
    if (!employee) return null;
    const todayIso = new Date().toISOString().split("T")[0];
    const upcoming = shiftAssignments.filter((sa) => {
      const empId = String(sa.employeeId || sa.employee_id || "");
      if (empId !== employee.id) return false;
      const from = String(sa.effectiveFrom || sa.effective_from || "").slice(0, 10);
      const status = String(sa.status || "");
      return status.toLowerCase() === "upcoming" || (from && from > todayIso);
    });
    return upcoming[0] || null;
  }, [employee, shiftAssignments]);

  useEffect(() => {
    if (activeTab === "grievances" || activeTab === "activity") {
      void reloadEmployees();
    }
  }, [activeTab, reloadEmployees]);

  // Dynamic Grievances for active employee
  const employeeGrievances = useMemo(() => {
    if (!employee) return [];
    return complaints
      .filter((c) => String(c.employeeId || c.employee_id || "") === employee.id)
      .map((c, idx) => {
        const ticketNo = String(c.ticketNo || c.ticket_no || `#TCK-${c.id || idx + 1}`);
        const subject = String(c.subject || c.title || "Grievance");
        const category = String(c.category || "General");
        const description = String(c.description || "");
        const priority = String(c.priority || "Medium");
        const rawDate = String(
          c.incidentDate ||
            c.incident_date ||
            c.submittedDate ||
            c.submitted_date ||
            c.createdAt ||
            c.created_at ||
            "",
        );
        const date = rawDate ? rawDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
        const status = String(c.status || "Open");
        const assignedOfficer = (c.assignedOfficer ?? c.assigned_officer) as string | undefined;
        const assignedRole = (c.assignedRole ?? c.assigned_role) as string | undefined;
        const investigationNotes = (c.investigationNotes ??
          c.investigation_notes ??
          []) as Array<{
          id?: string;
          author?: string;
          authorRole?: string;
          timestamp?: string;
          noteText?: string;
        }>;
        const resolutionNote = String(
          c.resolutionNotes ||
            c.resolution_notes ||
            c.proposedResolution ||
            c.proposed_resolution ||
            "",
        );
        const timeline = (c.timeline ?? []) as Array<{
          id?: string;
          action?: string;
          timestamp?: string;
          user?: string;
          role?: string;
          comment?: string;
        }>;

        return {
          id: String(c.id || idx),
          ticketNo,
          subject,
          category,
          description: description || undefined,
          date,
          priority,
          status,
          assignedOfficer,
          assignedRole,
          investigationNotes,
          resolutionNote: resolutionNote || undefined,
          timeline,
        };
      });
  }, [employee, complaints]);

  // Search results
  const searchResults = useMemo(() => {
    if (!comboboxQuery.trim()) return employees;
    const q = comboboxQuery.toLowerCase();
    return employees.filter((emp) => {
      return (
        emp.empCode.toLowerCase().includes(q) ||
        emp.name.toLowerCase().includes(q) ||
        emp.phone.includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q)
      );
    });
  }, [comboboxQuery, employees]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectEmployee = (emp: EmployeeItem) => {
    setSelectedEmpId(emp.id);
    setIsComboboxOpen(false);
    setComboboxQuery("");
    setActiveTab("overview");
    setToastMessage(`Loaded profile: ${emp.name}`);
  };

  const handleTabChange = useCallback((tab: ProfileTab) => {
    setActiveTab(tab);
    requestAnimationFrame(() => {
      tabPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  // Filtered Dynamic Activity Logs from real records
  const filteredActivities = useMemo(() => {
    if (!employee) return [];

    interface RawActivityItem {
      id: string;
      rawDate: string;
      timestamp: string;
      category: "Attendance" | "Leave" | "Payroll" | "Documents" | "Profile";
      timeframe: "Today" | "Yesterday" | "Last Week" | "Older";
      actor: string;
      description: string;
    }

    const getTimeframe = (dateStr?: string): "Today" | "Yesterday" | "Last Week" | "Older" => {
      if (!dateStr) return "Older";
      try {
        const clean = dateStr.slice(0, 10);
        const d = new Date(clean + "T00:00:00");
        if (isNaN(d.getTime())) return "Older";
        const now = new Date();
        const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.floor((todayZero.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays <= 7) return "Last Week";
        return "Older";
      } catch {
        return "Older";
      }
    };

    const formatDisplayDate = (dateStr?: string): string => {
      if (!dateStr) return "—";
      try {
        const clean = dateStr.slice(0, 10);
        const d = new Date(clean + "T00:00:00");
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      } catch {
        return dateStr;
      }
    };

    const activities: RawActivityItem[] = [];

    // 1. Profile Onboarding Activity
    if (employee.joinDate) {
      activities.push({
        id: `act-onboard-${employee.id}`,
        rawDate: employee.joinDate,
        timestamp: `Joined on ${formatDisplayDate(employee.joinDate)}`,
        category: "Profile",
        timeframe: getTimeframe(employee.joinDate),
        actor: "HR Department",
        description: `Onboarded as ${employee.designation} (${employee.employmentType}) in ${employee.department} department. Reporting to ${employee.reportingManager || "Department Head"}.`,
      });
    }

    // 2. Weekly Off Assignments
    weeklyOffs
      .filter((wo) => String(wo.employeeId || wo.employee_id || "") === employee.id)
      .forEach((wo, idx) => {
        const day = String(wo.weeklyOffDay || wo.weekly_off_day || wo.day || "Weekly Off");
        const from = String(wo.effectiveFrom || wo.effective_from || "");
        const to = String(wo.effectiveTo || wo.effective_to || "");
        const createdAt = String(wo.createdAt || wo.created_at || from || "");
        const assignedBy = String(wo.assignedBy || wo.assigned_by || "HR Administrator");
        activities.push({
          id: `act-wo-${wo.id || idx}`,
          rawDate: createdAt || from,
          timestamp: from ? `Effective ${formatDisplayDate(from)}` : "Active",
          category: "Attendance",
          timeframe: getTimeframe(createdAt || from),
          actor: assignedBy,
          description: `Assigned ${day} as regular weekly off${to ? ` (Valid till ${formatDisplayDate(to)})` : " (Ongoing)"}.`,
        });
      });

    // 3. Shift Assignments
    shiftAssignments
      .filter((sa) => String(sa.employeeId || sa.employee_id || "") === employee.id)
      .forEach((sa, idx) => {
        const shiftName = String(sa.shiftName || sa.shift_name || sa.shiftType || "Shift");
        const from = String(sa.effectiveFrom || sa.effective_from || "");
        const to = String(sa.effectiveTo || sa.effective_to || "");
        const createdAt = String(sa.createdAt || sa.created_at || from || "");
        const assignedBy = String(sa.assignedBy || sa.assigned_by || "HR Administrator");
        const isUpcoming = sa.status === "Upcoming" || (from && from > new Date().toISOString().split("T")[0]);
        activities.push({
          id: `act-sa-${sa.id || idx}`,
          rawDate: createdAt || from,
          timestamp: from ? `Effective ${formatDisplayDate(from)}` : "Roster",
          category: "Attendance",
          timeframe: getTimeframe(createdAt || from),
          actor: assignedBy,
          description: isUpcoming
            ? `Shift scheduled to change to ${shiftName} (Effective: ${formatDisplayDate(from)} to ${to ? formatDisplayDate(to) : "Ongoing"}).`
            : `Assigned to ${shiftName} (${formatDisplayDate(from)}${to ? ` to ${formatDisplayDate(to)}` : " onwards"}).`,
        });
      });

    // 4. Leave Applications
    leaveApplications
      .filter((la) => String(la.employeeId || la.employee_id || "") === employee.id)
      .forEach((la, idx) => {
        const leaveType = String(la.leaveTypeName || la.leave_type_name || la.leaveType || "Leave");
        const from = String(la.fromDate || la.from_date || "");
        const to = String(la.toDate || la.to_date || "");
        const days = la.totalDays || la.total_days || 1;
        const status = String(la.status || "Pending");
        const reason = la.reason ? ` - Reason: "${la.reason}"` : "";
        const createdAt = String(la.createdAt || la.created_at || from || "");
        const appliedBy = String(la.appliedBy || la.applied_by || employee.name);
        activities.push({
          id: `act-leave-${la.id || idx}`,
          rawDate: createdAt || from,
          timestamp: from ? `${formatDisplayDate(from)}${to && to !== from ? ` to ${formatDisplayDate(to)}` : ""}` : "Leave",
          category: "Leave",
          timeframe: getTimeframe(createdAt || from),
          actor: appliedBy,
          description: `${leaveType} application (${days} day${Number(days) > 1 ? "s" : ""}) [Status: ${status}]${reason}`,
        });
      });

    // 5. Overtime Records
    overtimeRecords
      .filter((ot) => String(ot.employeeId || ot.employee_id || "") === employee.id)
      .forEach((ot, idx) => {
        const date = String(ot.overtimeDate || ot.overtime_date || ot.date || "");
        const hours = ot.overtimeHours || ot.overtime_hours || ot.hours || 0;
        const status = String(ot.status || "Pending");
        const reason = ot.reason ? ` (${ot.reason})` : "";
        const createdAt = String(ot.createdAt || ot.created_at || date || "");
        const recordedBy = String(ot.recordedBy || ot.recorded_by || "HR Administrator");
        activities.push({
          id: `act-ot-${ot.id || idx}`,
          rawDate: createdAt || date,
          timestamp: date ? formatDisplayDate(date) : "Overtime",
          category: "Payroll",
          timeframe: getTimeframe(createdAt || date),
          actor: recordedBy,
          description: `Overtime claim: ${hours} hour(s) [Status: ${status}]${reason}`,
        });
      });

    // 6. Attendance Punch Logs
    employeeAttendance.forEach((att, idx) => {
      const date = String(att.attendanceDate || att.attendance_date || att.date || "");
      const status = String(att.attendanceStatus || att.attendance_status || att.status || "Present");
      const inTime = att.punchInTime || att.punch_in || att.punchInAt || "";
      const outTime = att.punchOutTime || att.punch_out || att.punchOutAt || "";
      const punchDetails = inTime || outTime ? ` (In: ${inTime || "—"} | Out: ${outTime || "—"})` : "";
      const createdAt = String(att.createdAt || att.created_at || date || "");
      const source = String(att.source || att.markedBy || "Attendance System");
      activities.push({
        id: `act-att-${att.id || idx}`,
        rawDate: date || createdAt,
        timestamp: date ? formatDisplayDate(date) : "Daily Log",
        category: "Attendance",
        timeframe: getTimeframe(date || createdAt),
        actor: source,
        description: `Daily attendance logged: ${status}${punchDetails}`,
      });
    });

    // 7. Complaints / Grievances
    complaints
      .filter((c) => String(c.employeeId || c.employee_id || "") === employee.id)
      .forEach((c, idx) => {
        const ticket = c.ticketNo || c.ticket_no || `#GR-${idx + 1}`;
        const title = c.subject || c.title || c.category || "Grievance Ticket";
        const status = String(c.status || "Open");
        const createdAt = String(c.createdAt || c.created_at || c.date || "");
        activities.push({
          id: `act-comp-${c.id || idx}`,
          rawDate: createdAt,
          timestamp: createdAt ? formatDisplayDate(createdAt) : "Grievance",
          category: "Profile",
          timeframe: getTimeframe(createdAt),
          actor: "HR Grievance Cell",
          description: `Grievance ticket ${ticket}: ${title} [Status: ${status}]`,
        });
      });

    // Sort descending by rawDate
    activities.sort((a, b) => {
      const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return dateB - dateA;
    });

    return activities.filter((item) => {
      const matchCat = activityCategoryFilter === "ALL" || item.category === activityCategoryFilter;
      const matchTime = activityTimeframeFilter === "ALL" || item.timeframe === activityTimeframeFilter;
      return matchCat && matchTime;
    });
  }, [
    employee,
    weeklyOffs,
    shiftAssignments,
    leaveApplications,
    overtimeRecords,
    employeeAttendance,
    complaints,
    activityCategoryFilter,
    activityTimeframeFilter,
  ]);

  // Helper for Status Badges
  const renderDocStatusBadge = (status: CategorizedDoc["status"]) => {
    switch (status) {
      case "Verified":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Verified
          </span>
        );
      case "Uploaded":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Check className="h-3 w-3 text-blue-600" />
            Uploaded
          </span>
        );
      case "Pending Review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            Pending Review
          </span>
        );
      case "Expiring Soon":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <AlertTriangle className="h-3 w-3 text-orange-600" />
            Expiring Soon
          </span>
        );
      case "Expired":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            Expired
          </span>
        );
      case "Missing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <X className="h-3 w-3 text-slate-400" />
            Missing
          </span>
        );
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Employees"
      title={employee ? "" : "Employee profile"}
      aboveTable={
        employee ? (
          <EmployeeProfileHeader
            employee={employee}
            weeklyOffText={activeWeeklyOff}
            compensationRefreshKey={compensationRefreshKey}
          />
        ) : undefined
      }
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Employees", href: "/human-resources/employees/list" },
        { label: employee?.name ?? "Profile" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <a href="/human-resources/employees/list">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold bg-white shadow-xs cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
              Back to Employee List
            </Button>
          </a>

          {/* Header Switch Employee Combobox Button */}
          {employee && (
            <div className="relative" ref={comboboxRef}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsComboboxOpen(!isComboboxOpen)}
                className="rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-xs cursor-pointer gap-1.5"
              >
                <Search className="h-3.5 w-3.5 text-emerald-600" />
                <span>Switch Employee</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </Button>

              {/* Popover Results */}
              {isComboboxOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl space-y-2 animate-in fade-in-50">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={comboboxQuery}
                      onChange={(e) => setComboboxQuery(e.target.value)}
                      placeholder="Search ID, name, mobile or email..."
                      className="h-8 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-100">
                    {searchResults.length === 0 ? (
                      <p className="p-3 text-center text-xs text-slate-400 font-medium">No matching employees found.</p>
                    ) : (
                      searchResults.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => handleSelectEmployee(emp)}
                          className={cn(
                            "flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors hover:bg-slate-100/80",
                            emp.id === employee.id && "bg-emerald-50 text-emerald-900"
                          )}
                        >
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt={emp.name} className="h-7 w-7 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                              {emp.avatar}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate text-slate-900">{emp.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{emp.empCode} • {emp.department}</p>
                          </div>
                          {emp.id === employee.id && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {employee && (
            <>
              <Button
                type="button"
                size="sm"
                onClick={() => setToastMessage(`Editing profile for ${employee.name}...`)}
                className="rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            </>
          )}
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          NO EMPLOYEE SELECTED STATE
      ───────────────────────────────────────────────────────────── */}
      {!employee ? (
        <div className="flex min-h-[440px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 text-center shadow-xs">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <Users className="h-7 w-7 text-emerald-700" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 mb-3">
            Employee search
          </span>

          <h3 className="text-base font-semibold text-slate-900">Find an employee</h3>
          <p className="mt-1 max-w-md text-sm text-slate-500 leading-relaxed mb-6">
            Search by ID, name, phone, or email to open their profile.
          </p>

          <div className="w-full max-w-lg text-left relative" ref={comboboxRef}>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Search employee
            </label>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={comboboxQuery}
                onFocus={() => setIsComboboxOpen(true)}
                onChange={(e) => {
                  setComboboxQuery(e.target.value);
                  setIsComboboxOpen(true);
                }}
                placeholder="Search by Employee ID, Name, Mobile or Email..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs font-semibold text-slate-900 shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              {comboboxQuery && (
                <button
                  onClick={() => setComboboxQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {isComboboxOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl space-y-1 max-h-72 overflow-y-auto animate-in fade-in-50">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium">
                    No matching employees found.
                  </div>
                ) : (
                  searchResults.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => handleSelectEmployee(emp)}
                      className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-slate-100/80 border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        {emp.photoUrl ? (
                          <img
                            src={emp.photoUrl}
                            alt={emp.name}
                            className="h-9 w-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs shrink-0 border border-emerald-200">
                            {emp.avatar}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{emp.name}</span>
                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                              {emp.empCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {emp.designation} • <span className="text-emerald-700">{emp.department}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            FULL ENTERPRISE EMPLOYEE PROFILE VIEW
        ───────────────────────────────────────────────────────────── */
        <>
          {/* Tabs */}
          <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs py-2 mb-4 border-b border-slate-200">
            <div
              className="flex overflow-x-auto gap-1 scrollbar-none"
              role="tablist"
              aria-label="Employee profile sections"
            >
              {PROFILE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                    activeTab === tab.id
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB PANELS CONTAINER */}
          <div ref={tabPanelRef} className="space-y-5 scroll-mt-24">
            {upcomingShiftChange && (
              <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold border border-amber-300">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] tracking-wide uppercase border border-amber-300">
                        Upcoming Shift Change
                      </span>
                      <span className="font-bold text-slate-900">
                        {String(upcomingShiftChange.shiftName || upcomingShiftChange.shift_name || "New Shift")}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      Effective from{" "}
                      <strong className="font-semibold text-slate-900">
                        {String(upcomingShiftChange.effectiveFrom || upcomingShiftChange.effective_from)}
                      </strong>{" "}
                      to{" "}
                      <strong className="font-semibold text-slate-900">
                        {String(upcomingShiftChange.effectiveTo || upcomingShiftChange.effective_to || "Until Further Notice")}
                      </strong>
                    </p>
                  </div>
                </div>
                <a
                  href="/human-resources/attendance-leave/shift-management"
                  className="inline-flex items-center gap-1 font-bold text-amber-800 hover:text-amber-950 hover:underline shrink-0 text-[11px]"
                >
                  Manage Shifts →
                </a>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 3: TAB 1 - OVERVIEW & PERSONAL (Expanded)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div
                className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] animate-in fade-in duration-200"
                role="tabpanel"
              >
                <ProfileCard title="Personal & contact" className="h-full">
                  <PersonalContactPanel employee={employee} />
                </ProfileCard>

                <div className="h-full min-h-0">
                  <EmployeeAttendanceGrid
                    employeeId={employee.id}
                    joinDate={employee.joinDate}
                    shiftType={employee.shiftType}
                    showLog={false}
                    showSummary={false}
                    compact
                    refreshKey={attendanceRefreshKey}
                    onViewFullAttendance={() => handleTabChange("attendance")}
                  />
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 4: TAB 2 - EMPLOYMENT DETAILS (Expanded)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "employment" && (
              <ProfileCard title="Employment">
                <EmploymentPanel employee={employee} />
              </ProfileCard>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 5: TAB 3 - ATTENDANCE & SHIFTS (Summary Cards + Shift Roster + 7-Day Table)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "attendance" && (
              <EmployeeAttendanceGrid
                employeeId={employee.id}
                joinDate={employee.joinDate}
                shiftType={employee.shiftType}
                sideCalendar
                refreshKey={attendanceRefreshKey}
                leadingContent={
                  <ProfileCard title="Current shift">
                    <CurrentShiftPanel shiftType={employee.shiftType} />
                  </ProfileCard>
                }
              />
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 6: TAB 4 - LEAVE MANAGEMENT (Categorized Balances & 2026 History Log)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "leave" && (
              <EmployeeLeaveTab
                employee={employee}
                onLeaveChanged={() => {
                  setAttendanceRefreshKey((k) => k + 1);
                  void reloadEmployees();
                }}
                onToast={setToastMessage}
              />
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 7: TAB 5 - PAYROLL (Bank, UAN, PF, ESIC)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "payroll" && (
              <EmployeePayrollTab employee={employee} onToast={notifyPayrollToast} />
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 8: TAB 6 - CATEGORIZED DOCUMENTS ⭐⭐⭐
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "documents" && (
              <div className="space-y-4 animate-in fade-in duration-200" role="tabpanel">
                <ProfileCard
                  title="Document vault"
                  action={
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setToastMessage("Opening document upload dialog...")}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold h-8"
                    >
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                      Upload
                    </Button>
                  }
                >
                  <p className="text-xs text-slate-500 -mt-1">
                    Compliance, credentials, and employment agreements for {employee.name}.
                  </p>
                </ProfileCard>

                {DOCUMENT_CATEGORIES.map((category) => (
                  <DocumentCategoryPanel
                    key={category}
                    title={DOCUMENT_CATEGORY_LABELS[category]}
                    documents={CATEGORIZED_DOCUMENTS.filter((d) => d.category === category).map(
                      (doc) => ({
                        id: doc.id,
                        name: doc.name,
                        status: renderDocStatusBadge(doc.status),
                        uploadDate: doc.uploadDate,
                        fileSize: doc.fileSize,
                        onView: () => setToastMessage(`Opening preview for ${doc.name}...`),
                        onDownload: () => setToastMessage(`Downloading ${doc.name}...`),
                      }),
                    )}
                  />
                ))}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 9 & 11: TAB 7 - GRIEVANCES (Status Badges + Empty State)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "grievances" && (
              <div role="tabpanel">
                <ProfileCard title="Grievances" className="animate-in fade-in duration-200">
                  <GrievancesPanel
                    grievances={employeeGrievances}
                    employeeName={employee.name}
                  />
                </ProfileCard>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 10: TAB 8 - ACTIVITY LOG (With Filters)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "activity" && (
              <div role="tabpanel">
                <ProfileCard
                  title="Activity log"
                  className="animate-in fade-in duration-200"
                  action={
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Filter className="h-3 w-3 text-slate-400" />
                      <select
                        value={activityCategoryFilter}
                        onChange={(e) => setActivityCategoryFilter(e.target.value)}
                        className="text-xs rounded-lg border border-slate-200 py-1 px-2 bg-white font-medium text-slate-700"
                      >
                        <option value="ALL">All categories</option>
                        <option value="Attendance">Attendance</option>
                        <option value="Leave">Leave</option>
                        <option value="Payroll">Payroll</option>
                        <option value="Documents">Documents</option>
                        <option value="Profile">Profile</option>
                      </select>
                    </div>
                    <select
                      value={activityTimeframeFilter}
                      onChange={(e) => setActivityTimeframeFilter(e.target.value)}
                      className="text-xs rounded-lg border border-slate-200 py-1 px-2 bg-white font-medium text-slate-700"
                    >
                      <option value="ALL">All time</option>
                      <option value="Today">Today</option>
                      <option value="Yesterday">Yesterday</option>
                      <option value="Last Week">Last week</option>
                    </select>
                  </div>
                }
              >
                <ActivityLogPanel items={filteredActivities} />
              </ProfileCard>
            </div>
          )}
          </div>
        </>
      )}
    </ModulePageShell>
  );
}
