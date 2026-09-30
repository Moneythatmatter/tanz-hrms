"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import React, { useState } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  Heart,
  IdCard,
  Mail,
  MapPin,
  FileText,
  Gift,
  History,
  Landmark,
  MessageSquareWarning,
  Phone,
  Shield,
  TrendingUp,
  User,
  Users,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmployeeAttendanceMonthSummary } from "@/lib/hr/employee-attendance";

export interface PersonalContactEmployee {
  name: string;
  gender: string;
  dob?: string;
  bloodGroup?: string;
  employmentType: string;
  shiftType: string;
  phone: string;
  email: string;
  emergencyContact: string;
  address?: string;
}

export function ProfileField({
  label,
  value,
  className,
  copyText,
  href,
  icon: Icon,
  compact = false,
  dense = false,
  wrapValue = false,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  copyText?: string;
  href?: string;
  icon?: LucideIcon;
  compact?: boolean;
  dense?: boolean;
  wrapValue?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div
      className={cn(
        dense ? "py-1" : compact ? "py-1.5" : "py-2",
        "group min-w-0",
        className,
      )}
    >
      <dt
        className={cn(
          "flex items-center gap-1.5 text-slate-500 font-medium",
          dense ? "text-[10px] leading-none" : compact ? "text-[11px]" : "text-xs",
        )}
      >
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden /> : null}
        {label}
      </dt>
      <dd
        className={cn(
          "font-semibold text-slate-900 flex items-center gap-1.5 min-w-0",
          Icon ? "mt-1 pl-5" : "mt-0.5",
          dense ? "text-xs" : "text-sm",
        )}
      >
        {href ? (
          <a href={href} className="text-emerald-700 hover:underline truncate">
            {value}
          </a>
        ) : (
          <span className={cn(wrapValue ? "leading-snug" : "truncate")}>{value}</span>
        )}
        {copyText ? (
          <button
            type="button"
            onClick={() => void handleCopy()}
            className={cn(
              "shrink-0 rounded p-0.5 text-slate-400 transition-opacity hover:bg-slate-100 hover:text-slate-600",
              "opacity-60 group-hover:opacity-100 focus:opacity-100",
            )}
            aria-label={`Copy ${label}`}
            title="Copy"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        ) : null}
      </dd>
    </div>
  );
}

const PROFILE_ICON_TONES = {
  slate: "bg-slate-100 text-slate-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  blue: "bg-blue-50 text-blue-600",
} as const;

export function ProfileIconField({
  icon: Icon,
  label,
  value,
  className,
  copyText,
  href,
  wrapValue = false,
  tone = "slate",
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  className?: string;
  copyText?: string;
  href?: string;
  wrapValue?: boolean;
  tone?: keyof typeof PROFILE_ICON_TONES;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={cn("group flex items-start gap-3 min-w-0", className)}>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          PROFILE_ICON_TONES[tone],
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <dt className="text-xs font-medium text-slate-500">{label}</dt>
        <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-slate-900 min-w-0">
          {href ? (
            <a href={href} className="text-emerald-700 hover:underline truncate">
              {value}
            </a>
          ) : (
            <span className={cn(wrapValue ? "leading-snug" : "truncate")}>{value}</span>
          )}
          {copyText ? (
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="shrink-0 rounded p-0.5 text-slate-400 opacity-60 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 focus:opacity-100"
              aria-label={`Copy ${label}`}
              title="Copy"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          ) : null}
        </dd>
      </div>
    </div>
  );
}

function ProfileFieldGroup({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </h4>
      {children}
    </div>
  );
}

