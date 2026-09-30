"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  TrendingUp,
  X,
} from "lucide-react";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";
import { ProfileCard } from "@/components/hr/shared/profileHelpers";
import { hrCompensationService } from "@/services/human-resources";
import { cn } from "@/lib/utils";

function formatDisplayDate(iso: string) {
  const d = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return iso;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function formatSalaryPeriod(from: string | null | undefined, to: string | null | undefined) {
  if (!from) return "—";
  const start = formatDisplayDate(from);
  if (!to) return `${start} → Present`;
  return `${start} → ${formatDisplayDate(to)}`;
}

type IncrementType = "percentage" | "fixed" | "new_gross";

type PreviewLine = { componentName?: string; computedAmount?: number };

export interface EmployeeCompensationSectionProps {
  employee: EmployeeItem;
  onToast?: (message: string) => void;
}

export function EmployeeCompensationSection({
  employee,
  onToast,
}: EmployeeCompensationSectionProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [incrementType, setIncrementType] = useState<IncrementType>("percentage");
  const [incrementValue, setIncrementValue] = useState(10);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [reason, setReason] = useState("Annual Increment");
  const [remarks, setRemarks] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hrCompensationService.getSummary(employee.id);
      setSummary(data);
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : "Failed to load compensation");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [employee.id, onToast]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const currentGross = Number(summary?.currentGross ?? 0);
  const structureName = String(summary?.salaryStructureName ?? "Not assigned");
  const currentPeriod = formatSalaryPeriod(
    summary?.currentEffectiveFrom as string | undefined,
    summary?.currentEffectiveTo as string | undefined,
  );
  const history = (summary?.history as Record<string, unknown>[]) ?? [];

  const snapshot = summary?.componentSnapshot as Record<string, unknown> | undefined;
  const snapshotEarnings = (snapshot?.earnings as PreviewLine[]) ?? [];

  const runPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const data = await hrCompensationService.previewIncrement(employee.id, {
        incrementType,
        incrementValue,
        effectiveFrom: effectiveFrom || undefined,
      });
      setPreview(data);
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  }, [employee.id, incrementType, incrementValue, effectiveFrom, onToast]);

  useEffect(() => {
    if (!modalOpen) return;
    const t = setTimeout(() => void runPreview(), 300);
    return () => clearTimeout(t);
  }, [modalOpen, incrementType, incrementValue, runPreview]);

  const previewSnapshot = preview?.componentPreview as Record<string, unknown> | undefined;
  const previewEarnings = (previewSnapshot?.earnings as PreviewLine[]) ?? [];
  const previewGross = Number(preview?.newGross ?? previewSnapshot?.gross ?? 0);

  const openIncrementModal = () => {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    setEffectiveFrom(iso);
    setIncrementType("percentage");
    setIncrementValue(10);
    setReason("Annual Increment");
    setRemarks("");
    setPreview(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!effectiveFrom) {
      onToast?.("Effective from date is required");
      return;
    }
    setSubmitting(true);
    try {
      await hrCompensationService.submitRevision(employee.id, {
        incrementType,
        incrementValue,
        effectiveFrom,
        reason,
        remarks,
        createdBy: "HR Admin",
        autoApprove: false,
      });
      setModalOpen(false);
      await loadSummary();
      onToast?.("Increment submitted for approval.");
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : "Failed to save increment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRevision = async (revisionId: string) => {
    try {
      await hrCompensationService.approveRevision(employee.id, revisionId, "HR Admin");
      await loadSummary();
      onToast?.("Compensation revision approved.");
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : "Approval failed");
    }
  };

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) =>
          String(b.effectiveFrom ?? "").localeCompare(String(a.effectiveFrom ?? "")),
      ),
    [history],
  );

  return (
    <>
      <ProfileCard
        title="Compensation"
        action={
          <button
            type="button"
            onClick={openIncrementModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Give increment
          </button>
        }
      >
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading compensation…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Current gross salary
                </p>
                <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">
                  {formatMoney(currentGross)}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Effective {currentPeriod}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Salary structure (template)
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">{structureName}</p>
                <p className="mt-1 text-[11px] text-slate-500">Calculation rules only — pay amount follows approved revisions above.</p>
              </div>
            </div>

            {snapshotEarnings.length > 0 && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                <p className="mb-2 text-xs font-bold uppercase text-emerald-900">
                  Current component split (approved)
                </p>
                <div className="space-y-1 text-sm">
                  {snapshotEarnings.map((line, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span className="text-slate-700">{line.componentName}</span>
                      <span className="font-semibold tabular-nums text-emerald-900">
                        {formatMoney(Number(line.computedAmount ?? 0))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Compensation history
              </p>
              {sortedHistory.length === 0 ? (
                <p className="text-sm text-slate-500">No revisions recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {sortedHistory.map((row) => {
                    const status = String(row.status ?? "");
                    const isApproved = status.toLowerCase() === "approved";
                    const oldG = row.oldGross != null ? Number(row.oldGross) : null;
                    const newG = Number(row.newGross ?? 0);
                    return (
                      <li
                        key={String(row.id)}
                        className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatSalaryPeriod(
                              String(row.effectiveFrom ?? ""),
                              row.effectiveTo ? String(row.effectiveTo) : null,
                            )}
                            {row.hikePercentage != null && Number(row.hikePercentage) > 0
                              ? ` · ${row.hikePercentage}%`
                              : ""}
                          </p>
                          <p className="text-xs text-slate-600">
                            {String(row.revisionType ?? "revision").replace(/_/g, " ")}
                            {row.reason ? ` — ${row.reason}` : ""}
                          </p>
                          <p className="mt-0.5 text-xs font-medium tabular-nums text-slate-800">
                            {oldG != null ? (
                              <>
                                {formatMoney(oldG)} <ArrowRight className="inline h-3 w-3" />{" "}
                                {formatMoney(newG)}
                              </>
                            ) : (
                              formatMoney(newG)
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                              isApproved
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-900",
                            )}
                          >
                            {isApproved ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {status}
                          </span>
                          {!isApproved && (
                            <button
                              type="button"
                              onClick={() => void handleApproveRevision(String(row.id))}
                              className="text-[10px] font-bold text-emerald-700 hover:underline"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </ProfileCard>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
            role="dialog"
            aria-labelledby="increment-title"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 id="increment-title" className="text-lg font-bold text-slate-900">
                Give increment — {employee.name}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Current salary</p>
                  <p className="font-bold tabular-nums">{formatMoney(currentGross)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Salary structure</p>
                  <p className="font-bold">{structureName}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold text-slate-700">Increment type</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["percentage", "Percentage"],
                      ["fixed", "Fixed amount"],
                      ["new_gross", "New gross"],
                    ] as const
                  ).map(([id, label]) => (
                    <label
                      key={id}
                      className={cn(
                        "cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold",
                        incrementType === id
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 text-slate-600",
                      )}
                    >
                      <input
                        type="radio"
                        name="incType"
                        className="sr-only"
                        checked={incrementType === id}
                        onChange={() => setIncrementType(id)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  {incrementType === "percentage"
                    ? "Increment (%)"
                    : incrementType === "fixed"
                      ? "Increment amount (TZS)"
                      : "New gross salary (TZS)"}
                </label>
                <input
                  type="number"
                  value={incrementValue}
                  onChange={(e) => setIncrementValue(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Effective from</label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">New gross salary</label>
                <p className="text-xl font-black tabular-nums text-emerald-800">
                  {previewLoading ? "…" : formatMoney(previewGross)}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-bold uppercase text-slate-600">Component preview</p>
                {previewLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                ) : previewEarnings.length > 0 ? (
                  <div className="space-y-1 text-sm">
                    {previewEarnings.map((line, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{line.componentName}</span>
                        <span className="font-semibold tabular-nums">
                          {formatMoney(Number(line.computedAmount ?? 0))}
                        </span>
                      </div>
                    ))}
                    <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-bold">
                      <span>Gross</span>
                      <span className="tabular-nums text-emerald-800">{formatMoney(previewGross)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Assign a salary structure for a detailed preview.</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSubmit()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Submit for approval
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
