"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Briefcase,
  Calculator,
  Clock,
  Gift,
  Loader2,
  Wallet,
} from "lucide-react";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";
import {
  PayrollBankPanel,
  PayrollStatutoryPanel,
  ProfileCard,
} from "@/components/hr/shared/profileHelpers";
import type { SalaryStructure, StructureComponentLine } from "@/components/hr/SalaryStructureView";
import { hrSalaryStructureService } from "@/services/human-resources";
import { mapSalaryStructureFromApi } from "@/lib/hr/api-mappers";
import { cn } from "@/lib/utils";
import { EmployeeCompensationSection } from "@/components/hr/shared/EmployeeCompensationSection";

function formatCalcRule(line: StructureComponentLine): string {
  if (line.calcType === "Fixed Amount") {
    return `Fixed ${formatMoney(line.amountOrPercentage)}`;
  }
  if (line.calcType === "Percentage of Basic") {
    return `${line.amountOrPercentage}% of Basic`;
  }
  return `${line.amountOrPercentage}% of Gross`;
}

function ComponentLineRow({
  line,
  variant,
}: {
  line: StructureComponentLine;
  variant: "earning" | "deduction";
}) {
  const isEarning = variant === "earning";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2.5",
        isEarning ? "border-emerald-100" : "border-rose-100",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{line.componentName}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">{formatCalcRule(line)}</p>
      </div>
      <p
        className={cn(
          "shrink-0 text-sm font-bold tabular-nums",
          isEarning ? "text-emerald-800" : "text-rose-800",
        )}
      >
        {isEarning ? "+" : "−"}
        {formatMoney(line.computedAmount)}
      </p>
    </div>
  );
}

function PayrollSummaryBar({
  gross,
  deductions,
  net,
}: {
  gross: number;
  deductions: number;
  net: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-xl bg-slate-900 p-4 text-white shadow-md sm:grid-cols-3">
      <div className="rounded-lg bg-white/5 px-3 py-2 text-center sm:text-left">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Monthly gross</p>
        <p className="mt-1 text-lg font-black tabular-nums">{formatMoney(gross)}</p>
      </div>
      <div className="rounded-lg bg-white/5 px-3 py-2 text-center sm:border-x sm:border-slate-700 sm:text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total deductions</p>
        <p className="mt-1 text-lg font-black tabular-nums text-rose-400">−{formatMoney(deductions)}</p>
      </div>
      <div className="rounded-lg bg-white/5 px-3 py-2 text-center sm:text-right">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Take-home (net)</p>
        <p className="mt-1 text-lg font-black tabular-nums text-amber-400">{formatMoney(net)}</p>
      </div>
    </div>
  );
}

export interface EmployeePayrollTabProps {
  employee: EmployeeItem;
  onToast?: (message: string) => void;
}