export function PersonalContactPanel({ employee }: { employee: PersonalContactEmployee }) {
  return (
    <div className="space-y-5">
      <ProfileFieldGroup title="Personal">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
          <ProfileIconField icon={User} tone="slate" label="Full name" value={employee.name} />
          <ProfileIconField icon={Users} tone="violet" label="Gender" value={employee.gender} />
          <ProfileIconField
            icon={Calendar}
            tone="slate"
            label="Date of birth"
            value={employee.dob || "14/05/1990"}
          />
          <ProfileIconField
            icon={Heart}
            tone="rose"
            label="Blood group"
            value={employee.bloodGroup || "O+"}
          />
          <ProfileIconField
            icon={Briefcase}
            tone="emerald"
            label="Employment type"
            value={employee.employmentType}
          />
          <ProfileIconField icon={Clock} tone="amber" label="Shift" value={employee.shiftType} />
        </dl>
      </ProfileFieldGroup>

      <ProfileFieldGroup title="Contact">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
          <ProfileIconField
            icon={Phone}
            tone="emerald"
            label="Phone"
            value={employee.phone}
            href={`tel:${employee.phone.replace(/\s/g, "")}`}
            copyText={employee.phone}
          />
          <ProfileIconField
            icon={Mail}
            tone="emerald"
            label="Email"
            value={employee.email}
            href={`mailto:${employee.email}`}
            copyText={employee.email}
          />
          <ProfileIconField
            icon={MessageSquareWarning}
            tone="amber"
            label="Emergency contact"
            value={employee.emergencyContact}
            copyText={employee.emergencyContact}
          />
        </dl>
      </ProfileFieldGroup>

      <div className="border-t border-slate-100 pt-4">
        <ProfileIconField
          icon={MapPin}
          tone="emerald"
          label="Address"
          wrapValue
          value={
            employee.address ||
            "Suite 402, Park View Residency, MG Road, Mumbai - 400001"
          }
        />
      </div>
    </div>
  );
}

export interface EmploymentPanelEmployee {
  empCode: string;
  department: string;
  designation: string;
  reportingManager?: string;
  employmentType: string;
  shiftType: string;
  joinDate: string;
  status: string;
  workLocation?: string;
}

export function CurrentShiftPanel({
  shiftType,
  timing = "07:00 AM – 03:30 PM",
  assignedSince = "01 Jan 2026",
  weeklyOff = "Sunday",
}: {
  shiftType: string;
  timing?: string;
  assignedSince?: string;
  weeklyOff?: string;
}) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
      <ProfileIconField icon={Clock} tone="amber" label="Shift" value={shiftType} />
      <ProfileIconField icon={Calendar} tone="slate" label="Timing" value={timing} />
      <ProfileIconField icon={CheckCircle2} tone="emerald" label="Assigned since" value={assignedSince} />
      <ProfileIconField icon={Briefcase} tone="violet" label="Weekly off" value={weeklyOff} />
    </dl>
  );
}

export function AttendanceMonthSummaryPanel({
  summary,
}: {
  summary: EmployeeAttendanceMonthSummary;
}) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
      <ProfileIconField icon={CheckCircle2} tone="emerald" label="Present" value={`${summary.present} days`} />
      <ProfileIconField icon={XCircle} tone="rose" label="Absent" value={`${summary.absent} days`} />
      <ProfileIconField icon={Clock} tone="amber" label="Late" value={`${summary.late} days`} />
      <ProfileIconField icon={Calendar} tone="violet" label="Half day" value={`${summary.halfDay} days`} />
      <ProfileIconField icon={Heart} tone="indigo" label="On leave" value={`${summary.onLeave} days`} />
      <ProfileIconField icon={Clock} tone="amber" label="Pending" value={`${summary.pending} days`} />
      <ProfileIconField icon={Calendar} tone="violet" label="Holiday" value={`${summary.holiday} days`} />
      <ProfileIconField icon={TrendingUp} tone="blue" label="Overtime" value={`${summary.overtimeHours} hrs`} />
      <ProfileIconField icon={Briefcase} tone="emerald" label="Working days" value={`${summary.workingDays} days`} />
      <ProfileIconField icon={Building2} tone="slate" label="Weekly off" value={`${summary.weeklyOff} days`} />
    </dl>
  );
}

export function EmploymentPanel({
  employee,
  workLocation = "Grand Hotel & Suites - Main Branch",
}: {
  employee: EmploymentPanelEmployee;
  workLocation?: string;
}) {
  const isActive = employee.status === "Active";
  const location = employee.workLocation ?? workLocation;

  return (
    <div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
        <ProfileIconField icon={IdCard} tone="indigo" label="Employee code" value={employee.empCode} />
        <ProfileIconField icon={Building2} tone="slate" label="Department" value={employee.department} />
        <ProfileIconField icon={Briefcase} tone="emerald" label="Designation" value={employee.designation} />
        <ProfileIconField
          icon={User}
          tone="slate"
          label="Reporting manager"
          value={employee.reportingManager || "—"}
        />
        <ProfileIconField icon={Briefcase} tone="emerald" label="Employment type" value={employee.employmentType} />
        <ProfileIconField icon={Clock} tone="amber" label="Shift" value={employee.shiftType} />
        <ProfileIconField icon={Calendar} tone="slate" label="Join date" value={employee.joinDate} />
        <ProfileIconField
          icon={CheckCircle2}
          tone={isActive ? "emerald" : "amber"}
          label="Status"
          value={employee.status}
        />
      </dl>

      <div className="border-t border-slate-100 pt-4 mt-4">
        <ProfileIconField icon={MapPin} tone="violet" label="Work location" wrapValue value={location} />
      </div>
    </div>
  );
}

