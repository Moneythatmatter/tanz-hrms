"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Timer,
  Plane,
  Percent,
  CreditCard,
  ShieldCheck,
  Save,
  RotateCcw,
  History,
  CheckCircle2,
  AlertCircle,
  Sliders,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Building,
  UserCheck,
  Lock,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Modal } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { hrPayrollSettingsService } from "@/services/human-resources";

export interface AuditLogEntry {
  id: string;
  settingGroup: string;
  action: string;
  updatedBy: string;
  timestamp: string;
  oldValue: string;
  newValue: string;
}

export function PayrollSettingsView() {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "general" | "attendance" | "overtime" | "holiday" | "deductions" | "payment" | "workflow"
  >("general");

  // Mobile Accordion open state
  const [mobileOpenTab, setMobileOpenTab] = useState<string | null>("general");

  // Audit Log Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLogs] = useState<AuditLogEntry[]>([]);

  // Tab 1: General Settings Form State
  const [frequency, setFrequency] = useState("Monthly");
  const [startDay, setStartDay] = useState(1);
  const [endDay, setEndDay] = useState(31);
  const [paymentDay, setPaymentDay] = useState(5);

  // Tab 2: Attendance Rules State
  const [enableLatePenalty, setEnableLatePenalty] = useState(true);
  const [allowedLateMarks, setAllowedLateMarks] = useState(3);
  const [latePenaltyAction, setLatePenaltyAction] = useState("Half Day");
  const [absentDeductionRule, setAbsentDeductionRule] = useState("Per Day Salary");

  // Tab 3: Overtime Rules State
  const [enableOvertime, setEnableOvertime] = useState(true);
  const [minOtHours, setMinOtHours] = useState(1.0);
  const [otCalcMethod, setOtCalcMethod] = useState("Multiplier");
  const [otMultiplier, setOtMultiplier] = useState(1.0);
  const [weeklyOffOtMultiplier, setWeeklyOffOtMultiplier] = useState(1.5);
  const [emergencyCallInMultiplier, setEmergencyCallInMultiplier] = useState(1.5);
  const [nightDifferentialMultiplier, setNightDifferentialMultiplier] = useState(1.25);

  // Tab 4: Holiday Work Rules State
  const [holidayBenefitType] = useState("Additional Pay Only");
  const [holidayPayMultiplier, setHolidayPayMultiplier] = useState(1.0);

  // Tab 5: Deduction Rules State
  const [enablePF, setEnablePF] = useState(true);
  const [pfEmployeePct, setPfEmployeePct] = useState(12.0);
  const [pfEmployerPct, setPfEmployerPct] = useState(12.0);

  const [enableESI, setEnableESI] = useState(true);
  const [esiEmployeePct, setEsiEmployeePct] = useState(0.75);
  const [esiEmployerPct, setEsiEmployerPct] = useState(3.25);

  const [enablePT, setEnablePT] = useState(true);
  const [ptState, setPtState] = useState("Maharashtra");

  // Tab 6: Payment Settings State
  const [salaryPaymentMode, setSalaryPaymentMode] = useState("Bank Transfer");
  const [enableBankExport, setEnableBankExport] = useState(true);
  const [bankExportFormat, setBankExportFormat] = useState("Excel");

  // Tab 7: Approval Workflow State
  const [approvalRole, setApprovalRole] = useState("HR Manager");
  const [lockPayrollAfterApproval, setLockPayrollAfterApproval] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const rows = await hrPayrollSettingsService.list();
        const row = rows[0];
        if (!row) return;
        setSettingsId(String(row.id));
        const settings = (row.settings as Record<string, unknown>) ?? {};
        if (settings.frequency) setFrequency(String(settings.frequency));
        if (settings.startDay != null) setStartDay(Number(settings.startDay));
        if (settings.endDay != null) setEndDay(Number(settings.endDay));
        if (settings.paymentDay != null) setPaymentDay(Number(settings.paymentDay));
        if (settings.enablePf != null) setEnablePF(Boolean(settings.enablePf));
        if (settings.enableEsi != null) setEnableESI(Boolean(settings.enableEsi));
        if (settings.enablePt != null) setEnablePT(Boolean(settings.enablePt));
        if (settings.pfEmployeePct != null) setPfEmployeePct(Number(settings.pfEmployeePct));
        if (settings.approvalRole) setApprovalRole(String(settings.approvalRole));
      } catch (e) {
        setToastMessage(e instanceof Error ? e.message : "Failed to load payroll settings");
      }
    };
    void loadSettings();
  }, []);

  // Handlers
  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsId) {
      setToastMessage("Payroll settings record not found.");
      return;
    }
    try {
      await hrPayrollSettingsService.update(settingsId, {
        settings: {
          frequency,
          startDay,
          endDay,
          paymentDay,
          enableLatePenalty,
          allowedLateMarks,
          latePenaltyAction,
          absentDeductionRule,
          enableOvertime,
          minOtHours,
          otCalcMethod,
          otMultiplier,
          weeklyOffOtMultiplier,
          emergencyCallInMultiplier,
          nightDifferentialMultiplier,
          holidayBenefitType,
          holidayPayMultiplier,
          enablePf: enablePF,
          pfEmployeePct,
          pfEmployerPct,
          enableEsi: enableESI,
          esiEmployeePct,
          esiEmployerPct,
          enablePt: enablePT,
          ptState,
          salaryPaymentMode,
          enableBankExport,
          bankExportFormat,
          approvalRole,
          lockPayrollAfterApproval,
        },
      });
      setToastMessage("Payroll settings saved successfully. Global calculation rules updated.");
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save payroll settings");
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Are you sure you want to reset all payroll settings to factory defaults?")) {
      setFrequency("Monthly");
      setStartDay(1);
      setEndDay(31);
      setPaymentDay(5);
      setEnableLatePenalty(true);
      setAllowedLateMarks(3);
      setLatePenaltyAction("Half Day");
      setEnableOvertime(true);
      setMinOtHours(1.0);
      setOtMultiplier(1.5);
      setHolidayPayMultiplier(2.0);
      setPfEmployeePct(12.0);
      setPfEmployerPct(12.0);
      setEsiEmployeePct(0.75);
      setEsiEmployerPct(3.25);
      setSalaryPaymentMode("Bank Transfer");
      setApprovalRole("HR Manager");
      setLockPayrollAfterApproval(true);
      setToastMessage("Payroll settings reset to system defaults.");
    }
  };

  const toggleMobileAccordion = (tabKey: string) => {
    setMobileOpenTab(mobileOpenTab === tabKey ? null : tabKey);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Payroll"
      title="Payroll Settings"
      description="Configure global payroll processing rules, salary calculation policies, deduction rates, overtime multipliers, and payment preferences."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Payroll" },
        { label: "Payroll Settings" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleSaveAllSettings}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save Settings
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="rounded-xl text-xs font-semibold bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Reset Defaults
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAuditModalOpen(true)}
            className="rounded-xl text-xs font-semibold bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs"
          >
            <History className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            View Audit Log
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: TOP 4 SUMMARY CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Payroll Cycle"
          value={frequency}
          subtitle={`Cutoff: ${endDay}st • Payment: ${paymentDay}th`}
          tone="blue"
          icon={<Calendar className="h-5 w-5" />}
        />
        <HRKPICard
          label="Payment Date"
          value={`${paymentDay}th Monthly`}
          subtitle="Direct Bank Transfer"
          tone="emerald"
          icon={<CreditCard className="h-5 w-5" />}
        />
        <HRKPICard
          label="OT Rate"
          value={`${otMultiplier}x Multiplier`}
          subtitle={`Min ${minOtHours} Hr • ${otCalcMethod}`}
          tone="amber"
          icon={<Timer className="h-5 w-5" />}
        />
        <HRKPICard
          label="Holiday Rate"
          value={`${holidayPayMultiplier}x Multiplier`}
          subtitle="Additional Pay Only"
          tone="purple"
          icon={<Plane className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: DESKTOP TAB NAVIGATION & FORMS
      ───────────────────────────────────────────────────────────── */}
      {/* Desktop Tabs Toolbar */}
      <div className="hidden sm:flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs mb-5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "general"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Calendar className="h-4 w-4" /> General
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "attendance"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Clock className="h-4 w-4" /> Attendance Rules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("overtime")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "overtime"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Timer className="h-4 w-4" /> Overtime Rules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("holiday")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "holiday"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Plane className="h-4 w-4" /> Holiday Rules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("deductions")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "deductions"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Percent className="h-4 w-4" /> Deduction Rules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payment")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "payment"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <CreditCard className="h-4 w-4" /> Payment Settings
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("workflow")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "workflow"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Approval Workflow
        </button>
      </div>

      {/* Desktop Main Content Forms */}
      <div className="hidden sm:block">
        <form onSubmit={handleSaveAllSettings} className="space-y-5">
          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === "general" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-700" /> General Payroll Cycle Settings
                </h3>
                <p className="text-xs text-slate-500">
                  Define payroll frequency, monthly cutoff dates, and salary disbursement schedules.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payroll Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Monthly">Monthly (Default)</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Salary Payment Day</label>
                  <select
                    value={paymentDay}
                    onChange={(e) => setPaymentDay(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value={1}>1st of Next Month</option>
                    <option value={5}>5th of Next Month (Default)</option>
                    <option value={7}>7th of Next Month</option>
                    <option value={10}>10th of Next Month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payroll Start Day</label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={startDay}
                    onChange={(e) => setStartDay(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payroll End Day (Cutoff)</label>
                  <input
                    type="number"
                    min={28}
                    max={31}
                    value={endDay}
                    onChange={(e) => setEndDay(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Example Card */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-xs text-blue-950 flex items-center justify-between">
                <div>
                  <span className="font-bold block">Current Payroll Cycle Preview:</span>
                  <p className="text-blue-800">
                    Cycle Period: <strong>1st Aug &rarr; 31st Aug</strong> | Salary Payment Date: <strong>5th Sep</strong>
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-blue-700 shrink-0" />
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE RULES */}
          {activeTab === "attendance" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-700" /> Attendance &amp; Lateness Deduction Rules
                </h3>
                <p className="text-xs text-slate-500">
                  Configure late mark limits, salary deductions, and absent day penalty policies.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">Late Mark Penalty Policy</label>
                    <span className="text-[11px] text-slate-500">
                      Automatically calculate salary deductions when staff exceed allowed late check-ins.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableLatePenalty}
                    onChange={(e) => setEnableLatePenalty(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                {enableLatePenalty && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Allowed Late Marks Per Month</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={allowedLateMarks}
                        onChange={(e) => setAllowedLateMarks(Number(e.target.value))}
                        className="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Penalty After Allowed Limit</label>
                      <select
                        value={latePenaltyAction}
                        onChange={(e) => setLatePenaltyAction(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      >
                        <option value="Half Day">Half Day Salary Deduction</option>
                        <option value="Full Day Deduction">Full Day Salary Deduction</option>
                        <option value="Ignore">Ignore (Warning Only)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase">Absent Day Salary Deduction</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Deduction Rate</label>
                      <select
                        value={absentDeductionRule}
                        onChange={(e) => setAbsentDeductionRule(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                      >
                        <option value="Per Day Salary">Per Day Salary (Basic / Days in Month)</option>
                        <option value="1.5x Per Day">1.5x Per Day Penalty</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    Example: For a salary of TSh30,000 in a 30-day month, 1 Absent day deducts exactly TSh1,000.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OVERTIME RULES */}
          {activeTab === "overtime" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Timer className="h-4 w-4 text-emerald-700" /> Overtime (OT) Calculation & Rate Multipliers
                </h3>
                <p className="text-xs text-slate-500">
                  Manage overtime pay multipliers across all OT classifications. These rates directly govern calculation in Overtime Management.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">Enable Overtime Pay</label>
                    <span className="text-[11px] text-slate-500">Include extra OT compensation in salary processing.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableOvertime}
                    onChange={(e) => setEnableOvertime(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                {enableOvertime && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Minimum OT Threshold</label>
                        <select
                          value={minOtHours}
                          onChange={(e) => setMinOtHours(Number(e.target.value))}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                        >
                          <option value={0.5}>0.5 Hour (30 Mins)</option>
                          <option value={1.0}>1.0 Hour (Default)</option>
                          <option value={2.0}>2.0 Hours</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Base Rate Calculation</label>
                        <select
                          value={otCalcMethod}
                          onChange={(e) => setOtCalcMethod(e.target.value)}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                        >
                          <option value="Multiplier">Hourly Rate × OT Multiplier (Standard)</option>
                          <option value="Hourly Rate">Standard Single Rate (1.0x Flat)</option>
                          <option value="Fixed Amount">Fixed Amount per Hour (TSh150/hr)</option>
                        </select>
                      </div>
                    </div>

                    {/* OVERTIME TYPE RATE MULTIPLIERS MANAGEMENT TABLE */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4 text-emerald-700" /> Overtime Classification Multiplier Rates
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Configure the exact rate multiplier for each OT type used in Assign Overtime.
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-100/70 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Overtime Type</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3">Multiplier Rate</th>
                              <th className="py-2.5 px-3">Rate Breakdown (TSh30k Salary = TSh1,000/day = TSh125/hr)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            <tr className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-bold text-slate-900">Regular OT</td>
                              <td className="py-2.5 px-3 text-slate-500 text-[11px]">Extra Hours after regular shift</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    step="0.05"
                                    min="1.0"
                                    max="3.0"
                                    value={otMultiplier}
                                    onChange={(e) => setOtMultiplier(Number(e.target.value))}
                                    className="w-20 rounded-lg border border-slate-300 p-1 text-xs font-bold text-emerald-800 text-center"
                                  />
                                  <span className="font-bold text-slate-600">x</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-700">
                                TSh{(125 * otMultiplier).toFixed(2)}/hr <span className="text-[10px] text-slate-500 font-medium">(TSh{((125 * otMultiplier) / 60).toFixed(2)}/min)</span>
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-bold text-slate-900">Weekly Off OT</td>
                              <td className="py-2.5 px-3 text-slate-500 text-[11px]">Working on scheduled Weekly Off day</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    step="0.05"
                                    min="1.0"
                                    max="3.0"
                                    value={weeklyOffOtMultiplier}
                                    onChange={(e) => setWeeklyOffOtMultiplier(Number(e.target.value))}
                                    className="w-20 rounded-lg border border-slate-300 p-1 text-xs font-bold text-emerald-800 text-center"
                                  />
                                  <span className="font-bold text-slate-600">x</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-700">
                                TSh{(125 * weeklyOffOtMultiplier).toFixed(2)}/hr <span className="text-[10px] text-slate-500 font-medium">(TSh{((125 * weeklyOffOtMultiplier) / 60).toFixed(2)}/min)</span>
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-bold text-slate-900">Emergency Call-In OT</td>
                              <td className="py-2.5 px-3 text-slate-500 text-[11px]">Urgent unplanned hotel callback</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    step="0.05"
                                    min="1.0"
                                    max="3.0"
                                    value={emergencyCallInMultiplier}
                                    onChange={(e) => setEmergencyCallInMultiplier(Number(e.target.value))}
                                    className="w-20 rounded-lg border border-slate-300 p-1 text-xs font-bold text-emerald-800 text-center"
                                  />
                                  <span className="font-bold text-slate-600">x</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-700">
                                TSh{(125 * emergencyCallInMultiplier).toFixed(2)}/hr <span className="text-[10px] text-slate-500 font-medium">(TSh{((125 * emergencyCallInMultiplier) / 60).toFixed(2)}/min)</span>
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-bold text-slate-900">Night Differential OT</td>
                              <td className="py-2.5 px-3 text-slate-500 text-[11px]">Late night shift overtime (11 PM - 6 AM)</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    step="0.05"
                                    min="1.0"
                                    max="3.0"
                                    value={nightDifferentialMultiplier}
                                    onChange={(e) => setNightDifferentialMultiplier(Number(e.target.value))}
                                    className="w-20 rounded-lg border border-slate-300 p-1 text-xs font-bold text-emerald-800 text-center"
                                  />
                                  <span className="font-bold text-slate-600">x</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-700">
                                TSh{(125 * nightDifferentialMultiplier).toFixed(2)}/hr <span className="text-[10px] text-slate-500 font-medium">(TSh{((125 * nightDifferentialMultiplier) / 60).toFixed(2)}/min)</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-950 flex items-center justify-between">
                  <div>
                    <span className="font-bold block">Live Overtime Multipliers Active:</span>
                    <p className="text-amber-900">
                      Regular: <strong>{otMultiplier}x</strong> | Weekly Off: <strong>{weeklyOffOtMultiplier}x</strong> | Emergency: <strong>{emergencyCallInMultiplier}x</strong> | Night Diff: <strong>{nightDifferentialMultiplier}x</strong>
                    </p>
                  </div>
                  <Timer className="h-5 w-5 text-amber-700 shrink-0" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HOLIDAY RULES */}
          {activeTab === "holiday" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Plane className="h-4 w-4 text-emerald-700" /> Holiday Work Compensation Rules
                </h3>
                <p className="text-xs text-slate-500">
                  Controls payroll calculation when employees work on declared official holidays.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-purple-950 text-sm block">Holiday Attendance Benefit Policy</span>
                      <p className="text-purple-800">
                        Comp Off has been disabled. All holiday attendance is compensated strictly via <strong>Additional Pay (Extra Money)</strong> forwarded to Payroll.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-200 text-purple-900 border border-purple-300">
                      Additional Pay Only
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Pay Rate Multiplier</label>
                    <select
                      value={holidayPayMultiplier}
                      onChange={(e) => setHolidayPayMultiplier(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value={1.0}>1.0x Normal Salary Rate (Default: 1 Day Pay)</option>
                      <option value={1.25}>1.25x Normal Salary Rate</option>
                      <option value={1.5}>1.5x Normal Salary Rate</option>
                      <option value={2.0}>2.0x Double Salary Rate</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs text-emerald-950 flex items-center justify-between">
                  <div>
                    <span className="font-bold block">Holiday Pay Formula:</span>
                    <p className="text-emerald-900">
                      Normal Rate = <strong>TSh100/hr</strong> &rarr; Holiday Rate ({holidayPayMultiplier}x) = <strong>TSh{100 * holidayPayMultiplier}/hr</strong>
                    </p>
                  </div>
                  <Plane className="h-5 w-5 text-emerald-700 shrink-0" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DEDUCTION RULES */}
          {activeTab === "deductions" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Percent className="h-4 w-4 text-emerald-700" /> Statutory Deduction Settings (PF, ESI, PT)
                </h3>
                <p className="text-xs text-slate-500">
                  Set statutory percentage rates and state tax rules applied during payroll processing.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PF Settings */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase">Provident Fund (PF)</h4>
                    <input
                      type="checkbox"
                      checked={enablePF}
                      onChange={(e) => setEnablePF(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                  </div>

                  {enablePF && (
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">Employee Contribution %</label>
                        <input
                          type="number"
                          step="0.1"
                          value={pfEmployeePct}
                          onChange={(e) => setPfEmployeePct(Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 p-2 font-bold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">Employer Contribution %</label>
                        <input
                          type="number"
                          step="0.1"
                          value={pfEmployerPct}
                          onChange={(e) => setPfEmployerPct(Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 p-2 font-bold bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ESI Settings */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase">ESI Insurance</h4>
                    <input
                      type="checkbox"
                      checked={enableESI}
                      onChange={(e) => setEnableESI(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                  </div>

                  {enableESI && (
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">Employee Contribution %</label>
                        <input
                          type="number"
                          step="0.05"
                          value={esiEmployeePct}
                          onChange={(e) => setEsiEmployeePct(Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 p-2 font-bold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">Employer Contribution %</label>
                        <input
                          type="number"
                          step="0.05"
                          value={esiEmployerPct}
                          onChange={(e) => setEsiEmployerPct(Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 p-2 font-bold bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PT Settings */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase">Professional Tax (PT)</h4>
                    <input
                      type="checkbox"
                      checked={enablePT}
                      onChange={(e) => setEnablePT(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                  </div>

                  {enablePT && (
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">Applicable State Slabs</label>
                        <select
                          value={ptState}
                          onChange={(e) => setPtState(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-2 bg-white font-semibold"
                        >
                          <option value="Maharashtra">Maharashtra (TSh200/mo)</option>
                          <option value="Karnataka">Karnataka (TSh200/mo)</option>
                          <option value="Delhi">Delhi (N/A)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PAYMENT SETTINGS */}
          {activeTab === "payment" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-700" /> Salary Payment &amp; Bank Export Settings
                </h3>
                <p className="text-xs text-slate-500">
                  Configure default salary payment channels and automated bank advice export formats.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Default Salary Payment Mode</label>
                  <select
                    value={salaryPaymentMode}
                    onChange={(e) => setSalaryPaymentMode(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                  >
                    <option value="Bank Transfer">Direct Bank Transfer (Default)</option>
                    <option value="Cash">Cash Payment</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Enable Bank File Export</label>
                    <input
                      type="checkbox"
                      checked={enableBankExport}
                      onChange={(e) => setEnableBankExport(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                  </div>

                  {enableBankExport && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Bank Export Format</label>
                      <select
                        value={bankExportFormat}
                        onChange={(e) => setBankExportFormat(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 p-2 bg-white font-semibold"
                      >
                        <option value="Excel">Excel Sheet (.xlsx)</option>
                        <option value="CSV">CSV Format (.csv)</option>
                        <option value="HDFC Corporate">HDFC Bank Format</option>
                        <option value="ICICI Corporate">ICICI Bank Format</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: APPROVAL WORKFLOW */}
          {activeTab === "workflow" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" /> Payroll Approval &amp; Lock Workflow
                </h3>
                <p className="text-xs text-slate-500">
                  Manage multi-tier authorization hierarchy and lock payroll records after final sign-off.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Final Approval Level Required</label>
                    <select
                      value={approvalRole}
                      onChange={(e) => setApprovalRole(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                    >
                      <option value="HR Executive">HR Executive</option>
                      <option value="HR Manager">HR Manager (Default)</option>
                      <option value="HR Admin">HR Admin</option>
                      <option value="Finance Manager">Finance Head / Manager</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between border-l border-slate-200 pl-4">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block">Lock Payroll After Approval</label>
                      <span className="text-[11px] text-slate-500">Prevents editing salary figures once marked as Approved.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={lockPayrollAfterApproval}
                      onChange={(e) => setLockPayrollAfterApproval(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Workflow Progression Visual */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <span className="font-extrabold text-slate-800 text-xs uppercase block">Standard Payroll Workflow Pipeline</span>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 overflow-x-auto py-2">
                    <span className="px-3 py-1 bg-slate-200 rounded-lg">1. Draft</span>
                    <span>&rarr;</span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-lg">2. HR Review</span>
                    <span>&rarr;</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-lg">3. Approved</span>
                    <span>&rarr;</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-900 rounded-lg">4. Locked</span>
                    <span>&rarr;</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-lg">5. Paid</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Submit Bar */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="rounded-xl text-xs font-semibold"
            >
              Reset Defaults
            </Button>

            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Save All Settings
            </Button>
          </div>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: MOBILE VIEW ACCORDION SECTIONS
      ───────────────────────────────────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {/* Accordion Item 1: General Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleMobileAccordion("general")}
            className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-900 text-xs bg-slate-50/50"
          >
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-700" /> General Settings
            </span>
            {mobileOpenTab === "general" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {mobileOpenTab === "general" && (
            <div className="p-4 space-y-3 text-xs border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payroll Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Salary Payment Day</label>
                <select
                  value={paymentDay}
                  onChange={(e) => setPaymentDay(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                >
                  <option value={1}>1st</option>
                  <option value={5}>5th</option>
                  <option value={7}>7th</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Accordion Item 2: Attendance Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleMobileAccordion("attendance")}
            className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-900 text-xs bg-slate-50/50"
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-700" /> Attendance Rules
            </span>
            {mobileOpenTab === "attendance" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {mobileOpenTab === "attendance" && (
            <div className="p-4 space-y-3 text-xs border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Late Penalty Policy</span>
                <input
                  type="checkbox"
                  checked={enableLatePenalty}
                  onChange={(e) => setEnableLatePenalty(e.target.checked)}
                />
              </div>
              {enableLatePenalty && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Allowed Late Marks</label>
                  <input
                    type="number"
                    value={allowedLateMarks}
                    onChange={(e) => setAllowedLateMarks(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Accordion Item 3: OT Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleMobileAccordion("overtime")}
            className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-900 text-xs bg-slate-50/50"
          >
            <span className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-emerald-700" /> Overtime Multiplier Rules
            </span>
            {mobileOpenTab === "overtime" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {mobileOpenTab === "overtime" && (
            <div className="p-4 space-y-3 text-xs border-t border-slate-100">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Regular OT Rate</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.05"
                      value={otMultiplier}
                      onChange={(e) => setOtMultiplier(Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-300 p-1 text-xs font-bold text-center"
                    />
                    <span className="font-bold">x</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Weekly Off OT Rate</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.05"
                      value={weeklyOffOtMultiplier}
                      onChange={(e) => setWeeklyOffOtMultiplier(Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-300 p-1 text-xs font-bold text-center"
                    />
                    <span className="font-bold">x</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Emergency Call-In Rate</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.05"
                      value={emergencyCallInMultiplier}
                      onChange={(e) => setEmergencyCallInMultiplier(Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-300 p-1 text-xs font-bold text-center"
                    />
                    <span className="font-bold">x</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Night Differential Rate</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.05"
                      value={nightDifferentialMultiplier}
                      onChange={(e) => setNightDifferentialMultiplier(Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-300 p-1 text-xs font-bold text-center"
                    />
                    <span className="font-bold">x</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accordion Item 4: Holiday Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleMobileAccordion("holiday")}
            className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-900 text-xs bg-slate-50/50"
          >
            <span className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-emerald-700" /> Holiday Rules
            </span>
            {mobileOpenTab === "holiday" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {mobileOpenTab === "holiday" && (
            <div className="p-4 space-y-3 text-xs border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Holiday Multiplier</label>
                <input
                  type="number"
                  step="0.5"
                  value={holidayPayMultiplier}
                  onChange={(e) => setHolidayPayMultiplier(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Save Action */}
        <Button
          type="button"
          onClick={handleSaveAllSettings}
          className="w-full bg-emerald-700 text-white rounded-xl text-xs font-bold py-3"
        >
          Save All Settings
        </Button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: AUDIT LOG HISTORY MODAL
      ───────────────────────────────────────────────────────────── */}
      {isAuditModalOpen && (
        <Modal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          title="Payroll Settings Audit Log"
          description="Historical change log of all configuration updates made by HR and Finance administrators."
          size="lg"
        >
          <div className="space-y-3 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">{log.action}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Setting Group: <strong>{log.settingGroup}</strong> | By: <strong>{log.updatedBy}</strong>
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] font-mono border-t border-slate-200/60 mt-1">
                  <span className="text-rose-700">Old: {log.oldValue}</span>
                  <span>&rarr;</span>
                  <span className="text-emerald-700 font-bold">New: {log.newValue}</span>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-3">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsAuditModalOpen(false)}
                className="rounded-xl text-xs font-bold bg-slate-900 text-white"
              >
                Close Log
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