export function EmployeePayrollTab({ employee, onToast }: EmployeePayrollTabProps) {
  const [structure, setStructure] = useState<SalaryStructure | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStructure = useCallback(async () => {
    if (!employee.salaryStructureId) {
      setStructure(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const row = await hrSalaryStructureService.get(employee.salaryStructureId);
      setStructure(mapSalaryStructureFromApi(row));
    } catch (e) {
      setStructure(null);
      setError(e instanceof Error ? e.message : "Failed to load salary structure");
    } finally {
      setLoading(false);
    }
  }, [employee.salaryStructureId]);

  useEffect(() => {
    void loadStructure();
  }, [loadStructure]);

  const totals = useMemo(() => {
    if (structure) {
      return {
        gross: structure.grossSalary,
        deductions: structure.totalDeductions,
        net: structure.netSalary,
        name: structure.name,
      };
    }
    const gross = employee.structureGrossSalary ?? 0;
    const net = employee.structureNetSalary ?? 0;
    return {
      gross,
      deductions: Math.max(0, gross - net),
      net,
      name: employee.salaryStructureName || "Not assigned",
    };
  }, [employee, structure]);

  const hasStructureId = Boolean(employee.salaryStructureId);

  return (
    <div className="space-y-4 animate-in fade-in duration-200" role="tabpanel">
      <EmployeeCompensationSection employee={employee} onToast={onToast} />

      <ProfileCard title="Salary structure">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Wallet className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Assigned pay template
                </p>
                <p className="mt-0.5 text-base font-bold text-slate-900">{totals.name}</p>
                {structure && (
                  <p className="mt-1 text-xs text-slate-500">
                    {structure.structureType} · {structure.department} · v{structure.version}
                    {structure.status === "Active" ? " · Active" : " · Inactive"}
                  </p>
                )}
              </div>
            </div>

            {structure && (
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700">
                  <Briefcase className="h-3 w-3" />
                  Effective {structure.effectiveFrom}
                  {structure.effectiveTo ? ` → ${structure.effectiveTo}` : " → Present"}
                </span>
                {structure.overtimeEligible && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-900">
                    <Clock className="h-3 w-3" />
                    Overtime eligible
                  </span>
                )}
                {structure.incentives > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-semibold text-violet-900">
                    <Gift className="h-3 w-3" />
                    Incentives {formatMoney(structure.incentives)}
                  </span>
                )}
              </div>
            )}
          </div>

          {loading && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading salary breakdown…
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Could not load full breakdown</p>
                <p className="mt-0.5 text-xs text-amber-800">{error}</p>
              </div>
            </div>
          )}

          {!loading && !hasStructureId && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No salary structure assigned to this employee yet.
            </div>
          )}

          {!loading && hasStructureId && structure && (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5">
                  <div className="flex items-center gap-2 border-b border-emerald-200/60 pb-2">
                    <ArrowUpCircle className="h-4 w-4 text-emerald-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-950">
                      Earnings (added)
                    </h4>
                    <span className="ml-auto text-xs font-bold tabular-nums text-emerald-800">
                      {formatMoney(structure.grossSalary)}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {structure.earnings.length > 0 ? (
                      structure.earnings.map((line, idx) => (
                        <ComponentLineRow key={`${line.componentId}-${idx}`} line={line} variant="earning" />
                      ))
                    ) : (
                      <p className="py-2 text-center text-xs text-slate-500">No earning components defined.</p>
                    )}
                    {structure.incentives > 0 && (
                      <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-100/60 px-3 py-2.5">
                        <span className="text-sm font-semibold text-emerald-950">Performance incentives</span>
                        <span className="text-sm font-bold tabular-nums text-emerald-900">
                          +{formatMoney(structure.incentives)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-rose-200/80 bg-rose-50/40 p-3.5">
                  <div className="flex items-center gap-2 border-b border-rose-200/60 pb-2">
                    <ArrowDownCircle className="h-4 w-4 text-rose-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wide text-rose-950">
                      Deductions
                    </h4>
                    <span className="ml-auto text-xs font-bold tabular-nums text-rose-800">
                      −{formatMoney(structure.totalDeductions)}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {structure.deductions.length > 0 ? (
                      structure.deductions.map((line, idx) => (
                        <ComponentLineRow key={`${line.componentId}-${idx}`} line={line} variant="deduction" />
                      ))
                    ) : (
                      <p className="py-2 text-center text-xs text-slate-500">No deduction components defined.</p>
                    )}
                  </div>
                </div>
              </div>

              <PayrollSummaryBar
                gross={structure.grossSalary}
                deductions={structure.totalDeductions}
                net={structure.netSalary}
              />

              {structure.description && (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs italic text-slate-600">
                  {structure.description}
                </p>
              )}
            </>
          )}

          {!loading && hasStructureId && !structure && !error && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calculator className="h-3.5 w-3.5" />
                Summary from employee record
              </div>
              <PayrollSummaryBar
                gross={totals.gross}
                deductions={totals.deductions}
                net={totals.net}
              />
            </div>
          )}
        </div>
      </ProfileCard>

      <ProfileCard title="Bank details">
        <PayrollBankPanel employee={employee} />
      </ProfileCard>

      <ProfileCard title="Statutory">
        <PayrollStatutoryPanel employee={employee} />
      </ProfileCard>
    </div>
  );
}