export function ProfileSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <h4 className="text-sm font-semibold text-slate-800 pt-2">{title}</h4>
      {children}
    </div>
  );
}

export function ProfileCard({
  title,
  children,
  className,
  action,
  dense = false,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  dense?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-xs",
        dense ? "p-3 sm:p-4" : "p-4 sm:p-5",
        className,
      )}
    >
      {title ? (
        <div className={cn("flex items-center justify-between gap-2", dense ? "mb-2" : "mb-3")}>
          <h3
            className={cn(
              "font-semibold text-slate-900",
              dense ? "text-xs uppercase tracking-wide text-slate-500" : "text-sm",
            )}
          >
            {title}
          </h3>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function ProfileStatusBadge({
  label,
  tone = "emerald",
}: {
  label: string;
  tone?: "emerald" | "amber" | "rose" | "violet" | "slate" | "blue" | "indigo";
}) {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    rose: "bg-rose-100 text-rose-800 border-rose-200",
    violet: "bg-violet-100 text-violet-800 border-violet-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border", tones[tone])}>
      {label}
    </span>
  );
}

export interface LeaveBalanceItem {
  label: string;
  remaining: number;
  allocated: number;
  used: number;
  icon: LucideIcon;
  tone: keyof typeof PROFILE_ICON_TONES;
}

