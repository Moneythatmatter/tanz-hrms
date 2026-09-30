"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  CalendarHeart,
  Search,
  Plus,
  SlidersHorizontal,
  X,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Power,
  Trash2,
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  DollarSign,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { hrLeaveTypeService } from "@/services/human-resources";
import { mapLeaveTypeFromApi, mapLeaveTypeToApi } from "@/lib/hr/api-mappers";

export type LeaveStatus = "Active" | "Inactive";
export type LeavePayType = "Paid" | "Unpaid" | "Half-Pay";

export interface LeaveTypeMaster {
  id: string;
  leaveCode: string;
  leaveName: string;
  annualQuotaDays: number;
  payType: LeavePayType;
  carryForwardAllowed: boolean;
  maxCarryForwardDays: number;
  encashable: boolean;
  requiresMedicalProof: boolean;
  description: string;
  status: LeaveStatus;
  createdDate: string;
  activeRequestsCount: number;
}

export function LeaveTypesMasterView() {
  const [leaves, setLeaves] = useState<LeaveTypeMaster[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadLeaves = async () => {
    try {
      const rows = await hrLeaveTypeService.list();
      setLeaves(rows.map(mapLeaveTypeFromApi));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load leave types");
      setLeaves([]);
    }
  };

  useEffect(() => {
    void loadLeaves();
  }, []);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [payTypeFilter, setPayTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveTypeMaster | null>(null);
  const [viewingLeave, setViewingLeave] = useState<LeaveTypeMaster | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formQuota, setFormQuota] = useState(12);
  const [formPayType, setFormPayType] = useState<LeavePayType>("Paid");
  const [formCarryForward, setFormCarryForward] = useState(false);
  const [formMaxCarry, setFormMaxCarry] = useState(0);
  const [formEncashable, setFormEncashable] = useState(false);
  const [formMedicalProof, setFormMedicalProof] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<LeaveStatus>("Active");
  const [nameError, setNameError] = useState("");
  const [codeError, setCodeError] = useState("");

  // Statistics KPI
  const stats = useMemo(() => {
    const total = leaves.length;
    const active = leaves.filter((l) => l.status === "Active").length;
    const paidLeaves = leaves.filter((l) => l.payType === "Paid").length;
    const encashableLeaves = leaves.filter((l) => l.encashable).length;
    return { total, active, paidLeaves, encashableLeaves };
  }, [leaves]);

  // Filtered List
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const matchSearch =
        l.leaveName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.leaveCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPay = payTypeFilter === "ALL" || l.payType === payTypeFilter;
      const matchStatus = statusFilter === "ALL" || l.status === statusFilter;

      return matchSearch && matchPay && matchStatus;
    });
  }, [leaves, searchTerm, payTypeFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingLeave(null);
    setFormCode(`LV-${Math.floor(100 + Math.random() * 900)}`);
    setFormName("");
    setFormQuota(12);
    setFormPayType("Paid");
    setFormCarryForward(false);
    setFormMaxCarry(0);
    setFormEncashable(false);
    setFormMedicalProof(false);
    setFormDescription("");
    setFormStatus("Active");
    setNameError("");
    setCodeError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (l: LeaveTypeMaster) => {
    setEditingLeave(l);
    setFormCode(l.leaveCode);
    setFormName(l.leaveName);
    setFormQuota(l.annualQuotaDays);
    setFormPayType(l.payType);
    setFormCarryForward(l.carryForwardAllowed);
    setFormMaxCarry(l.maxCarryForwardDays);
    setFormEncashable(l.encashable);
    setFormMedicalProof(l.requiresMedicalProof);
    setFormDescription(l.description);
    setFormStatus(l.status);
    setNameError("");
    setCodeError("");
    setIsModalOpen(true);
  };

  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setCodeError("");

    const trimmedName = formName.trim();
    const trimmedCode = formCode.trim();

    if (!trimmedName) {
      setNameError("Leave Name is required.");
      return;
    }

    if (!trimmedCode) {
      setCodeError("Leave Code is required.");
      return;
    }

    const isDuplicate = leaves.some(
      (l) =>
        l.leaveName.toLowerCase() === trimmedName.toLowerCase() &&
        (!editingLeave || l.id !== editingLeave.id)
    );

    if (isDuplicate) {
      setNameError(`Leave Type "${trimmedName}" already exists.`);
      return;
    }

    const payload = mapLeaveTypeToApi({
      leaveCode: trimmedCode,
      leaveName: trimmedName,
      annualQuotaDays: Number(formQuota),
      payType: formPayType,
      carryForwardAllowed: formCarryForward,
      maxCarryForwardDays: formCarryForward ? Number(formMaxCarry) : 0,
      encashable: formEncashable,
      requiresMedicalProof: formMedicalProof,
      description: formDescription.trim(),
      status: formStatus,
    });

    try {
      if (editingLeave) {
        await hrLeaveTypeService.update(editingLeave.id, payload);
        setToastMessage(`Updated leave type "${trimmedName}".`);
      } else {
        await hrLeaveTypeService.create(payload);
        setToastMessage(`Created leave type "${trimmedName}".`);
      }
      await loadLeaves();
      setIsModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save leave type");
    }
  };

  const handleToggleStatus = async (l: LeaveTypeMaster) => {
    const nextStatus: LeaveStatus = l.status === "Active" ? "Inactive" : "Active";
    try {
      await hrLeaveTypeService.update(l.id, { status: nextStatus });
      await loadLeaves();
      setToastMessage(`Leave type "${l.leaveName}" is now ${nextStatus}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeleteLeave = async (l: LeaveTypeMaster) => {
    if (l.activeRequestsCount > 0) {
      alert(
        `Cannot delete "${l.leaveName}" because it has ${l.activeRequestsCount} active employee leave application(s) linked to it. Clear applications before deleting, or deactivate this type instead.`
      );
      return;
    }

    if (confirm(`Are you sure you want to delete leave type "${l.leaveName}"?`)) {
      try {
        await hrLeaveTypeService.remove(l.id);
        if (viewingLeave?.id === l.id) setViewingLeave(null);
        await loadLeaves();
        setToastMessage(`Deleted leave type "${l.leaveName}".`);
      } catch (err) {
        setToastMessage(err instanceof Error ? err.message : "Failed to delete leave type");
      }
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Masters"
      title="Leave Types"
      description="Configure employee leave master policies, annual quotas, pay types (Paid / Unpaid), carry-forward limits, and encashment rules."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Masters" },
        { label: "Leave Types" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={handleOpenCreateModal}
          className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Leave Type
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: REUSABLE KPI DASHBOARD CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Total Leave Types"
          value={`${stats.total}`}
          subtitle="Configured Policies"
          tone="blue"
          icon={<CalendarHeart className="h-5 w-5" />}
        />
        <HRKPICard
          label="Active Policies"
          value={`${stats.active}`}
          subtitle="Available for Request"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Paid Leave Types"
          value={`${stats.paidLeaves}`}
          subtitle="Full Pay Protection"
          tone="purple"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <HRKPICard
          label="Encashable Policies"
          value={`${stats.encashableLeaves}`}
          subtitle="Retirement / Resignation"
          tone="amber"
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SEARCH & FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Leave Name or Code..."
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
                value={payTypeFilter}
                onChange={(e) => setPayTypeFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Pay Types</option>
                <option value="Paid">Paid Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
                <option value="Half-Pay">Half-Pay</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">🟢 Active</option>
                <option value="Inactive">⚪ Inactive</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setPayTypeFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Mobile Filter Trigger */}
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
          SECTION 3: DATA TABLE (DESKTOP) & STACKED CARDS (MOBILE)
      ───────────────────────────────────────────────────────────── */}
      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Leave Policy Name</th>
                <th className="py-3.5 px-4">Annual Quota</th>
                <th className="py-3.5 px-4">Pay Protection</th>
                <th className="py-3.5 px-4">Carry Forward &amp; Encash</th>
                <th className="py-3.5 px-4">Medical Certificate</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingLeave(l)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs">
                          <CalendarHeart className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{l.leaveName}</p>
                          <span className="text-[11px] text-slate-400 font-mono">{l.leaveCode}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      📅 {l.annualQuotaDays > 0 ? `${l.annualQuotaDays} Days / Year` : "As Approved"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                          l.payType === "Paid"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : l.payType === "Unpaid"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {l.payType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="text-slate-800 font-semibold block">
                          Carry Forward: {l.carryForwardAllowed ? `Yes (Max ${l.maxCarryForwardDays}d)` : "No"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Encashable: {l.encashable ? "Yes 💰" : "No"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {l.requiresMedicalProof ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-900 border border-blue-200">
                          📄 Medical Proof Mandatory
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Not Required</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={l.status} />
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
                          onClick={() => setViewingLeave(l)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(l)}
                          className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Edit
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(l)}
                          className={`rounded-xl text-xs font-semibold ${
                            l.status === "Active"
                              ? "text-amber-800 border-amber-300 hover:bg-amber-50"
                              : "text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          {l.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLeave(l)}
                          className="rounded-xl text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No leave types found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredLeaves.map((l) => (
          <div
            key={l.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            onClick={() => setViewingLeave(l)}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{l.leaveCode}</span>
                <h4 className="font-bold text-slate-900 text-sm">{l.leaveName}</h4>
              </div>
              <StatusBadge status={l.status} />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-900 font-bold">Quota: {l.annualQuotaDays} Days / Year ({l.payType})</p>
              <p className="text-slate-500">Carry Forward: {l.carryForwardAllowed ? `Yes (${l.maxCarryForwardDays}d)` : "No"}</p>
              <p className="text-slate-500">Encashable: {l.encashable ? "Yes" : "No"}</p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditModal(l)}
                className="text-xs font-semibold text-emerald-800 border-emerald-300"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(l)}
                className="text-xs font-semibold"
              >
                {l.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDeleteLeave(l)}
                className="text-xs font-semibold text-rose-700 border-rose-200"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT LEAVE TYPE
      ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingLeave ? "Edit Leave Type" : "Add Leave Type"}
          description="Configure leave annual quotas, pay types, carry forward limits, and encashment terms."
          size="md"
        >
          <form onSubmit={handleSaveLeave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Leave Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LV-CL"
                  value={formCode}
                  onChange={(e) => {
                    setFormCode(e.target.value);
                    setCodeError("");
                  }}
                  className={`w-full rounded-xl border p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 ${
                    codeError ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-emerald-600"
                  }`}
                />
                {codeError && <p className="text-[11px] text-rose-600 font-bold pt-1">{codeError}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Leave Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Casual Leave (CL)"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setNameError("");
                  }}
                  className={`w-full rounded-xl border p-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
                    nameError ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-emerald-600"
                  }`}
                />
                {nameError && <p className="text-[11px] text-rose-600 font-bold pt-1">{nameError}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Annual Quota (Days)</label>
                <input
                  type="number"
                  min={0}
                  value={formQuota}
                  onChange={(e) => setFormQuota(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pay Protection Type</label>
                <select
                  value={formPayType}
                  onChange={(e) => setFormPayType(e.target.value as LeavePayType)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                >
                  <option value="Paid">🟢 Paid Leave (Full Salary)</option>
                  <option value="Unpaid">🔴 Unpaid (Leave Without Pay)</option>
                  <option value="Half-Pay">🟡 Half-Pay Leave</option>
                </select>
              </div>
            </div>

            {/* Carry Forward & Encashment Settings */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <label className="block font-bold text-slate-800 uppercase text-[11px]">
                Carry-Forward &amp; Encashment Rules
              </label>

              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formCarryForward}
                    onChange={(e) => {
                      setFormCarryForward(e.target.checked);
                      if (!e.target.checked) setFormMaxCarry(0);
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">Carry Forward</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formEncashable}
                    onChange={(e) => setFormEncashable(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">Encashable</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formMedicalProof}
                    onChange={(e) => setFormMedicalProof(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">Medical Proof</span>
                </label>
              </div>

              {formCarryForward && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Carry Forward Limit (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={formMaxCarry}
                    onChange={(e) => setFormMaxCarry(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description &amp; Guidelines</label>
              <textarea
                rows={3}
                placeholder="Policy approval criteria and guidelines..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as LeaveStatus)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
              >
                <option value="Active">🟢 Active (Available for employee application)</option>
                <option value="Inactive">⚪ Inactive (Archived / Disabled)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {editingLeave ? "Update Leave Type" : "Save Leave Type"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: VIEW LEAVE TYPE DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingLeave)}
        onClose={() => setViewingLeave(null)}
        title="Leave Type Master Details"
        icon={<CalendarHeart className="h-5 w-5 text-purple-700" />}
      >
        {viewingLeave && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block">{viewingLeave.leaveCode}</span>
              <h3 className="text-base font-black text-amber-400">{viewingLeave.leaveName}</h3>
              <StatusBadge status={viewingLeave.status} />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-extrabold text-slate-900 block uppercase">Policy Quotas &amp; Pay</span>
              <div className="flex justify-between">
                <span className="text-slate-600">Annual Quota:</span>
                <strong className="text-slate-900">{viewingLeave.annualQuotaDays} Days / Year</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pay Protection:</span>
                <strong className="text-emerald-800">{viewingLeave.payType}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Medical Proof Required:</span>
                <strong className="text-slate-900">{viewingLeave.requiresMedicalProof ? "Yes" : "No"}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <span className="font-extrabold text-emerald-950 block uppercase">Carry-Forward &amp; Encashment</span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded font-bold text-xs ${viewingLeave.carryForwardAllowed ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-600"}`}>
                  {viewingLeave.carryForwardAllowed ? `Carry Forward Allowed (Max ${viewingLeave.maxCarryForwardDays} Days)` : "No Carry Forward"}
                </span>
                {viewingLeave.encashable && (
                  <span className="px-2.5 py-1 rounded font-bold text-xs bg-amber-100 text-amber-900">
                    💰 Encashable on Exit
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="font-extrabold text-slate-900 block uppercase">Policy Overview</span>
              <p className="text-slate-700 leading-relaxed">{viewingLeave.description}</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS DRAWER */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Leave Type Filters"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pay Protection</label>
            <select
              value={payTypeFilter}
              onChange={(e) => setPayTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All Pay Types</option>
              <option value="Paid">Paid Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
              <option value="Half-Pay">Half-Pay</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">🟢 Active</option>
              <option value="Inactive">⚪ Inactive</option>
            </select>
          </div>

          <Button
            type="button"
            onClick={() => setIsMobileFilterOpen(false)}
            className="w-full font-bold bg-emerald-700 text-white rounded-xl"
          >
            Apply Filters
          </Button>
        </div>
      </Drawer>
    </ModulePageShell>
  );
}
