"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import {
  LeaveBalancePanel,
  LeaveHistoryPanel,
  ProfileCard,
  type LeaveBalanceItem,
  type LeaveHistoryRow,
} from "@/components/hr/shared/profileHelpers";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";
import { hrLeaveApplicationService } from "@/services/human-resources";
import { mapLeaveApplicationFromApi } from "@/lib/hr/api-mappers";
import type { LeaveApplication } from "@/components/hr/LeaveManagementView";
import { Calendar, Clock, Gift, Heart } from "lucide-react";

function buildLeaveBalances(employee: EmployeeItem): LeaveBalanceItem[] {
  const lb = employee.leaveBalance ?? { casual: 0, sick: 0, earned: 0 };
  return [
    {
      label: "Casual leave (CL)",
      remaining: lb.casual ?? 0,
      allocated: (lb.casual ?? 0) + 3,
      used: 3,
      icon: Calendar,
      tone: "blue",
    },
    {
      label: "Sick leave (SL)",
      remaining: lb.sick ?? 0,
      allocated: (lb.sick ?? 0) + 4,
      used: 4,
      icon: Heart,
      tone: "rose",
    },
    {
      label: "Earned leave (EL)",
      remaining: lb.earned ?? 0,
      allocated: (lb.earned ?? 0) + 5,
      used: 5,
      icon: Gift,
      tone: "violet",
    },
    {
      label: "Compensatory off",
      remaining: 0,
      allocated: 0,
      used: 0,
      icon: Clock,
      tone: "emerald",
    },
  ];
}

function toHistoryRow(app: LeaveApplication): LeaveHistoryRow {
  const daysLabel =
    app.status === "Approved" && app.effectiveDays != null
      ? `${app.effectiveDays} eligible day(s)`
      : `${app.totalDays} day(s)`;
  return {
    id: app.id,
    type: `${app.leaveTypeName} (${app.leaveTypeCode})`,
    dates: `${app.fromDate} → ${app.toDate}`,
    days: daysLabel,
    reason: app.reason,
    status: app.status as LeaveHistoryRow["status"],
    approvedBy: app.approvedBy ?? "—",
    fromDateIso: app.fromDateIso,
    toDateIso: app.toDateIso,
    effectiveDays: app.effectiveDays,
  };
}

export interface EmployeeLeaveTabProps {
  employee: EmployeeItem;
  onLeaveChanged?: () => void;
  onToast?: (message: string) => void;
}

