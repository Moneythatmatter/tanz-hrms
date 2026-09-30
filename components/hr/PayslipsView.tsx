"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import React, { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Search,
  Users,
  DollarSign,
  CheckCircle2,
  Send,
  Download,
  Eye,
  Mail,
  Printer,
  SlidersHorizontal,
  X,
  Building2,
  Calendar,
  CreditCard,
  Building,
  Award,
  Sparkles,
  FileCheck,
  Check,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";
import { hrPayslipService, hrEmployeeService } from "@/services/human-resources";
import { mapPayslipFromApi, mapEmployeeFromApi } from "@/lib/hr/api-mappers";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";

export type PayslipStatus = "Generated" | "Sent" | "Pending";

export interface PayslipRecord {
  id: string;
  payslipNo: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  month: string;
  payPeriod: string;
  generatedDate: string;
  paymentMode: string;
  bankName: string;
  bankAccountNo: string;
  panNo: string;
  pfNo: string;
  workedDays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  overtimePay: number;
  holidayPay: number;
  grossSalary: number;
  pfDeduction: number;
  esiDeduction: number;
  ptDeduction: number;
  taxDeduction: number;
  leaveDeduction: number;
  totalDeductions: number;
  netSalary: number;
  status: PayslipStatus;
  sentDate?: string;
}