export function LeaveBalancePanel({ balances }: { balances: LeaveBalanceItem[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
      {balances.map((item) => (
        <ProfileIconField
          key={item.label}
          icon={item.icon}
          tone={item.tone}
          label={item.label}
          value={`${item.remaining} days left`}
        />
      ))}
    </dl>
  );
}

export interface LeaveHistoryRow {
  id?: string;
  type: string;
  dates: string;
  days: string;
  reason: string;
  status: "Approved" | "Pending" | "Rejected" | "Cancelled";
  approvedBy: string;
  fromDateIso?: string;
  toDateIso?: string;
  effectiveDays?: number;
}

export function LeaveHistoryPanel({
  rows,
  renderActions,
}: {
  rows: LeaveHistoryRow[];
  renderActions?: (row: LeaveHistoryRow) => React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
          <tr>
            <th className="py-2.5 px-3">Leave type</th>
            <th className="py-2.5 px-3">Date range</th>
            <th className="py-2.5 px-3">Days</th>
            <th className="py-2.5 px-3">Reason</th>
            <th className="py-2.5 px-3">Status</th>
            <th className="py-2.5 px-3">Approved by</th>
            {renderActions ? <th className="py-2.5 px-3">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={row.id ?? `${row.type}-${index}`} className="hover:bg-slate-50 transition-colors">
              <td className="py-2.5 px-3 font-semibold text-slate-800">{row.type}</td>
              <td className="py-2.5 px-3 text-slate-700">{row.dates}</td>
              <td className="py-2.5 px-3 text-slate-900 font-medium">{row.days}</td>
              <td className="py-2.5 px-3 text-slate-600">{row.reason}</td>
              <td className="py-2.5 px-3">
                <ProfileStatusBadge
                  label={row.status}
                  tone={
                    row.status === "Approved"
                      ? "emerald"
                      : row.status === "Pending"
                        ? "amber"
                        : row.status === "Cancelled"
                          ? "slate"
                          : "rose"
                  }
                />
              </td>
              <td className="py-2.5 px-3 text-slate-500">{row.approvedBy}</td>
              {renderActions ? (
                <td className="py-2.5 px-3">{renderActions(row)}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface PayrollPanelEmployee {
  salaryStructureName?: string;
  structureGrossSalary?: number;
  structureNetSalary?: number;
  bankName?: string;
  bankAccount?: string;
  ifscCode?: string;
  panNumber?: string;
  uanNumber?: string;
  esicNumber?: string;
}

export function PayrollSalaryPanel({ employee }: { employee: PayrollPanelEmployee }) {
  const gross = employee.structureGrossSalary ?? 0;
  const net = employee.structureNetSalary ?? 0;

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
      <ProfileIconField
        icon={Wallet}
        tone="emerald"
        label="Salary structure"
        value={employee.salaryStructureName || "Not assigned"}
      />
      <ProfileIconField icon={Briefcase} tone="slate" label="Monthly gross" value={formatMoney(gross)} />
      <ProfileIconField icon={Building2} tone="violet" label="Monthly net" value={formatMoney(net)} />
      <ProfileIconField
        icon={Gift}
        tone="indigo"
        label="Deductions"
        value={formatMoney(Math.max(0, gross - net))}
      />
    </dl>
  );
}

export function PayrollBankPanel({ employee }: { employee: PayrollPanelEmployee }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
      <ProfileIconField
        icon={Landmark}
        tone="slate"
        label="Bank name"
        value={employee.bankName || "HDFC Bank Ltd"}
      />
      <ProfileIconField
        icon={IdCard}
        tone="indigo"
        label="Account number"
        value={
          employee.bankAccount ? `•••• ${employee.bankAccount.slice(-4)}` : "•••• 4821"
        }
      />
      <ProfileIconField
        icon={Building2}
        tone="emerald"
        label="IFSC code"
        value={employee.ifscCode || "HDFC0001234"}
      />
    </dl>
  );
}

export function PayrollStatutoryPanel({ employee }: { employee: PayrollPanelEmployee }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
      <ProfileIconField
        icon={IdCard}
        tone="violet"
        label="PAN number"
        value={employee.panNumber || "ABCDE1234F"}
      />
      <ProfileIconField
        icon={Shield}
        tone="emerald"
        label="UAN (PF)"
        value={employee.uanNumber || "101293847501"}
      />
      <ProfileIconField
        icon={Shield}
        tone="blue"
        label="ESIC registration"
        value={employee.esicNumber || "31000482910001"}
      />
    </dl>
  );
}

export function PayrollPanel({ employee }: { employee: PayrollPanelEmployee }) {
  return (
    <div className="space-y-5">
      <PayrollSalaryPanel employee={employee} />
      <div className="border-t border-slate-100 pt-4">
        <PayrollBankPanel employee={employee} />
      </div>
      <div className="border-t border-slate-100 pt-4">
        <PayrollStatutoryPanel employee={employee} />
      </div>
    </div>
  );
}

export interface ProfileDocumentItem {
  id: string;
  name: string;
  status: React.ReactNode;
  uploadDate?: string;
  fileSize?: string;
  onView?: () => void;
  onDownload?: () => void;
}

export function DocumentCategoryPanel({
  title,
  documents,
}: {
  title: string;
  documents: ProfileDocumentItem[];
}) {
  if (documents.length === 0) return null;

  return (
    <ProfileCard title={`${title} (${documents.length})`} dense>
      <ul className="divide-y divide-slate-100">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <FileText className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{doc.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {doc.uploadDate || "Pending"}
                  {doc.fileSize ? ` · ${doc.fileSize}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {doc.status}
              {doc.onView ? (
                <button
                  type="button"
                  onClick={doc.onView}
                  className="rounded-md p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                  title="View document"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              ) : null}
              {doc.onDownload ? (
                <button
                  type="button"
                  onClick={doc.onDownload}
                  className="rounded-md p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </ProfileCard>
  );
}

export interface GrievanceItem {
  id: string;
  ticketNo: string;
  subject: string;
  category: string;
  description?: string;
  date: string;
  priority?: string;
  status: string;
  assignedOfficer?: string;
  assignedRole?: string;
  investigationNotes?: Array<{
    id?: string;
    author?: string;
    authorRole?: string;
    timestamp?: string;
    noteText?: string;
  }>;
  resolutionNote?: string;
  timeline?: Array<{
    id?: string;
    action?: string;
    timestamp?: string;
    user?: string;
    role?: string;
    comment?: string;
  }>;
}

const GRIEVANCE_STATUS_TONE: Record<
  string,
  "emerald" | "amber" | "rose" | "violet" | "slate" | "blue" | "indigo"
> = {
  Open: "amber",
  "In Review": "indigo",
  Assigned: "blue",
  "Under Investigation": "violet",
  "Action Taken": "indigo",
  "Pending Level 1 Review": "indigo",
  "Pending Level 2 Review": "indigo",
  "Pending Final Approval": "violet",
  "Resolution Proposed": "emerald",
  Resolved: "emerald",
  Escalated: "rose",
  Closed: "slate",
};

export function GrievancesPanel({
  grievances,
  employeeName,
}: {
  grievances: GrievanceItem[];
  employeeName: string;
}) {
  if (grievances.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
        <MessageSquareWarning className="mx-auto h-8 w-8 text-emerald-500" aria-hidden />
        <p className="mt-2 text-sm font-medium text-slate-700">No grievances on record</p>
        <p className="mt-0.5 text-xs text-slate-400">
          {employeeName} has no open or past complaint tickets.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {grievances.map((ticket) => {
        const isResolvedOrClosed =
          ticket.status === "Resolved" || ticket.status === "Closed";

        return (
          <li
            key={ticket.id}
            className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3"
          >
            {/* Top Bar: Ticket No, Category, Date, Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {ticket.ticketNo}
                </span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {ticket.category}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{ticket.date}</span>
                {ticket.priority && (
                  <>
                    <span className="text-slate-400">·</span>
                    <span
                      className={cn(
                        "font-semibold px-2 py-0.5 rounded-md text-[10px]",
                        ticket.priority === "Critical"
                          ? "bg-rose-100 text-rose-800"
                          : ticket.priority === "High"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700",
                      )}
                    >
                      {ticket.priority} Priority
                    </span>
                  </>
                )}
              </div>
              <ProfileStatusBadge
                label={ticket.status}
                tone={GRIEVANCE_STATUS_TONE[ticket.status] || "amber"}
              />
            </div>

            {/* Subject & Description */}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">{ticket.subject}</h4>
              {ticket.description && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ticket.description}
                </p>
              )}
            </div>

            {/* Officer Assignment details */}
            {ticket.assignedOfficer && (
              <div className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500 font-medium">Assigned Officer:</span>
                <span className="font-semibold text-slate-800">
                  {ticket.assignedOfficer}{" "}
                  {ticket.assignedRole ? `(${ticket.assignedRole})` : ""}
                </span>
              </div>
            )}

            {/* Officer Investigation Notes */}
            {ticket.investigationNotes && ticket.investigationNotes.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Officer Investigation Notes ({ticket.investigationNotes.length})
                </span>
                <div className="space-y-1.5">
                  {ticket.investigationNotes.map((note, nIdx) => (
                    <div
                      key={note.id || nIdx}
                      className="rounded-lg bg-blue-50/70 border border-blue-100 p-2.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-blue-900/80 font-medium">
                        <span>
                          {note.author || "Officer"}{" "}
                          {note.authorRole ? `(${note.authorRole})` : ""}
                        </span>
                        <span>{note.timestamp}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-medium">
                        "{note.noteText}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Box */}
            {ticket.resolutionNote && (
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Redressal &amp; Resolution Note</span>
                </div>
                <p className="text-emerald-950 leading-relaxed pl-5 font-medium">
                  {ticket.resolutionNote}
                </p>
              </div>
            )}

            {/* Closed without custom note */}
            {!ticket.resolutionNote && isResolvedOrClosed && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>This grievance has been officially resolved and closed by HR.</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  category: string;
  actor: string;
  description: string;
}

const ACTIVITY_CATEGORY_ICON: Record<string, LucideIcon> = {
  Attendance: Clock,
  Leave: Calendar,
  Payroll: Wallet,
  Documents: FileText,
  Profile: User,
};

export function ActivityLogPanel({ items }: { items: ActivityLogItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
        <History className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
        <p className="mt-2 text-sm font-medium text-slate-600">No activity found</p>
        <p className="mt-0.5 text-xs text-slate-400">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((act) => {
        const Icon = ACTIVITY_CATEGORY_ICON[act.category] ?? History;
        return (
          <li
            key={act.id}
            className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-100 text-emerald-600">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{act.description}</p>
                <span className="text-[11px] text-slate-400 shrink-0">{act.timestamp}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                <span className="inline-flex items-center rounded-md bg-slate-200/80 px-1.5 py-0.5 font-medium text-slate-700 mr-2">
                  {act.category}
                </span>
                By {act.actor}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ProfileQuickLinks({
  links,
  placement = "bottom",
}: {
  links: Array<{ label: string; onClick: () => void }>;
  placement?: "top" | "bottom";
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        placement === "top"
          ? "pb-4 mb-4 border-b border-slate-100"
          : "pt-4 mt-4 border-t border-slate-100",
      )}
    >
      {links.map((link) => (
        <button
          key={link.label}
          type="button"
          onClick={link.onClick}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white hover:border-slate-300 transition-colors cursor-pointer"
        >
          {link.label} →
        </button>
      ))}
    </div>
  );
}