export function EmployeeLeaveTab({ employee, onLeaveChanged, onToast }: EmployeeLeaveTabProps) {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<LeaveHistoryRow | null>(null);
  const [modifyTarget, setModifyTarget] = useState<LeaveHistoryRow | null>(null);
  const [modifyFrom, setModifyFrom] = useState("");
  const [modifyTo, setModifyTo] = useState("");
  const [modifyPreview, setModifyPreview] = useState<{ effectiveDays: number; calendarDays: number } | null>(
    null,
  );

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await hrLeaveApplicationService.list();
      const mapped = rows
        .map((row) => mapLeaveApplicationFromApi(row, employee))
        .filter((a) => a.employeeId === employee.id);
      setApplications(mapped);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [employee]);

  useEffect(() => {
    void loadLeaves();
  }, [loadLeaves]);

  useEffect(() => {
    if (!modifyTarget || !modifyFrom || !modifyTo) {
      setModifyPreview(null);
      return;
    }
    let cancelled = false;
    hrLeaveApplicationService
      .previewDays({
        employeeId: employee.id,
        fromDate: modifyFrom,
        toDate: modifyTo,
      })
      .then((r) => {
        if (!cancelled) {
          setModifyPreview({
            effectiveDays: Number(r.effectiveDays ?? 0),
            calendarDays: Number(r.calendarDays ?? 0),
          });
        }
      })
      .catch(() => {
        if (!cancelled) setModifyPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [modifyTarget, modifyFrom, modifyTo, employee.id]);

  const historyRows = useMemo(() => applications.map(toHistoryRow), [applications]);
  const balances = useMemo(() => buildLeaveBalances(employee), [employee]);

  const handleCancel = async () => {
    if (!cancelTarget?.id) return;
    setActionId(cancelTarget.id);
    try {
      await hrLeaveApplicationService.cancel(cancelTarget.id, {
        changedBy: "Neha Mehta (HR Manager)",
      });
      setCancelTarget(null);
      await loadLeaves();
      onLeaveChanged?.();
      onToast?.("Leave cancelled. Balance restored and attendance recalculated.");
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : "Failed to cancel leave");
    } finally {
      setActionId(null);
    }
  };

  const handleModify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyTarget?.id) return;
    setActionId(modifyTarget.id);
    try {
      await hrLeaveApplicationService.modify(modifyTarget.id, {
        fromDate: modifyFrom,
        toDate: modifyTo,
        changedBy: "Neha Mehta (HR Manager)",
      });
      setModifyTarget(null);
      await loadLeaves();
      onLeaveChanged?.();
      onToast?.("Leave dates updated. Attendance and balance adjusted.");
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : "Failed to modify leave");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200" role="tabpanel">
      <ProfileCard title="Leave balance">
        <LeaveBalancePanel balances={balances} />
        <p className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <span>Casual (CL): {employee.leaveBalance?.casual ?? 0} remaining</span>
          <span>Sick (SL): {employee.leaveBalance?.sick ?? 0} remaining</span>
          <span>Earned (EL): {employee.leaveBalance?.earned ?? 0} remaining</span>
        </p>
      </ProfileCard>

      <ProfileCard title={`Leave history — ${employee.name}`}>
        {loading ? (
          <p className="text-xs text-slate-500 py-4">Loading leave records…</p>
        ) : historyRows.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No leave applications on file.</p>
        ) : (
          <LeaveHistoryPanel
            rows={historyRows}
            renderActions={(row) =>
              row.status === "Approved" ? (
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={actionId === row.id}
                    className="text-[10px] h-7 px-2 rounded-lg"
                    onClick={() => {
                      setModifyTarget(row);
                      setModifyFrom(row.fromDateIso ?? "");
                      setModifyTo(row.toDateIso ?? "");
                    }}
                  >
                    <CalendarDays className="h-3 w-3 mr-1" />
                    Modify
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={actionId === row.id}
                    className="text-[10px] h-7 px-2 rounded-lg text-amber-800 border-amber-300 hover:bg-amber-50"
                    onClick={() => setCancelTarget(row)}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400">—</span>
              )
            }
          />
        )}
      </ProfileCard>

      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel Approved Leave"
        size="sm"
      >
        {cancelTarget && (
          <div className="space-y-4 text-sm">
            <p className="text-slate-700">
              Cancel <strong>{cancelTarget.type}</strong> ({cancelTarget.dates})?
            </p>
            <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
              <li>Future dates become Pending on attendance — not Absent until shift cutoff.</li>
              <li>Leave balance restored for eligible days only.</li>
            </ul>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setCancelTarget(null)}>
                Keep
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={actionId === cancelTarget.id}
                onClick={() => void handleCancel()}
                className="bg-amber-700 hover:bg-amber-800 text-white"
              >
                Cancel Leave
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(modifyTarget)}
        onClose={() => setModifyTarget(null)}
        title="Modify Leave Dates"
        size="md"
      >
        {modifyTarget && (
          <form onSubmit={(e) => void handleModify(e)} className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">From</label>
                <input
                  type="date"
                  value={modifyFrom}
                  onChange={(e) => setModifyFrom(e.target.value)}
                  required
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">To</label>
                <input
                  type="date"
                  value={modifyTo}
                  onChange={(e) => setModifyTo(e.target.value)}
                  required
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>
            </div>
            {modifyPreview && (
              <p className="text-xs text-emerald-800 bg-emerald-50 rounded-lg p-2.5 border border-emerald-100">
                New eligible days: {modifyPreview.effectiveDays}
                {modifyPreview.calendarDays !== modifyPreview.effectiveDays &&
                  ` (calendar: ${modifyPreview.calendarDays})`}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setModifyTarget(null)}>
                Close
              </Button>
              <Button type="submit" size="sm" disabled={actionId === modifyTarget.id} className="bg-emerald-700 text-white">
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