export function PayslipsView() {
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const loadPayslips = async () => {
    try {
      const [rows, empRows] = await Promise.all([hrPayslipService.list(), hrEmployeeService.list()]);
      const lookup = new Map(empRows.map(mapEmployeeFromApi).map((e) => [e.id, e]));
      setPayslips(rows.map((row) => mapPayslipFromApi(row, lookup.get(String(row.employeeId)))));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load payslips");
      setPayslips([]);
    }
  };

  useEffect(() => { void loadPayslips(); }, []);



  // Filters State
  const [selectedMonth, setSelectedMonth] = useState("August 2026");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal State for Viewing / Printing Payslip
  const [viewingPayslip, setViewingPayslip] = useState<PayslipRecord | null>(null);

  // Filtered Records
  const filteredPayslips = useMemo(() => {
    return payslips.filter((p) => {
      const matchSearch =
        p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.payslipNo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchMonth = selectedMonth === "ALL" || p.month === selectedMonth;
      const matchDept = selectedDept === "ALL" || p.department === selectedDept;
      const matchStatus = selectedStatus === "ALL" || p.status === selectedStatus;

      return matchSearch && matchMonth && matchDept && matchStatus;
    });
  }, [payslips, searchTerm, selectedMonth, selectedDept, selectedStatus]);

  // Dashboard KPI Metrics
  const metrics = useMemo(() => {
    const generated = payslips.filter((p) => p.status === "Generated" || p.status === "Sent").length;
    const sent = payslips.filter((p) => p.status === "Sent").length;
    const pending = payslips.filter((p) => p.status === "Generated").length;
    const totalPayrollAmount = payslips.reduce((sum, p) => sum + p.netSalary, 0);

    return { generated, sent, pending, totalPayrollAmount };
  }, [payslips]);

  // Handlers
  const handleEmailPayslip = async (p: PayslipRecord) => {
    try {
      await hrPayslipService.send(p.id, "Neha Mehta (HR Manager)");
      await loadPayslips();
      setToastMessage(`Payslip sent to ${p.employeeName}.`);
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to send payslip");
    }
  };

  const handleDownloadPDF = (p: PayslipRecord) => {
    setToastMessage(`Downloading official PDF payslip for ${p.employeeName} (${p.payslipNo})...`);
  };

  const handleBulkEmailAll = async () => {
    try {
      const result = await hrPayslipService.sendBatch({ sentBy: "Neha Mehta (HR Manager)" });
      await loadPayslips();
      setToastMessage(`Sent ${Number(result.sentCount ?? 0)} payslip(s) to employees.`);
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to send payslips");
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Payroll"
      title="Payslips"
      description="View, download, print, and disburse official monthly salary slips to hotel staff members."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Payroll" },
        { label: "Payslips" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleBulkEmailAll}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            Email All Payslips
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Downloading zip archive of all monthly payslips...")}
            className="rounded-xl text-xs font-semibold bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Download All (ZIP)
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: 4 DASHBOARD SUMMARY CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Payslips Generated"
          value={`${metrics.generated}`}
          subtitle="Ready for Disbursement"
          tone="blue"
          icon={<FileText className="h-5 w-5" />}
        />
        <HRKPICard
          label="Payslips Sent"
          value={`${metrics.sent}`}
          subtitle="Emailed to Employees"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Pending Payslips"
          value={`${metrics.pending}`}
          subtitle="Awaiting Final Sign-off"
          tone="amber"
          icon={<FileCheck className="h-5 w-5" />}
        />
        <HRKPICard
          label="Total Payroll Amount"
          value={formatMoneyCompactTotal(metrics.totalPayrollAmount)}
          subtitle="Net Salary Disbursed"
          tone="purple"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Employee or Payslip No..."
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

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-extrabold text-slate-800"
              >
                <option value="ALL">All Months</option>
                <option value="August 2026">August 2026</option>
                <option value="July 2026">July 2026</option>
                <option value="June 2026">June 2026</option>
              </select>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Generated">🔵 Generated</option>
                <option value="Sent">🟢 Sent</option>
                <option value="Pending">🟡 Pending</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedMonth("August 2026");
                  setSelectedDept("ALL");
                  setSelectedStatus("ALL");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="sm:hidden px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: PAYSLIPS MAIN DATA TABLE (DESKTOP & MOBILE)
      ───────────────────────────────────────────────────────────── */}
      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Payslip No / Month</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Net Salary</th>
                <th className="py-3.5 px-4">Generated Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayslips.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/80 transition cursor-pointer"
                  onClick={() => setViewingPayslip(p)}
                >
                  <td className="py-3.5 px-4">
                    <HREmployeeCell
                      name={p.employeeName}
                      id={p.employeeId}
                      avatar={p.avatar}
                      photoUrl={p.photoUrl}
                    />
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{p.month}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.payslipNo}</p>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    <p>{p.department}</p>
                    <p className="text-[10px] text-slate-400">{p.designation}</p>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-black text-emerald-800 text-sm">
                      {formatMoney(p.netSalary)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 font-medium font-mono">
                    {p.generatedDate}
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={p.status} />
                  </td>

                  <td
                    className="py-3.5 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingPayslip(p)}
                        className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(p)}
                        className="rounded-xl text-xs font-semibold text-blue-800 border-blue-300 hover:bg-blue-50"
                      >
                        <Download className="h-3.5 w-3.5 mr-1 text-blue-600" /> PDF
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEmailPayslip(p)}
                        className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                      >
                        <Mail className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Email
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredPayslips.map((p) => (
          <div
            key={p.id}
            onClick={() => setViewingPayslip(p)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <HREmployeeCell name={p.employeeName} id={p.employeeId} avatar={p.avatar} photoUrl={p.photoUrl} />
              <StatusBadge status={p.status} />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Month &amp; Ref:</span>
                <span className="font-bold text-slate-900">{p.month} ({p.payslipNo})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Gross Salary:</span>
                <span className="font-bold text-slate-800">{formatMoney(p.grossSalary)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="text-slate-500 font-medium">Net Take-Home:</span>
                <span className="font-black text-emerald-800 text-sm">{formatMoney(p.netSalary)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingPayslip(p);
                }}
                className="w-full text-xs font-bold"
              >
                View
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadPDF(p);
                }}
                className="w-full text-xs font-bold text-blue-800 border-blue-200"
              >
                PDF
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEmailPayslip(p);
                }}
                className="w-full bg-emerald-700 text-white text-xs font-bold"
              >
                Email
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: OFFICIAL PAYSLIP VIEW & PRINT TEMPLATE
      ───────────────────────────────────────────────────────────── */}
      {viewingPayslip && (
        <Modal
          isOpen={Boolean(viewingPayslip)}
          onClose={() => setViewingPayslip(null)}
          title={`Official Salary Slip: ${viewingPayslip.employeeName}`}
          description={`Statement for ${viewingPayslip.month} (${viewingPayslip.payslipNo})`}
          size="xl"
        >
          <div className="space-y-4 text-xs">
            {/* Printable Payslip Document Card */}
            <div className="p-6 rounded-2xl border border-slate-300 bg-white space-y-4 shadow-sm">
              {/* Hotel Header & Logo */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">GRAND PALACE HOTEL &amp; RESORT</h2>
                  <p className="text-slate-500 text-[11px]">101 Beachfront Boulevard, Goa, India</p>
                  <p className="text-slate-500 text-[11px]">Email: hr@grandpalacehotel.com | Tax ID: GSTIN29ABCDE1234F</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-900 text-amber-400 font-extrabold rounded-lg text-xs block">
                    PAYSLIP STATEMENT
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block pt-1">{viewingPayslip.payslipNo}</span>
                </div>
              </div>

              {/* Employee & Bank Info Grid */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <p><strong className="text-slate-900">Employee Name:</strong> {viewingPayslip.employeeName}</p>
                  <p><strong className="text-slate-900">Employee ID:</strong> {viewingPayslip.employeeId}</p>
                  <p><strong className="text-slate-900">Department:</strong> {viewingPayslip.department}</p>
                  <p><strong className="text-slate-900">Designation:</strong> {viewingPayslip.designation}</p>
                  <p><strong className="text-slate-900">Pay Period:</strong> {viewingPayslip.payPeriod}</p>
                </div>

                <div className="space-y-1">
                  <p><strong className="text-slate-900">Bank Name:</strong> {viewingPayslip.bankName}</p>
                  <p><strong className="text-slate-900">Account No:</strong> {viewingPayslip.bankAccountNo}</p>
                  <p><strong className="text-slate-900">PAN Number:</strong> {viewingPayslip.panNo}</p>
                  <p><strong className="text-slate-900">PF Number:</strong> {viewingPayslip.pfNo}</p>
                  <p><strong className="text-slate-900">Worked / Paid Days:</strong> {viewingPayslip.workedDays} Days ({viewingPayslip.paidLeaves} Leaves)</p>
                </div>
              </div>

              {/* Earnings & Deductions Comparison Table */}
              <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-xl overflow-hidden">
                {/* Earnings Side */}
                <div className="border-r border-slate-200">
                  <div className="bg-emerald-100/70 p-2 font-extrabold text-emerald-950 uppercase border-b border-slate-200">
                    Earnings
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex justify-between"><span className="text-slate-600">Basic Salary</span><span className="font-bold">{formatMoney(viewingPayslip.basicSalary)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">HRA</span><span className="font-bold">{formatMoney(viewingPayslip.hra)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Allowances</span><span className="font-bold">{formatMoney(viewingPayslip.allowances)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Overtime Pay (OT)</span><span className="font-bold text-emerald-800">+{formatMoney(viewingPayslip.overtimePay)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Holiday Pay</span><span className="font-bold text-emerald-800">+{formatMoney(viewingPayslip.holidayPay)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-slate-900 text-xs">
                      <span>Total Earnings</span>
                      <span>{formatMoney(viewingPayslip.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Side */}
                <div>
                  <div className="bg-rose-100/70 p-2 font-extrabold text-rose-950 uppercase border-b border-slate-200">
                    Deductions
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex justify-between"><span className="text-slate-600">Provident Fund (PF)</span><span className="font-bold text-rose-700">{formatMoney(viewingPayslip.pfDeduction)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">ESI Insurance</span><span className="font-bold text-rose-700">{formatMoney(viewingPayslip.esiDeduction)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Professional Tax (PT)</span><span className="font-bold text-rose-700">{formatMoney(viewingPayslip.ptDeduction)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">TDS / Income Tax</span><span className="font-bold text-rose-700">{formatMoney(viewingPayslip.taxDeduction)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Leave Penalty</span><span className="font-bold text-rose-700">{formatMoney(viewingPayslip.leaveDeduction)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-rose-950 text-xs">
                      <span>Total Deductions</span>
                      <span>-{formatMoney(viewingPayslip.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Take-Home Highlight Banner */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Net Salary Payable (In Words)</span>
                  <span className="text-sm font-extrabold text-amber-400">
                    Shillings Twenty-Nine Thousand Four Hundred Fifty Only
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Net Take-Home Amount</span>
                  <span className="text-xl font-black text-emerald-400">
                    {formatMoney(viewingPayslip.netSalary)}
                  </span>
                </div>
              </div>

              {/* Footer Stamp & Signatures */}
              <div className="pt-4 flex justify-between items-end text-[10px] text-slate-400 border-t border-slate-200">
                <p>This is a computer-generated salary slip and requires no physical signature.</p>
                <div className="text-right font-bold text-slate-700">
                  <p className="border-b border-slate-300 pb-1 mb-0.5">Neha Mehta (HR Manager)</p>
                  <span>Authorized Signatory</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewingPayslip(null)}
                className="rounded-xl text-xs"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPDF(viewingPayslip)}
                className="rounded-xl text-xs font-bold text-blue-800 border-blue-300 hover:bg-blue-50"
              >
                <Download className="h-3.5 w-3.5 mr-1" /> Download PDF
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleEmailPayslip(viewingPayslip)}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <Mail className="h-3.5 w-3.5 mr-1" /> Email Payslip
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
          title="Filter Payslips"
          size="sm"
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Months</option>
                <option value="August 2026">August 2026</option>
                <option value="July 2026">July 2026</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
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
    </ModulePageShell>
  );
}
